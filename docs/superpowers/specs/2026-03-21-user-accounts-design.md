# User Accounts — Design Spec

**Date:** 2026-03-21
**Status:** Approved
**Scope:** Add user accounts so characters persist across browsers, backed by JSON files in the GitHub repo, served through a thin Express API on Render.

## Context

Spellbook is a fully client-side D&D spell preparation planner. Character data lives in IndexedDB — browser-local, lost on clear, no cross-device access. The app deploys as a static site on GitHub Pages.

This feature adds user accounts for a friends & family audience. The admin (repo owner) creates accounts manually. Users log in by typing a username (no password). Character data syncs to the GitHub repo as JSON files via an Express API server hosted on Render.

## Requirements

- Users log in by typing a username. No password, no user list shown.
- A user can store multiple characters, each with the existing `CharacterProfile` data (class, subclass, casting ability, spell lists, preparation limits, prepared spells, queue, saved ideas).
- A user can add, delete, and edit characters and their information.
- A user can access the app in different browsers with their account and see the same data.
- The admin creates user accounts by editing files in the GitHub repo.
- Everything runs on GitHub (code + data) and Render (hosting).

## Data Model

Character data lives as JSON files in the repo under `data/users/`:

```
data/
  spells.snapshot.json              # (existing) spell catalog
  users/
    users.json                      # user registry
    alice/
      characters.json               # alice's characters
    bob/
      characters.json               # bob's characters
```

### users.json

```json
[
  { "id": "alice", "username": "alice", "createdAt": "2026-03-21T00:00:00Z" },
  { "id": "bob", "username": "bob", "createdAt": "2026-03-21T00:00:00Z" }
]
```

### characters.json

An array of `CharacterProfile` objects. Same shape as today's IndexedDB data, with an added `userId` field:

```json
[
  {
    "id": "gandalf",
    "userId": "alice",
    "name": "Gandalf",
    "class": "Wizard",
    "subclass": "Diviner",
    "castingAbility": "Intelligence",
    "availableLists": ["WIZARD"],
    "preparationLimits": [{ "list": "WIZARD", "limit": 8 }],
    "preparedSpellIds": ["fireball", "shield"],
    "nextPreparationQueue": [],
    "savedIdeas": [],
    "updatedAt": "2026-03-21T12:00:00Z"
  }
]
```

## API Design

Two REST endpoints. All prefixed `/api`.

### GET /api/users/:userId/characters

Reads `data/users/:userId/characters.json` from GitHub via the Contents API.

- **200:** Returns the characters array.
- **404:** User not found (no directory or not in `users.json`).

Used on login to hydrate the frontend.

### PUT /api/users/:userId/characters

Writes the updated characters array to GitHub via an auto-merge PR flow:

1. Create a branch: `data/{userId}-{timestamp}`
2. Commit updated `characters.json` to the branch
3. Open a PR titled "Update {userId}'s characters"
4. Auto-merge the PR via the GitHub Merge API
5. Delete the branch after merge

- **200:** Save successful, PR merged.
- **404:** User not found.
- **409:** Merge conflict (retry).

**Auto-merge scope:** Only PRs created by the server on `data/*` branches are auto-merged. Regular code PRs are unaffected — this is enforced in application logic, not branch protection rules.

## Architecture

```
┌──────────────┐       REST        ┌──────────────┐     GitHub API    ┌──────────────┐
│   Browser    │ ◄──────────────► │    Render     │ ◄──────────────► │   GitHub     │
│  React App   │   GET/PUT /api   │  Express API  │   Contents API   │   Repo       │
│  + IndexedDB │                  │  + static     │   + PRs API      │  data/users/ │
└──────────────┘                  └──────────────┘                   └──────────────┘
```

### Data Flow

**On login:**
1. User types username on login screen.
2. Frontend calls `GET /api/users/:userId/characters`.
3. Server reads `characters.json` from GitHub, returns it.
4. Frontend writes to IndexedDB and populates AppContext.

**During use:**
- All reads/writes hit IndexedDB (instant). App works offline.
- Character CRUD operations set a dirty flag.

**Background sync:**
- A sync service checks the dirty flag every ~30 seconds.
- If dirty: `PUT /api/users/:userId/characters` with the full array.
- Also triggers on `beforeunload` (page close/navigate away).
- Sync indicator in UI: synced / syncing / error.

**Conflict model:** Last write wins. Each user typically has one active session, so conflicts are negligible.

## Frontend Changes

### New: Login Screen

- Shown when no username in localStorage.
- Single text input: "Enter your username."
- On submit: call GET endpoint.
  - Success → store username in localStorage, load app.
  - 404 → show error: "Username not found."

### New: Sync Service

A module that manages background sync:

- `startSync(userId)` — begins the sync loop.
- `markDirty()` — called by AppContext on character mutations.
- `stopSync()` — on logout.
- Exposes sync status (idle / syncing / error) for UI indicator.

### Modified: AppContext

- On mount: load from IndexedDB first (instant), then reconcile with API data on login.
- Adds `userId` to context state.
- Character CRUD operations call `markDirty()` on the sync service.

### Modified: CharacterPage

- Adds a "Log out" action: clears localStorage username, clears IndexedDB, returns to login screen.

### Unchanged

- CatalogPage, PreparePage, all domain logic, extension sync, spell snapshot loading. These work on in-memory character data regardless of source.

## Server Structure

New `apps/server/` package in the monorepo:

```
apps/server/
  src/
    index.ts              # Express app: static serving + API routes
    github.ts             # GitHub API client: read file, write via PR, merge, delete branch
  package.json            # express, @octokit/rest or node-fetch
  tsconfig.json
```

~200 lines of code total. The server is a thin proxy with no business logic beyond the PR flow.

## Deployment

### Render

- **Service type:** Web Service (free tier)
- **Runtime:** Node.js
- **Build command:** `npm run build` (builds frontend + compiles server)
- **Start command:** `node apps/server/dist/index.js`
- **Environment variables:**
  - `GITHUB_PAT` — fine-grained PAT scoped to repo (Contents: R/W, Pull Requests: R/W)
  - `GITHUB_REPO` — e.g., `ABZerra/spellbook-v2-main`
  - `GITHUB_BRANCH` — default `main`
  - `PORT` — set automatically by Render
- **Auto-deploy:** On push to `main` via Render's GitHub integration.

### GitHub Pages Removal

- Remove `pages.yml` workflow.
- Remove Pages-related build scripts.
- The app lives entirely on Render.

## User Management

No admin UI. The admin creates accounts by editing the repo directly:

1. Add an entry to `data/users/users.json`.
2. Create `data/users/{username}/characters.json` containing `[]`.
3. Commit to main.

This can be done via GitHub's web UI, Claude Code, or any git workflow.

## Out of Scope

- Passwords or real authentication.
- Admin UI for user management.
- Real-time collaboration or live sync between sessions.
- Conflict resolution beyond last-write-wins.
- User registration (self-service sign-up).
- Data encryption.
