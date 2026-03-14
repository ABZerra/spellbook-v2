import type { PreparedSpellEntry } from '../types';

export interface PlanDiffItem {
  index: number;
  type: 'replace' | 'add' | 'remove';
  from?: PreparedSpellEntry;
  to?: PreparedSpellEntry;
}

function matchesEntry(left: PreparedSpellEntry | null, right: PreparedSpellEntry | null): boolean {
  return Boolean(
    left
    && right
    && left.spellId === right.spellId
    && left.assignedList === right.assignedList
  );
}

export function buildPlanDiff(currentPreparedSpells: PreparedSpellEntry[], nextPreparedSpells: PreparedSpellEntry[]): PlanDiffItem[] {
  const maxLen = Math.max(currentPreparedSpells.length, nextPreparedSpells.length);
  const output: PlanDiffItem[] = [];

  for (let index = 0; index < maxLen; index += 1) {
    const from = currentPreparedSpells[index] || null;
    const to = nextPreparedSpells[index] || null;

    if (matchesEntry(from, to)) continue;

    if (from && to) {
      output.push({ index, type: 'replace', from, to });
      continue;
    }

    if (from && !to) {
      output.push({ index, type: 'remove', from });
      continue;
    }

    if (!from && to) {
      output.push({ index, type: 'add', to });
    }
  }

  return output;
}
