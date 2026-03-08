import type {
  ApplyPlanResult,
  CatalogSyncResult,
  CharacterProfile,
  CharacterProfileInput,
  NextPreparationQueueEntry,
  ProviderRuntime,
  SpellRecord,
} from '../types';

export interface SpellCatalogProvider {
  runtime: ProviderRuntime;
  listSpells(): Promise<SpellRecord[]>;
  listCharacterProfiles(): Promise<CharacterProfile[]>;
  getCharacterProfile(characterId: string): Promise<CharacterProfile | null>;
  createCharacterProfile(input: CharacterProfileInput): Promise<CharacterProfile>;
  saveCharacterProfile(profile: CharacterProfile): Promise<CharacterProfile>;
  deleteCharacterProfile(characterId: string): Promise<void>;
  applyPlan(characterId: string, nextPreparedSpellIds: string[], remainingQueue?: NextPreparationQueueEntry[]): Promise<ApplyPlanResult>;
  syncCatalog(): Promise<CatalogSyncResult>;
}
