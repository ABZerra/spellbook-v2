import { describe, expect, it } from 'vitest';
import { getPreparationLimits, getSpellLists, isSpellEligibleForCharacter, normalizeCharacterProfile, normalizeSpellIdList } from '../domain/character';

describe('character domain', () => {
  it('normalizes spell list extraction from spellList/source', () => {
    expect(getSpellLists({ spellList: [' Wizard ', 'wizard'], source: [] })).toEqual(['WIZARD']);
    expect(getSpellLists({ spellList: [], source: ['cleric'] })).toEqual(['CLERIC']);
  });

  it('enforces eligibility when character has constrained lists', () => {
    const spell = { spellList: ['Wizard'], source: [] };
    expect(isSpellEligibleForCharacter(spell, { availableLists: ['WIZARD'] })).toBe(true);
    expect(isSpellEligibleForCharacter(spell, { availableLists: ['CLERIC'] })).toBe(false);
  });

  it('dedupes spell ids in queue normalization', () => {
    const queue = normalizeSpellIdList(['a', '', 'a', 'b']);
    expect(queue).toEqual(['a', 'b']);
  });

  it('builds default per-list preparation limits', () => {
    const limits = getPreparationLimits({ id: 'x', name: 'X', availableLists: ['Wizard', 'Cleric'] });
    expect(limits).toEqual([
      { list: 'WIZARD', limit: 8 },
      { list: 'CLERIC', limit: 8 },
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
});
