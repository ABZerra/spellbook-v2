# Prepare Queue Row Alignment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove passive replace helper text and tighten queue-row alignment so the compact ledger reads cleanly.

**Architecture:** Keep the current queue-ledger structure in `PreparePage.tsx`, but extract the replace-column message into a tiny presentation helper so the validation behavior is explicit and testable. Then adjust the row classes so all desktop columns share the same top alignment.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, Tailwind utility classes

---

### Task 1: Add a failing test for replace-column messaging

**Files:**
- Modify: `apps/web/src/app/__tests__/prepare-presentation.test.ts`
- Modify: `apps/web/src/app/pages/preparePresentation.ts`

**Step 1: Write the failing test**

Add a focused test for the replace-column message helper:

```ts
it('only shows replace guidance when validation is active', () => {
  expect(getPrepareReplaceMessage({ replaceMissing: true, showValidationErrors: false })).toBeNull();
  expect(getPrepareReplaceMessage({ replaceMissing: true, showValidationErrors: true })).toBe('Choose a prepared spell before applying.');
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test --prefix apps/web -- prepare-presentation.test.ts`

Expected: FAIL because the helper does not exist yet.

**Step 3: Write minimal implementation**

Add the helper to `preparePresentation.ts` and keep it narrowly scoped to replace-column messaging.

**Step 4: Run test to verify it passes**

Run: `npm run test --prefix apps/web -- prepare-presentation.test.ts`

Expected: PASS

### Task 2: Apply the row-alignment cleanup

**Files:**
- Modify: `apps/web/src/app/pages/PreparePage.tsx`
- Modify: `apps/web/src/app/pages/preparePresentation.ts`
- Modify: `apps/web/src/app/__tests__/prepare-presentation.test.ts`

**Step 1: Verify the current issue**

Confirm the queue still renders the passive `Pick what this replaces.` helper and that the `Remove` action does not fully share the new top-aligned row structure.

**Step 2: Write minimal implementation**

In `PreparePage.tsx`:

- remove the passive replace helper text
- render only the stronger validation message when the apply validation state is active
- keep the replace column compact
- align the `Remove` action to the row top on desktop

**Step 3: Run verification**

Run:

```bash
npm run test --prefix apps/web
npm run build --prefix apps/web
```

Expected: PASS
