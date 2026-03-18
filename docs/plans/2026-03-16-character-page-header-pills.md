# Character Page Header Pills Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reshape the Character page so character switching lives in compact header pills and `Current Prepared` becomes the full-width primary work surface.

**Architecture:** Keep the existing Character page data flow and domain logic, but reorganize the page hierarchy. Remove the dedicated sidebar layout, move character switching into the page header, keep the active-character cue compact, and demote profile/rules/always-prepared editing into a secondary expandable section below the main prepared list.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, Tailwind utility classes

---

### Task 1: Finalize the presentation contract

**Files:**
- Modify: `apps/web/src/app/__tests__/character-presentation.test.ts`
- Modify: `apps/web/src/app/pages/characterPresentation.ts`

**Step 1: Write the failing test**

Extend the presentation test to cover any new helper output needed for header pills or compact cue metadata.

**Step 2: Run test to verify it fails**

Run: `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run test --prefix apps/web -- character-presentation.test.ts`
Expected: FAIL with the missing helper shape or assertion mismatch.

**Step 3: Write minimal implementation**

Update `characterPresentation.ts` with the smallest helper changes needed for the new header/cue structure.

**Step 4: Run test to verify it passes**

Run: `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run test --prefix apps/web -- character-presentation.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/app/__tests__/character-presentation.test.ts apps/web/src/app/pages/characterPresentation.ts
git commit -m "test: define character header presentation contract"
```

### Task 2: Move character switching into the page header

**Files:**
- Modify: `apps/web/src/app/pages/CharacterPage.tsx`

**Step 1: Write the failing test**

If a UI test is practical, add one that asserts the character switcher renders in the page header instead of a sidebar. If a UI test is not practical in this repo, capture the expected DOM structure in comments within the plan and verify via focused manual review after implementation.

**Step 2: Run test to verify it fails**

Run the relevant focused test command if a test was added. Otherwise verify the current page still uses the sidebar layout.

**Step 3: Write minimal implementation**

Remove the left sidebar layout, render character pills in the header area, and keep a compact `Create Character` control nearby without reintroducing a large left rail.

**Step 4: Run test to verify it passes**

Run the focused test if added, or verify locally in the browser that the switcher now lives in the header and the sidebar is gone.

**Step 5: Commit**

```bash
git add apps/web/src/app/pages/CharacterPage.tsx
git commit -m "feat: move character switching into header pills"
```

### Task 3: Promote `Current Prepared` to the full-width main surface

**Files:**
- Modify: `apps/web/src/app/pages/CharacterPage.tsx`

**Step 1: Write the failing test**

Add or adjust the smallest testable presentation assertion available, or document the expected visual structure to validate manually if this repo does not support component rendering tests yet.

**Step 2: Run test to verify it fails**

Run the focused test if one was added, or confirm the current implementation still splits width with secondary UI.

**Step 3: Write minimal implementation**

Refactor the page structure so `Current Prepared` appears directly after the compact active-character cue and uses the full page width.

**Step 4: Run test to verify it passes**

Verify in the browser that the prepared list has materially more horizontal space and remains readable as the list grows.

**Step 5: Commit**

```bash
git add apps/web/src/app/pages/CharacterPage.tsx
git commit -m "feat: promote current prepared as primary surface"
```

### Task 4: Demote setup flows into a secondary expandable area

**Files:**
- Modify: `apps/web/src/app/pages/CharacterPage.tsx`

**Step 1: Write the failing test**

Add the smallest focused assertion available for the presence of a secondary `Profile Basics` disclosure area, or note manual validation steps if UI tests are not available.

**Step 2: Run test to verify it fails**

Run the focused test if present, or confirm the current page still keeps setup elements too prominent.

**Step 3: Write minimal implementation**

Move basic info, preparation rules, and always-prepared management into one quieter section below the prepared list, using collapsible subsections as needed.

**Step 4: Run test to verify it passes**

Verify locally that profile/rules/always-prepared still work, but read as secondary and no longer compete with the main review surface.

**Step 5: Commit**

```bash
git add apps/web/src/app/pages/CharacterPage.tsx
git commit -m "feat: group character setup into secondary profile basics"
```

### Task 5: Verify responsive behavior and final quality

**Files:**
- Modify: `apps/web/src/app/pages/CharacterPage.tsx`
- Test: `apps/web/src/app/__tests__/character-presentation.test.ts`

**Step 1: Write the failing test**

If a focused testable helper change is needed for responsive copy or chip data, add it now; otherwise skip new tests and rely on layout verification in the browser.

**Step 2: Run test to verify it fails**

Run the focused test only if added.

**Step 3: Write minimal implementation**

Polish overflow, wrapping, and spacing so the character pills scroll cleanly on narrow screens and the compact cue remains readable.

**Step 4: Run test to verify it passes**

Run:

```bash
PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run test --prefix apps/web
PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run build --prefix apps/web
```

Expected: all tests pass and the Vite build succeeds.

**Step 5: Commit**

```bash
git add apps/web/src/app/pages/CharacterPage.tsx apps/web/src/app/__tests__/character-presentation.test.ts apps/web/src/app/pages/characterPresentation.ts
git commit -m "feat: finalize character page hierarchy refresh"
```
