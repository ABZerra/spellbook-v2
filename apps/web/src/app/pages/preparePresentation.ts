import type { QueueIntent } from '../types';

interface PrepareReviewItemInput {
  key: string;
  assignedList?: string | null;
  label: string;
}

interface PrepareLimitSummaryInput {
  list: string;
  used: number;
  limit: number;
}

export interface PrepareReviewGroup {
  list: string;
  usageLabel?: string;
  items: Array<Pick<PrepareReviewItemInput, 'key' | 'label'>>;
}

export function getDefaultQueueIntent(preparedCount: number): QueueIntent {
  return preparedCount > 0 ? 'replace' : 'add';
}

export function formatPrepareRowMeta(row: { level: number; list: string }): string {
  const levelLabel = row.level === 0 ? 'Cantrip' : `Level ${row.level}`;
  return `${levelLabel} · ${row.list}`;
}

export function formatPrepareReviewLabel(item: {
  intent: QueueIntent;
  spellName: string;
  assignedList?: string | null;
  replaceTargetName?: string | null;
}): string {
  if (item.intent === 'replace') {
    if (item.replaceTargetName) {
      return `Replace ${item.replaceTargetName} with ${item.spellName}`;
    }

    return `Replace with ${item.spellName}`;
  }

  if (item.intent === 'queue_only') {
    return `Save ${item.spellName} for later`;
  }

  return `Prepare ${item.spellName}`;
}

export function groupPrepareReviewItems(
  items: PrepareReviewItemInput[],
  limits: PrepareLimitSummaryInput[],
): PrepareReviewGroup[] {
  const groups = new Map<string, PrepareReviewGroup>();

  for (const limit of limits) {
    groups.set(limit.list, {
      list: limit.list,
      usageLabel: `${limit.used}/${limit.limit}`,
      items: [],
    });
  }

  for (const item of items) {
    const list = item.assignedList || 'Unassigned';
    const group = groups.get(list) || {
      list,
      usageLabel: undefined,
      items: [],
    };
    group.items.push({
      key: item.key,
      label: item.label,
    });
    groups.set(list, group);
  }

  return [...groups.values()].filter((group) => group.items.length > 0);
}
