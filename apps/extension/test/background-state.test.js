import test from 'node:test';
import assert from 'node:assert/strict';
import { loadStoredPayloadState } from '../background-state.js';

test('loadStoredPayloadState reports missing payload without api fallback behavior', async () => {
  const state = await loadStoredPayloadState(async () => null);

  assert.deepEqual(state, {
    payload: null,
    hydrated: false,
    payloadError: 'No Spellbook payload available yet. Generate one from the web app before syncing.',
  });
});
