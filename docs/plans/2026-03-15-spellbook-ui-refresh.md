# Spellbook UI Refresh Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refresh Spellbook’s local UI so the core workflow is clearer, more distinctive, and more responsive without changing the underlying spell rules.

**Architecture:** Keep the current routing and state layer intact. Refactor page-level presentation by introducing small display helpers, stronger page sections, and responsive layouts that adapt the app shell, Catalog, Prepare, and Character views.

**Tech Stack:** React 18, React Router, Tailwind CSS 4, Vitest

---

### Task 1: Catalog Presentation Helpers

**Files:**
- Create: `apps/web/src/app/pages/catalogPresentation.ts`
- Create: `apps/web/src/app/__tests__/catalog-presentation.test.ts`
- Modify: `apps/web/src/app/pages/CatalogPage.tsx`

**Step 1:** Write failing tests for row presentation state, badge text, and queue CTA logic.

**Step 2:** Run `npm run test --prefix apps/web -- catalog-presentation.test.ts` and confirm the new tests fail for the expected missing module behavior.

**Step 3:** Implement minimal helper functions that turn a `CatalogRow` into presentation metadata.

**Step 4:** Run the targeted test again and confirm it passes.

### Task 2: Refresh the App Shell and Catalog

**Files:**
- Modify: `apps/web/src/app/components/AppShell.tsx`
- Modify: `apps/web/src/app/pages/CatalogPage.tsx`
- Modify: `apps/web/src/styles/theme.css`

**Step 1:** Replace the compressed header layout with a responsive two-row shell.

**Step 2:** Replace the grid table Catalog UI with browse-first list rows and a stronger top summary area.

**Step 3:** Add any supporting visual tokens or utility styles needed for the new hierarchy.

### Task 3: Rework the Prepare Flow

**Files:**
- Modify: `apps/web/src/app/pages/PreparePage.tsx`
- Modify: `apps/web/src/app/components/PreparedDrawer.tsx`

**Step 1:** Promote queue summary and apply state.

**Step 2:** Make queued spell cards easier to scan and act on.

**Step 3:** Improve copy and layout so mobile reads as a workflow instead of a compressed form.

### Task 4: Reorganize the Character Page and Empty State

**Files:**
- Modify: `apps/web/src/app/pages/CharacterPage.tsx`
- Modify: `apps/web/src/app/components/CharacterGate.tsx`

**Step 1:** Restructure the main Character page into clearer content blocks.

**Step 2:** Tighten the onboarding copy and layout so the empty state feels intentional rather than isolated.

**Step 3:** Preserve the existing character actions while improving hierarchy and readability.

### Task 5: Verify

**Files:**
- None

**Step 1:** Run `npm run test --prefix apps/web`.

**Step 2:** Run `npm run build --prefix apps/web`.

**Step 3:** Review the changed screens locally and summarize any remaining risks.
