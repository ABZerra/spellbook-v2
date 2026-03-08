export interface PlanDiffItem {
  index: number;
  type: 'replace' | 'add' | 'remove';
  fromSpellId?: string;
  toSpellId?: string;
}

export function buildPlanDiff(currentSpellIds: string[], nextSpellIds: string[]): PlanDiffItem[] {
  const maxLen = Math.max(currentSpellIds.length, nextSpellIds.length);
  const output: PlanDiffItem[] = [];

  for (let index = 0; index < maxLen; index += 1) {
    const fromSpellId = currentSpellIds[index] || null;
    const toSpellId = nextSpellIds[index] || null;

    if (fromSpellId === toSpellId) continue;

    if (fromSpellId && toSpellId) {
      output.push({ index, type: 'replace', fromSpellId, toSpellId });
      continue;
    }

    if (fromSpellId && !toSpellId) {
      output.push({ index, type: 'remove', fromSpellId });
      continue;
    }

    if (!fromSpellId && toSpellId) {
      output.push({ index, type: 'add', toSpellId });
    }
  }

  return output;
}
