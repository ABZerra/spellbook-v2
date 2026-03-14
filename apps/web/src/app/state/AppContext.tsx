import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  isSpellEligibleForCharacter,
  normalizeCharacterProfile,
} from '../domain/character';
import { computeApplyResult } from '../domain/prepareQueue';
import { buildSpellSyncPayloadV3, publishSpellSyncPayloadV3, waitForSpellSyncPayloadAck } from '../services/extensionSyncV3';
import type { CharacterProfile, CharacterProfileInput, QueueIntent, SpellRecord, SpellSyncPayloadV3 } from '../types';
import { LocalSnapshotProvider } from '../providers/localSnapshotProvider';
import type { SpellCatalogProvider } from '../providers/provider';

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
  spells: SpellRecord[];
  characters: CharacterProfile[];
  activeCharacter: CharacterProfile | null;

  refreshAll: () => Promise<void>;
  setActiveCharacter: (characterId: string) => void;
  createCharacter: (input: CharacterProfileInput) => Promise<void>;
  saveCharacter: (profile: CharacterProfile) => Promise<void>;
  deleteCharacter: (characterId: string) => Promise<void>;

  queueSpellForNextPreparation: (spellId: string) => Promise<void>;
  unqueueSpellForNextPreparation: (spellId: string) => Promise<void>;
  isSpellQueuedForNextPreparation: (spellId: string) => boolean;
  setQueuedSpellIntent: (spellId: string, intent: QueueIntent) => Promise<void>;
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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [spells, setSpells] = useState<SpellRecord[]>([]);
  const [characters, setCharacters] = useState<CharacterProfile[]>([]);
  const [activeCharacterId, setActiveCharacterId] = useState<string | null>(getPersistedCharacterId());

  const spellsById = useMemo(() => new Map(spells.map((spell) => [spell.id, spell])), [spells]);

  const persistCharacter = useCallback(async (profile: CharacterProfile): Promise<CharacterProfile> => {
    const normalized = normalizeCharacterProfile(profile);
    const saved = await resolvedProvider.saveCharacterProfile(normalized);
    setCharacters((current) => current.map((entry) => (entry.id === saved.id ? saved : entry)));
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
    setCharacters((current) => [...current, normalizeCharacterProfile(created)].sort((left, right) => left.name.localeCompare(right.name)));
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

      const alreadyQueued = character.nextPreparationQueue.some((entry) => entry.spellId === spellId);
      const nextQueue = alreadyQueued
        ? character.nextPreparationQueue
        : [...character.nextPreparationQueue, { spellId, intent: 'add' as const }];
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
  }, [mutateActiveCharacter]);

  const isSpellQueuedForNextPreparation = useCallback((spellId: string) => {
    if (!activeCharacter) return false;
    return activeCharacter.nextPreparationQueue.some((entry) => entry.spellId === spellId);
  }, [activeCharacter]);

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
      nextPreparationQueue: character.preparedSpellIds.map((spellId) => ({ spellId, intent: 'add' as const })),
      savedIdeas: character.savedIdeas.filter((entry) => character.preparedSpellIds.includes(entry.spellId)),
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

    const payload = buildSpellSyncPayloadV3(activeCharacter, computed.finalPreparedSpellIds, spells);
    const ackPromise = waitForSpellSyncPayloadAck();

    const applyResult = await resolvedProvider.applyPlan(
      activeCharacter.id,
      computed.finalPreparedSpellIds,
      computed.remainingQueue,
    );
    setCharacters((current) => current.map((entry) => (
      entry.id === applyResult.profile.id ? normalizeCharacterProfile(applyResult.profile) : entry
    )));

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
    spells,
    characters,
    activeCharacter,
    refreshAll,
    setActiveCharacter,
    createCharacter,
    saveCharacter,
    deleteCharacter,
    queueSpellForNextPreparation,
    unqueueSpellForNextPreparation,
    isSpellQueuedForNextPreparation,
    setQueuedSpellIntent,
    setQueuedSpellReplaceTarget,
    restoreQueueFromPrepared,
    applyPlan,
  }), [
    loading,
    error,
    spells,
    characters,
    activeCharacter,
    refreshAll,
    setActiveCharacter,
    createCharacter,
    saveCharacter,
    deleteCharacter,
    queueSpellForNextPreparation,
    unqueueSpellForNextPreparation,
    isSpellQueuedForNextPreparation,
    setQueuedSpellIntent,
    setQueuedSpellReplaceTarget,
    restoreQueueFromPrepared,
    applyPlan,
  ]);

  return (
    <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
  );
}
