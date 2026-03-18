# Prepare Dense Workbench Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor the Prepare page into a denser workbench that prioritizes queued changes, limits, and visible queue actions over dashboard-like preview chrome.

**Architecture:** Keep the existing queue, validation, and apply logic in `PreparePage.tsx`, but simplify the presentation. The main changes are: flatten the right rail into a compact `Final Check`, convert search results into compact rows, reduce staged spell chrome while keeping core controls visible, and reuse the existing spell detail side drawer pattern instead of default inline metadata. Add or update pure presentation helpers only if that keeps the component readable and testable.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, Tailwind utility classes

---

### Task 1: Add a focused test for any new Prepare presentation helper

**Files:**
- Modify: `apps/web/src/app/__tests__/prepare-presentation.test.ts`
- Modify: `apps/web/src/app/pages/preparePresentation.ts`

**Step 1: Write the failing test**

Add one minimal test only if a new pure helper is introduced for compact row summaries or final-check presentation.

Example:

```ts
it('formats compact prepare row metadata', () => {
  expect(formatPrepareRowMeta({ level: 3, list: 'Wizard' })).toBe('Level 3 · Wizard');
});
```

**Step 2: Run test to verify it fails**

Run: `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run test --prefix apps/web -- prepare-presentation.test.ts`

Expected: FAIL because the new helper does not exist yet.

**Step 3: Write minimal implementation**

Add the smallest helper needed to satisfy the test. Skip this task entirely if the UI refactor stays clear without extra pure helpers.

**Step 4: Run test to verify it passes**

Run: `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run test --prefix apps/web -- prepare-presentation.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/app/__tests__/prepare-presentation.test.ts apps/web/src/app/pages/preparePresentation.ts
git commit -m "test: cover prepare workbench presentation"
```

### Task 2: Simplify search and move spell details to the side drawer

**Files:**
- Modify: `apps/web/src/app/pages/PreparePage.tsx`
- Modify: `apps/web/src/app/components/SpellDetailDialog.tsx`
- Optionally Create or Modify: `apps/web/src/app/components/SpellDetailDrawer.tsx`

**Step 1: Write the failing test**

If Task 1 added a pure helper, use that test path. Otherwise, document the current failure as search results still rendering as metadata-heavy cards and spell details opening through the wrong presentation pattern.

**Step 2: Run test to verify it fails**

Run the focused helper test if one exists, or verify manually that:

- search shows explanatory tooltip copy when empty
- result rows still look like cards
- spell details do not follow the Character-page side drawer pattern

**Step 3: Write minimal implementation**

Update the search area so it has:

- input
- clear action
- compact result rows

Remove the empty instructional block. Make the spell name open the side drawer and keep `Stage Spell` visible in the row.

**Step 4: Run test to verify it passes**

Verify locally that search is lighter and details open in the side drawer.

**Step 5: Commit**

```bash
git add apps/web/src/app/pages/PreparePage.tsx apps/web/src/app/components/SpellDetailDialog.tsx apps/web/src/app/components/SpellDetailDrawer.tsx
git commit -m "feat: simplify prepare search and move details to drawer"
```

### Task 3: Densify the staged queue without hiding core actions

**Files:**
- Modify: `apps/web/src/app/pages/PreparePage.tsx`

**Step 1: Write the failing test**

Add a focused helper test only if new row-format logic was extracted. Otherwise, document the current failure as staged queue cards still feeling noisy and over-decorated.

**Step 2: Run test to verify it fails**

Verify the current UI still includes:

- heavy card framing per staged spell
- unnecessary casting/save metadata by default
- oversized spacing around always-visible controls

**Step 3: Write minimal implementation**

Keep visible:

- spell name
- intent controls
- spell list control
- replace target control when relevant
- remove action

Remove:

- default casting time chips
- save chips
- extra descriptive metadata
- unnecessary card chrome

Make the staged queue feel like a compact action ledger.

**Step 4: Run test to verify it passes**

Verify locally that staged spells stay actionable but feel much denser and less cluttered.

**Step 5: Commit**

```bash
git add apps/web/src/app/pages/PreparePage.tsx apps/web/src/app/__tests__/prepare-presentation.test.ts apps/web/src/app/pages/preparePresentation.ts
git commit -m "feat: densify prepare workbench rows"
```

### Task 4: Refactor the right rail into a compact final check

**Files:**
- Modify: `apps/web/src/app/pages/PreparePage.tsx`

**Step 1: Write the failing test**

Add a pure helper test only if limits or diff labeling logic is extracted. Otherwise, document the current failure as the apply preview still over-emphasizing metrics instead of the actual verification surfaces.

**Step 2: Run test to verify it fails**

Verify manually that the current right rail still prioritizes:

- large preview title and description
- staged / changes metric cards

over:

- queued changes
- preparation limits
- warnings
- apply

**Step 3: Write minimal implementation**

Replace the current preview emphasis with a quieter `Final Check` rail:

- queued changes first
- preparation limits second
- warnings next
- apply button last

Remove or greatly reduce metric cards and explanatory copy.

**Step 4: Run test to verify it passes**

Verify locally that the right rail now supports the actual apply decision instead of behaving like a dashboard.

**Step 5: Commit**

```bash
git add apps/web/src/app/pages/PreparePage.tsx
git commit -m "feat: simplify prepare final check"
```

### Task 5: Final verification and polish

**Files:**
- Modify: `apps/web/src/app/pages/PreparePage.tsx`
- Optionally Modify: `apps/web/src/app/components/SpellDetailDrawer.tsx`
- Optionally Modify: `apps/web/src/app/pages/preparePresentation.ts`
- Optionally Modify: `apps/web/src/app/__tests__/prepare-presentation.test.ts`

**Step 1: Write the failing test**

Only add another focused test if a new pure helper still lacks explicit coverage.

**Step 2: Run test to verify it fails**

Run the focused test if added. Otherwise, verify the current page still has any leftover explanatory copy or spacing that weakens the dense workbench model.

**Step 3: Write minimal implementation**

Polish spacing, copy, mobile wrapping, and drawer rhythm so the page feels like one coherent preparation workbench.

**Step 4: Run test to verify it passes**

Run:

```bash
PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run test --prefix apps/web
PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run build --prefix apps/web
```

Expected: all tests pass and the web build succeeds.

**Step 5: Commit**

```bash
git add apps/web/src/app/pages/PreparePage.tsx apps/web/src/app/components/SpellDetailDrawer.tsx apps/web/src/app/pages/preparePresentation.ts apps/web/src/app/__tests__/prepare-presentation.test.ts
git commit -m "feat: finish prepare dense workbench refinement"
```
