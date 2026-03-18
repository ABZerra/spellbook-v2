import { describe, expect, it } from 'vitest';
import { formatPrepareReviewLabel, formatPrepareRowMeta, getDefaultQueueIntent } from '../pages/preparePresentation';

describe('prepare presentation', () => {
  it('defaults staged spells to replace when there are prepared spells already active', () => {
    expect(getDefaultQueueIntent(3)).toBe('replace');
  });

  it('defaults staged spells to add when nothing is prepared yet', () => {
    expect(getDefaultQueueIntent(0)).toBe('add');
  });

  it('formats compact prepare row metadata', () => {
    expect(formatPrepareRowMeta({ level: 3, list: 'Wizard' })).toBe('Level 3 · Wizard');
    expect(formatPrepareRowMeta({ level: 0, list: 'Cleric' })).toBe('Cantrip · Cleric');
  });

  it('formats queued review labels from staged actions', () => {
    expect(formatPrepareReviewLabel({
      intent: 'replace',
      spellName: 'Counterspell',
      assignedList: 'Wizard',
      replaceTargetName: 'Shield',
    })).toBe('Replace Shield [Wizard] with Counterspell [Wizard]');

    expect(formatPrepareReviewLabel({
      intent: 'queue_only',
      spellName: 'Bless',
      assignedList: 'Cleric',
    })).toBe('Save Bless [Cleric] for later');
  });
});
