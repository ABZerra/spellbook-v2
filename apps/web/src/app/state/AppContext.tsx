import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  assertSpellCanBeAddedToList,
  getAddableAssignmentLists,
  getValidAssignmentLists,
  isSpellEligibleForCharacter,
  normalizeCharacterProfile,
  removePreparedSpellEntryAtOccurrence,
  reassignPreparedSpellEntryAtOccurrence,
} from '../domain/character';
import { extractClassInfo, extractListNames, type CatalogClassInfo } from '../domain/catalog';
import { getDefaultQueueIntent } from '../pages/preparePresentation';
import { computeApplyResult } from '../domain/prepareQueue';
import { buildSpellSyncPayloadV3, publishSpellSyncPayloadV3, waitForSpellSyncPayloadAck } from '../services/extensionSyncV3';
import type { CharacterProfile, CharacterProfileInput, PreparedSpellEntry, QueueIntent, SpellRecord, SpellSyncPayloadV3 } from '../types';
import { LocalSnapshotProvider } from '../providers/localSnapshotProvider';
import type { SpellCatalogProvider } from '../providers/provider';
import { useAuth } from './AuthContext';
import { SyncService, type SyncStatus } from './SyncService';

const ACTIVE_CHARACTER_KEY = 'spellbook.activeCharacter';

interface ApplyPlanOutput {
  payload: SpellSyncPayloadV3;
  summary: {
    adds: number;
    replacements: number;
    queueOnlySkipped: number;
  };
  ack: {
    acknowledged: boolean;
    ok: boolean;
    error?: string;
    timedOut: boolean;
  };
}

interface AppContextValue {
  loading: boolean;
  error: string | null;
  syncStatus: SyncStatus;
  spells: SpellRecord[];
  characters: CharacterProfile[];
  activeCharacter: CharacterProfile | null;
  catalogClasses: CatalogClassInfo[];
  catalogListNames: string[];

  refreshAll: () => Promise<void>;
  setActiveCharacter: (characterId: string) => void;
  createCharacter: (input: CharacterProfileInput) => Promise<void>;
  saveCharacter: (profile: CharacterProfile) => Promise<void>;
  deleteCharacter: (characterId: string) => Promise<void>;

  queueSpellForNextPreparation: (spellId: string) => Promise<void>;
  unqueueSpellForNextPreparation: (spellId: string) => Promise<void>;
  isSpellQueuedForNextPreparation: (spellId: string) => boolean;
  addPreparedSpell: (spellId: string, assignedList: string, mode: PreparedSpellEntry['mode']) => Promise<void>;
  removePreparedSpell: (spellId: string, assignedList: string, mode: PreparedSpellEntry['mode'], occurrenceIndex: number) => Promise<void>;
  reassignPreparedSpell: (spellId: string, currentAssignedList: string, mode: PreparedSpellEntry['mode'], occurrenceIndex: number, nextAssignedList: string) => Promise<void>;
  setQueuedSpellIntent: (spellId: string, intent: QueueIntent) => Promise<void>;
  setQueuedSpellAssignedList: (spellId: string, assignedList: string | null) => Promise<void>;
  setQueuedSpellReplaceTarget: (spellId: string, replaceTarget: string | null) => Promise<void>;
  restoreQueueFromPrepared: () => Promise<void>;

  applyPlan: () => Promise<ApplyPlanOutput>;
}

const AppCtx = createContext<AppContextValue | null>(null);

function getPersistedCharacterId(): string | null {
  const value = localStorage.getItem(ACTIVE_CHARACTER_KEY);
  if (!value) return null;
  const normalized = String(value).trim();
  return normalized || null;
}

export function useApp() {
  const value = useContext(AppCtx);
  if (!value) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return value;
}

interface AppProviderProps {
  children: React.ReactNode;
  provider?: SpellCatalogProvider;
}

export function AppProvider({ children, provider }: AppProviderProps) {
  const [resolvedProvider] = useState<SpellCatalogProvider>(() => provider || new LocalSnapshotProvider());
  const { userId, isAuthenticated, isOffline } = useAuth();

  const syncServiceRef = useRef(new SyncService());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [spells, setSpells] = useState<SpellRecord[]>([]);
  const [characters, setCharacters] = useState<CharacterProfile[]>([]);
  const [activeCharacterId, setActiveCharacterId] = useState<string | null>(getPersistedCharacterId());

  useEffect(() => {
    const service = syncServiceRef.current;
    const unsubscribe = service.onStatusChange(setSyncStatus);

    if (isAuthenticated && userId && !isOffline) {
      fetch(`/api/users/${encodeURIComponent(userId)}/characters`)
        .then((res) => res.ok ? res.json() : null)
        .then(async (data) => {
          if (!data) return;
          // Hydrate local state and IndexedDB with remote characters
          const remoteCharacters = (Array.isArray(data.characters) ? data.characters : [])
            .map((c: CharacterProfile) => normalizeCharacterProfile(c));
          // Write each remote character to local provider (IndexedDB)
          const localCharacters = await resolvedProvider.listCharacterProfiles();
          const localIds = new Set(localCharacters.map((c) => c.id));
          for (const remote of remoteCharacters) {
            if (localIds.has(remote.id)) {
              await resolvedProvider.saveCharacterProfile(remote);
            } else {
              await resolvedProvider.createCharacterProfile(remote);
            }
          }
          // Update React state with remote data
          setCharacters(remoteCharacters.sort((a: CharacterProfile, b: CharacterProfile) => a.name.localeCompare(b.name)));
          if (remoteCharacters.length > 0 && !activeCharacterId) {
            const firstId = remoteCharacters[0].id;
            setActiveCharacterId(firstId);
            localStorage.setItem(ACTIVE_CHARACTER_KEY, firstId);
          }
          if (data.sha !== undefined) {
            service.start(userId, data.sha);
          }
        })
        .catch(() => {});
    } else {
      service.stop();
      setCharacters([]);
      setActiveCharacterId(null);
    }

    return () => {
      unsubscribe();
      service.stop();
    };
  }, [isAuthenticated, userId]);

  const spellsById = useMemo(() => new Map(spells.map((spell) => [spell.id, spell])), [spells]);
  const catalogClasses = useMemo(() => extractClassInfo(spells), [spells]);
  const catalogListNames = useMemo(() => extractListNames(spells), [spells]);

  const persistCharacter = useCallback(async (profile: CharacterProfile): Promise<CharacterProfile> => {
    const normalized = normalizeCharacterProfile(profile);
    const saved = await resolvedProvider.saveCharacterProfile(normalized);
    setCharacters((current) => {
      const next = current.map((entry) => (entry.id === saved.id ? saved : entry));
      syncServiceRef.current.markDirty(next);
      return next;
    });
    return saved;
  }, [resolvedProvider]);

  const hydrate = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [nextSpells, nextCharacters] = await Promise.all([
        resolvedProvider.listSpells(),
        resolvedProvider.listCharacterProfiles(),
      ]);

      setSpells(nextSpells);
      setCharacters(nextCharacters.map((entry) => normalizeCharacterProfile(entry)));

      if (!nextCharacters.length) {
        setActiveCharacterId(null);
      } else {
        const persisted = getPersistedCharacterId();
        const preferred = persisted && nextCharacters.some((entry) => entry.id === persisted)
          ? persisted
          : nextCharacters[0].id;

        setActiveCharacterId(preferred);
        localStorage.setItem(ACTIVE_CHARACTER_KEY, preferred);
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to load state.');
    } finally {
      setLoading(false);
    }
  }, [resolvedProvider]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const activeCharacter = useMemo(
    () => characters.find((entry) => entry.id === activeCharacterId) || null,
    [characters, activeCharacterId],
  );

  const setActiveCharacter = useCallback((characterId: string) => {
    setActiveCharacterId(characterId);
    localStorage.setItem(ACTIVE_CHARACTER_KEY, characterId);
  }, []);

  const createCharacter = useCallback(async (input: CharacterProfileInput) => {
    const created = await resolvedProvider.createCharacterProfile(input);
    setCharacters((current) => {
      const next = [...current, normalizeCharacterProfile(created)].sort((left, right) => left.name.localeCompare(right.name));
      syncServiceRef.current.markDirty(next);
      return next;
    });
    setActiveCharacter(created.id);
  }, [resolvedProvider, setActiveCharacter]);

  const saveCharacter = useCallback(async (profile: CharacterProfile) => {
    await persistCharacter(profile);
  }, [persistCharacter]);

  const deleteCharacter = useCallback(async (characterId: string) => {
    await resolvedProvider.deleteCharacterProfile(characterId);
    setCharacters((current) => {
      const next = current.filter((entry) => entry.id !== characterId);
      if (next.length === 0) {
        setActiveCharacterId(null);
        localStorage.removeItem(ACTIVE_CHARACTER_KEY);
      } else if (characterId === activeCharacterId) {
        const replacement = next[0].id;
        setActiveCharacterId(replacement);
        localStorage.setItem(ACTIVE_CHARACTER_KEY, replacement);
      }
      syncServiceRef.current.markDirty(next);
      return next;
    });
  }, [resolvedProvider, activeCharacterId]);

  const mutateActiveCharacter = useCallback(async (mutate: (current: CharacterProfile) => CharacterProfile) => {
    if (!activeCharacter) {
      throw new Error('Choose a character first.');
    }

    const next = normalizeCharacterProfile(mutate(activeCharacter));
    await persistCharacter(next);
  }, [activeCharacter, persistCharacter]);

  const queueSpellForNextPreparation = useCallback(async (spellId: string) => {
    await mutateActiveCharacter((character) => {
      const spell = spellsById.get(spellId);
      if (!spell) {
        throw new Error(`Unknown spell: ${spellId}`);
      }
      if (!isSpellEligibleForCharacter(spell, character)) {
        throw new Error(`${spell.name} is outside ${character.name}'s available spell lists.`);
      }

      const validLists = getAddableAssignmentLists(spell, character);
      if (validLists.length === 0) {
        throw new Error(`${spell.name} exceeds this character's available max spell levels.`);
      }
      const alreadyQueued = character.nextPreparationQueue.some((entry) => entry.spellId === spellId);
      const nextQueue = alreadyQueued
        ? character.nextPreparationQueue
        : [...character.nextPreparationQueue, {
          spellId,
          intent: getDefaultQueueIntent(character.preparedSpells.length),
          assignedList: validLists.length === 1 ? validLists[0] : undefined,
        }];
      const existingIdea = character.savedIdeas.find((entry) => entry.spellId === spellId);
      const nextIdeas = existingIdea
        ? character.savedIdeas
        : [...character.savedIdeas, { spellId, createdAt: new Date().toISOString() }];

      return {
        ...character,
        nextPreparationQueue: nextQueue,
        savedIdeas: nextIdeas,
      };
    });
  }, [mutateActiveCharacter, spellsById]);

  const unqueueSpellForNextPreparation = useCallback(async (spellId: string) => {
    await mutateActiveCharacter((character) => ({
      ...character,
      nextPreparationQueue: character.nextPreparationQueue.filter((entry) => entry.spellId !== spellId),
      savedIdeas: character.savedIdeas.filter((entry) => entry.spellId !== spellId),
    }));
  }, [mutateActiveCharacter, spellsById]);

  const isSpellQueuedForNextPreparation = useCallback((spellId: string) => {
    if (!activeCharacter) return false;
    return activeCharacter.nextPreparationQueue.some((entry) => entry.spellId === spellId);
  }, [activeCharacter]);

  const addPreparedSpell = useCallback(async (
    spellId: string,
    assignedList: string,
    mode: PreparedSpellEntry['mode'],
  ) => {
    await mutateActiveCharacter((character) => {
      const spell = spellsById.get(spellId);
      if (!spell) {
        throw new Error(`Unknown spell: ${spellId}`);
      }

      assertSpellCanBeAddedToList(spell, character, assignedList);

      return {
        ...character,
        preparedSpells: [...character.preparedSpells, { spellId, assignedList, mode }],
      };
    });
  }, [mutateActiveCharacter, spellsById]);

  const removePreparedSpell = useCallback(async (
    spellId: string,
    assignedList: string,
    mode: PreparedSpellEntry['mode'],
    occurrenceIndex: number,
  ) => {
    await mutateActiveCharacter((character) => ({
      ...character,
      preparedSpells: removePreparedSpellEntryAtOccurrence(
        character.preparedSpells,
        { spellId, assignedList, mode },
        occurrenceIndex,
      ),
    }));
  }, [mutateActiveCharacter]);

  const reassignPreparedSpell = useCallback(async (
    spellId: string,
    currentAssignedList: string,
    mode: PreparedSpellEntry['mode'],
    occurrenceIndex: number,
    nextAssignedList: string,
  ) => {
    await mutateActiveCharacter((character) => {
      const spell = spellsById.get(spellId);
      if (!spell) {
        throw new Error(`Unknown spell: ${spellId}`);
      }

      const validLists = getValidAssignmentLists(spell, character);
      if (!validLists.includes(nextAssignedList)) {
        throw new Error(`${spell.name}: choose a valid spell list.`);
      }

      return {
        ...character,
        preparedSpells: reassignPreparedSpellEntryAtOccurrence(
          character.preparedSpells,
          { spellId, assignedList: currentAssignedList, mode },
          occurrenceIndex,
          nextAssignedList,
        ),
      };
    });
  }, [mutateActiveCharacter, spellsById]);

  const setQueuedSpellIntent = useCallback(async (spellId: string, intent: QueueIntent) => {
    await mutateActiveCharacter((character) => ({
      ...character,
      nextPreparationQueue: character.nextPreparationQueue.map((entry) => {
        if (entry.spellId !== spellId) return entry;
        if (intent === 'replace') return { ...entry, intent };
        return { ...entry, intent, replaceTarget: undefined };
      }),
    }));
  }, [mutateActiveCharacter]);

  const setQueuedSpellAssignedList = useCallback(async (spellId: string, assignedList: string | null) => {
    await mutateActiveCharacter((character) => {
      const spell = spellsById.get(spellId);
      if (!spell) {
        throw new Error(`Unknown spell: ${spellId}`);
      }
      if (assignedList) {
        assertSpellCanBeAddedToList(spell, character, assignedList);
      }

      return {
        ...character,
        nextPreparationQueue: character.nextPreparationQueue.map((entry) => (
          entry.spellId === spellId
            ? { ...entry, assignedList: assignedList || undefined, replaceTarget: undefined }
            : entry
        )),
      };
    });
  }, [mutateActiveCharacter]);

  const setQueuedSpellReplaceTarget = useCallback(async (spellId: string, replaceTarget: string | null) => {
    await mutateActiveCharacter((character) => ({
      ...character,
      nextPreparationQueue: character.nextPreparationQueue.map((entry) => (
        entry.spellId === spellId
          ? { ...entry, replaceTarget: replaceTarget || undefined }
          : entry
      )),
    }));
  }, [mutateActiveCharacter]);

  const restoreQueueFromPrepared = useCallback(async () => {
    await mutateActiveCharacter((character) => ({
      ...character,
      nextPreparationQueue: character.preparedSpells
        .filter((entry) => entry.mode !== 'always')
        .map((entry) => ({
        spellId: entry.spellId,
        intent: 'add' as const,
        assignedList: entry.assignedList,
      })),
      savedIdeas: character.savedIdeas.filter((entry) => character.preparedSpells.some((prepared) => prepared.spellId === entry.spellId)),
    }));
  }, [mutateActiveCharacter]);

  const applyPlan = useCallback(async (): Promise<ApplyPlanOutput> => {
    if (!activeCharacter) {
      throw new Error('Choose a character first.');
    }

    const computed = computeApplyResult({
      profile: activeCharacter,
      spellsById,
      queue: activeCharacter.nextPreparationQueue,
    });

    const payload = buildSpellSyncPayloadV3(activeCharacter, computed.finalPreparedSpells, spells);
    const ackPromise = waitForSpellSyncPayloadAck();

    const applyResult = await resolvedProvider.applyPlan(
      activeCharacter.id,
      computed.finalPreparedSpells,
      computed.remainingQueue,
    );
    setCharacters((current) => {
      const next = current.map((entry) => (
        entry.id === applyResult.profile.id ? normalizeCharacterProfile(applyResult.profile) : entry
      ));
      syncServiceRef.current.markDirty(next);
      return next;
    });

    publishSpellSyncPayloadV3(payload);
    const ack = await ackPromise;

    return {
      payload,
      summary: computed.summary,
      ack,
    };
  }, [activeCharacter, resolvedProvider, spells, spellsById]);

  const refreshAll = useCallback(async () => {
    await hydrate();
  }, [hydrate]);

  const value = useMemo<AppContextValue>(() => ({
    loading,
    error,
    syncStatus,
    spells,
    characters,
    activeCharacter,
    catalogClasses,
    catalogListNames,
    refreshAll,
    setActiveCharacter,
    createCharacter,
    saveCharacter,
    deleteCharacter,
    queueSpellForNextPreparation,
    unqueueSpellForNextPreparation,
    isSpellQueuedForNextPreparation,
    addPreparedSpell,
    removePreparedSpell,
    reassignPreparedSpell,
    setQueuedSpellIntent,
    setQueuedSpellAssignedList,
    setQueuedSpellReplaceTarget,
    restoreQueueFromPrepared,
    applyPlan,
  }), [
    loading,
    error,
    syncStatus,
    spells,
    characters,
    activeCharacter,
    catalogClasses,
    catalogListNames,
    refreshAll,
    setActiveCharacter,
    createCharacter,
    saveCharacter,
    deleteCharacter,
    queueSpellForNextPreparation,
    unqueueSpellForNextPreparation,
    isSpellQueuedForNextPreparation,
    addPreparedSpell,
    removePreparedSpell,
    reassignPreparedSpell,
    setQueuedSpellIntent,
    setQueuedSpellAssignedList,
    setQueuedSpellReplaceTarget,
    restoreQueueFromPrepared,
    applyPlan,
  ]);

  return (
    <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
  );
}
