# User Accounts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add user accounts backed by JSON files in GitHub so characters persist across browsers, served through a thin Express API on Render.

**Architecture:** A new Express server (`apps/server/`) proxies character CRUD to the GitHub Contents API. The frontend gets a login screen, an auth context for lazy login, and a sync service that auto-saves to the API every ~30 seconds. The existing `SpellCatalogProvider` interface is leveraged — AppContext switches between local-only and remote-aware providers based on login state.

**Tech Stack:** Express, Octokit (GitHub API), React Context, IndexedDB (existing), Vitest

**Spec:** `docs/superpowers/specs/2026-03-21-user-accounts-design.md`

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `apps/server/package.json` | Server package definition, dependencies (express, @octokit/rest, cors) |
| `apps/server/tsconfig.json` | TypeScript config for server (Node target) |
| `apps/server/src/index.ts` | Express app: static file serving + API route mounting |
| `apps/server/src/routes.ts` | API route handlers: GET/PUT `/api/users/:userId/characters` |
| `apps/server/src/github.ts` | GitHub API client: read file, create branch, commit, open PR, merge, delete branch |
| `apps/server/src/config.ts` | Environment variable loading and validation |
| `apps/web/src/app/state/AuthContext.tsx` | Auth context: userId, login/logout, isAuthenticated |
| `apps/web/src/app/state/SyncService.ts` | Background sync: dirty flag, 30s interval, beforeunload, status |
| `apps/web/src/app/components/LoginScreen.tsx` | Login form: username text input, error display, submit |
| `apps/web/src/app/components/AuthGate.tsx` | Wraps character-dependent routes, redirects to login if needed |
| `apps/web/src/app/components/SyncIndicator.tsx` | Small UI showing sync status (synced/syncing/error) |
| `data/users/users.json` | Initial user registry (empty array or seed data) |

### Modified Files

| File | Changes |
|------|---------|
| `package.json` (root) | Add `apps/server` to workspaces, add server scripts |
| `apps/web/src/app/App.tsx` | Wrap with AuthProvider, add login route, wrap character routes with AuthGate |
| `apps/web/src/app/state/AppContext.tsx` | Accept userId prop, integrate sync service, call markDirty on mutations |
| `apps/web/src/app/components/AppShell.tsx` | Add logout button and SyncIndicator to navbar |
| `.github/workflows/ci.yml` | Add server build + test job |
| `.github/workflows/pages.yml` | Remove (replaced by Render deployment) |
| `scripts/build-pages.mjs` | Remove (no longer needed) |

---

## Task 1: Server Package Scaffolding

**Files:**
- Create: `apps/server/package.json`
- Create: `apps/server/tsconfig.json`
- Create: `apps/server/src/config.ts`
- Modify: `package.json` (root)

- [ ] **Step 1: Create server package.json**

```json
{
  "name": "spellbook-server",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "dev": "node --watch --loader ts-node/esm src/index.ts",
    "start": "node dist/index.js",
    "test": "vitest run"
  },
  "dependencies": {
    "@octokit/rest": "^21.0.0",
    "express": "^5.1.0"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/node": "^20.0.0",
    "ts-node": "^10.9.0",
    "typescript": "^5.7.0",
    "vitest": "^2.1.9"
  }
}
```

- [ ] **Step 2: Create server tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create config.ts**

```typescript
export interface ServerConfig {
  port: number;
  githubPat: string;
  githubRepo: string;
  githubBranch: string;
  staticDir: string;
}

export function loadConfig(): ServerConfig {
  const githubPat = process.env.GITHUB_PAT;
  if (!githubPat) {
    throw new Error('GITHUB_PAT environment variable is required');
  }

  const githubRepo = process.env.GITHUB_REPO;
  if (!githubRepo) {
    throw new Error('GITHUB_REPO environment variable is required (e.g. owner/repo)');
  }

  return {
    port: parseInt(process.env.PORT || '3001', 10),
    githubPat,
    githubRepo,
    githubBranch: process.env.GITHUB_BRANCH || 'main',
    staticDir: process.env.STATIC_DIR || '../web/dist',
  };
}
```

- [ ] **Step 4: Add server to root workspaces**

In root `package.json`, add `"apps/server"` to the `workspaces` array and add scripts:

```json
{
  "workspaces": ["apps/web", "apps/extension", "apps/server"],
  "scripts": {
    "dev:server": "npm run dev --prefix apps/server",
    "test:server": "npm run test --prefix apps/server",
    "build:server": "npm run build --prefix apps/server",
    "build": "npm run build:web && npm run build:server",
    "test": "npm run test:web && npm run test:extension && npm run test:docs && npm run test:server"
  }
}
```

- [ ] **Step 5: Install dependencies**

Run: `cd apps/server && npm install`
Expected: `node_modules/` created, `package-lock.json` updated.

- [ ] **Step 6: Commit**

```bash
git add apps/server/package.json apps/server/tsconfig.json apps/server/src/config.ts package.json package-lock.json
git commit -m "feat(server): scaffold server package with config"
```

---

## Task 2: GitHub API Client

**Files:**
- Create: `apps/server/src/github.ts`
- Create: `apps/server/src/__tests__/github.test.ts`

- [ ] **Step 1: Write failing tests for GitHub client**

Create `apps/server/src/__tests__/github.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitHubClient } from '../github.js';

// Mock Octokit
const mockGetContent = vi.fn();
const mockCreateRef = vi.fn();
const mockCreateOrUpdateFileContents = vi.fn();
const mockCreatePull = vi.fn();
const mockMergePull = vi.fn();
const mockDeleteRef = vi.fn();
const mockGetRef = vi.fn();

vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn().mockImplementation(() => ({
    repos: {
      getContent: mockGetContent,
      createOrUpdateFileContents: mockCreateOrUpdateFileContents,
    },
    git: {
      createRef: mockCreateRef,
      getRef: mockGetRef,
      deleteRef: mockDeleteRef,
    },
    pulls: {
      create: mockCreatePull,
      merge: mockMergePull,
    },
  })),
}));

describe('GitHubClient', () => {
  let client: GitHubClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new GitHubClient({
      pat: 'test-token',
      repo: 'owner/repo',
      branch: 'main',
    });
  });

  describe('readJsonFile', () => {
    it('reads and decodes a JSON file from the repo', async () => {
      const content = JSON.stringify([{ id: 'gandalf', name: 'Gandalf' }]);
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(content).toString('base64'),
          sha: 'abc123',
        },
      });

      const result = await client.readJsonFile('data/users/alice/characters.json');
      expect(result).toEqual({
        content: [{ id: 'gandalf', name: 'Gandalf' }],
        sha: 'abc123',
      });
      expect(mockGetContent).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        path: 'data/users/alice/characters.json',
        ref: 'main',
      });
    });

    it('returns null when file not found', async () => {
      mockGetContent.mockRejectedValue({ status: 404 });

      const result = await client.readJsonFile('data/users/nobody/characters.json');
      expect(result).toBeNull();
    });
  });

  describe('writeJsonViaPR', () => {
    it('creates a branch, commits, opens PR, merges, and cleans up', async () => {
      // Mock getting main branch SHA
      mockGetRef.mockResolvedValue({
        data: { object: { sha: 'main-sha-123' } },
      });
      // Mock creating branch
      mockCreateRef.mockResolvedValue({ data: {} });
      // Mock committing file
      mockCreateOrUpdateFileContents.mockResolvedValue({ data: {} });
      // Mock creating PR
      mockCreatePull.mockResolvedValue({ data: { number: 42 } });
      // Mock merging PR
      mockMergePull.mockResolvedValue({ data: { merged: true } });
      // Mock deleting branch
      mockDeleteRef.mockResolvedValue({ data: {} });

      await client.writeJsonViaPR(
        'data/users/alice/characters.json',
        [{ id: 'gandalf' }],
        'abc123',
        'alice',
      );

      expect(mockGetRef).toHaveBeenCalled();
      expect(mockCreateRef).toHaveBeenCalled();
      expect(mockCreateOrUpdateFileContents).toHaveBeenCalled();
      expect(mockCreatePull).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('alice'),
        }),
      );
      expect(mockMergePull).toHaveBeenCalledWith(
        expect.objectContaining({ pull_number: 42 }),
      );
      expect(mockDeleteRef).toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/server && npx vitest run src/__tests__/github.test.ts`
Expected: FAIL — `github.ts` doesn't exist yet.

- [ ] **Step 3: Implement GitHubClient**

Create `apps/server/src/github.ts`:

```typescript
import { Octokit } from '@octokit/rest';

interface GitHubClientConfig {
  pat: string;
  repo: string;  // "owner/repo"
  branch: string;
}

interface ReadResult {
  content: unknown;
  sha: string;
}

export class GitHubClient {
  private octokit: Octokit;
  private owner: string;
  private repo: string;
  private branch: string;

  constructor(config: GitHubClientConfig) {
    this.octokit = new Octokit({ auth: config.pat });
    const [owner, repo] = config.repo.split('/');
    this.owner = owner;
    this.repo = repo;
    this.branch = config.branch;
  }

  async readJsonFile(path: string): Promise<ReadResult | null> {
    try {
      const response = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
        ref: this.branch,
      });

      const data = response.data;
      if (!('content' in data) || data.type !== 'file') {
        return null;
      }

      const decoded = Buffer.from(data.content, 'base64').toString('utf-8');
      return {
        content: JSON.parse(decoded),
        sha: data.sha,
      };
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async writeJsonViaPR(
    path: string,
    content: unknown,
    fileSha: string,
    userId: string,
  ): Promise<{ newSha: string }> {
    const branchName = `data/${userId}-${Date.now()}`;
    const encoded = Buffer.from(JSON.stringify(content, null, 2)).toString('base64');

    // 1. Get main branch SHA
    const mainRef = await this.octokit.git.getRef({
      owner: this.owner,
      repo: this.repo,
      ref: `heads/${this.branch}`,
    });
    const baseSha = mainRef.data.object.sha;

    // 2. Create branch
    await this.octokit.git.createRef({
      owner: this.owner,
      repo: this.repo,
      ref: `refs/heads/${branchName}`,
      sha: baseSha,
    });

    try {
      // 3. Commit file to branch
      await this.octokit.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path,
        message: `Update ${userId}'s characters`,
        content: encoded,
        sha: fileSha,
        branch: branchName,
      });

      // 4. Open PR
      const pr = await this.octokit.pulls.create({
        owner: this.owner,
        repo: this.repo,
        title: `Update ${userId}'s characters`,
        head: branchName,
        base: this.branch,
        body: `Automated data sync for user **${userId}**.`,
      });

      // 5. Merge PR
      await this.octokit.pulls.merge({
        owner: this.owner,
        repo: this.repo,
        pull_number: pr.data.number,
        merge_method: 'squash',
      });

      // 6. Delete branch
      await this.octokit.git.deleteRef({
        owner: this.owner,
        repo: this.repo,
        ref: `heads/${branchName}`,
      });

      // 7. Read back the file to get the new SHA after merge
      const updated = await this.readJsonFile(path);
      return { newSha: updated?.sha ?? '' };
    } catch (error) {
      // Attempt cleanup of branch on failure
      try {
        await this.octokit.git.deleteRef({
          owner: this.owner,
          repo: this.repo,
          ref: `heads/${branchName}`,
        });
      } catch {
        // Ignore cleanup errors
      }
      throw error;
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/server && npx vitest run src/__tests__/github.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/server/src/github.ts apps/server/src/__tests__/github.test.ts
git commit -m "feat(server): add GitHub API client with PR-based writes"
```

---

## Task 3: API Routes

**Files:**
- Create: `apps/server/src/routes.ts`
- Create: `apps/server/src/__tests__/routes.test.ts`

- [ ] **Step 1: Write failing tests for routes**

Create `apps/server/src/__tests__/routes.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import { createApiRouter } from '../routes.js';

// Supertest-style helper using native fetch against a running server
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
    it('saves characters via PR and returns 200', async () => {
      mockReadJsonFile.mockResolvedValueOnce({
        content: [{ id: 'alice', username: 'alice', role: 'user' }],
        sha: 'u1',
      });
      mockWriteJsonViaPR.mockResolvedValueOnce(undefined);

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
        expect(mockWriteJsonViaPR).toHaveBeenCalledWith(
          'data/users/alice/characters.json',
          [{ id: 'gandalf', name: 'Gandalf' }],
          'old-sha',
          'alice',
        );
      });
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/server && npx vitest run src/__tests__/routes.test.ts`
Expected: FAIL — `routes.ts` doesn't exist.

- [ ] **Step 3: Implement routes**

Create `apps/server/src/routes.ts`:

```typescript
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
      const { userId } = req.params;
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
      const { userId } = req.params;
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/server && npx vitest run src/__tests__/routes.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/server/src/routes.ts apps/server/src/__tests__/routes.test.ts
git commit -m "feat(server): add API routes for character CRUD"
```

---

## Task 4: Express Server Entry Point

**Files:**
- Create: `apps/server/src/index.ts`

- [ ] **Step 1: Implement server entry point**

Create `apps/server/src/index.ts`:

```typescript
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { loadConfig } from './config.js';
import { GitHubClient } from './github.js';
import { createApiRouter } from './routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config = loadConfig();

const github = new GitHubClient({
  pat: config.githubPat,
  repo: config.githubRepo,
  branch: config.githubBranch,
});

const app = express();

app.use(express.json());

// API routes
app.use('/api', createApiRouter(github));

// Static files (built frontend)
const staticPath = path.resolve(__dirname, config.staticDir);
app.use(express.static(staticPath));

// SPA fallback — serve index.html for all non-API, non-static routes
app.get('*', (_req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

app.listen(config.port, () => {
  console.log(`Spellbook server running on port ${config.port}`);
});
```

- [ ] **Step 2: Verify server compiles**

Run: `cd apps/server && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/server/src/index.ts
git commit -m "feat(server): add Express entry point with static serving"
```

---

## Task 5: Auth Context (Frontend)

**Files:**
- Create: `apps/web/src/app/state/AuthContext.tsx`
- Create: `apps/web/src/app/state/__tests__/AuthContext.test.tsx`

- [ ] **Step 1: Write failing tests for AuthContext**

Create `apps/web/src/app/state/__tests__/AuthContext.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import React from 'react';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const storage: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, value: string) => { storage[key] = value; },
  removeItem: (key: string) => { delete storage[key]; },
});

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(storage).forEach((key) => delete storage[key]);
  });

  it('starts unauthenticated', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.userId).toBeNull();
  });

  it('login succeeds and stores userId', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ characters: [], sha: null }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let loginResult: boolean = false;
    await act(async () => {
      loginResult = await result.current.login('alice');
    });

    expect(loginResult).toBe(true);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.userId).toBe('alice');
    expect(storage['spellbook.userId']).toBe('alice');
  });

  it('login fails for unknown user (404)', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let loginResult: boolean = true;
    await act(async () => {
      loginResult = await result.current.login('nobody');
    });

    expect(loginResult).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('logout clears state', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ characters: [], sha: null }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('alice');
    });
    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.userId).toBeNull();
    expect(storage['spellbook.userId']).toBeUndefined();
  });

  it('restores session from localStorage on mount', () => {
    storage['spellbook.userId'] = 'bob';

    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.userId).toBe('bob');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/web && npx vitest run src/app/state/__tests__/AuthContext.test.tsx`
Expected: FAIL — `AuthContext.tsx` doesn't exist.

Note: You may need to install `@testing-library/react` as a devDependency in `apps/web` if not already present. Run `npm install -D @testing-library/react` in `apps/web` if needed.

- [ ] **Step 3: Implement AuthContext**

Create `apps/web/src/app/state/AuthContext.tsx`:

```typescript
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const USER_ID_KEY = 'spellbook.userId';

interface AuthContextValue {
  userId: string | null;
  isAuthenticated: boolean;
  loginError: string | null;
  login: (username: string) => Promise<boolean>;
  logout: () => void;
}

const AuthCtx = createContext<AuthContextValue | null>(null);

function getPersistedUserId(): string | null {
  const value = localStorage.getItem(USER_ID_KEY);
  return value ? value.trim() || null : null;
}

export function useAuth() {
  const value = useContext(AuthCtx);
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return value;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [userId, setUserId] = useState<string | null>(getPersistedUserId);
  const [loginError, setLoginError] = useState<string | null>(null);

  const login = useCallback(async (username: string): Promise<boolean> => {
    setLoginError(null);
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(username)}/characters`);
      if (!res.ok) {
        if (res.status === 404) {
          setLoginError('Username not found.');
        } else {
          setLoginError('Login failed. Try again.');
        }
        return false;
      }
      localStorage.setItem(USER_ID_KEY, username);
      setUserId(username);
      return true;
    } catch {
      setLoginError('Could not connect to server.');
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem('spellbook.activeCharacter');
    setUserId(null);
    setLoginError(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    userId,
    isAuthenticated: userId !== null,
    loginError,
    login,
    logout,
  }), [userId, loginError, login, logout]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/web && npx vitest run src/app/state/__tests__/AuthContext.test.tsx`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/state/AuthContext.tsx apps/web/src/app/state/__tests__/AuthContext.test.tsx
git commit -m "feat(web): add AuthContext for username-based login"
```

---

## Task 6: Sync Service

**Files:**
- Create: `apps/web/src/app/state/SyncService.ts`
- Create: `apps/web/src/app/state/__tests__/SyncService.test.ts`

- [ ] **Step 1: Write failing tests for SyncService**

Create `apps/web/src/app/state/__tests__/SyncService.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SyncService } from '../SyncService';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('SyncService', () => {
  let service: SyncService;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    service = new SyncService();
  });

  afterEach(() => {
    service.stop();
    vi.useRealTimers();
  });

  it('starts with idle status', () => {
    expect(service.getStatus()).toBe('idle');
  });

  it('does not sync when not dirty', async () => {
    service.start('alice', 'sha-1');
    await vi.advanceTimersByTimeAsync(35000);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('syncs when dirty after interval', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    });

    const characters = [{ id: 'gandalf', name: 'Gandalf' }];
    service.start('alice', 'sha-1');
    service.markDirty(characters);

    await vi.advanceTimersByTimeAsync(35000);

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/users/alice/characters',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ characters, sha: 'sha-1' }),
      }),
    );
    expect(service.getStatus()).toBe('idle');
  });

  it('sets error status on sync failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    service.start('alice', 'sha-1');
    service.markDirty([]);

    await vi.advanceTimersByTimeAsync(35000);

    expect(service.getStatus()).toBe('error');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/web && npx vitest run src/app/state/__tests__/SyncService.test.ts`
Expected: FAIL — `SyncService.ts` doesn't exist.

- [ ] **Step 3: Implement SyncService**

Create `apps/web/src/app/state/SyncService.ts`:

```typescript
export type SyncStatus = 'idle' | 'syncing' | 'error';

type StatusListener = (status: SyncStatus) => void;

const SYNC_INTERVAL_MS = 30_000;

export class SyncService {
  private userId: string | null = null;
  private sha: string | null = null;
  private dirty = false;
  private pendingCharacters: unknown[] | null = null;
  private status: SyncStatus = 'idle';
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<StatusListener> = new Set();

  getStatus(): SyncStatus {
    return this.status;
  }

  onStatusChange(listener: StatusListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setStatus(next: SyncStatus) {
    this.status = next;
    this.listeners.forEach((fn) => fn(next));
  }

  start(userId: string, sha: string | null) {
    this.stop();
    this.userId = userId;
    this.sha = sha;
    this.dirty = false;
    this.pendingCharacters = null;
    this.setStatus('idle');

    this.intervalId = setInterval(() => {
      void this.flush();
    }, SYNC_INTERVAL_MS);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.userId = null;
    this.dirty = false;
    this.pendingCharacters = null;
    this.setStatus('idle');
  }

  markDirty(characters: unknown[]) {
    this.dirty = true;
    this.pendingCharacters = characters;
  }

  updateSha(sha: string | null) {
    this.sha = sha;
  }

  async flush(): Promise<void> {
    if (!this.dirty || !this.userId || !this.pendingCharacters) return;

    this.dirty = false;
    const characters = this.pendingCharacters;
    this.pendingCharacters = null;

    this.setStatus('syncing');
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(this.userId)}/characters`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characters, sha: this.sha }),
      });

      if (!res.ok) {
        throw new Error(`Sync failed: ${res.status}`);
      }

      // Update SHA to the new value so subsequent PUTs don't conflict
      const body = await res.json() as { ok: boolean; sha: string };
      if (body.sha) {
        this.sha = body.sha;
      }

      this.setStatus('idle');
    } catch {
      this.setStatus('error');
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/web && npx vitest run src/app/state/__tests__/SyncService.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/state/SyncService.ts apps/web/src/app/state/__tests__/SyncService.test.ts
git commit -m "feat(web): add background sync service"
```

---

## Task 7: Login Screen & Auth Gate Components

**Files:**
- Create: `apps/web/src/app/components/LoginScreen.tsx`
- Create: `apps/web/src/app/components/AuthGate.tsx`

- [ ] **Step 1: Create LoginScreen component**

Create `apps/web/src/app/components/LoginScreen.tsx`:

```typescript
import { useState } from 'react';
import { useAuth } from '../state/AuthContext';

interface LoginScreenProps {
  onSuccess?: () => void;
}

export function LoginScreen({ onSuccess }: LoginScreenProps) {
  const { login, loginError } = useAuth();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) return;

    setLoading(true);
    const success = await login(trimmed);
    setLoading(false);

    if (success) {
      onSuccess?.();
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div className="space-y-1">
          <p className="font-display text-2xl">Welcome to Spellbook</p>
          <p className="text-sm text-text-muted">Enter your username to access your characters.</p>
        </div>

        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          autoFocus
          disabled={loading}
          className="w-full rounded-lg border border-border-dark bg-bg-1 px-4 py-2.5 text-sm text-text placeholder:text-text-dim focus:border-gold-soft focus:outline-none"
        />

        {loginError ? (
          <p className="text-sm text-blood">{loginError}</p>
        ) : null}

        <button
          type="submit"
          disabled={loading || !username.trim()}
          className="w-full rounded-lg bg-gold-soft/20 px-4 py-2.5 text-sm text-text transition-colors hover:bg-gold-soft/30 disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Create AuthGate component**

Create `apps/web/src/app/components/AuthGate.tsx`:

```typescript
import { useAuth } from '../state/AuthContext';
import { LoginScreen } from './LoginScreen';

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <>{children}</>;
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/components/LoginScreen.tsx apps/web/src/app/components/AuthGate.tsx
git commit -m "feat(web): add LoginScreen and AuthGate components"
```

---

## Task 8: Sync Indicator Component

**Files:**
- Create: `apps/web/src/app/components/SyncIndicator.tsx`

- [ ] **Step 1: Create SyncIndicator**

Create `apps/web/src/app/components/SyncIndicator.tsx`:

```typescript
import type { SyncStatus } from '../state/SyncService';

interface SyncIndicatorProps {
  status: SyncStatus;
}

export function SyncIndicator({ status }: SyncIndicatorProps) {
  if (status === 'idle') {
    return (
      <span className="flex items-center gap-1.5 text-[11px] text-text-dim">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Synced
      </span>
    );
  }

  if (status === 'syncing') {
    return (
      <span className="flex items-center gap-1.5 text-[11px] text-text-dim">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
        Syncing...
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5 text-[11px] text-blood">
      <span className="h-1.5 w-1.5 rounded-full bg-blood" />
      Sync error
    </span>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/components/SyncIndicator.tsx
git commit -m "feat(web): add sync status indicator component"
```

---

## Task 9: Integrate Auth + Sync into App

**Files:**
- Modify: `apps/web/src/app/App.tsx`
- Modify: `apps/web/src/app/state/AppContext.tsx`
- Modify: `apps/web/src/app/components/AppShell.tsx`

This is the integration task where everything comes together. The changes are:

- [ ] **Step 1: Update App.tsx — add AuthProvider and AuthGate**

Wrap the app with `AuthProvider`. Wrap character-dependent routes (`/prepare`, `/character`) with `AuthGate`. The catalog route remains ungated.

```typescript
// apps/web/src/app/App.tsx
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { AuthGate } from './components/AuthGate';
import { CharacterPage } from './pages/CharacterPage';
import { CatalogPage } from './pages/CatalogPage';
import { PreparePage } from './pages/PreparePage';
import { AppProvider, useApp } from './state/AppContext';
import { AuthProvider } from './state/AuthContext';

function RouterContent() {
  const { loading, error } = useApp();

  if (loading) {
    return <p className="mx-auto max-w-2xl p-6 text-sm text-text-muted">Loading Spellbook...</p>;
  }

  if (error) {
    return <p className="mx-auto max-w-2xl p-6 text-sm text-blood">{error}</p>;
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/catalog" replace />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/prepare" element={<AuthGate><PreparePage /></AuthGate>} />
        <Route path="/character" element={<AuthGate><CharacterPage /></AuthGate>} />
        <Route path="*" element={<Navigate to="/catalog" replace />} />
      </Routes>
    </AppShell>
  );
}

export function App() {
  return (
    <div className="dark">
      <AuthProvider>
        <AppProvider>
          <Router basename={import.meta.env.BASE_URL}>
            <RouterContent />
          </Router>
        </AppProvider>
      </AuthProvider>
    </div>
  );
}
```

- [ ] **Step 2: Update AppContext.tsx — integrate sync service**

Key changes to `AppContext.tsx`:
- Import `useAuth` and `SyncService`.
- Create a `SyncService` instance, start it on login, stop on logout.
- On mount when authenticated: fetch characters from API, write to IndexedDB, hydrate.
- Call `syncService.markDirty(characters)` after every mutation.
- Expose `syncStatus` in the context value.

Every mutation path must call `markDirty` after updating state. The callsites are:

1. **`persistCharacter`** — called by `saveCharacter` and `mutateActiveCharacter` (which covers all spell queue/prep operations)
2. **`createCharacter`** — after `setCharacters` adds the new character
3. **`deleteCharacter`** — after `setCharacters` removes the character
4. **`applyPlan`** — after `setCharacters` updates the profile

Each should call:

```typescript
// After setCharacters update, get the latest characters array and:
syncServiceRef.current.markDirty(latestCharacters);
```

Add a `useEffect` that starts/stops the sync service based on auth state:

```typescript
const { userId, isAuthenticated } = useAuth();

useEffect(() => {
  if (isAuthenticated && userId) {
    // Fetch from API to hydrate
    fetch(`/api/users/${encodeURIComponent(userId)}/characters`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.sha) {
          syncServiceRef.current.start(userId, data.sha);
        }
      })
      .catch(() => {});
  } else {
    syncServiceRef.current.stop();
  }
  return () => syncServiceRef.current.stop();
}, [isAuthenticated, userId]);
```

Expose sync status via a state variable updated by `syncService.onStatusChange`.

- [ ] **Step 3: Update AppShell.tsx — add logout and sync indicator**

Add to the AppShell header, near the CharacterDropdown:

```typescript
import { useAuth } from '../state/AuthContext';
import { SyncIndicator } from './SyncIndicator';

// Inside AppShell:
const { isAuthenticated, logout } = useAuth();
const { syncStatus } = useApp(); // Add syncStatus to AppContextValue

// In the header JSX, after CharacterDropdown:
{isAuthenticated ? (
  <div className="flex items-center gap-3">
    <SyncIndicator status={syncStatus} />
    <button
      onClick={logout}
      className="text-xs text-text-dim hover:text-text transition-colors"
    >
      Log out
    </button>
  </div>
) : null}
```

- [ ] **Step 4: Run all existing tests**

Run: `npm run test:web`
Expected: All tests PASS (existing tests should not break, the provider fallback still works without auth).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/App.tsx apps/web/src/app/state/AppContext.tsx apps/web/src/app/components/AppShell.tsx
git commit -m "feat(web): integrate auth, sync, and lazy login into app"
```

---

## Task 10: Seed Data & GitHub Pages Cleanup

**Files:**
- Create: `data/users/users.json`
- Remove: `.github/workflows/pages.yml`
- Remove: `scripts/build-pages.mjs`
- Modify: `package.json` (root) — remove `build:pages` script
- Modify: `.github/workflows/ci.yml` — add server job

- [ ] **Step 1: Create seed users.json**

Create `data/users/users.json`:

```json
[]
```

- [ ] **Step 2: Remove GitHub Pages workflow and build script**

```bash
rm .github/workflows/pages.yml
rm scripts/build-pages.mjs
```

- [ ] **Step 3: Update root package.json — remove build:pages**

Remove the `"build:pages": "node scripts/build-pages.mjs"` and `"snapshot:import"` scripts if no longer relevant. Keep the `snapshot:import` script if it's still useful for maintaining the spell catalog.

- [ ] **Step 4: Update CI workflow — add server job**

Add to `.github/workflows/ci.yml`:

```yaml
  server:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci --prefix apps/server
      - run: npm run test:server
      - run: npm run build:server
```

- [ ] **Step 5: Commit**

```bash
git add data/users/users.json .github/workflows/ci.yml package.json
git rm .github/workflows/pages.yml scripts/build-pages.mjs
git commit -m "chore: seed user data, remove GitHub Pages, add server CI"
```

---

## Task 11: End-to-End Smoke Test

**Files:** No new files — this is a manual verification task.

- [ ] **Step 1: Start the server locally**

```bash
cd apps/server
GITHUB_PAT=<your-token> GITHUB_REPO=ABZerra/spellbook-v2-main GITHUB_BRANCH=main STATIC_DIR=../web/dist npm run dev
```

- [ ] **Step 2: Start the frontend dev server**

In a separate terminal:
```bash
cd apps/web
npm run dev
```

The Vite dev server at `localhost:3000` already has a proxy configured in `vite.config.ts` (`/api` → `http://localhost:3001`). No changes needed.

- [ ] **Step 3: Verify catalog works without login**

Open `http://localhost:3000/catalog`. Verify:
- Spell catalog loads and is browsable.
- No login prompt appears.

- [ ] **Step 4: Verify login required for character flows**

Navigate to `http://localhost:3000/character`. Verify:
- Login screen appears.
- Typing an invalid username shows "Username not found."
- After creating a test user in `data/users/users.json` and their `characters.json`, logging in works.

- [ ] **Step 5: Verify character CRUD and sync**

After login:
- Create a character. Verify it saves locally.
- Wait ~30 seconds. Check the GitHub repo for a new merged PR.
- Open a different browser / incognito. Log in with same username. Verify the character appears.

- [ ] **Step 6: Verify logout**

Click "Log out." Verify:
- Returns to catalog (or login screen if on a gated page).
- Characters are cleared from local state.
