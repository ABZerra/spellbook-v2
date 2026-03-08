import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createAppServer } from '../src/server.mjs';

test('GET /api/spells returns snapshot payload', async () => {
  const server = createAppServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');

  const address = server.address();
  const url = `http://127.0.0.1:${address.port}/api/spells`;
  const response = await fetch(url);

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.ok(Array.isArray(payload.spells));

  server.close();
});

test('POST /api/spells/sync returns failure when Notion credentials are missing', async () => {
  const server = createAppServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');

  const address = server.address();
  const url = `http://127.0.0.1:${address.port}/api/spells/sync`;
  const response = await fetch(url, { method: 'POST' });

  assert.equal(response.status, 500);
  const payload = await response.json();
  assert.equal(payload.ok, false);
  assert.match(String(payload.error || ''), /NOTION_API_TOKEN is required/i);

  server.close();
});
