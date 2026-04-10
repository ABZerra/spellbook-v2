export interface SpellRecord {
  id: string;
  ddbSpellId: string;
  name: string;
  level: number;
  source: string;
  page: string;
  sourceCitation: string;
  save: string;
  castingTime: string;
  notes: string;
  description: string;
  school: string;
  duration: string;
  rangeArea: string;
  attackSave: string;
  damageEffect: string;
  atHigherLevels: string;
  components: string;
  componentsExpanded: string;
  spellTags: string[];
  availableFor: string[];
  additionalSpellLists: string[];
  ddbUrl: string;
}

export interface SavedIdea {
  spellId: string;
  note?: string;
  createdAt: string;
}

export interface PreparationLimit {
  list: string;
  limit: number;
  maxSpellLevel: number;
}

export interface PreparedSpellEntry {
  spellId: string;
  assignedList: string;
  mode: 'normal' | 'always';
}

export type QueueIntent = 'add' | 'replace' | 'queue_only' | 'remove';

export interface NextPreparationQueueEntry {
  spellId: string;
  intent: QueueIntent;
  assignedList?: string;
  replaceTarget?: string;
  createdAt?: string;
}

export interface ClassEntry {
  name: string;
  subclass?: string;
  castingAbility?: string;
}

export interface CharacterProfile {
  id: string;
  name: string;
  classes: ClassEntry[];
  castingAbility: string;
  availableLists: string[];
  preparationLimits: PreparationLimit[];
  preparedSpells: PreparedSpellEntry[];
  nextPreparationQueue: NextPreparationQueueEntry[];
  savedIdeas: SavedIdea[];
  updatedAt: string;
}

export interface CharacterProfileInput {
  id?: string;
  name: string;
  classes?: ClassEntry[];
  castingAbility?: string;
  availableLists?: string[];
  preparationLimits?: PreparationLimit[];
}

export interface ApplyPlanResult {
  profile: CharacterProfile;
  appliedSpellIds: string[];
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
