import { describe, expect, it } from 'vitest';
import {
  buildCatalogRows,
  getDefaultCatalogPreferences,
  readCatalogPreferences,
  resetCatalogSort,
  sanitizeCatalogPreferences,
} from '../pages/catalogViewModel';

const spells = [
  {
    id: 'magic-missile',
    name: 'Magic Missile',
    notes: 'Guaranteed damage',
    description: 'Three darts of force.',
    level: 1,
    save: '',
    castingTime: '1 Action',
    availableFor: ['Wizard (Legacy)'],
    additionalSpellLists: [],
  },
  {
    id: 'shield',
    name: 'Shield',
    notes: '',
    description: 'Protective ward.',
    level: 1,
    save: '',
    castingTime: '1 Reaction',
    availableFor: ['Wizard (Legacy)'],
    additionalSpellLists: [],
  },
  {
    id: 'bless',
    name: 'Bless',
    notes: '',
    description: 'Bless allies.',
    level: 1,
    save: '',
    castingTime: '1 Action',
    availableFor: ['Cleric (Legacy)'],
    additionalSpellLists: [],
  },
  {
    id: 'acid-arrow',
    name: 'Acid Arrow',
    notes: '',
    description: 'Acid streaks toward a target.',
    level: 2,
    save: 'DEX',
    castingTime: '',
    availableFor: ['Wizard (Legacy)'],
    additionalSpellLists: [],
  },
] as any;

const activeCharacter = {
  availableLists: ['Wizard'],
  preparationLimits: [{ list: 'Wizard', limit: 8, maxSpellLevel: 9 }],
  preparedSpells: [{ spellId: 'shield', assignedList: 'WIZARD', mode: 'normal' }],
  nextPreparationQueue: [{ spellId: 'magic-missile', intent: 'add' }],
} as any;

describe('catalog view model', () => {
  it('filters to character-eligible spells in character_filtered mode', () => {
    const rows = buildCatalogRows({
      spells,
      activeCharacter,
      search: '',
      preferences: { viewMode: 'character_filtered', sortKey: 'name', sortDirection: 'asc' },
    });

    expect(rows.map((row) => row.spell.id)).toEqual([
      'acid-arrow',
      'magic-missile',
      'shield',
    ]);
  });

  it('returns no rows when character_filtered mode has no eligible matches', () => {
    const rows = buildCatalogRows({
      spells,
      activeCharacter: {
        availableLists: ['Druid'],
        preparationLimits: [{ list: 'Druid', limit: 8, maxSpellLevel: 9 }],
        preparedSpells: [],
        nextPreparationQueue: [],
      } as any,
      search: '',
      preferences: { viewMode: 'character_filtered', sortKey: 'name', sortDirection: 'asc' },
    });

    expect(rows).toEqual([]);
  });

  it('excludes ineligible spells entirely in character_filtered mode', () => {
    const rows = buildCatalogRows({
      spells,
      activeCharacter,
      search: '',
      preferences: { viewMode: 'character_filtered', sortKey: 'name', sortDirection: 'asc' },
    });

    expect(rows.map((row) => row.spell.id)).toEqual([
      'acid-arrow',
      'magic-missile',
      'shield',
    ]);
    expect(rows.find((row) => row.spell.id === 'bless')).toBeUndefined();
  });

  it('sorts by level ascending and descending', () => {
    const ascending = buildCatalogRows({
      spells,
      activeCharacter,
      search: '',
      preferences: { viewMode: 'all', sortKey: 'level', sortDirection: 'asc' },
    });
    const descending = buildCatalogRows({
      spells,
      activeCharacter,
      search: '',
      preferences: { viewMode: 'all', sortKey: 'level', sortDirection: 'desc' },
    });

    expect(ascending.map((row) => row.spell.id)).toEqual([
      'bless',
      'magic-missile',
      'shield',
      'acid-arrow',
    ]);
    expect(descending.map((row) => row.spell.id)).toEqual([
      'acid-arrow',
      'bless',
      'magic-missile',
      'shield',
    ]);
  });

  it('sorts by prepared and queued derived state', () => {
    const prepared = buildCatalogRows({
      spells,
      activeCharacter,
      search: '',
      preferences: { viewMode: 'all', sortKey: 'prepared', sortDirection: 'desc' },
    });
    const queued = buildCatalogRows({
      spells,
      activeCharacter,
      search: '',
      preferences: { viewMode: 'all', sortKey: 'queued', sortDirection: 'desc' },
    });

    expect(prepared[0]?.spell.id).toBe('shield');
    expect(queued[0]?.spell.id).toBe('magic-missile');
  });

  it('falls back to default preferences for invalid stored payloads', () => {
    expect(readCatalogPreferences('{"viewMode":"weird"}')).toEqual(getDefaultCatalogPreferences());
    expect(readCatalogPreferences('{')).toEqual(getDefaultCatalogPreferences());
  });

  it('restores valid persisted preferences', () => {
    expect(readCatalogPreferences(JSON.stringify({
      viewMode: 'character_filtered',
      sortKey: 'level',
      sortDirection: 'desc',
    }))).toEqual({
      viewMode: 'character_filtered',
      sortKey: 'level',
      sortDirection: 'desc',
    });
  });

  it('treats all spells as eligible when there is no active character', () => {
    const rows = buildCatalogRows({
      spells,
      activeCharacter: null,
      search: '',
      preferences: { viewMode: 'character_filtered', sortKey: 'name', sortDirection: 'asc' },
    });

    expect(rows.map((row) => row.spell.id)).toEqual([
      'acid-arrow',
      'bless',
      'magic-missile',
      'shield',
    ]);
    expect(rows.every((row) => row.eligible)).toBe(true);
  });

  it('keeps ordering deterministic when sortable values are blank', () => {
    const rows = buildCatalogRows({
      spells,
      activeCharacter,
      search: '',
      preferences: { viewMode: 'all', sortKey: 'action', sortDirection: 'asc' },
    });

    expect(rows.map((row) => row.spell.id)).toEqual([
      'acid-arrow',
      'bless',
      'magic-missile',
      'shield',
    ]);
  });

  it('resets list sorting when the list column is unavailable', () => {
    const next = sanitizeCatalogPreferences(
      { viewMode: 'all', sortKey: 'list', sortDirection: 'desc' },
      { allowListSort: false },
    );

    expect(next).toEqual({
      viewMode: 'all',
      sortKey: 'name',
      sortDirection: 'asc',
    });
  });

  it('resets sorting and resets viewMode to all', () => {
    expect(resetCatalogSort({
      viewMode: 'character_filtered',
      sortKey: 'level',
      sortDirection: 'desc',
    })).toEqual({
      viewMode: 'all',
      sortKey: 'name',
      sortDirection: 'asc',
    });
  });
});
