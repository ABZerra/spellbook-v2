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
    { id: 'shield', name: 'Shield', level: 1, source: ['Wizard'], spellList: ['Wizard'], save: '', castingTime: 'Reaction', notes: '', description: '', school: '', duration: '', range: '', components: '', tags: [] },
    { id: 'mage-armor', name: 'Mage Armor', level: 1, source: ['Wizard'], spellList: ['Wizard'], save: '', castingTime: '1 Action', notes: '', description: '', school: '', duration: '', range: '', components: '', tags: [] },
    { id: 'absorb-elements', name: 'Absorb Elements', level: 1, source: ['Wizard'], spellList: ['Wizard'], save: '', castingTime: 'Reaction', notes: '', description: '', school: '', duration: '', range: '', components: '', tags: [] },
    { id: 'counterspell', name: 'Counterspell', level: 3, source: ['Wizard'], spellList: ['Wizard'], save: '', castingTime: 'Reaction', notes: '', description: '', school: '', duration: '', range: '', components: '', tags: [] },
    { id: 'bless', name: 'Bless', level: 1, source: ['Cleric'], spellList: ['Cleric'], save: '', castingTime: '1 Action', notes: '', description: '', school: '', duration: '', range: '', components: '', tags: [] },
    { id: 'water-breathing', name: 'Water Breathing', level: 3, source: ['Wizard'], spellList: ['Wizard'], save: '', castingTime: '1 Action', notes: '', description: '', school: '', duration: '', range: '', components: '', tags: [] },
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
