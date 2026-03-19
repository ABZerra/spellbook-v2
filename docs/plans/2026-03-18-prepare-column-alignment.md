# Prepare Queue Column Alignment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make every desktop queue row follow a consistent label/value rhythm and align `Remove` with the main control line.

**Architecture:** Keep the current queue-ledger structure in `PreparePage.tsx`, but extract the read-only replace-column text into a tiny presentation helper so the non-replace states stay explicit and testable. Then update the list/replace column markup so they share the same vertical cadence.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, Tailwind utility classes

---

### Task 1: Add a failing test for read-only replace-column copy

**Files:**
- Modify: `apps/web/src/app/__tests__/prepare-presentation.test.ts`
- Modify: `apps/web/src/app/pages/preparePresentation.ts`

**Step 1: Write the failing test**

Add a focused test for the read-only replace column:

```ts
it('formats read-only replace column copy for non-replace intents', () => {
  expect(getPrepareQueueReplaceSummary('add')).toBe('Prepare without replacement');
  expect(getPrepareQueueReplaceSummary('queue_only')).toBe('Saved for later');
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test --prefix apps/web -- prepare-presentation.test.ts`

Expected: FAIL because the helper does not exist yet.

**Step 3: Write minimal implementation**

Add the helper to `preparePresentation.ts` and keep it narrowly scoped to the read-only replace column.

**Step 4: Run test to verify it passes**

Run: `npm run test --prefix apps/web -- prepare-presentation.test.ts`

Expected: PASS

### Task 2: Normalize queue column rhythm

**Files:**
- Modify: `apps/web/src/app/pages/PreparePage.tsx`
- Modify: `apps/web/src/app/pages/preparePresentation.ts`
- Modify: `apps/web/src/app/__tests__/prepare-presentation.test.ts`

**Step 1: Verify the current issue**

Confirm the current queue still mixes `label + select` columns with plain text columns, and that `Remove` does not share the main control-line alignment.

**Step 2: Write minimal implementation**

In `PreparePage.tsx`:

- keep the left spell column unchanged
- give the list column a consistent top label
- give the replace column a consistent top label even for non-replace intents
- align `Remove` to the main control/value line

**Step 3: Run verification**

Run:

```bash
npm run test --prefix apps/web
npm run build --prefix apps/web
```

Expected: PASS
