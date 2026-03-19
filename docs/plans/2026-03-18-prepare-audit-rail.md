# Prepare Audit Rail Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Simplify the Prepare right rail so grouped list sections carry the limit context and the redundant bottom limits summary is removed.

**Architecture:** Keep the current grouped final-check layout in `PreparePage.tsx`, but make `groupPrepareReviewItems` explicitly order `Unassigned` after normal list groups so the rail always reads as `lists -> unassigned -> warnings -> apply`. The UI change then becomes a small removal in `PreparePage.tsx` rather than a broader refactor.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, Tailwind utility classes

---

### Task 1: Add a failing test for review-group ordering

**Files:**
- Modify: `apps/web/src/app/__tests__/prepare-presentation.test.ts`
- Modify: `apps/web/src/app/pages/preparePresentation.ts`

**Step 1: Write the failing test**

Add a focused test showing that `Unassigned` should appear after normal list groups even if the unassigned item is encountered first.

**Step 2: Run test to verify it fails**

Run: `npm run test --prefix apps/web -- prepare-presentation.test.ts`

Expected: FAIL because the current grouping logic preserves insertion order and may place `Unassigned` too early.

**Step 3: Write minimal implementation**

Update `groupPrepareReviewItems` so the returned groups keep normal lists first and move `Unassigned` to the end.

**Step 4: Run test to verify it passes**

Run: `npm run test --prefix apps/web -- prepare-presentation.test.ts`

Expected: PASS

### Task 2: Remove the redundant bottom limits summary

**Files:**
- Modify: `apps/web/src/app/pages/PreparePage.tsx`

**Step 1: Verify the current issue**

Confirm the `Final Check` rail still shows grouped list headers with `used/limit` and also repeats that information again in the bottom `Preparation Limits` block.

**Step 2: Write minimal implementation**

Remove the separate `Preparation Limits` section so the rail order becomes:

- list sections
- unassigned section
- warnings
- apply button

**Step 3: Run verification**

Run:

```bash
npm run test --prefix apps/web
npm run build --prefix apps/web
```

Expected: PASS
