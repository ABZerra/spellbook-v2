import { describe, expect, it } from 'vitest';
import { buildSpellSyncPayloadV3 } from '../services/extensionSyncV3';

describe('extension sync v3', () => {
  it('builds list-scoped operations and reports issues', () => {
    const payload = buildSpellSyncPayloadV3(
      {
        id: 'char-1',
        name: 'Aelric',
        preparedSpells: [
          { spellId: 'magic-missile', assignedList: 'WIZARD' },
          { spellId: 'shield', assignedList: 'WIZARD' },
        ],
      },
      [
        { spellId: 'shield', assignedList: 'WIZARD' },
        { spellId: 'counterspell', assignedList: 'WIZARD' },
      ],
      [
        { id: 'magic-missile', ddbSpellId: '2191', name: 'Magic Missile', level: 1, source: 'Basic Rules (2014)', page: '257', sourceCitation: 'Basic Rules (2014), pg. 257', save: '', castingTime: '1 Action', notes: '', description: '', school: '', duration: '', rangeArea: '120 ft.', components: 'V, S', componentsExpanded: 'V, S', attackSave: 'None', damageEffect: 'Force', spellTags: [], availableFor: ['Wizard (Legacy)'], ddbUrl: '' },
        { id: 'shield', ddbSpellId: '2253', name: 'Shield', level: 1, source: 'Basic Rules (2014)', page: '275', sourceCitation: 'Basic Rules (2014), pg. 275', save: '', castingTime: '1 Reaction', notes: '', description: '', school: '', duration: '', rangeArea: 'Self', components: 'V, S', componentsExpanded: 'V, S', attackSave: 'None', damageEffect: 'Warding', spellTags: [], availableFor: ['Wizard (Legacy)'], ddbUrl: '' },
        { id: 'counterspell', ddbSpellId: '2065', name: 'Counterspell', level: 3, source: 'Basic Rules (2014)', page: '228', sourceCitation: 'Basic Rules (2014), pg. 228', save: '', castingTime: '1 Reaction', notes: '', description: '', school: '', duration: '', rangeArea: '60 ft.', components: 'S', componentsExpanded: 'S', attackSave: 'None', damageEffect: 'Control', spellTags: [], availableFor: ['Wizard (Legacy)'], ddbUrl: '' },
      ],
    );

    expect(payload.version).toBe(3);
    expect(payload.character).toEqual({ id: 'char-1', name: 'Aelric' });
    expect(payload.operations).toEqual([
      { type: 'replace', list: 'WIZARD', remove: 'Magic Missile', add: 'Shield' },
      { type: 'replace', list: 'WIZARD', remove: 'Shield', add: 'Counterspell' },
    ]);
    expect(payload.issues).toEqual([]);
  });

  it('emits no operations when final prepared list has no actionable changes', () => {
    const payload = buildSpellSyncPayloadV3(
      {
        id: 'char-1',
        name: 'Aelric',
        preparedSpells: [
          { spellId: 'magic-missile', assignedList: 'WIZARD' },
          { spellId: 'shield', assignedList: 'WIZARD' },
        ],
      },
      [
        { spellId: 'magic-missile', assignedList: 'WIZARD' },
        { spellId: 'shield', assignedList: 'WIZARD' },
      ],
      [
        { id: 'magic-missile', ddbSpellId: '2191', name: 'Magic Missile', level: 1, source: 'Basic Rules (2014)', page: '257', sourceCitation: 'Basic Rules (2014), pg. 257', save: '', castingTime: '1 Action', notes: '', description: '', school: '', duration: '', rangeArea: '120 ft.', components: 'V, S', componentsExpanded: 'V, S', attackSave: 'None', damageEffect: 'Force', spellTags: [], availableFor: ['Wizard (Legacy)'], ddbUrl: '' },
        { id: 'shield', ddbSpellId: '2253', name: 'Shield', level: 1, source: 'Basic Rules (2014)', page: '275', sourceCitation: 'Basic Rules (2014), pg. 275', save: '', castingTime: '1 Reaction', notes: '', description: '', school: '', duration: '', rangeArea: 'Self', components: 'V, S', componentsExpanded: 'V, S', attackSave: 'None', damageEffect: 'Warding', spellTags: [], availableFor: ['Wizard (Legacy)'], ddbUrl: '' },
      ],
    );

    expect(payload.operations).toEqual([]);
    expect(payload.issues).toEqual([]);
  });

  it('uses explicit assigned lists for multi-list replacements', () => {
    const payload = buildSpellSyncPayloadV3(
      {
        id: 'char-1',
        name: 'Aelric',
        availableLists: ['WIZARD', 'CLERIC'],
        preparedSpells: [{ spellId: 'light', assignedList: 'CLERIC' }],
      } as any,
      [{ spellId: 'guidance', assignedList: 'CLERIC' }] as any,
      [
        { id: 'light', ddbSpellId: '2175', name: 'Light', level: 0, source: 'Basic Rules (2014)', page: '255', sourceCitation: 'Basic Rules (2014), pg. 255', save: '', castingTime: '1 Action', notes: '', description: '', school: '', duration: '', rangeArea: 'Touch', components: 'V, M', componentsExpanded: 'V, M', attackSave: 'None', damageEffect: 'Utility', spellTags: [], availableFor: ['Wizard (Legacy)', 'Cleric (Legacy)'], ddbUrl: '' },
        { id: 'guidance', ddbSpellId: '2139', name: 'Guidance', level: 0, source: 'Basic Rules (2014)', page: '248', sourceCitation: 'Basic Rules (2014), pg. 248', save: '', castingTime: '1 Action', notes: '', description: '', school: '', duration: '', rangeArea: 'Touch', components: 'V, S', componentsExpanded: 'V, S', attackSave: 'None', damageEffect: 'Buff', spellTags: [], availableFor: ['Wizard (Legacy)', 'Cleric (Legacy)'], ddbUrl: '' },
      ],
    );

    expect(payload.operations).toEqual([
      { type: 'replace', list: 'CLERIC', remove: 'Light', add: 'Guidance' },
    ]);
    expect(payload.issues).toEqual([]);
  });
});
