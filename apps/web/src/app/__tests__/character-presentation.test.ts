import { describe, expect, it } from 'vitest';
import {
  getCharacterCueMetadata,
  getCharacterCueStats,
  getCharacterHeaderPills,
  getGroupedPreparedVerificationRows,
  getCharacterPreparationRuleSummaries,
  formatPreparedVerificationRowMeta,
} from '../pages/characterPresentation';

describe('character presentation', () => {
  it('builds compact cue stats from prepared and queued spells', () => {
    expect(getCharacterCueStats({
      preparedSpells: [
        { spellId: 'shield', assignedList: 'WIZARD', mode: 'normal' },
        { spellId: 'mage-armor', assignedList: 'WIZARD', mode: 'always' },
        { spellId: 'bless', assignedList: 'CLERIC', mode: 'normal' },
      ],
      nextPreparationQueue: [
        { spellId: 'counterspell', intent: 'replace' },
        { spellId: 'spirit-guardians', intent: 'queue_only' },
      ],
    })).toEqual([
      { label: 'Prepared', value: 3 },
      { label: 'Always', value: 1 },
      { label: 'Queued', value: 2 },
    ]);
  });

  it('formats the compact cue metadata', () => {
    expect(getCharacterCueMetadata({
      class: 'Wizard',
      subclass: 'Evocation',
    })).toEqual({
      classLabel: 'Wizard',
      subclassLabel: 'Evocation',
    });

    expect(getCharacterCueMetadata({
      class: '',
      subclass: '',
    })).toEqual({
      classLabel: 'Unassigned class',
      subclassLabel: undefined,
    });
  });

  it('builds header pill data from characters', () => {
    expect(getCharacterHeaderPills([
      { id: 'one', name: 'Alira' },
      { id: 'two', name: 'Varric' },
    ], 'two')).toEqual([
      { id: 'one', label: 'Alira', isActive: false },
      { id: 'two', label: 'Varric', isActive: true },
    ]);
  });

  it('builds top-level preparation rule summaries', () => {
    expect(getCharacterPreparationRuleSummaries(
      [
        { list: 'Wizard', limit: 8, maxSpellLevel: 9 },
        { list: 'Cleric', limit: 5, maxSpellLevel: 4 },
      ],
      new Map([
        ['WIZARD', 6],
        ['CLERIC', 2],
      ]),
    )).toEqual([
      { list: 'Wizard', used: 6, limit: 8, maxSpellLevel: 9 },
      { list: 'Cleric', used: 2, limit: 5, maxSpellLevel: 4 },
    ]);
  });

  it('groups prepared rows by level and sorts by name within each level', () => {
    expect(getGroupedPreparedVerificationRows([
      { spellId: 'shield', spellName: 'Shield', level: 1, assignedList: 'WIZARD', mode: 'normal' },
      { spellId: 'aid', spellName: 'Aid', level: 2, assignedList: 'CLERIC', mode: 'normal' },
      { spellId: 'absorb-elements', spellName: 'Absorb Elements', level: 1, assignedList: 'WIZARD', mode: 'normal' },
      { spellId: 'guidance', spellName: 'Guidance', level: 0, assignedList: 'CLERIC', mode: 'always' },
    ])).toEqual([
      {
        level: 0,
        label: 'Cantrips',
        rows: [
          { spellId: 'guidance', spellName: 'Guidance', level: 0, assignedList: 'CLERIC', mode: 'always' },
        ],
      },
      {
        level: 1,
        label: 'Level 1',
        rows: [
          { spellId: 'absorb-elements', spellName: 'Absorb Elements', level: 1, assignedList: 'WIZARD', mode: 'normal' },
          { spellId: 'shield', spellName: 'Shield', level: 1, assignedList: 'WIZARD', mode: 'normal' },
        ],
      },
      {
        level: 2,
        label: 'Level 2',
        rows: [
          { spellId: 'aid', spellName: 'Aid', level: 2, assignedList: 'CLERIC', mode: 'normal' },
        ],
      },
    ]);
  });

  it('formats quiet prepared row metadata', () => {
    expect(formatPreparedVerificationRowMeta({
      assignedList: 'Wizard',
      mode: 'always',
    })).toBe('Wizard · Always');

    expect(formatPreparedVerificationRowMeta({
      assignedList: 'Cleric',
      mode: 'normal',
    })).toBe('Cleric');
  });
});
