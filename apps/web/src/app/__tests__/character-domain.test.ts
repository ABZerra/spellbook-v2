import { describe, expect, it } from 'vitest';
import {
  getPreparationLimits,
  getSpellLists,
  isSpellEligibleForCharacter,
  normalizeCharacterProfile,
  normalizeSpellIdList,
  reassignPreparedSpellEntryAtOccurrence,
  removePreparedSpellEntryAtOccurrence,
} from '../domain/character';

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
      class: '',
      subclass: '',
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
      class: '',
      subclass: '',
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
      class: '',
      subclass: '',
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
