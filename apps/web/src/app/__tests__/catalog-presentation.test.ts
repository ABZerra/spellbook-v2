import { describe, expect, it } from 'vitest';
import { getCatalogRowPresentation } from '../pages/catalogPresentation';

describe('catalog presentation', () => {
  it('marks queued spells as staged and removable', () => {
    const result = getCatalogRowPresentation({
      row: {
        spell: {
          id: 'magic-missile',
          name: 'Magic Missile',
          level: 1,
          save: '',
          castingTime: '1 Action',
          notes: '',
        } as any,
        eligible: true,
        prepared: false,
        queued: true,
        displayList: 'WIZARD',
      },
      addableLists: ['WIZARD'],
    });

    expect(result.stateLabel).toBe('Queued');
    expect(result.actionLabel).toBe('Remove');
    expect(result.disabled).toBe(false);
    expect(result.helperText).toBe('Already staged for the next preparation.');
  });

  it('explains when a spell is outside the active lists', () => {
    const result = getCatalogRowPresentation({
      row: {
        spell: {
          id: 'bless',
          name: 'Bless',
          level: 1,
          save: '',
          castingTime: '1 Action',
          notes: '',
        } as any,
        eligible: false,
        prepared: false,
        queued: false,
        displayList: '-',
      },
      addableLists: [],
    });

    expect(result.stateLabel).toBe('Off-list');
    expect(result.actionLabel).toBe('Unavailable');
    expect(result.disabled).toBe(true);
    expect(result.helperText).toMatch(/outside your active spell lists/i);
  });

  it('explains when spell level limits block queueing', () => {
    const result = getCatalogRowPresentation({
      row: {
        spell: {
          id: 'meteor-swarm',
          name: 'Meteor Swarm',
          level: 9,
          save: '',
          castingTime: '1 Action',
          notes: '',
        } as any,
        eligible: true,
        prepared: false,
        queued: false,
        displayList: 'WIZARD',
      },
      addableLists: [],
    });

    expect(result.stateLabel).toBe('Too High');
    expect(result.actionLabel).toBe('Blocked');
    expect(result.disabled).toBe(true);
    expect(result.helperText).toMatch(/max spell level/i);
  });
});
