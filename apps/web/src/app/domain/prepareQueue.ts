import {
  enforcePreparationLimits,
  getSpellAssignmentList,
  isSpellEligibleForCharacter,
  normalizeQueueEntries,
  normalizeSpellIdList,
} from './character';
import type { CharacterProfile, NextPreparationQueueEntry, SpellRecord } from '../types';

interface ComputeApplyInput {
  profile: Pick<CharacterProfile, 'name' | 'availableLists' | 'preparationLimits' | 'preparedSpellIds'>;
  spellsById: Map<string, SpellRecord>;
  queue: NextPreparationQueueEntry[];
}

interface ApplySummary {
  adds: number;
  replacements: number;
  queueOnlySkipped: number;
}

interface ComputeApplyOutput {
  finalPreparedSpellIds: string[];
  appliedSpellIds: string[];
  remainingQueue: NextPreparationQueueEntry[];
  summary: ApplySummary;
}

export function computeApplyResult(input: ComputeApplyInput): ComputeApplyOutput {
  const queue = normalizeQueueEntries(input.queue || []);
  const nextPrepared = [...normalizeSpellIdList(input.profile.preparedSpellIds || [])];
  const appliedSpellIds: string[] = [];

  const summary: ApplySummary = {
    adds: 0,
    replacements: 0,
    queueOnlySkipped: 0,
  };

  for (const entry of queue) {
    const spell = input.spellsById.get(entry.spellId);
    if (!spell) {
      throw new Error(`Unknown spell: ${entry.spellId}`);
    }

    if (!isSpellEligibleForCharacter(spell, input.profile)) {
      throw new Error(`${spell.name} is outside ${input.profile.name}'s available spell lists.`);
    }

    if (entry.intent === 'queue_only') {
      summary.queueOnlySkipped += 1;
      continue;
    }

    if (entry.intent === 'replace') {
      summary.replacements += 1;

      if (!entry.replaceTarget) {
        throw new Error(`${spell.name}: must choose a prepared spell to replace.`);
      }

      const replaceTarget = input.spellsById.get(entry.replaceTarget);
      if (!replaceTarget) {
        throw new Error(`Unknown spell: ${entry.replaceTarget}`);
      }

      const replaceIndex = nextPrepared.indexOf(entry.replaceTarget);
      if (replaceIndex === -1) {
        throw new Error(`${spell.name}: replace target must be currently prepared.`);
      }

      const queuedList = getSpellAssignmentList(spell, input.profile);
      const targetList = getSpellAssignmentList(replaceTarget, input.profile);
      if (queuedList && targetList && queuedList !== targetList) {
        throw new Error(`${spell.name}: must replace a spell from the same list.`);
      }

      nextPrepared[replaceIndex] = entry.spellId;
      appliedSpellIds.push(entry.spellId);
      continue;
    }

    summary.adds += 1;
    nextPrepared.push(entry.spellId);
    appliedSpellIds.push(entry.spellId);
  }

  const finalPreparedSpellIds = normalizeSpellIdList(nextPrepared);
  enforcePreparationLimits(finalPreparedSpellIds, input.profile, input.spellsById);

  const remainingQueue = queue.filter((entry) => entry.intent === 'queue_only');

  return {
    finalPreparedSpellIds,
    appliedSpellIds: normalizeSpellIdList(appliedSpellIds),
    remainingQueue,
    summary,
  };
}
