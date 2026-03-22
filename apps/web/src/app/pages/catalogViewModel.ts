import { getAddableAssignmentLists, getSpellAssignmentList, getSpellLists, isSpellEligibleForCharacter } from '../domain/character';
import type { CharacterProfile, SpellRecord } from '../types';

export type CatalogViewMode = 'all' | 'character_filtered';

export type CatalogSortKey =
  | 'prepared'
  | 'level'
  | 'name'
  | 'list'
  | 'save'
  | 'action'
  | 'notes'
  | 'queued';

export interface CatalogSortEntry {
  key: CatalogSortKey;
  direction: 'asc' | 'desc';
}

export interface CatalogPreferences {
  viewMode: CatalogViewMode;
  sorts: CatalogSortEntry[];
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

const VALID_VIEW_MODES: CatalogViewMode[] = ['all', 'character_filtered'];
const VALID_SORT_KEYS: CatalogSortKey[] = ['prepared', 'level', 'name', 'list', 'save', 'action', 'notes', 'queued'];
const VALID_SORT_DIRECTIONS: Array<'asc' | 'desc'> = ['asc', 'desc'];

export function getDefaultCatalogPreferences(): CatalogPreferences {
  return { viewMode: 'all', sorts: [] };
}

export function resetCatalogSort(preferences: CatalogPreferences): CatalogPreferences {
  return { ...preferences, viewMode: 'all', sorts: [] };
}

export function sanitizeCatalogPreferences(
  preferences: CatalogPreferences,
  options: SanitizeCatalogPreferencesOptions,
): CatalogPreferences {
  if (!options.allowListSort && preferences.sorts.some((s) => s.key === 'list')) {
    return {
      ...preferences,
      sorts: preferences.sorts.filter((s) => s.key !== 'list'),
    };
  }

  return preferences;
}

export function readCatalogPreferences(raw: string | null): CatalogPreferences {
  const fallback = getDefaultCatalogPreferences();
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed) return fallback;
    if (!VALID_VIEW_MODES.includes(parsed.viewMode as CatalogViewMode)) return fallback;

    // Migrate old single-sort format
    if ('sortKey' in parsed && !('sorts' in parsed)) {
      if (!VALID_SORT_KEYS.includes(parsed.sortKey) || !VALID_SORT_DIRECTIONS.includes(parsed.sortDirection)) {
        return fallback;
      }
      return {
        viewMode: parsed.viewMode as CatalogViewMode,
        sorts: [{ key: parsed.sortKey as CatalogSortKey, direction: parsed.sortDirection as 'asc' | 'desc' }],
      };
    }

    // New format
    if (!Array.isArray(parsed.sorts)) return fallback;
    const validSorts = parsed.sorts.filter(
      (s: any) => s && VALID_SORT_KEYS.includes(s.key) && VALID_SORT_DIRECTIONS.includes(s.direction),
    );

    return {
      viewMode: parsed.viewMode as CatalogViewMode,
      sorts: validSorts as CatalogSortEntry[],
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
  for (const sort of preferences.sorts) {
    const leftValue = getSortValue(left, sort.key);
    const rightValue = getSortValue(right, sort.key);

    let result = 0;
    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      result = leftValue - rightValue;
    } else {
      result = compareText(String(leftValue), String(rightValue));
    }

    if (result !== 0) {
      return sort.direction === 'desc' ? result * -1 : result;
    }
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

  const filteredRows = input.preferences.viewMode === 'character_filtered' && input.activeCharacter
    ? rows.filter((row) => {
        if (!row.eligible) return false;
        const addable = getAddableAssignmentLists(row.spell, input.activeCharacter!);
        return addable.length > 0;
      })
    : rows;

  return [...filteredRows].sort((left, right) => compareRows(left, right, input.preferences));
}
