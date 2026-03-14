# D&D Beyond Spell Schema Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the app consume a new D&D Beyond-aligned spell snapshot derived from the scraped CSV with notes, while keeping the raw artifact files unchanged.

**Architecture:** Keep `data/artifacts/spells.dndbeyond.filtered.scraped.with-notes.csv` as the canonical raw source. Generate a new normalized snapshot JSON for the app from that CSV, update shared spell types/providers/UI to use D&D Beyond-aligned field names, and preserve character preparation behavior by deriving available spell lists from `availableFor` instead of the old `spellList` field.

**Tech Stack:** Node.js, Vitest, native Node test runner, Vite/React, JSON snapshot import script.

---

### Task 1: Lock the new spell contract with failing tests

**Files:**
- Modify: `apps/web/src/app/__tests__/provider-contract.test.ts`
- Modify: `apps/web/src/app/__tests__/character-domain.test.ts`
- Create or modify: `apps/api/test/*.test.mjs` if importer/API coverage is needed

**Step 1: Write the failing tests**
- Update provider contract fixtures to use the DDB-aligned API shape (`ddbSpellId`, `source`, `sourceCitation`, `rangeArea`, `attackSave`, `damageEffect`, `spellTags`, `availableFor`, `ddbUrl`, `notes`).
- Add a character-domain test proving list eligibility can be derived from `availableFor` values like `Wizard (Legacy)` and `Wizard - Graviturgy Magic (EGtW)`.

**Step 2: Run tests to verify they fail**
- Run: `npm run test:web -- --run apps/web/src/app/__tests__/provider-contract.test.ts apps/web/src/app/__tests__/character-domain.test.ts`
- Expected: failures caused by the old schema assumptions.

**Step 3: Write minimal implementation**
- No production code in this task.

**Step 4: Re-run targeted tests after implementation work in later tasks**
- Keep these tests as the contract gate for the migration.

### Task 2: Change the shared app spell schema

**Files:**
- Modify: `apps/web/src/shared/api.ts`
- Modify: `apps/web/src/app/types.ts`
- Modify: `apps/web/src/app/providers/spellNormalizer.ts`

**Step 1: Update the API types**
- Replace the old `source: string[]`, `spellList`, `range`, `tags` model with DDB-aligned normalized fields.
- Keep names code-friendly: `ddbSpellId`, `source`, `sourceCitation`, `rangeArea`, `attackSave`, `damageEffect`, `spellTags`, `availableFor`, `ddbUrl`.

**Step 2: Update the web spell normalizer**
- Normalize the new fields from API payloads into `SpellRecord`.
- Preserve sorting behavior.

**Step 3: Run targeted web tests**
- Run: `npm run test:web -- --run apps/web/src/app/__tests__/provider-contract.test.ts`
- Expected: provider contract passes for normalization.

### Task 3: Update spell-list derivation and character-domain logic

**Files:**
- Modify: `apps/web/src/app/domain/character.ts`
- Modify: any tests that construct `SpellRecord` fixtures

**Step 1: Derive available lists from `availableFor`**
- Parse `availableFor` entries into canonical list labels for preparation eligibility.
- Treat both `Wizard` and `Wizard (Legacy)` as `WIZARD`.
- Ignore non-class spell access for preparation limits unless explicitly class-shaped.

**Step 2: Keep existing preparation behavior intact**
- `getSpellLists`, `isSpellEligibleForCharacter`, and `getSpellAssignmentList` should work without `spellList`.

**Step 3: Run domain tests**
- Run: `npm run test:web -- --run apps/web/src/app/__tests__/character-domain.test.ts apps/web/src/app/__tests__/prepare-queue-domain.test.ts`
- Expected: green.

### Task 4: Update UI usage sites to the new schema

**Files:**
- Modify: `apps/web/src/app/pages/CatalogPage.tsx`
- Modify: `apps/web/src/app/pages/PreparePage.tsx`
- Modify: `apps/web/src/app/components/PreparedDrawer.tsx`
- Modify: any other `SpellRecord` consumers found by search

**Step 1: Replace old field references**
- `range` -> `rangeArea`
- `tags` -> `spellTags`
- add or preserve `notes`, `damageEffect`, `attackSave`, `sourceCitation` where useful

**Step 2: Keep the UI behavior stable**
- Do not redesign the UI.
- Only update labels/content to the new contract.

**Step 3: Run targeted web tests**
- Run: `npm run test:web`
- Expected: all web tests pass.

### Task 5: Generate the new app snapshot from the repo artifact

**Files:**
- Modify: `scripts/import-spells-csv.mjs`
- Modify: `data/spells.snapshot.json`
- Modify: `apps/web/public/spells.snapshot.json`

**Step 1: Update the CSV import script**
- Detect the DDB CSV headers and map them to the new normalized snapshot shape.
- Keep support for the old importer only if it stays small and cheap.

**Step 2: Generate the snapshot from the repo artifact**
- Run: `npm run snapshot:import -- data/artifacts/spells.dndbeyond.filtered.scraped.with-notes.csv`
- Expected: snapshot JSON files update to the DDB-aligned schema.

**Step 3: Verify snapshot contents**
- Confirm the generated snapshot contains `521` spells and DDB-aligned fields.

### Task 6: Keep API compatibility with the new snapshot

**Files:**
- Modify: `apps/api/src/server.mjs`
- Modify: `apps/api/src/notionSync.mjs` only if necessary for type alignment
- Modify: `apps/api/test/*.test.mjs`

**Step 1: Ensure API read path remains generic**
- `/api/spells` should serve the new snapshot unchanged.

**Step 2: Decide Notion sync stance**
- If Notion sync is no longer the source of truth, keep the endpoint but do not let it silently revert schema expectations.
- Minimal acceptable option: leave the server read path working and note that sync still returns the legacy shape until explicitly migrated.

**Step 3: Run API tests**
- Run: `npm run test:api`
- Expected: green.

### Task 7: Full verification

**Files:**
- No new files unless small fixture updates are required

**Step 1: Run full verification**
- Run: `npm test`
- Expected: all suites green.

**Step 2: Spot-check runtime data**
- Run a small script or inspect `data/spells.snapshot.json` to verify known spells:
  - `Acid Splash`
  - `Abi-Dalzim's Horrid Wilting`
  - `Gate Seal`
  - `Booming Blade`

**Step 3: Review git diff**
- Ensure raw artifacts remain unchanged and only the new app-facing data path is updated.
