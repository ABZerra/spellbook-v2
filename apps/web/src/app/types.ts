export interface SpellRecord {
  id: string;
  name: string;
  level: number;
  source: string[];
  spellList: string[];
  save: string;
  castingTime: string;
  notes: string;
  description: string;
  school: string;
  duration: string;
  range: string;
  components: string;
  tags: string[];
}

export interface SavedIdea {
  spellId: string;
  note?: string;
  createdAt: string;
}

export interface PreparationLimit {
  list: string;
  limit: number;
}

export type QueueIntent = 'add' | 'replace' | 'queue_only';

export interface NextPreparationQueueEntry {
  spellId: string;
  intent: QueueIntent;
  replaceTarget?: string;
  createdAt?: string;
}

export interface CharacterProfile {
  id: string;
  name: string;
  class: string;
  subclass: string;
  castingAbility: string;
  availableLists: string[];
  preparationLimits: PreparationLimit[];
  preparedSpellIds: string[];
  nextPreparationQueue: NextPreparationQueueEntry[];
  savedIdeas: SavedIdea[];
  updatedAt: string;
}

export interface CharacterProfileInput {
  id?: string;
  name: string;
  class?: string;
  subclass?: string;
  castingAbility?: string;
  availableLists?: string[];
  preparationLimits?: PreparationLimit[];
}

export interface ApplyPlanResult {
  profile: CharacterProfile;
  appliedSpellIds: string[];
}

export type ProviderRuntime = 'local' | 'production';

export interface CatalogSyncResult {
  ok: boolean;
  refreshedAt: string | null;
}

export interface SpellSyncIssue {
  code: 'AMBIGUOUS_LIST' | 'MISSING_SPELL' | 'MISSING_NAME' | 'LIST_MISMATCH';
  operationIndex: number;
  detail: string;
}

export type SpellSyncOperation =
  | { type: 'replace'; list: string; remove: string; add: string }
  | { type: 'prepare'; list: string; spell: string }
  | { type: 'unprepare'; list: string; spell: string };

export interface SpellSyncPayloadV3 {
  version: 3;
  source: 'spellbook';
  timestamp: number;
  character: {
    id: string;
    name: string;
  };
  operations: SpellSyncOperation[];
  issues: SpellSyncIssue[];
}
