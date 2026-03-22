import { Router, type Request, type Response } from 'express';
import type { GitHubClient } from './github.js';

export function createApiRouter(github: GitHubClient): Router {
  const router = Router();

  const VALID_USER_ID = /^[a-zA-Z0-9_-]+$/;

  async function validateUser(userId: string): Promise<boolean> {
    const result = await github.readJsonFile('data/users/users.json');
    if (!result) return false;
    const users = result.content as Array<{ id: string }>;
    return users.some((u) => u.id === userId);
  }

  router.post('/users', async (req: Request, res: Response) => {
    try {
      const { username } = req.body;
      if (!username || typeof username !== 'string') {
        res.status(400).json({ error: 'username is required' });
        return;
      }

      const id = username.toLowerCase();
      if (!VALID_USER_ID.test(id)) {
        res.status(400).json({ error: 'Invalid username format' });
        return;
      }

      const result = await github.readJsonFile('data/users/users.json');
      const users = (result?.content as Array<{ id: string }>) || [];
      const usersSha = result?.sha || '';

      if (users.some((u) => u.id === id)) {
        res.status(409).json({ error: 'Username already exists' });
        return;
      }

      const newUser = {
        id,
        username,
        role: 'user' as const,
        createdAt: new Date().toISOString(),
      };

      await github.writeMultipleFilesViaPR(
        [
          { path: 'data/users/users.json', content: [...users, newUser], sha: usersSha },
          { path: `data/users/${id}/characters.json`, content: [], sha: null },
        ],
        id,
      );

      res.status(201).json(newUser);
    } catch (error) {
      console.error('POST users error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.get('/users/:userId/characters', async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId as string;
      if (!VALID_USER_ID.test(userId)) {
        res.status(400).json({ error: 'Invalid user ID format' });
        return;
      }
      const isValid = await validateUser(userId);
      if (!isValid) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const result = await github.readJsonFile(`data/users/${userId}/characters.json`);
      if (!result) {
        res.json({ characters: [], sha: null });
        return;
      }

      res.json({ characters: result.content, sha: result.sha });
    } catch (error) {
      console.error('GET characters error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.put('/users/:userId/characters', async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId as string;
      if (!VALID_USER_ID.test(userId)) {
        res.status(400).json({ error: 'Invalid user ID format' });
        return;
      }
      const { characters, sha } = req.body;

      if (!Array.isArray(characters)) {
        res.status(400).json({ error: 'characters must be an array' });
        return;
      }

      const isValid = await validateUser(userId);
      if (!isValid) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const result = await github.writeJsonViaPR(
        `data/users/${userId}/characters.json`,
        characters,
        sha,
        userId,
      );

      res.json({ ok: true, sha: result.newSha });
    } catch (error) {
      console.error('PUT characters error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
