import { Router, type Request, type Response } from 'express';
import type { GitHubClient } from './github.js';

export function createApiRouter(github: GitHubClient): Router {
  const router = Router();

  async function validateUser(userId: string): Promise<boolean> {
    const result = await github.readJsonFile('data/users/users.json');
    if (!result) return false;
    const users = result.content as Array<{ id: string }>;
    return users.some((u) => u.id === userId);
  }

  router.get('/users/:userId/characters', async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId as string;
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
