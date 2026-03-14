import { describe, expect, it } from 'vitest';
import { computeApplyResult } from '../domain/prepareQueue';
import type { CharacterProfile, SpellRecord } from '../types';

function makeProfile(): CharacterProfile {
  return {
    id: 'char-1',
    name: 'Aelric',
    class: '',
    subclass: '',
    castingAbility: 'INT',
    availableLists: ['WIZARD'],
    preparationLimits: [{ list: 'WIZARD', limit: 6 }],
    preparedSpellIds: ['shield', 'mage-armor'],
    nextPreparationQueue: [],
    savedIdeas: [],
    updatedAt: new Date().toISOString(),
  };
}

function makeSpells(): SpellRecord[] {
  return [
    { id: 'shield', ddbSpellId: '2253', name: 'Shield', level: 1, source: 'Basic Rules (2014)', page: '275', sourceCitation: 'Basic Rules (2014), pg. 275', save: '', castingTime: '1 Reaction', notes: '', description: '', school: '', duration: '', rangeArea: 'Self', components: 'V, S', componentsExpanded: 'V, S', attackSave: 'None', damageEffect: 'Warding', spellTags: [], availableFor: ['Wizard (Legacy)'], ddbUrl: '' },
    { id: 'mage-armor', ddbSpellId: '2182', name: 'Mage Armor', level: 1, source: 'Basic Rules (2014)', page: '256', sourceCitation: 'Basic Rules (2014), pg. 256', save: '', castingTime: '1 Action', notes: '', description: '', school: '', duration: '', rangeArea: 'Touch', components: 'V, S, M', componentsExpanded: 'V, S, M', attackSave: 'None', damageEffect: 'Buff', spellTags: [], availableFor: ['Wizard (Legacy)'], ddbUrl: '' },
    { id: 'absorb-elements', ddbSpellId: '2058', name: 'Absorb Elements', level: 1, source: 'Elemental Evil Player\'s Companion', page: '150', sourceCitation: 'Elemental Evil Player\'s Companion, pg. 150', save: '', castingTime: '1 Reaction', notes: '', description: '', school: '', duration: '', rangeArea: 'Self', components: 'S', componentsExpanded: 'S', attackSave: 'None', damageEffect: 'Acid', spellTags: [], availableFor: ['Wizard (Legacy)'], ddbUrl: '' },
    { id: 'counterspell', ddbSpellId: '2065', name: 'Counterspell', level: 3, source: 'Basic Rules (2014)', page: '228', sourceCitation: 'Basic Rules (2014), pg. 228', save: '', castingTime: '1 Reaction', notes: '', description: '', school: '', duration: '', rangeArea: '60 ft.', components: 'S', componentsExpanded: 'S', attackSave: 'None', damageEffect: 'Control', spellTags: [], availableFor: ['Wizard (Legacy)'], ddbUrl: '' },
    { id: 'bless', ddbSpellId: '2035', name: 'Bless', level: 1, source: 'Basic Rules (2014)', page: '219', sourceCitation: 'Basic Rules (2014), pg. 219', save: '', castingTime: '1 Action', notes: '', description: '', school: '', duration: '', rangeArea: '30 ft.', components: 'V, S, M', componentsExpanded: 'V, S, M', attackSave: 'None', damageEffect: 'Buff', spellTags: [], availableFor: ['Cleric (Legacy)'], ddbUrl: '' },
    { id: 'water-breathing', ddbSpellId: '2309', name: 'Water Breathing', level: 3, source: 'Basic Rules (2014)', page: '287', sourceCitation: 'Basic Rules (2014), pg. 287', save: '', castingTime: '1 Action', notes: '', description: '', school: '', duration: '', rangeArea: '30 ft.', components: 'V, S, M', componentsExpanded: 'V, S, M', attackSave: 'None', damageEffect: 'Utility', spellTags: [], availableFor: ['Wizard (Legacy)'], ddbUrl: '' },
  ];
}

describe('computeApplyResult', () => {
  it('applies add and replace while keeping queue_only rows', () => {
    const profile = makeProfile();
    const spells = makeSpells();

    const output = computeApplyResult({
      profile,
      spellsById: new Map(spells.map((spell) => [spell.id, spell])),
      queue: [
        { spellId: 'absorb-elements', intent: 'add' },
        { spellId: 'counterspell', intent: 'replace', replaceTarget: 'shield' },
        { spellId: 'water-breathing', intent: 'queue_only' },
      ],
    });

    expect(output.finalPreparedSpellIds).toEqual(['counterspell', 'mage-armor', 'absorb-elements']);
    expect(output.remainingQueue).toEqual([
      { spellId: 'water-breathing', intent: 'queue_only' },
    ]);
    expect(output.summary).toEqual({
      adds: 1,
      replacements: 1,
      queueOnlySkipped: 1,
    });
  });

  it('fails when replace target is missing', () => {
    const profile = makeProfile();
    const spells = makeSpells();

    expect(() => computeApplyResult({
      profile,
      spellsById: new Map(spells.map((spell) => [spell.id, spell])),
      queue: [{ spellId: 'counterspell', intent: 'replace' }],
    })).toThrow('must choose a prepared spell to replace');
  });

  it('fails when replace target is from a different list', () => {
    const profile = makeProfile();
    profile.preparedSpellIds = ['bless'];
    profile.availableLists = ['WIZARD', 'CLERIC'];
    profile.preparationLimits = [{ list: 'WIZARD', limit: 6 }, { list: 'CLERIC', limit: 6 }];

    const spells = makeSpells();

    expect(() => computeApplyResult({
      profile,
      spellsById: new Map(spells.map((spell) => [spell.id, spell])),
      queue: [{ spellId: 'counterspell', intent: 'replace', replaceTarget: 'bless' }],
    })).toThrow('must replace a spell from the same list');
  });
});
