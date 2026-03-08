import { describe, expect, it } from 'vitest';
import { buildSpellSyncPayloadV3 } from '../services/extensionSyncV3';

describe('extension sync v3', () => {
  it('builds list-scoped operations and reports issues', () => {
    const payload = buildSpellSyncPayloadV3(
      {
        id: 'char-1',
        name: 'Aelric',
        availableLists: ['WIZARD'],
        preparedSpellIds: ['magic-missile', 'shield'],
      },
      ['shield', 'counterspell'],
      [
        { id: 'magic-missile', name: 'Magic Missile', level: 1, source: ['Wizard'], spellList: ['Wizard'], save: '', castingTime: '1 Action', notes: '', description: '', school: '', duration: '', range: '', components: '', tags: [] },
        { id: 'shield', name: 'Shield', level: 1, source: ['Wizard'], spellList: ['Wizard'], save: '', castingTime: 'Reaction', notes: '', description: '', school: '', duration: '', range: '', components: '', tags: [] },
        { id: 'counterspell', name: 'Counterspell', level: 3, source: ['Wizard'], spellList: ['Wizard'], save: '', castingTime: 'Reaction', notes: '', description: '', school: '', duration: '', range: '', components: '', tags: [] },
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
        availableLists: ['WIZARD'],
        preparedSpellIds: ['magic-missile', 'shield'],
      },
      ['magic-missile', 'shield'],
      [
        { id: 'magic-missile', name: 'Magic Missile', level: 1, source: ['Wizard'], spellList: ['Wizard'], save: '', castingTime: '1 Action', notes: '', description: '', school: '', duration: '', range: '', components: '', tags: [] },
        { id: 'shield', name: 'Shield', level: 1, source: ['Wizard'], spellList: ['Wizard'], save: '', castingTime: 'Reaction', notes: '', description: '', school: '', duration: '', range: '', components: '', tags: [] },
      ],
    );

    expect(payload.operations).toEqual([]);
    expect(payload.issues).toEqual([]);
  });
});
