# D&D Beyond Additional Spell Lists Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Preserve D&D Beyond optional-feature provenance for extra class spell-list grants while making those spells behave exactly like native members of the added class list throughout the app.

**Architecture:** Store a repo-owned mapping of D&D Beyond optional-feature spell grants, inject canonical `additionalSpellLists` into the generated spell snapshot, and update the runtime spell-list helpers to merge that field into ordinary list membership. Keep the provenance in data only; do not expose special UI behavior or alternate preparation logic.

**Tech Stack:** Node.js, JSON snapshot import script, Vite/React, Vitest, native repo docs checker.

---

### Task 1: Lock the new spell provenance contract with failing tests

**Files:**
- Modify: `apps/web/src/app/__tests__/provider-contract.test.ts`
- Modify: `apps/web/src/app/__tests__/character-domain.test.ts`
- Modify: `apps/web/src/app/__tests__/extension-sync-v3.test.ts`

**Step 1: Write the failing tests**
- Add `additionalSpellLists` to at least one snapshot fixture in `provider-contract.test.ts` and assert it survives provider normalization.
- Add a character-domain case where a spell has no matching base `availableFor` class but does have `additionalSpellLists: ['BARD']`, then assert a bard character can use it.
- Add an extension sync case proving a spell granted only through `additionalSpellLists` syncs as that class list.

**Step 2: Run tests to verify they fail**
- Run: `npm run test:web -- --run apps/web/src/app/__tests__/provider-contract.test.ts apps/web/src/app/__tests__/character-domain.test.ts apps/web/src/app/__tests__/extension-sync-v3.test.ts`
- Expected: failures caused by the missing `additionalSpellLists` support.

**Step 3: Write minimal implementation**
- No production code in this task.

**Step 4: Re-run these tests after later tasks**
- Keep them as the contract gate for the feature.

### Task 2: Add the repo-owned DDB additional-spell mapping and importer support

**Files:**
- Create: `data/ddb-additional-spell-lists.json`
- Modify: `scripts/import-spells-csv.mjs`

**Step 1: Write the failing importer test or focused fixture assertion**
- If the importer already has test coverage, extend it; otherwise add a small targeted assertion near the importer workflow used in this repo.
- Cover at least one bard, ranger, sorcerer, and wizard example from the DDB mapping.

**Step 2: Run the importer-focused test or script check**
- Run the smallest available command that exercises the importer path.
- Expected: the emitted record lacks `additionalSpellLists` before implementation.

**Step 3: Write minimal implementation**
- Add the canonical mapping file keyed by normalized class list names.
- Teach `scripts/import-spells-csv.mjs` to attach `additionalSpellLists` by spell name without mutating `availableFor`.

**Step 4: Re-run the importer-focused check**
- Confirm mapped spells now emit the new field correctly.

### Task 3: Extend snapshot and runtime spell types

**Files:**
- Modify: `apps/web/src/shared/snapshot.ts`
- Modify: `apps/web/src/app/types.ts`
- Modify: `apps/web/src/app/providers/spellNormalizer.ts`

**Step 1: Update the failing type/normalization expectations**
- Ensure the provider contract fixture expects `additionalSpellLists` to exist on loaded `SpellRecord`s.

**Step 2: Write minimal implementation**
- Add optional `additionalSpellLists?: string[]` to `SnapshotSpell`.
- Add required `additionalSpellLists: string[]` to `SpellRecord`.
- Normalize the field in `spellNormalizer.ts` with the same string-list rules as other list fields.

**Step 3: Run targeted tests**
- Run: `npm run test:web -- --run apps/web/src/app/__tests__/provider-contract.test.ts`
- Expected: provider normalization passes.

### Task 4: Merge additional spell lists into character-domain behavior

**Files:**
- Modify: `apps/web/src/app/domain/character.ts`
- Modify: `apps/web/src/app/__tests__/character-domain.test.ts`
- Modify: any web tests that construct `SpellRecord` fixtures if TypeScript requires the new field

**Step 1: Write the failing domain assertions**
- Add tests that cover:
  - `getSpellLists()` unioning native and additional lists
  - `isSpellEligibleForCharacter()` accepting a spell solely because of an added list
  - `getSpellAssignmentList()` returning the added list when it matches the character

**Step 2: Run tests to verify they fail**
- Run: `npm run test:web -- --run apps/web/src/app/__tests__/character-domain.test.ts`
- Expected: failures due to list helpers ignoring `additionalSpellLists`.

**Step 3: Write minimal implementation**
- Update the list-parsing helpers to merge normalized `additionalSpellLists` with parsed `availableFor` lists.
- Keep existing normalization and dedupe behavior intact.

**Step 4: Re-run targeted tests**
- Run: `npm run test:web -- --run apps/web/src/app/__tests__/character-domain.test.ts apps/web/src/app/__tests__/prepare-queue-domain.test.ts`
- Expected: green.

### Task 5: Keep extension sync aligned with merged list membership

**Files:**
- Modify: `apps/web/src/app/services/extensionSyncV3.ts`
- Modify: `apps/web/src/app/__tests__/extension-sync-v3.test.ts`

**Step 1: Confirm the failing sync case**
- Use the test from Task 1 where a spell only belongs through `additionalSpellLists`.

**Step 2: Write minimal implementation**
- If `extensionSyncV3.ts` already relies on `getSpellLists()`, keep the production code minimal and only adjust where fixture shapes now require `additionalSpellLists`.
- Avoid introducing any UI- or sync-specific branching for provenance.

**Step 3: Re-run targeted tests**
- Run: `npm run test:web -- --run apps/web/src/app/__tests__/extension-sync-v3.test.ts`
- Expected: green.

### Task 6: Regenerate and verify the snapshot

**Files:**
- Modify: `data/spells.snapshot.json`
- Modify: `apps/web/public/spells.snapshot.json`

**Step 1: Run the importer**
- Run: `npm run snapshot:import -- data/artifacts/spells.dndbeyond.filtered.scraped.with-notes.csv`
- Expected: both snapshot files gain `additionalSpellLists` for mapped spells.

**Step 2: Spot-check representative spells**
- Verify examples such as:
  - `Aid` includes `BARD` and `RANGER`
  - `Augury` includes `DRUID` and `WIZARD`
  - `Grease` includes `SORCERER`
  - `Gate` includes `WARLOCK`

**Step 3: Review the diff**
- Confirm `availableFor` remains faithful to the imported CSV and the provenance lives only in `additionalSpellLists`.

### Task 7: Run full verification

**Files:**
- No new files unless tiny fixture fixes are needed

**Step 1: Run all web tests**
- Run: `npm run test:web`
- Expected: green.

**Step 2: Run repo verification**
- Run: `npm test`
- Expected: web, extension, and docs checks all pass.

**Step 3: Prepare the PR summary**
- Draft a PR title such as `feat: merge DDB optional class spell grants into runtime spell lists`.
- Summarize:
  - new snapshot provenance field
  - merged runtime list behavior
  - no user-facing distinction in catalog or prep flows
