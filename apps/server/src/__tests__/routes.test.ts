import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import { createApiRouter } from '../routes.js';

async function withServer(router: express.Router, fn: (url: string) => Promise<void>) {
  const app = express();
  app.use(express.json());
  app.use('/api', router);
  const server = app.listen(0);
  const port = (server.address() as { port: number }).port;
  try {
    await fn(`http://localhost:${port}`);
  } finally {
    server.close();
  }
}

const mockReadJsonFile = vi.fn();
const mockWriteJsonViaPR = vi.fn();

const mockGitHub = {
  readJsonFile: mockReadJsonFile,
  writeJsonViaPR: mockWriteJsonViaPR,
} as any;

describe('API routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/users/:userId/characters', () => {
    it('returns characters for a valid user', async () => {
      const characters = [{ id: 'gandalf', name: 'Gandalf', userId: 'alice' }];
      mockReadJsonFile
        .mockResolvedValueOnce({ content: [{ id: 'alice', username: 'alice', role: 'admin' }], sha: 'u1' })
        .mockResolvedValueOnce({ content: characters, sha: 'c1' });

      const router = createApiRouter(mockGitHub);
      await withServer(router, async (url) => {
        const res = await fetch(`${url}/api/users/alice/characters`);
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.characters).toEqual(characters);
        expect(body.sha).toBe('c1');
      });
    });

    it('returns 404 for unknown user', async () => {
      mockReadJsonFile.mockResolvedValueOnce({ content: [], sha: 'u1' });

      const router = createApiRouter(mockGitHub);
      await withServer(router, async (url) => {
        const res = await fetch(`${url}/api/users/nobody/characters`);
        expect(res.status).toBe(404);
      });
    });
  });

  describe('PUT /api/users/:userId/characters', () => {
    it('saves characters via PR and returns 200 with new sha', async () => {
      mockReadJsonFile.mockResolvedValueOnce({
        content: [{ id: 'alice', username: 'alice', role: 'user' }],
        sha: 'u1',
      });
      mockWriteJsonViaPR.mockResolvedValueOnce({ newSha: 'new-sha-789' });

      const router = createApiRouter(mockGitHub);
      await withServer(router, async (url) => {
        const res = await fetch(`${url}/api/users/alice/characters`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            characters: [{ id: 'gandalf', name: 'Gandalf' }],
            sha: 'old-sha',
          }),
        });
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.ok).toBe(true);
        expect(body.sha).toBe('new-sha-789');
      });
    });
  });
});
