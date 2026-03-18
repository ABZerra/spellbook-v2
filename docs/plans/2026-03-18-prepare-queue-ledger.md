# Prepare Queue Ledger Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Tighten the Prepare queue into a more horizontal ledger and group final-check items by spell list with visible limit context.

**Architecture:** Keep the current dense-workbench foundation in `PreparePage.tsx`, but compress the staged queue further and reorganize the right-rail review output. The main work will likely stay in `PreparePage.tsx`, with small additions to `preparePresentation.ts` if grouped review formatting or list-header summaries are easier to keep pure and testable there.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, Tailwind utility classes

---

### Task 1: Add tests for grouped review output helpers if needed

**Files:**
- Modify: `apps/web/src/app/__tests__/prepare-presentation.test.ts`
- Modify: `apps/web/src/app/pages/preparePresentation.ts`

**Step 1: Write the failing test**

If grouped review sections or list-header summaries are extracted into pure helpers, add focused failing tests first.

Example:

```ts
it('groups queued review items by spell list with limits', () => {
  expect(groupPrepareReviewItems(...)).toEqual([
    { list: 'Druid', usageLabel: '4/8', items: ['Replace Healing Word', 'Prepare Faerie Fire'] },
  ]);
});
```

**Step 2: Run test to verify it fails**

Run: `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run test --prefix apps/web -- prepare-presentation.test.ts`

Expected: FAIL because the helper does not exist yet or the output is wrong.

**Step 3: Write minimal implementation**

Add only the pure helper logic needed for grouping/formatting. Keep it small and directly tied to the UI requirement.

**Step 4: Run test to verify it passes**

Run: `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run test --prefix apps/web -- prepare-presentation.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/app/__tests__/prepare-presentation.test.ts apps/web/src/app/pages/preparePresentation.ts
git commit -m "test: cover prepare queue ledger presentation"
```

### Task 2: Reorder and regroup the top utility actions

**Files:**
- Modify: `apps/web/src/app/pages/PreparePage.tsx`

**Step 1: Write the failing test**

Use a helper test only if new top-action presentation logic is extracted. Otherwise, document the current failure as `View Current Prepared` and `Reset To Current Prepared` still being separated or ordered awkwardly.

**Step 2: Run test to verify it fails**

Verify manually that the current page still splits or misorders those baseline actions.

**Step 3: Write minimal implementation**

Move `View Current Prepared` alongside `Reset To Current Prepared`, with `View Current Prepared` first.

**Step 4: Run test to verify it passes**

Verify locally that the baseline tools now read as a coherent pair.

**Step 5: Commit**

```bash
git add apps/web/src/app/pages/PreparePage.tsx
git commit -m "feat: regroup prepare baseline actions"
```

### Task 3: Compress staged queue rows into a more horizontal ledger

**Files:**
- Modify: `apps/web/src/app/pages/PreparePage.tsx`

**Step 1: Write the failing test**

Add a helper test only if row-layout formatting is extracted into `preparePresentation.ts`. Otherwise, document the current failure as rows still consuming too much vertical space and not using horizontal room well enough.

**Step 2: Run test to verify it fails**

Verify the current queue still stacks too many controls into multiple vertical bands by default.

**Step 3: Write minimal implementation**

Refactor each staged spell so desktop layout prioritizes one-row composition:

- spell name
- `Replace` as dominant action
- quieter alternative intents
- list control
- replace target control
- remove action

Keep wrapping for smaller screens, but avoid default stacked sections on desktop.

**Step 4: Run test to verify it passes**

Verify locally that the queue feels denser without hiding the controls used every time.

**Step 5: Commit**

```bash
git add apps/web/src/app/pages/PreparePage.tsx apps/web/src/app/pages/preparePresentation.ts apps/web/src/app/__tests__/prepare-presentation.test.ts
git commit -m "feat: compact prepare queue into ledger rows"
```

### Task 4: Group final-check review items by spell list

**Files:**
- Modify: `apps/web/src/app/pages/PreparePage.tsx`
- Optionally Modify: `apps/web/src/app/pages/preparePresentation.ts`
- Optionally Modify: `apps/web/src/app/__tests__/prepare-presentation.test.ts`

**Step 1: Write the failing test**

If review grouping is extracted, add a failing helper test for grouped sections and list-limit headers before implementation.

**Step 2: Run test to verify it fails**

Run the focused helper test if added, or verify manually that the current final-check rail still uses a flat item list with repeated list labels.

**Step 3: Write minimal implementation**

Group review items by spell list and render compact sections like:

- `Druid 4/8`
- `Replace Healing Word`
- `Prepare Faerie Fire`

Use visible limit context in each list header.

**Step 4: Run test to verify it passes**

Verify locally that the rail is easier to scan and no longer needs repeated bracketed list names per row.

**Step 5: Commit**

```bash
git add apps/web/src/app/pages/PreparePage.tsx apps/web/src/app/pages/preparePresentation.ts apps/web/src/app/__tests__/prepare-presentation.test.ts
git commit -m "feat: group prepare final check by spell list"
```

### Task 5: Final verification and polish

**Files:**
- Modify: `apps/web/src/app/pages/PreparePage.tsx`
- Optionally Modify: `apps/web/src/app/pages/preparePresentation.ts`
- Optionally Modify: `apps/web/src/app/__tests__/prepare-presentation.test.ts`

**Step 1: Write the failing test**

Only add another focused test if a new pure helper still lacks coverage.

**Step 2: Run test to verify it fails**

Run the focused test if added. Otherwise, verify the current page still has avoidable spacing or hierarchy issues after the ledger compaction.

**Step 3: Write minimal implementation**

Polish spacing, selection emphasis for `Replace`, row wrapping, and grouped final-check rhythm so the page reads as a coherent ledger.

**Step 4: Run test to verify it passes**

Run:

```bash
PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run test --prefix apps/web
PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run build --prefix apps/web
```

Expected: all tests pass and the web build succeeds.

**Step 5: Commit**

```bash
git add apps/web/src/app/pages/PreparePage.tsx apps/web/src/app/pages/preparePresentation.ts apps/web/src/app/__tests__/prepare-presentation.test.ts
git commit -m "feat: finish prepare queue ledger refinement"
```
