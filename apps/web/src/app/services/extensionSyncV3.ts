import { getSpellLists } from '../domain/character';
import { buildPlanDiff } from '../domain/plan';
import type { CharacterProfile, PreparedSpellEntry, SpellRecord, SpellSyncIssue, SpellSyncOperation, SpellSyncPayloadV3 } from '../types';

export const SYNC_PAYLOAD_EVENT_TYPE = 'SPELLBOOK_SYNC_PAYLOAD_SET';
export const SYNC_PAYLOAD_ACK_EVENT_TYPE = 'SPELLBOOK_SYNC_PAYLOAD_ACK';

function normalizeSpellName(name: string): string {
  return String(name || '').replace(/\s+/g, ' ').trim();
}

function createIssue(code: SpellSyncIssue['code'], operationIndex: number, detail: string): SpellSyncIssue {
  return { code, operationIndex, detail };
}

export function buildSpellSyncPayloadV3(
  character: Pick<CharacterProfile, 'id' | 'name' | 'preparedSpells'>,
  finalPreparedSpells: PreparedSpellEntry[],
  spells: SpellRecord[],
): SpellSyncPayloadV3 {
  const byId = new Map(spells.map((spell) => [spell.id, spell]));
  const diff = buildPlanDiff(character.preparedSpells, finalPreparedSpells);
  const operations: SpellSyncOperation[] = [];
  const issues: SpellSyncIssue[] = [];

  for (let index = 0; index < diff.length; index += 1) {
    const item = diff[index];

    if (item.type === 'replace') {
      const fromSpell = item.from ? byId.get(item.from.spellId) : null;
      const toSpell = item.to ? byId.get(item.to.spellId) : null;

      if (!fromSpell || !toSpell) {
        issues.push(createIssue('MISSING_SPELL', index, `Missing spell record for replace operation at position ${item.index + 1}.`));
        continue;
      }

      const remove = normalizeSpellName(fromSpell.name);
      const add = normalizeSpellName(toSpell.name);
      if (!remove || !add) {
        issues.push(createIssue('MISSING_NAME', index, `Missing spell name for replace operation at position ${item.index + 1}.`));
        continue;
      }

      const list = item.from?.assignedList || item.to?.assignedList || null;
      if (!list) {
        issues.push(createIssue('AMBIGUOUS_LIST', index, `Replace operation for ${remove} has ambiguous list context.`));
        continue;
      }

      const replacementLists = getSpellLists(toSpell);
      if (replacementLists.length > 0 && !replacementLists.includes(list)) {
        issues.push(createIssue('LIST_MISMATCH', index, `${add} is not available in list ${list}.`));
        continue;
      }

      operations.push({ type: 'replace', list, remove, add });
      continue;
    }

    if (item.type === 'add') {
      const spell = item.to ? byId.get(item.to.spellId) : null;
      if (!spell) {
        issues.push(createIssue('MISSING_SPELL', index, `Missing spell record for prepare operation at position ${item.index + 1}.`));
        continue;
      }

      const spellName = normalizeSpellName(spell.name);
      if (!spellName) {
        issues.push(createIssue('MISSING_NAME', index, `Missing spell name for prepare operation at position ${item.index + 1}.`));
        continue;
      }

      const list = item.to?.assignedList || null;
      if (!list) {
        issues.push(createIssue('AMBIGUOUS_LIST', index, `Prepare operation for ${spellName} has ambiguous list context.`));
        continue;
      }

      operations.push({ type: 'prepare', list, spell: spellName });
      continue;
    }

    const spell = item.from ? byId.get(item.from.spellId) : null;
    if (!spell) {
      issues.push(createIssue('MISSING_SPELL', index, `Missing spell record for unprepare operation at position ${item.index + 1}.`));
      continue;
    }

    const spellName = normalizeSpellName(spell.name);
    if (!spellName) {
      issues.push(createIssue('MISSING_NAME', index, `Missing spell name for unprepare operation at position ${item.index + 1}.`));
      continue;
    }

    const list = item.from?.assignedList || null;
    if (!list) {
      issues.push(createIssue('AMBIGUOUS_LIST', index, `Unprepare operation for ${spellName} has ambiguous list context.`));
      continue;
    }

    operations.push({ type: 'unprepare', list, spell: spellName });
  }

  return {
    version: 3,
    source: 'spellbook',
    timestamp: Date.now(),
    character: {
      id: character.id,
      name: character.name,
    },
    operations,
    issues,
  };
}

export function publishSpellSyncPayloadV3(payload: SpellSyncPayloadV3) {
  window.postMessage(
    {
      type: SYNC_PAYLOAD_EVENT_TYPE,
      payload,
    },
    window.location.origin,
  );
}

export function waitForSpellSyncPayloadAck(timeoutMs = 2000): Promise<{ acknowledged: boolean; ok: boolean; error?: string; timedOut: boolean }> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      window.removeEventListener('message', onMessage);
      resolve({ acknowledged: false, ok: false, timedOut: true, error: 'No extension acknowledgement received.' });
    }, timeoutMs);

    function onMessage(event: MessageEvent) {
      if (event.source !== window) return;
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string; ok?: boolean; error?: string };
      if (!data || data.type !== SYNC_PAYLOAD_ACK_EVENT_TYPE) return;

      window.clearTimeout(timer);
      window.removeEventListener('message', onMessage);
      resolve({
        acknowledged: true,
        ok: Boolean(data.ok),
        error: data.error,
        timedOut: false,
      });
    }

    window.addEventListener('message', onMessage);
  });
}
