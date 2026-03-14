import { getSpellAssignmentList, getSpellLists, isSpellEligibleForCharacter } from '../domain/character';
import type { CharacterProfile, SpellRecord } from '../types';

export type CatalogViewMode = 'all' | 'eligible_first' | 'eligible_only';

export type CatalogSortKey =
  | 'prepared'
  | 'level'
  | 'name'
  | 'list'
  | 'save'
  | 'action'
  | 'notes'
  | 'queued';

export interface CatalogPreferences {
  viewMode: CatalogViewMode;
  sortKey: CatalogSortKey;
  sortDirection: 'asc' | 'desc';
}

export interface CatalogRow {
  spell: SpellRecord;
  eligible: boolean;
  prepared: boolean;
  queued: boolean;
  displayList: string;
}

interface BuildCatalogRowsInput {
  spells: SpellRecord[];
  activeCharacter: CharacterProfile | null;
  search: string;
  preferences: CatalogPreferences;
}

interface SanitizeCatalogPreferencesOptions {
  allowListSort: boolean;
}

const VALID_VIEW_MODES: CatalogViewMode[] = ['all', 'eligible_first', 'eligible_only'];
const VALID_SORT_KEYS: CatalogSortKey[] = ['prepared', 'level', 'name', 'list', 'save', 'action', 'notes', 'queued'];
const VALID_SORT_DIRECTIONS: CatalogPreferences['sortDirection'][] = ['asc', 'desc'];

export function getDefaultCatalogPreferences(): CatalogPreferences {
  return {
    viewMode: 'eligible_first',
    sortKey: 'name',
    sortDirection: 'asc',
  };
}

export function resetCatalogSort(preferences: CatalogPreferences): CatalogPreferences {
  return {
    ...preferences,
    sortKey: 'name',
    sortDirection: 'asc',
  };
}

export function sanitizeCatalogPreferences(
  preferences: CatalogPreferences,
  options: SanitizeCatalogPreferencesOptions,
): CatalogPreferences {
  if (!options.allowListSort && preferences.sortKey === 'list') {
    return resetCatalogSort(preferences);
  }

  return preferences;
}

export function readCatalogPreferences(raw: string | null): CatalogPreferences {
  const fallback = getDefaultCatalogPreferences();
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as Partial<CatalogPreferences>;
    if (!parsed) return fallback;
    if (!VALID_VIEW_MODES.includes(parsed.viewMode as CatalogViewMode)) return fallback;
    if (!VALID_SORT_KEYS.includes(parsed.sortKey as CatalogSortKey)) return fallback;
    if (!VALID_SORT_DIRECTIONS.includes(parsed.sortDirection as CatalogPreferences['sortDirection'])) return fallback;

    return {
      viewMode: parsed.viewMode as CatalogViewMode,
      sortKey: parsed.sortKey as CatalogSortKey,
      sortDirection: parsed.sortDirection as CatalogPreferences['sortDirection'],
    };
  } catch {
    return fallback;
  }
}

function matchesSearch(spell: SpellRecord, query: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;

  return (
    spell.name.toLowerCase().includes(q)
    || spell.notes.toLowerCase().includes(q)
    || spell.description.toLowerCase().includes(q)
  );
}

function compareText(left: string, right: string): number {
  return left.localeCompare(right);
}

function compareBoolean(left: boolean, right: boolean): number {
  return Number(left) - Number(right);
}

function getSortValue(row: CatalogRow, sortKey: CatalogSortKey): string | number {
  switch (sortKey) {
    case 'prepared':
      return Number(row.prepared);
    case 'level':
      return row.spell.level;
    case 'name':
      return row.spell.name;
    case 'list':
      return row.displayList;
    case 'save':
      return row.spell.save || '';
    case 'action':
      return row.spell.castingTime || '';
    case 'notes':
      return row.spell.notes || '';
    case 'queued':
      return Number(row.queued);
    default:
      return row.spell.name;
  }
}

function compareRows(left: CatalogRow, right: CatalogRow, preferences: CatalogPreferences): number {
  if (preferences.viewMode === 'eligible_first' && left.eligible !== right.eligible) {
    return Number(right.eligible) - Number(left.eligible);
  }

  const leftValue = getSortValue(left, preferences.sortKey);
  const rightValue = getSortValue(right, preferences.sortKey);

  let result = 0;
  if (typeof leftValue === 'number' && typeof rightValue === 'number') {
    result = leftValue - rightValue;
  } else {
    result = compareText(String(leftValue), String(rightValue));
  }

  if (result !== 0) {
    return preferences.sortDirection === 'desc' ? result * -1 : result;
  }

  return compareText(left.spell.name, right.spell.name);
}

export function buildCatalogRows(input: BuildCatalogRowsInput): CatalogRow[] {
  const preparedSet = new Set((input.activeCharacter?.preparedSpells || []).map((entry) => entry.spellId));
  const queuedSet = new Set((input.activeCharacter?.nextPreparationQueue || []).map((entry) => entry.spellId));

  const rows = input.spells
    .filter((spell) => matchesSearch(spell, input.search))
    .map((spell) => {
      const eligible = input.activeCharacter
        ? isSpellEligibleForCharacter(spell, input.activeCharacter)
        : true;

      const displayList = input.activeCharacter
        ? (getSpellAssignmentList(spell, input.activeCharacter) || '-')
        : (getSpellLists(spell)[0] || '-');

      return {
        spell,
        eligible,
        prepared: preparedSet.has(spell.id),
        queued: queuedSet.has(spell.id),
        displayList,
      };
    });

  const filteredRows = input.preferences.viewMode === 'eligible_only'
    ? rows.filter((row) => row.eligible)
    : rows;

  return [...filteredRows].sort((left, right) => compareRows(left, right, input.preferences));
}
