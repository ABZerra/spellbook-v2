# Snapshot-Only Catalog Cutover Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the repo-managed spell snapshot the only supported catalog source for local testing and production, removing API and legacy runtime branching.

**Architecture:** The web app and extension will read only from the generated snapshot and sync payload storage. The API app, Notion sync path, production provider path, and runtime mode branching will be removed so the codebase has one catalog contract and one import pipeline.

**Tech Stack:** Node.js, React, Vitest, Node test runner, CSV snapshot importer, Chrome extension

---

### Task 1: Lock the provider layer to snapshot-only

**Files:**
- Modify: `apps/web/src/app/__tests__/provider-contract.test.ts`
- Modify: `apps/web/src/app/providers/provider.ts`
- Modify: `apps/web/src/app/providers/localSnapshotProvider.ts`
- Delete: `apps/web/src/app/providers/productionProvider.ts`
- Delete: `apps/web/src/app/providers/createProvider.ts`
- Modify: `apps/web/src/app/state/AppContext.tsx`
- Modify: `apps/web/src/app/types.ts`

**Step 1: Write the failing test**
- Update the provider contract test to cover only the snapshot provider and remove production-only sync expectations.
- Add an expectation that `syncCatalog()` refreshes from the snapshot file path without hitting `/api/spells`.

**Step 2: Run test to verify it fails**
Run: `npm run test --prefix apps/web -- --run src/app/__tests__/provider-contract.test.ts`
Expected: FAIL because the provider contract and app context still expose production/runtime branching.

**Step 3: Write minimal implementation**
- Remove `ProductionProvider` and `createProvider`.
- Simplify provider runtime to `snapshot` only.
- Have `AppContext` default directly to `LocalSnapshotProvider`.
- Simplify `syncCatalog()` semantics to just reload the local snapshot.

**Step 4: Run test to verify it passes**
Run: `npm run test --prefix apps/web -- --run src/app/__tests__/provider-contract.test.ts`
Expected: PASS.

**Step 5: Commit**
```bash
git add apps/web/src/app/__tests__/provider-contract.test.ts apps/web/src/app/providers/provider.ts apps/web/src/app/providers/localSnapshotProvider.ts apps/web/src/app/state/AppContext.tsx apps/web/src/app/types.ts
git rm apps/web/src/app/providers/productionProvider.ts apps/web/src/app/providers/createProvider.ts
git commit -m "refactor: make spell catalog snapshot-only"
```

### Task 2: Remove API fallback behavior from the extension

**Files:**
- Modify: `apps/extension/background.js`
- Modify: `apps/extension/test/payload-utils.test.js` if needed
- Create: `apps/extension/test/background-fallback.test.js`

**Step 1: Write the failing test**
- Add a test proving the extension reports a missing payload instead of trying the local Spellbook API fallback.

**Step 2: Run test to verify it fails**
Run: `npm run test --prefix apps/extension`
Expected: FAIL because the background script still hydrates from `/api/config` and `/api/spells`.

**Step 3: Write minimal implementation**
- Remove API base URLs and `hydratePayloadFromSpellbookApi()`.
- Keep popup/sync behavior dependent only on stored sync payloads.
- Update error text to point users toward generating a payload from the web app.

**Step 4: Run test to verify it passes**
Run: `npm run test --prefix apps/extension`
Expected: PASS.

**Step 5: Commit**
```bash
git add apps/extension/background.js apps/extension/test/background-fallback.test.js apps/extension/test/payload-utils.test.js
git commit -m "refactor: remove extension api fallback"
```

### Task 3: Remove the API app and Notion sync implementation

**Files:**
- Modify: `package.json`
- Delete: `apps/api/package.json`
- Delete: `apps/api/src/notionSync.mjs`
- Delete: `apps/api/src/server.mjs`
- Delete: `apps/api/test/server.test.mjs`

**Step 1: Write the failing test**
- Update root scripts/assumptions so `npm test` no longer expects `test:api`.
- Verify current commands fail until package scripts are adjusted.

**Step 2: Run test to verify it fails**
Run: `npm test`
Expected: FAIL because the root scripts still reference the removed API workspace.

**Step 3: Write minimal implementation**
- Remove `apps/api` from workspaces.
- Remove `dev:api` and `test:api` scripts.
- Delete the API app files.

**Step 4: Run test to verify it passes**
Run: `npm test`
Expected: PASS without any API tests.

**Step 5: Commit**
```bash
git add package.json
git rm -r apps/api
git commit -m "chore: remove unused spell api"
```

### Task 4: Update docs and references to the single snapshot workflow

**Files:**
- Modify: `README.md`
- Modify: `docs/engineering/ARCHITECTURE.md`
- Modify: `docs/product/PRD.md`
- Modify: `docs/plans/2026-03-14-ddb-spell-schema-migration.md`
- Search: remaining references to production runtime, Notion sync, API paths

**Step 1: Write the failing test**
- Run the docs checker after intentionally keeping old references to confirm the doc pass is the guardrail.

**Step 2: Run test to verify it fails**
Run: `node scripts/check-docs.mjs`
Expected: PASS or no coverage for stale content; use grep results as the explicit red-state checklist instead.

**Step 3: Write minimal implementation**
- Rewrite docs to describe one snapshot-only runtime.
- Remove mentions of production API, Notion sync, and runtime mode splits.

**Step 4: Run test to verify it passes**
Run: `node scripts/check-docs.mjs`
Expected: PASS.

**Step 5: Commit**
```bash
git add README.md docs/engineering/ARCHITECTURE.md docs/product/PRD.md docs/plans/2026-03-14-ddb-spell-schema-migration.md
git commit -m "docs: document snapshot-only catalog workflow"
```

### Task 5: Full verification and cleanup

**Files:**
- Review: `apps/web/public/spells.snapshot.json`
- Review: `data/spells.snapshot.json`
- Review: `package.json`
- Review: `git status`

**Step 1: Run verification commands**
Run:
- `node --test scripts/import-spells-csv.test.mjs`
- `npm run test --prefix apps/web`
- `npm run test --prefix apps/extension`
- `node scripts/check-docs.mjs`
- `npm run build --prefix apps/web`
- `npm test`

**Step 2: Inspect outputs**
- Confirm all commands exit 0.
- Confirm snapshot files still report `schemaVersion: 2` and `521` spells.
- Confirm no files under `apps/api` remain.

**Step 3: Final commit**
```bash
git add -A
git commit -m "refactor: remove legacy catalog runtime paths"
```
