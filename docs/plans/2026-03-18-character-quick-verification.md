# Character Quick Verification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn the Character page into a quick-verification screen with top-level preparation rules, a dense prepared list, and only rare-edit tools below.

**Architecture:** Keep the existing Character page data flow and mutation logic, but change the presentation hierarchy. Introduce a small presentation helper for top-level preparation rule summaries, render those rules near the active character cue, replace the prepared spell card grid with dense rows, and remove preparation rules from the bottom edit area.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, Tailwind utility classes

---

### Task 1: Add the preparation-rules presentation helper

**Files:**
- Modify: `apps/web/src/app/__tests__/character-presentation.test.ts`
- Modify: `apps/web/src/app/pages/characterPresentation.ts`

**Step 1: Write the failing test**

Add a focused test for a helper that returns top-level preparation rule summaries with:

- list
- used
- limit
- max spell level

**Step 2: Run test to verify it fails**

Run: `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run test --prefix apps/web -- character-presentation.test.ts`
Expected: FAIL because the new helper does not exist yet.

**Step 3: Write minimal implementation**

Add the smallest helper needed to shape rule-strip data for the Character page.

**Step 4: Run test to verify it passes**

Run: `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run test --prefix apps/web -- character-presentation.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/app/__tests__/character-presentation.test.ts apps/web/src/app/pages/characterPresentation.ts
git commit -m "test: add character preparation rule summaries"
```

### Task 2: Promote preparation rules into the top verification area

**Files:**
- Modify: `apps/web/src/app/pages/CharacterPage.tsx`

**Step 1: Write the failing test**

If a focused UI test is practical, add one. Otherwise rely on the presentation helper test and manual layout verification for this repo.

**Step 2: Run test to verify it fails**

Run the focused test if added, or verify the current page still places preparation rules too low in the hierarchy.

**Step 3: Write minimal implementation**

Use existing preparation data plus the new helper to render an always-visible rules strip near the active character cue. Replace the old summary chips if they no longer support the task.

**Step 4: Run test to verify it passes**

Verify locally that list name, used count, limit, and max spell level are visible without opening the lower reference area.

**Step 5: Commit**

```bash
git add apps/web/src/app/pages/CharacterPage.tsx
git commit -m "feat: surface character preparation rules near cue"
```

### Task 3: Replace prepared spell cards with dense verification rows

**Files:**
- Modify: `apps/web/src/app/pages/CharacterPage.tsx`

**Step 1: Write the failing test**

Add the smallest focused testable assertion available, or use careful manual verification if this repo does not support efficient component rendering tests.

**Step 2: Run test to verify it fails**

Run the focused test if added, or confirm the current page still renders spell cards instead of a dense list.

**Step 3: Write minimal implementation**

Refactor `Current Prepared` into a denser row-based layout that prioritizes:

- spell name
- assigned list
- level
- always-prepared state
- compact row actions

Remove secondary metadata that makes each spell visually heavy.

**Step 4: Run test to verify it passes**

Verify locally that the prepared area reads like a checklist and fits significantly more rows on screen.

**Step 5: Commit**

```bash
git add apps/web/src/app/pages/CharacterPage.tsx
git commit -m "feat: convert character prepared spells to dense rows"
```

### Task 4: Simplify the rare-edit area

**Files:**
- Modify: `apps/web/src/app/pages/CharacterPage.tsx`

**Step 1: Write the failing test**

Add the smallest focused assertion available, or note the manual verification target if UI testing is not practical here.

**Step 2: Run test to verify it fails**

Run the focused test if added, or confirm the current page still duplicates preparation rules in the bottom section.

**Step 3: Write minimal implementation**

Remove preparation rules from the bottom rare-edit area and keep only low-frequency tools there:

- profile details
- always prepared

Make the section read clearly as occasional editing rather than primary reference.

**Step 4: Run test to verify it passes**

Verify locally that the bottom area feels quieter and no longer competes with the main verification flow.

**Step 5: Commit**

```bash
git add apps/web/src/app/pages/CharacterPage.tsx
git commit -m "feat: simplify character rare-edit sections"
```

### Task 5: Final polish and verification

**Files:**
- Modify: `apps/web/src/app/pages/CharacterPage.tsx`
- Modify: `apps/web/src/app/__tests__/character-presentation.test.ts`
- Modify: `apps/web/src/app/pages/characterPresentation.ts`

**Step 1: Write the failing test**

Only add another focused test if a small presentation helper refinement needs explicit coverage.

**Step 2: Run test to verify it fails**

Run the focused test only if added.

**Step 3: Write minimal implementation**

Polish spacing, density, and mobile behavior so the verification flow remains readable on narrow screens.

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
git commit -m "feat: finish character quick verification flow"
```
