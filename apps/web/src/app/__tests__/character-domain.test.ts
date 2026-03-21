import { describe, expect, it } from 'vitest';
import {
  formatClassDisplayString,
  getPreparationLimits,
  getSpellLists,
  isSpellEligibleForCharacter,
  normalizeCharacterProfile,
  normalizeSpellIdList,
  reassignPreparedSpellEntryAtOccurrence,
  removePreparedSpellEntryAtOccurrence,
} from '../domain/character';
import type { CharacterProfile } from '../types';

function makeProfile(): CharacterProfile {
  return {
    id: 'aelric',
    name: 'Aelric',
    classes: [],
    castingAbility: '',
    availableLists: [],
    preparationLimits: [],
    preparedSpells: [],
    nextPreparationQueue: [],
    savedIdeas: [],
    updatedAt: new Date().toISOString(),
  };
}

describe('character domain', () => {
  it('normalizes spell list extraction from availableFor entries', () => {
    expect(getSpellLists({ availableFor: [' Wizard (Legacy) ', 'wizard'] } as any)).toEqual(['WIZARD']);
    expect(getSpellLists({ availableFor: ['Cleric (Legacy) - Life Domain'] } as any)).toEqual(['CLERIC']);
  });

  it('enforces eligibility when character has constrained lists', () => {
    const spell = { availableFor: ['Wizard (Legacy)', 'Wizard - Graviturgy Magic (EGtW)'] } as any;
    expect(isSpellEligibleForCharacter(spell, { availableLists: ['WIZARD'] })).toBe(true);
    expect(isSpellEligibleForCharacter(spell, { availableLists: ['CLERIC'] })).toBe(false);
  });

  it('treats additional spell lists as native class list membership', () => {
    const spell = { availableFor: ['Cleric (Legacy)'], additionalSpellLists: ['BARD', 'RANGER'] } as any;
    expect(getSpellLists(spell)).toEqual(['CLERIC', 'BARD', 'RANGER']);
    expect(isSpellEligibleForCharacter(spell, { availableLists: ['BARD'] })).toBe(true);
    expect(isSpellEligibleForCharacter(spell, { availableLists: ['WIZARD'] })).toBe(false);
  });

  it('dedupes spell ids in queue normalization', () => {
    const queue = normalizeSpellIdList(['a', '', 'a', 'b']);
    expect(queue).toEqual(['a', 'b']);
  });

  it('builds default per-list preparation limits', () => {
    const limits = getPreparationLimits({ id: 'x', name: 'X', availableLists: ['Wizard', 'Cleric'] });
    expect(limits).toEqual([
      { list: 'WIZARD', limit: 8, maxSpellLevel: 9 },
      { list: 'CLERIC', limit: 8, maxSpellLevel: 9 },
    ]);
  });

  it('normalizes queue entries and removes duplicates', () => {
    const profile = normalizeCharacterProfile({
      id: 'aelric',
      name: 'Aelric',
      classes: [],
      castingAbility: '',
      availableLists: ['Wizard'],
      preparationLimits: [{ list: 'Wizard', limit: 8 }],
      preparedSpellIds: ['shield'],
      nextPreparationQueue: [
        { spellId: ' counterspell ', intent: 'add' },
        { spellId: 'counterspell', intent: 'add' },
      ],
      savedIdeas: [],
      updatedAt: new Date().toISOString(),
    } as any) as any;

    expect(profile.nextPreparationQueue).toEqual([
      { spellId: 'counterspell', intent: 'add' },
    ]);
  });

  it('migrates legacy prepared spell ids into explicit assigned-list entries', () => {
    const profile = normalizeCharacterProfile({
      id: 'aelric',
      name: 'Aelric',
      classes: [],
      castingAbility: '',
      availableLists: ['Wizard'],
      preparationLimits: [{ list: 'Wizard', limit: 8 }],
      preparedSpellIds: ['shield'],
      nextPreparationQueue: [],
      savedIdeas: [],
      updatedAt: new Date().toISOString(),
    } as any) as any;

    expect(profile.preparedSpells).toEqual([
      { spellId: 'shield', assignedList: 'WIZARD', mode: 'normal' },
    ]);
  });

  it('defaults prepared entries without mode to normal', () => {
    const profile = normalizeCharacterProfile({
      id: 'aelric',
      name: 'Aelric',
      classes: [],
      castingAbility: '',
      availableLists: ['Wizard'],
      preparationLimits: [{ list: 'Wizard', limit: 8 }],
      preparedSpells: [{ spellId: 'shield', assignedList: 'WIZARD' }],
      nextPreparationQueue: [],
      savedIdeas: [],
      updatedAt: new Date().toISOString(),
    } as any) as any;

    expect(profile.preparedSpells).toEqual([
      { spellId: 'shield', assignedList: 'WIZARD', mode: 'normal' },
    ]);
  });

  it('defaults list max spell level to 9 when omitted', () => {
    const limits = getPreparationLimits({
      id: 'x',
      name: 'X',
      availableLists: ['Wizard'],
      preparationLimits: [{ list: 'Wizard', limit: 5 }],
    } as any);

    expect(limits).toEqual([
      { list: 'WIZARD', limit: 5, maxSpellLevel: 9 },
    ]);
  });

  it('removes only the targeted duplicate prepared entry occurrence', () => {
    const preparedSpells = [
      { spellId: 'shield', assignedList: 'WIZARD', mode: 'normal' },
      { spellId: 'shield', assignedList: 'WIZARD', mode: 'normal' },
      { spellId: 'shield', assignedList: 'CLERIC', mode: 'normal' },
    ] as const;

    expect(removePreparedSpellEntryAtOccurrence(
      [...preparedSpells],
      { spellId: 'shield', assignedList: 'WIZARD', mode: 'normal' },
      0,
    )).toEqual([
      { spellId: 'shield', assignedList: 'WIZARD', mode: 'normal' },
      { spellId: 'shield', assignedList: 'CLERIC', mode: 'normal' },
    ]);
  });

  it('reassigns only the targeted duplicate prepared entry occurrence', () => {
    const preparedSpells = [
      { spellId: 'shield', assignedList: 'WIZARD', mode: 'normal' },
      { spellId: 'shield', assignedList: 'WIZARD', mode: 'normal' },
      { spellId: 'shield', assignedList: 'CLERIC', mode: 'normal' },
    ] as const;

    expect(reassignPreparedSpellEntryAtOccurrence(
      [...preparedSpells],
      { spellId: 'shield', assignedList: 'WIZARD', mode: 'normal' },
      1,
      'cleric',
    )).toEqual([
      { spellId: 'shield', assignedList: 'WIZARD', mode: 'normal' },
      { spellId: 'shield', assignedList: 'CLERIC', mode: 'normal' },
      { spellId: 'shield', assignedList: 'CLERIC', mode: 'normal' },
    ]);
  });
});

describe('multiclass migration', () => {
  it('migrates old class/subclass strings to classes array', () => {
    const oldProfile = {
      ...makeProfile(),
      class: 'Wizard',
      subclass: 'School of Evocation',
      classes: undefined,
    } as any;
    const result = normalizeCharacterProfile(oldProfile);
    expect(result.classes).toEqual([{ name: 'Wizard', subclass: 'School of Evocation' }]);
    expect((result as any).class).toBeUndefined();
    expect((result as any).subclass).toBeUndefined();
  });

  it('migrates empty class to empty classes array', () => {
    const oldProfile = {
      ...makeProfile(),
      class: '',
      subclass: '',
      classes: undefined,
    } as any;
    const result = normalizeCharacterProfile(oldProfile);
    expect(result.classes).toEqual([]);
  });

  it('preserves existing classes array', () => {
    const profile = makeProfile();
    profile.classes = [{ name: 'Cleric', subclass: 'War Domain' }, { name: 'Wizard' }];
    const result = normalizeCharacterProfile(profile);
    expect(result.classes).toEqual([{ name: 'Cleric', subclass: 'War Domain' }, { name: 'Wizard' }]);
  });
});

describe('formatClassDisplayString', () => {
  it('returns default for empty classes', () => {
    expect(formatClassDisplayString([])).toBe('Unassigned class');
  });
  it('formats single class', () => {
    expect(formatClassDisplayString([{ name: 'Wizard' }])).toBe('Wizard');
  });
  it('formats class with subclass', () => {
    expect(formatClassDisplayString([{ name: 'Cleric', subclass: 'War Domain' }])).toBe('Cleric · War Domain');
  });
  it('formats multiclass', () => {
    expect(formatClassDisplayString([
      { name: 'Cleric', subclass: 'War Domain' },
      { name: 'Wizard' },
    ])).toBe('Cleric · War Domain / Wizard');
  });
});
