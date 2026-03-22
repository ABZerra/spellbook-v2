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
      preferences: { viewMode: 'character_filtered', sorts: [] },
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
      preferences: { viewMode: 'character_filtered', sorts: [] },
    });

    expect(rows).toEqual([]);
  });

  it('excludes ineligible spells entirely in character_filtered mode', () => {
    const rows = buildCatalogRows({
      spells,
      activeCharacter,
      search: '',
      preferences: { viewMode: 'character_filtered', sorts: [] },
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
      preferences: { viewMode: 'all', sorts: [{ key: 'level', direction: 'asc' }] },
    });
    const descending = buildCatalogRows({
      spells,
      activeCharacter,
      search: '',
      preferences: { viewMode: 'all', sorts: [{ key: 'level', direction: 'desc' }] },
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
      preferences: { viewMode: 'all', sorts: [{ key: 'prepared', direction: 'desc' }] },
    });
    const queued = buildCatalogRows({
      spells,
      activeCharacter,
      search: '',
      preferences: { viewMode: 'all', sorts: [{ key: 'queued', direction: 'desc' }] },
    });

    expect(prepared[0]?.spell.id).toBe('shield');
    expect(queued[0]?.spell.id).toBe('magic-missile');
  });

  it('falls back to default preferences for invalid stored payloads', () => {
    expect(readCatalogPreferences('{"viewMode":"weird"}')).toEqual(getDefaultCatalogPreferences());
    expect(readCatalogPreferences('{')).toEqual(getDefaultCatalogPreferences());
  });

  it('restores valid persisted preferences (new format)', () => {
    expect(readCatalogPreferences(JSON.stringify({
      viewMode: 'character_filtered',
      sorts: [{ key: 'level', direction: 'desc' }],
    }))).toEqual({
      viewMode: 'character_filtered',
      sorts: [{ key: 'level', direction: 'desc' }],
    });
  });

  it('migrates old single-sort format to new sorts array', () => {
    expect(readCatalogPreferences(JSON.stringify({
      viewMode: 'character_filtered',
      sortKey: 'level',
      sortDirection: 'desc',
    }))).toEqual({
      viewMode: 'character_filtered',
      sorts: [{ key: 'level', direction: 'desc' }],
    });
  });

  it('treats all spells as eligible when there is no active character', () => {
    const rows = buildCatalogRows({
      spells,
      activeCharacter: null,
      search: '',
      preferences: { viewMode: 'character_filtered', sorts: [] },
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
      preferences: { viewMode: 'all', sorts: [{ key: 'action', direction: 'asc' }] },
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
      { viewMode: 'all', sorts: [{ key: 'list', direction: 'desc' }] },
      { allowListSort: false },
    );

    expect(next).toEqual({
      viewMode: 'all',
      sorts: [],
    });
  });

  it('resets sorting and resets viewMode to all', () => {
    expect(resetCatalogSort({
      viewMode: 'character_filtered',
      sorts: [{ key: 'level', direction: 'desc' }],
    })).toEqual({
      viewMode: 'all',
      sorts: [],
    });
  });

  it('default preferences returns empty sorts array', () => {
    expect(getDefaultCatalogPreferences()).toEqual({ viewMode: 'all', sorts: [] });
  });

  it('sorts by multiple criteria: level asc then name desc within same level', () => {
    const rows = buildCatalogRows({
      spells,
      activeCharacter: null,
      search: '',
      preferences: {
        viewMode: 'all',
        sorts: [
          { key: 'level', direction: 'asc' },
          { key: 'name', direction: 'desc' },
        ],
      },
    });

    // Level 1 spells: Shield, Magic Missile, Bless (name desc within level 1)
    // Level 2 spell: Acid Arrow
    expect(rows.map((row) => row.spell.id)).toEqual([
      'shield',        // level 1, name desc: S > M > B
      'magic-missile', // level 1
      'bless',         // level 1
      'acid-arrow',    // level 2
    ]);
  });
});
