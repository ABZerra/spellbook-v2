import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createServer } from 'node:http';
import { syncSpellsFromNotion } from './notionSync.mjs';

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 3001);
const snapshotPath = process.env.SPELLBOOK_SNAPSHOT_PATH
  ? resolve(process.cwd(), process.env.SPELLBOOK_SNAPSHOT_PATH)
  : resolve(process.cwd(), '..', '..', 'data', 'spells.snapshot.json');

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload, null, 2));
}

function readSnapshot() {
  if (!existsSync(snapshotPath)) {
    return { schemaVersion: 1, sourceFile: 'pending-upload.csv', generatedAt: null, spells: [] };
  }

  const parsed = JSON.parse(readFileSync(snapshotPath, 'utf8'));
  if (!Array.isArray(parsed.spells)) parsed.spells = [];
  return parsed;
}

function writeSnapshot(nextSnapshot) {
  mkdirSync(dirname(snapshotPath), { recursive: true });
  writeFileSync(snapshotPath, `${JSON.stringify(nextSnapshot, null, 2)}\n`, 'utf8');
}

async function handleRequest(req, res) {
  const url = new URL(req.url || '/', `http://${host}:${port}`);

  if (req.method === 'GET' && url.pathname === '/health') {
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === 'GET' && url.pathname === '/api/spells') {
    const snapshot = readSnapshot();
    return sendJson(res, 200, {
      count: snapshot.spells.length,
      spells: snapshot.spells,
      syncMeta: {
        source: process.env.NOTION_API_TOKEN && process.env.NOTION_DATABASE_ID ? 'notion-cache' : 'snapshot',
        refreshedAt: snapshot.generatedAt || null
      }
    });
  }

  if (req.method === 'POST' && url.pathname === '/api/spells/sync') {
    try {
      const { spells, refreshedAt } = await syncSpellsFromNotion({
        token: process.env.NOTION_API_TOKEN || '',
        databaseId: process.env.NOTION_DATABASE_ID || ''
      });

      const snapshot = {
        schemaVersion: 1,
        sourceFile: 'notion-sync',
        generatedAt: refreshedAt,
        spells
      };
      writeSnapshot(snapshot);

      return sendJson(res, 200, {
        ok: true,
        count: spells.length,
        syncMeta: {
          source: 'notion',
          refreshedAt
        }
      });
    } catch (error) {
      return sendJson(res, 500, {
        ok: false,
        error: error instanceof Error ? error.message : 'Sync failed.'
      });
    }
  }

  return sendJson(res, 404, { error: 'Not found.' });
}

export function createAppServer() {
  return createServer((req, res) => {
    void handleRequest(req, res);
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = createAppServer();
  server.listen(port, host, () => {
    console.log(`API listening on http://${host}:${port}`);
  });
}
