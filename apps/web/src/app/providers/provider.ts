import type {
  ApplyPlanResult,
  CharacterProfile,
  CharacterProfileInput,
  NextPreparationQueueEntry,
  PreparedSpellEntry,
  SpellRecord,
} from '../types';

export interface SpellCatalogProvider {
  listSpells(): Promise<SpellRecord[]>;
  listCharacterProfiles(): Promise<CharacterProfile[]>;
  getCharacterProfile(characterId: string): Promise<CharacterProfile | null>;
  createCharacterProfile(input: CharacterProfileInput): Promise<CharacterProfile>;
  saveCharacterProfile(profile: CharacterProfile): Promise<CharacterProfile>;
  deleteCharacterProfile(characterId: string): Promise<void>;
  applyPlan(characterId: string, nextPreparedSpells: PreparedSpellEntry[], remainingQueue?: NextPreparationQueueEntry[]): Promise<ApplyPlanResult>;
}
