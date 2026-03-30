import { describe, expect, it } from 'vitest';
import { computeApplyResult } from '../domain/prepareQueue';
import type { CharacterProfile, SpellRecord } from '../types';

function makeProfile(): CharacterProfile {
  return {
    id: 'char-1',
    name: 'Aelric',
    classes: [],
    castingAbility: 'INT',
    availableLists: ['WIZARD'],
    preparationLimits: [{ list: 'WIZARD', limit: 6 }],
    preparedSpells: [
      { spellId: 'shield', assignedList: 'WIZARD' },
      { spellId: 'mage-armor', assignedList: 'WIZARD' },
    ],
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
    { id: 'light', ddbSpellId: '2175', name: 'Light', level: 0, source: 'Basic Rules (2014)', page: '255', sourceCitation: 'Basic Rules (2014), pg. 255', save: '', castingTime: '1 Action', notes: '', description: '', school: '', duration: '', rangeArea: 'Touch', components: 'V, M', componentsExpanded: 'V, M', attackSave: 'None', damageEffect: 'Utility', spellTags: [], availableFor: ['Wizard (Legacy)', 'Cleric (Legacy)'], ddbUrl: '' },
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
        { spellId: 'absorb-elements', intent: 'add', assignedList: 'WIZARD' },
        { spellId: 'counterspell', intent: 'replace', assignedList: 'WIZARD', replaceTarget: 'shield' },
        { spellId: 'water-breathing', intent: 'queue_only' },
      ],
    });

    expect(output.finalPreparedSpells).toEqual([
      { spellId: 'counterspell', assignedList: 'WIZARD', mode: 'normal' },
      { spellId: 'mage-armor', assignedList: 'WIZARD', mode: 'normal' },
      { spellId: 'absorb-elements', assignedList: 'WIZARD', mode: 'normal' },
    ]);
    expect(output.remainingQueue).toEqual([
      { spellId: 'water-breathing', intent: 'queue_only' },
    ]);
    expect(output.summary).toEqual({
      adds: 1,
      replacements: 1,
      removals: 0,
      queueOnlySkipped: 1,
    });
  });

  it('fails when replace target is missing', () => {
    const profile = makeProfile();
    const spells = makeSpells();

    expect(() => computeApplyResult({
      profile,
      spellsById: new Map(spells.map((spell) => [spell.id, spell])),
      queue: [{ spellId: 'counterspell', intent: 'replace', assignedList: 'WIZARD' }],
    })).toThrow('must choose a prepared spell to replace');
  });

  it('fails when replace target is from a different list', () => {
    const profile = makeProfile();
    profile.preparedSpells = [{ spellId: 'bless', assignedList: 'CLERIC' }];
    profile.availableLists = ['WIZARD', 'CLERIC'];
    profile.preparationLimits = [{ list: 'WIZARD', limit: 6 }, { list: 'CLERIC', limit: 6 }];

    const spells = makeSpells();

    expect(() => computeApplyResult({
      profile,
      spellsById: new Map(spells.map((spell) => [spell.id, spell])),
      queue: [{ spellId: 'counterspell', intent: 'replace', assignedList: 'WIZARD', replaceTarget: 'bless' }],
    })).toThrow('must replace a spell from the same list');
  });

  it('does not count level 0 spells against an assigned list limit', () => {
    const spells = makeSpells();

    const output = computeApplyResult({
      profile: {
        id: 'char-1',
        name: 'Aelric',
        classes: [],
        castingAbility: 'INT',
        availableLists: ['WIZARD'],
        preparationLimits: [{ list: 'WIZARD', limit: 1 }],
        preparedSpells: [{ spellId: 'shield', assignedList: 'WIZARD' }],
        nextPreparationQueue: [],
        savedIdeas: [],
        updatedAt: new Date().toISOString(),
      } as any,
      spellsById: new Map(spells.map((spell) => [spell.id, spell])),
      queue: [{ spellId: 'light', intent: 'add', assignedList: 'WIZARD' } as any],
    });

    expect(output.finalPreparedSpells).toEqual([
      { spellId: 'shield', assignedList: 'WIZARD', mode: 'normal' },
      { spellId: 'light', assignedList: 'WIZARD', mode: 'normal' },
    ]);
  });

  it('allows duplicate prepared spells across assigned lists and returns a warning', () => {
    const spells = makeSpells();

    const output = computeApplyResult({
      profile: {
        id: 'char-1',
        name: 'Aelric',
        classes: [],
        castingAbility: 'INT',
        availableLists: ['WIZARD', 'CLERIC'],
        preparationLimits: [{ list: 'WIZARD', limit: 6 }, { list: 'CLERIC', limit: 6 }],
        preparedSpells: [{ spellId: 'light', assignedList: 'WIZARD' }],
        nextPreparationQueue: [],
        savedIdeas: [],
        updatedAt: new Date().toISOString(),
      } as any,
      spellsById: new Map(spells.map((spell) => [spell.id, spell])),
      queue: [{ spellId: 'light', intent: 'add', assignedList: 'CLERIC' } as any],
    });

    expect(output.finalPreparedSpells).toEqual([
      { spellId: 'light', assignedList: 'WIZARD', mode: 'normal' },
      { spellId: 'light', assignedList: 'CLERIC', mode: 'normal' },
    ]);
    expect(output.warnings).toEqual([
      'Light is prepared more than once.',
    ]);
  });

  it('blocks queueing a spell above the assigned list max spell level', () => {
    const profile = makeProfile();
    profile.preparationLimits = [{ list: 'WIZARD', limit: 6, maxSpellLevel: 2 } as any];
    const spells = makeSpells();

    expect(() => computeApplyResult({
      profile,
      spellsById: new Map(spells.map((spell) => [spell.id, spell])),
      queue: [{ spellId: 'counterspell', intent: 'add', assignedList: 'WIZARD' } as any],
    })).toThrow(/max spell level/i);
  });

  it('applies a remove entry as pure removal when no replacement is linked', () => {
    const profile = makeProfile();
    const spells = makeSpells();

    const output = computeApplyResult({
      profile,
      spellsById: new Map(spells.map((spell) => [spell.id, spell])),
      queue: [
        { spellId: 'shield', intent: 'remove', assignedList: 'WIZARD' },
      ],
    });

    expect(output.finalPreparedSpells).toEqual([
      { spellId: 'mage-armor', assignedList: 'WIZARD', mode: 'normal' },
    ]);
    expect(output.summary.removals).toBe(1);
  });

  it('skips remove entry when spell is not currently prepared', () => {
    const profile = makeProfile();
    const spells = makeSpells();

    const output = computeApplyResult({
      profile,
      spellsById: new Map(spells.map((spell) => [spell.id, spell])),
      queue: [
        { spellId: 'counterspell', intent: 'remove', assignedList: 'WIZARD' },
      ],
    });

    // Prepared spells unchanged — counterspell was never prepared
    expect(output.finalPreparedSpells).toEqual([
      { spellId: 'shield', assignedList: 'WIZARD', mode: 'normal' },
      { spellId: 'mage-armor', assignedList: 'WIZARD', mode: 'normal' },
    ]);
    expect(output.summary.removals).toBe(0);
  });

  it('applies remove alongside add and replace entries', () => {
    const profile = makeProfile();
    const spells = makeSpells();

    const output = computeApplyResult({
      profile,
      spellsById: new Map(spells.map((spell) => [spell.id, spell])),
      queue: [
        { spellId: 'shield', intent: 'remove', assignedList: 'WIZARD' },
        { spellId: 'absorb-elements', intent: 'add', assignedList: 'WIZARD' },
      ],
    });

    expect(output.finalPreparedSpells).toEqual([
      { spellId: 'mage-armor', assignedList: 'WIZARD', mode: 'normal' },
      { spellId: 'absorb-elements', assignedList: 'WIZARD', mode: 'normal' },
    ]);
    expect(output.summary).toEqual({
      adds: 1,
      replacements: 0,
      removals: 1,
      queueOnlySkipped: 0,
    });
  });

  it('does not count always prepared spells against preparation limits', () => {
    const spells = makeSpells();

    const output = computeApplyResult({
      profile: {
        id: 'char-1',
        name: 'Aelric',
        classes: [],
        castingAbility: 'INT',
        availableLists: ['WIZARD'],
        preparationLimits: [{ list: 'WIZARD', limit: 1, maxSpellLevel: 9 }],
        preparedSpells: [{ spellId: 'mage-armor', assignedList: 'WIZARD', mode: 'always' }],
        nextPreparationQueue: [],
        savedIdeas: [],
        updatedAt: new Date().toISOString(),
      } as any,
      spellsById: new Map(spells.map((spell) => [spell.id, spell])),
      queue: [{ spellId: 'shield', intent: 'add', assignedList: 'WIZARD' } as any],
    });

    expect(output.finalPreparedSpells).toEqual([
      { spellId: 'mage-armor', assignedList: 'WIZARD', mode: 'always' },
      { spellId: 'shield', assignedList: 'WIZARD', mode: 'normal' },
    ]);
  });
});
