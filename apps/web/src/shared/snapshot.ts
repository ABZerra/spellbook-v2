export interface SnapshotSpell {
  id: string;
  ddbSpellId?: string;
  name: string;
  level?: number;
  source?: string;
  page?: string;
  sourceCitation?: string;
  save?: string;
  castingTime?: string;
  notes?: string;
  description?: string;
  school?: string;
  duration?: string;
  rangeArea?: string;
  attackSave?: string;
  damageEffect?: string;
  atHigherLevels?: string;
  components?: string;
  componentsExpanded?: string;
  spellTags?: string[];
  availableFor?: string[];
  additionalSpellLists?: string[];
  ddbUrl?: string;
}

export interface SpellSnapshotPayload {
  schemaVersion?: number;
  sourceFile?: string;
  generatedAt?: string | null;
  spells: SnapshotSpell[];
}
