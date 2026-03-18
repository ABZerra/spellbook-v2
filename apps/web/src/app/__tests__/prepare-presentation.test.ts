import { describe, expect, it } from 'vitest';
import {
  formatPrepareReviewLabel,
  formatPrepareRowMeta,
  getDefaultQueueIntent,
  groupPrepareReviewItems,
} from '../pages/preparePresentation';

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
    })).toBe('Replace Shield with Counterspell');

    expect(formatPrepareReviewLabel({
      intent: 'queue_only',
      spellName: 'Bless',
      assignedList: 'Cleric',
    })).toBe('Save Bless for later');
  });

  it('groups queued review items by spell list with usage labels', () => {
    expect(groupPrepareReviewItems(
      [
        {
          key: 'druid-replace',
          assignedList: 'Druid',
          label: 'Replace Healing Word with Cure Wounds',
        },
        {
          key: 'druid-add',
          assignedList: 'Druid',
          label: 'Prepare Faerie Fire',
        },
        {
          key: 'cleric-save',
          assignedList: 'Cleric',
          label: 'Save Bless for later',
        },
      ],
      [
        { list: 'Cleric', used: 15, limit: 22 },
        { list: 'Druid', used: 4, limit: 8 },
      ],
    )).toEqual([
      {
        list: 'Cleric',
        usageLabel: '15/22',
        items: [
          {
            key: 'cleric-save',
            label: 'Save Bless for later',
          },
        ],
      },
      {
        list: 'Druid',
        usageLabel: '4/8',
        items: [
          {
            key: 'druid-replace',
            label: 'Replace Healing Word with Cure Wounds',
          },
          {
            key: 'druid-add',
            label: 'Prepare Faerie Fire',
          },
        ],
      },
    ]);
  });
});
