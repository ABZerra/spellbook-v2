import { normalizeListName } from '../domain/character';
import type { CharacterProfile } from '../types';

export interface CharacterCueStat {
  label: string;
  value: number;
}

export interface CharacterCueMetadata {
  classLabel: string;
  subclassLabel?: string;
}

export function getCharacterCueStats(
  profile: Pick<CharacterProfile, 'preparedSpells' | 'nextPreparationQueue'>,
): CharacterCueStat[] {
  const prepared = profile.preparedSpells.length;
  const alwaysPrepared = profile.preparedSpells.filter((entry) => entry.mode === 'always').length;
  const queued = profile.nextPreparationQueue.length;

  return [
    { label: 'Prepared', value: prepared },
    { label: 'Always', value: alwaysPrepared },
    { label: 'Queued', value: queued },
  ];
}

export function getCharacterCueMetadata(
  profile: Pick<CharacterProfile, 'class' | 'subclass'>,
): CharacterCueMetadata {
  const classLabel = profile.class?.trim() || 'Unassigned class';
  const subclassLabel = profile.subclass?.trim() || undefined;

  return {
    classLabel,
    subclassLabel,
  };
}

export interface CharacterHeaderPill {
  id: string;
  label: string;
  isActive: boolean;
}

export interface CharacterPreparationRuleSummary {
  list: string;
  used: number;
  limit: number;
  maxSpellLevel: number;
}

export interface CharacterPreparedVerificationRow {
  spellId: string;
  spellName: string;
  level: number;
  assignedList: string;
  mode: CharacterProfile['preparedSpells'][number]['mode'];
}

export interface CharacterPreparedVerificationGroup<Row extends CharacterPreparedVerificationRow = CharacterPreparedVerificationRow> {
  level: number;
  label: string;
  rows: Row[];
}

export function getCharacterHeaderPills(
  characters: Pick<CharacterProfile, 'id' | 'name'>[],
  activeCharacterId?: string | null,
): CharacterHeaderPill[] {
  return characters.map((character) => ({
    id: character.id,
    label: character.name,
    isActive: character.id === activeCharacterId,
  }));
}

export function getCharacterPreparationRuleSummaries(
  limits: Pick<CharacterProfile['preparationLimits'][number], 'list' | 'limit' | 'maxSpellLevel'>[],
  usageByList: Map<string, number>,
): CharacterPreparationRuleSummary[] {
  return limits.map((entry) => ({
    list: entry.list,
    used: usageByList.get(normalizeListName(entry.list)) || 0,
    limit: entry.limit,
    maxSpellLevel: entry.maxSpellLevel,
  }));
}

export function getGroupedPreparedVerificationRows<Row extends CharacterPreparedVerificationRow>(
  rows: Row[],
): CharacterPreparedVerificationGroup<Row>[] {
  const sorted = [...rows].sort((left, right) => (
    left.level - right.level
    || left.spellName.localeCompare(right.spellName)
    || left.assignedList.localeCompare(right.assignedList)
    || left.mode.localeCompare(right.mode)
  ));

  const groups = new Map<number, CharacterPreparedVerificationRow[]>();
  for (const row of sorted) {
    const levelRows = groups.get(row.level) || [];
    levelRows.push(row);
    groups.set(row.level, levelRows);
  }

  return [...groups.entries()].map(([level, groupedRows]) => ({
    level,
    label: level === 0 ? 'Cantrips' : `Level ${level}`,
    rows: groupedRows,
  }));
}

export function formatPreparedVerificationRowMeta(
  row: Pick<CharacterPreparedVerificationRow, 'assignedList' | 'mode'>,
): string {
  if (row.mode === 'always') {
    return `${row.assignedList} · Always`;
  }

  return row.assignedList;
}
