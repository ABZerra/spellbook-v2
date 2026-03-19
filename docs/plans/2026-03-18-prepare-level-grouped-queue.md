# Prepare Level-Grouped Queue Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Group the left Prepare queue by spell level and sort spells by name within each section, while keeping the right rail unchanged.

**Architecture:** Add a small pure presentation helper in `preparePresentation.ts` that groups queued rows by level with stable labels and alphabetical ordering. Then update `PreparePage.tsx` to render grouped sections instead of a single flat queue loop. Keep the existing row controls and final-check grouping intact.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, Tailwind utility classes

---

### Task 1: Add a failing test for level-grouped queue presentation

**Files:**
- Modify: `apps/web/src/app/__tests__/prepare-presentation.test.ts`
- Modify: `apps/web/src/app/pages/preparePresentation.ts`

**Step 1: Write the failing test**

Add a focused test showing that queued rows should group by level and sort alphabetically inside each level group.

**Step 2: Run test to verify it fails**

Run: `npm run test --prefix apps/web -- prepare-presentation.test.ts`

Expected: FAIL because the grouping helper does not exist yet.

**Step 3: Write minimal implementation**

Add a level-grouping helper with labels such as `Cantrips` and `Level 3`.

**Step 4: Run test to verify it passes**

Run: `npm run test --prefix apps/web -- prepare-presentation.test.ts`

Expected: PASS

### Task 2: Render the queue as level-grouped sections

**Files:**
- Modify: `apps/web/src/app/pages/PreparePage.tsx`
- Modify: `apps/web/src/app/pages/preparePresentation.ts`
- Modify: `apps/web/src/app/__tests__/prepare-presentation.test.ts`

**Step 1: Verify the current issue**

Confirm the queue still renders as one flat list and that level is still shown inside the row metadata instead of as a section heading.

**Step 2: Write minimal implementation**

Update `PreparePage.tsx` to:

- build grouped queue sections
- render section headings and dividers
- keep rows interactive
- remove level from the list-column support text

**Step 3: Run verification**

Run:

```bash
npm run test --prefix apps/web
npm run build --prefix apps/web
```

Expected: PASS
