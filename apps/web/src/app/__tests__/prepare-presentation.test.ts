import { describe, expect, it } from 'vitest';
import {
  formatPrepareLevelLabel,
  groupQueuedSpellsByLevel,
  getPrepareQueueListMeta,
  getPrepareQueueReplaceSummary,
  getPrepareReplaceMessage,
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

  it('formats level-only queue metadata', () => {
    expect(formatPrepareLevelLabel(5)).toBe('Level 5');
    expect(formatPrepareLevelLabel(0)).toBe('Cantrip');
  });

  it('builds queue list metadata for the side column', () => {
    expect(getPrepareQueueListMeta({ level: 4, list: 'Cleric' })).toEqual({
      listLabel: 'Cleric',
      levelLabel: 'Level 4',
    });

    expect(getPrepareQueueListMeta({ level: 0, list: null })).toEqual({
      listLabel: null,
      levelLabel: 'Cantrip',
    });
  });

  it('only shows replace guidance when validation is active', () => {
    expect(getPrepareReplaceMessage({
      replaceMissing: true,
      showValidationErrors: false,
    })).toBeNull();

    expect(getPrepareReplaceMessage({
      replaceMissing: true,
      showValidationErrors: true,
    })).toBe('Choose a prepared spell before applying.');
  });

  it('formats read-only replace column copy for non-replace intents', () => {
    expect(getPrepareQueueReplaceSummary('replace')).toBeNull();
    expect(getPrepareQueueReplaceSummary('add')).toBe('Prepare without replacement');
    expect(getPrepareQueueReplaceSummary('queue_only')).toBe('Saved for later');
    expect(getPrepareQueueReplaceSummary('remove')).toBe('Marked for replacement');
  });

  it('formats remove intent as removal label', () => {
    const result = formatPrepareReviewLabel({
      intent: 'remove',
      spellName: 'Shield',
      assignedList: 'WIZARD',
    });
    expect(result).toBe('Replacing Shield');
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

  it('keeps unassigned review items after named list groups', () => {
    expect(groupPrepareReviewItems(
      [
        {
          key: 'unassigned-add',
          assignedList: null,
          label: 'Prepare Bless',
        },
        {
          key: 'wizard-replace',
          assignedList: 'Wizard',
          label: 'Replace Shield with Counterspell',
        },
      ],
      [],
    )).toEqual([
      {
        list: 'Wizard',
        usageLabel: undefined,
        items: [
          {
            key: 'wizard-replace',
            label: 'Replace Shield with Counterspell',
          },
        ],
      },
      {
        list: 'Unassigned',
        usageLabel: undefined,
        items: [
          {
            key: 'unassigned-add',
            label: 'Prepare Bless',
          },
        ],
      },
    ]);
  });

  it('groups queued spells by level and sorts spell names alphabetically', () => {
    expect(groupQueuedSpellsByLevel([
      { key: 'banishment', level: 4, spellName: 'Banishment' },
      { key: 'bless', level: 1, spellName: 'Bless' },
      { key: 'aid', level: 1, spellName: 'Aid' },
      { key: 'guidance', level: 0, spellName: 'Guidance' },
    ])).toEqual([
      {
        level: 0,
        label: 'Cantrips',
        itemKeys: ['guidance'],
      },
      {
        level: 1,
        label: 'Level 1',
        itemKeys: ['aid', 'bless'],
      },
      {
        level: 4,
        label: 'Level 4',
        itemKeys: ['banishment'],
      },
    ]);
  });
});
