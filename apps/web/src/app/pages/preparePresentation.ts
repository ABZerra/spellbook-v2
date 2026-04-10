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

export interface PrepareQueueLevelGroup {
  level: number;
  label: string;
  itemKeys: string[];
}

export function getDefaultQueueIntent(preparedCount: number): QueueIntent {
  return preparedCount > 0 ? 'replace' : 'add';
}

export function formatPrepareRowMeta(row: { level: number; list: string }): string {
  return `${formatPrepareLevelLabel(row.level)} · ${row.list}`;
}

export function formatPrepareLevelLabel(level: number): string {
  return level === 0 ? 'Cantrip' : `Level ${level}`;
}

export function getPrepareQueueListMeta(row: { level: number; list?: string | null }): {
  listLabel: string | null;
  levelLabel: string;
} {
  return {
    listLabel: row.list || null,
    levelLabel: formatPrepareLevelLabel(row.level),
  };
}

export function getPrepareReplaceMessage(input: {
  replaceMissing: boolean;
  showValidationErrors: boolean;
}): string | null {
  if (!input.replaceMissing) return null;
  if (!input.showValidationErrors) return null;
  return 'Choose a prepared spell before applying.';
}

export function getPrepareQueueReplaceSummary(intent: QueueIntent): string | null {
  if (intent === 'remove') return 'Marked for replacement';
  if (intent === 'replace') return null;
  if (intent === 'add') return 'Prepare without replacement';
  return 'Saved for later';
}

export function groupQueuedSpellsByLevel(items: Array<{
  key: string;
  level: number;
  spellName: string;
}>): PrepareQueueLevelGroup[] {
  const sortedItems = [...items].sort((left, right) => {
    if (left.level !== right.level) return left.level - right.level;
    return left.spellName.localeCompare(right.spellName);
  });

  const groups: PrepareQueueLevelGroup[] = [];

  for (const item of sortedItems) {
    const currentGroup = groups[groups.length - 1];
    if (!currentGroup || currentGroup.level !== item.level) {
      groups.push({
        level: item.level,
        label: item.level === 0 ? 'Cantrips' : `Level ${item.level}`,
        itemKeys: [item.key],
      });
      continue;
    }

    currentGroup.itemKeys.push(item.key);
  }

  return groups;
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

  if (item.intent === 'remove') {
    return `Remove ${item.spellName}`;
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

  const visibleGroups = [...groups.values()].filter((group) => group.items.length > 0);
  const namedGroups = visibleGroups.filter((group) => group.list !== 'Unassigned');
  const unassignedGroup = visibleGroups.find((group) => group.list === 'Unassigned');

  return unassignedGroup ? [...namedGroups, unassignedGroup] : namedGroups;
}
