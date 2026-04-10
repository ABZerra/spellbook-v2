import {
  assertSpellCanBeAddedToList,
  findDuplicatePreparedSpellWarnings,
  enforcePreparationLimits,
  getValidAssignmentLists,
  isSpellEligibleForCharacter,
  normalizeListName,
  normalizePreparedSpells,
  normalizeQueueEntries,
  normalizeSpellIdList,
} from './character';
import type { CharacterProfile, NextPreparationQueueEntry, PreparedSpellEntry, SpellRecord } from '../types';

interface ComputeApplyInput {
  profile: Pick<CharacterProfile, 'name' | 'availableLists' | 'preparationLimits' | 'preparedSpells'>;
  spellsById: Map<string, SpellRecord>;
  queue: NextPreparationQueueEntry[];
}

interface ApplySummary {
  adds: number;
  replacements: number;
  removals: number;
  queueOnlySkipped: number;
}

interface ComputeApplyOutput {
  finalPreparedSpells: PreparedSpellEntry[];
  appliedSpellIds: string[];
  remainingQueue: NextPreparationQueueEntry[];
  summary: ApplySummary;
  warnings: string[];
}

function resolveAssignedList(
  entry: NextPreparationQueueEntry,
  spell: SpellRecord,
  profile: ComputeApplyInput['profile'],
): string | null {
  const validLists = getValidAssignmentLists(spell, profile as CharacterProfile);
  if (validLists.length === 0) return null;

  const explicit = normalizeListName(entry.assignedList || '');
  if (explicit) {
    if (!validLists.includes(explicit)) {
      throw new Error(`${spell.name}: choose a valid spell list.`);
    }
    return explicit;
  }

  if (validLists.length === 1) {
    return validLists[0];
  }

  throw new Error(`${spell.name}: choose a spell list before applying.`);
}

export function computeApplyResult(input: ComputeApplyInput): ComputeApplyOutput {
  const queue = normalizeQueueEntries(input.queue || []);
  const nextPrepared = [...normalizePreparedSpells(input.profile.preparedSpells || [], input.profile as CharacterProfile)];
  const appliedSpellIds: string[] = [];

  const summary: ApplySummary = {
    adds: 0,
    replacements: 0,
    removals: 0,
    queueOnlySkipped: 0,
  };

  // Process removals first
  const removeEntries = queue.filter((entry) => entry.intent === 'remove');
  for (const entry of removeEntries) {
    const removeIndex = nextPrepared.findIndex((preparedEntry) => (
      preparedEntry.spellId === entry.spellId
      && preparedEntry.assignedList === (entry.assignedList || preparedEntry.assignedList)
    ));
    if (removeIndex !== -1) {
      nextPrepared.splice(removeIndex, 1);
      appliedSpellIds.push(entry.spellId);
      summary.removals += 1;
    }
  }

  const nonRemoveQueue = queue.filter((entry) => entry.intent !== 'remove');

  for (const entry of nonRemoveQueue) {
    const spell = input.spellsById.get(entry.spellId);
    if (!spell) {
      throw new Error(`Unknown spell: ${entry.spellId}`);
    }

    if (!isSpellEligibleForCharacter(spell, input.profile)) {
      throw new Error(`${spell.name} is outside ${input.profile.name}'s available spell lists.`);
    }

    const assignedList = resolveAssignedList(entry, spell, input.profile);
    if (!assignedList) {
      throw new Error(`${spell.name}: choose a valid spell list.`);
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

      const replaceIndex = nextPrepared.findIndex((preparedEntry) => (
        preparedEntry.spellId === entry.replaceTarget
        && preparedEntry.assignedList === assignedList
      ));
      if (replaceIndex === -1) {
        throw new Error(`${spell.name}: must replace a spell from the same list.`);
      }

      assertSpellCanBeAddedToList(spell, input.profile, assignedList);
      nextPrepared[replaceIndex] = { spellId: entry.spellId, assignedList, mode: 'normal' };
      appliedSpellIds.push(entry.spellId);
      continue;
    }

    summary.adds += 1;
    assertSpellCanBeAddedToList(spell, input.profile, assignedList);
    nextPrepared.push({ spellId: entry.spellId, assignedList, mode: 'normal' });
    appliedSpellIds.push(entry.spellId);
  }

  const finalPreparedSpells = normalizePreparedSpells(nextPrepared, input.profile as CharacterProfile);
  enforcePreparationLimits(finalPreparedSpells, input.profile, input.spellsById);
  const warnings = findDuplicatePreparedSpellWarnings(finalPreparedSpells, input.spellsById);

  const remainingQueue = queue.filter((entry) => entry.intent === 'queue_only');

  return {
    finalPreparedSpells,
    appliedSpellIds: normalizeSpellIdList(appliedSpellIds),
    remainingQueue,
    summary,
    warnings,
  };
}
