import type { SnapshotSpell, SpellSnapshotPayload } from '../../shared/snapshot';
import {
  createCharacterProfile,
  enforcePreparationLimits,
  normalizeCharacterProfile,
  normalizeSpellIdList,
  touchProfile,
} from '../domain/character';
import type {
  ApplyPlanResult,
  CharacterProfile,
  CharacterProfileInput,
  NextPreparationQueueEntry,
  PreparedSpellEntry,
  SpellRecord,
} from '../types';
import type { SpellCatalogProvider } from './provider';
import { createStateDb, type StateDb } from './localDb';
import { normalizeSpells } from './spellNormalizer';

async function fetchSnapshot(): Promise<SpellRecord[]> {
  try {
    const response = await fetch('/spells.snapshot.json', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const payload = await response.json() as SpellSnapshotPayload;
    const spells = Array.isArray(payload.spells) ? payload.spells as SnapshotSpell[] : [];
    return normalizeSpells(spells);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error || '');
    throw new Error(`Failed to load local spell snapshot. ${detail}`.trim());
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export class LocalSnapshotProvider implements SpellCatalogProvider {
  private readonly stateDb: StateDb;
  private spellsCache: SpellRecord[] | null = null;

  constructor(stateDb: StateDb = createStateDb()) {
    this.stateDb = stateDb;
  }

  private async readState() {
    return this.stateDb.readState();
  }

  private async writeState(state: { characters: CharacterProfile[] }) {
    await this.stateDb.writeState(state);
  }

  async listSpells(): Promise<SpellRecord[]> {
    if (!this.spellsCache) {
      this.spellsCache = await fetchSnapshot();
    }
    return clone(this.spellsCache);
  }

  async listCharacterProfiles(): Promise<CharacterProfile[]> {
    const state = await this.readState();
    const normalized = state.characters.map((entry) => normalizeCharacterProfile(entry));
    if (normalized.length !== state.characters.length || JSON.stringify(normalized) !== JSON.stringify(state.characters)) {
      state.characters = normalized;
      await this.writeState(state);
    }
    return clone(normalized).sort((left, right) => left.name.localeCompare(right.name));
  }

  async getCharacterProfile(characterId: string): Promise<CharacterProfile | null> {
    const profiles = await this.listCharacterProfiles();
    const profile = profiles.find((entry) => entry.id === characterId) || null;
    return profile ? clone(profile) : null;
  }

  async createCharacterProfile(input: CharacterProfileInput): Promise<CharacterProfile> {
    const state = await this.readState();
    const next = createCharacterProfile(input);

    if (state.characters.some((entry) => entry.id === next.id)) {
      throw new Error(`Character already exists: ${next.id}`);
    }

    state.characters.push(next);
    await this.writeState(state);
    return clone(next);
  }

  async saveCharacterProfile(profile: CharacterProfile): Promise<CharacterProfile> {
    const state = await this.readState();
    const index = state.characters.findIndex((entry) => entry.id === profile.id);
    if (index === -1) {
      throw new Error(`Character not found: ${profile.id}`);
    }

    const next = touchProfile(normalizeCharacterProfile(profile));

    state.characters[index] = next;
    await this.writeState(state);
    return clone(next);
  }

  async deleteCharacterProfile(characterId: string): Promise<void> {
    const state = await this.readState();
    state.characters = state.characters.filter((entry) => entry.id !== characterId);
    await this.writeState(state);
  }

  async applyPlan(
    characterId: string,
    nextPreparedSpells: PreparedSpellEntry[],
    remainingQueue: NextPreparationQueueEntry[] = [],
  ): Promise<ApplyPlanResult> {
    const spells = await this.listSpells();
    const byId = new Map(spells.map((spell) => [spell.id, spell]));

    const state = await this.readState();
    const index = state.characters.findIndex((entry) => entry.id === characterId);
    if (index === -1) {
      throw new Error(`Character not found: ${characterId}`);
    }

    const profile = normalizeCharacterProfile(state.characters[index]);
    const normalizedPrepared = normalizeCharacterProfile({
      ...profile,
      preparedSpells: nextPreparedSpells,
    }).preparedSpells;
    enforcePreparationLimits(normalizedPrepared, profile, byId);
    const normalizedRemainingQueue = normalizeCharacterProfile({
      ...profile,
      nextPreparationQueue: remainingQueue,
    }).nextPreparationQueue;

    const nextProfile = touchProfile({
      ...profile,
      preparedSpells: normalizedPrepared,
      nextPreparationQueue: normalizedRemainingQueue,
      savedIdeas: profile.savedIdeas.filter((idea) => (
        normalizedPrepared.some((entry) => entry.spellId === idea.spellId)
        || normalizedRemainingQueue.some((entry) => entry.spellId === idea.spellId)
      )),
    });

    state.characters[index] = nextProfile;
    await this.writeState(state);

    return {
      profile: clone(nextProfile),
      appliedSpellIds: normalizeSpellIdList(normalizedPrepared.map((entry) => entry.spellId)),
    };
  }
}
