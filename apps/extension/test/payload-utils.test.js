import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractDndBeyondCharacterId,
  isDndBeyondCharacterUrl,
  parseSyncPayload,
  summarizeOpsPreview,
} from '../payload-utils.js';

test('parseSyncPayload accepts and normalizes version 3 payload', () => {
  const parsed = parseSyncPayload({
    version: 3,
    source: 'spellbook',
    timestamp: 123,
    character: { id: '46441499', name: 'Aelric' },
    operations: [
      { type: 'replace', list: 'cleric', remove: 'Guiding Bolt', add: 'Bless' },
      { type: 'prepare', list: ' druid ', spell: 'Entangle' },
      { type: 'unprepare', list: 'DRUID', spell: 'Faerie Fire' },
    ],
    issues: [
      { code: 'ambiguous_list', operationIndex: 5, detail: 'Multiple list matches.' },
    ],
  });

  assert.equal(parsed.ok, true);
  assert.equal(parsed.payload.version, 3);
  assert.equal(parsed.payload.operations.length, 3);
});

test('summarizeOpsPreview aggregates operations', () => {
  const preview = summarizeOpsPreview({
    version: 3,
    source: 'spellbook',
    timestamp: 123,
    character: { id: '46441499', name: 'Aelric' },
    operations: [
      { type: 'replace', list: 'CLERIC', remove: 'A', add: 'B' },
      { type: 'prepare', list: 'CLERIC', spell: 'C' },
      { type: 'unprepare', list: 'DRUID', spell: 'D' },
    ],
    issues: [{ code: 'MISSING_SPELL', operationIndex: 1, detail: 'Missing spell.' }],
  });

  assert.equal(preview.actionCount, 3);
  assert.equal(preview.skippedCount, 1);
});

test('extractDndBeyondCharacterId and url matching remain strict', () => {
  assert.equal(extractDndBeyondCharacterId('https://www.dndbeyond.com/characters/12345'), '12345');
  assert.equal(extractDndBeyondCharacterId('https://www.dndbeyond.com/campaigns/123'), null);
  assert.equal(isDndBeyondCharacterUrl('https://www.dndbeyond.com/characters/12345'), true);
  assert.equal(isDndBeyondCharacterUrl('https://www.dndbeyond.com/foo/characters/12345'), false);
});
