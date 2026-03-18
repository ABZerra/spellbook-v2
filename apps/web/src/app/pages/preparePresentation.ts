import type { QueueIntent } from '../types';

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
  const listLabel = item.assignedList || '-';

  if (item.intent === 'replace') {
    if (item.replaceTargetName) {
      return `Replace ${item.replaceTargetName} [${listLabel}] with ${item.spellName} [${listLabel}]`;
    }

    return `Replace with ${item.spellName} [${listLabel}]`;
  }

  if (item.intent === 'queue_only') {
    return `Save ${item.spellName} [${listLabel}] for later`;
  }

  return `Prepare ${item.spellName} [${listLabel}]`;
}
