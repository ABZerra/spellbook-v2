# Character Verification List Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refine the Character page into a tighter spellbook-style verification flow with editable top rules, a grouped prepared list, integrated profile pills, and contextual spell details.

**Architecture:** Keep the Character page’s existing data mutations but reshape the presentation. Integrate profile switching into the review header, add compact inline editing for visible preparation rules, turn the prepared section into grouped list entries sorted by level then name, and open spell details in a right-side drawer from the prepared list.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, Tailwind utility classes

---

### Task 1: Extend presentation helpers for the new verification model

**Files:**
- Modify: `apps/web/src/app/__tests__/character-presentation.test.ts`
- Modify: `apps/web/src/app/pages/characterPresentation.ts`

**Step 1: Write the failing test**

Add the smallest focused test for any new helper output required by this pass, such as normalized rule editing data or grouped/sorted prepared list presentation.

**Step 2: Run test to verify it fails**

Run: `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run test --prefix apps/web -- character-presentation.test.ts`
Expected: FAIL with the missing helper or wrong output.

**Step 3: Write minimal implementation**

Add the minimal helper changes needed to support the new header/rules/list presentation.

**Step 4: Run test to verify it passes**

Run: `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run test --prefix apps/web -- character-presentation.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/app/__tests__/character-presentation.test.ts apps/web/src/app/pages/characterPresentation.ts
git commit -m "test: extend character verification presentation helpers"
```

### Task 2: Unify the review header and editable rules

**Files:**
- Modify: `apps/web/src/app/pages/CharacterPage.tsx`

**Step 1: Write the failing test**

Add the smallest focused assertion available if practical; otherwise rely on the presentation helper test and manual layout verification.

**Step 2: Run test to verify it fails**

Run the focused test if added, or confirm the current page still separates profiles from the review header and keeps top rules non-editable.

**Step 3: Write minimal implementation**

Move the profile pills into the review header and make the visible preparation rules editable in place without pushing users back into the lower section.

**Step 4: Run test to verify it passes**

Verify locally that profile switching, character creation, and rule editing all work in the new top layout.

**Step 5: Commit**

```bash
git add apps/web/src/app/pages/CharacterPage.tsx
git commit -m "feat: unify character review header and editable rules"
```

### Task 3: Convert Current Prepared into a grouped spell list

**Files:**
- Modify: `apps/web/src/app/pages/CharacterPage.tsx`

**Step 1: Write the failing test**

Add the smallest focused testable assertion available, or document the manual verification target if UI tests are not practical here.

**Step 2: Run test to verify it fails**

Run the focused test if added, or confirm the current prepared section still feels row-grid/spreadsheet-like.

**Step 3: Write minimal implementation**

Refactor the prepared list into grouped level sections sorted by:

1. level
2. name

Make spell names clickable, simplify row metadata, and keep remove/reassign actions compact.

**Step 4: Run test to verify it passes**

Verify locally that the list feels like a spellbook index rather than an admin table.

**Step 5: Commit**

```bash
git add apps/web/src/app/pages/CharacterPage.tsx
git commit -m "feat: group prepared spells into verification list"
```

### Task 4: Simplify Add Always Prepared and open spell details in a drawer

**Files:**
- Modify: `apps/web/src/app/pages/CharacterPage.tsx`
- Create or Modify: `apps/web/src/app/components/SpellDetailDrawer.tsx`
- Optionally Modify: `apps/web/src/app/components/PreparedDrawer.tsx`

**Step 1: Write the failing test**

Add the smallest focused test or helper assertion if practical; otherwise use careful manual verification for this repo.

**Step 2: Run test to verify it fails**

Run the focused test if added, or confirm the current page still uses the heavier always-prepared structure and does not open spell details from list clicks.

**Step 3: Write minimal implementation**

Simplify the bottom always-prepared tool to title + search-first behavior, and add a right-side spell detail drawer opened from prepared-list spell names.

**Step 4: Run test to verify it passes**

Verify locally that clicking a spell name opens the drawer and that always-prepared search feels lighter.

**Step 5: Commit**

```bash
git add apps/web/src/app/pages/CharacterPage.tsx apps/web/src/app/components/SpellDetailDrawer.tsx
git commit -m "feat: simplify always prepared and add spell detail drawer"
```

### Task 5: Final polish and verification

**Files:**
- Modify: `apps/web/src/app/pages/CharacterPage.tsx`
- Modify: `apps/web/src/app/__tests__/character-presentation.test.ts`
- Modify: `apps/web/src/app/pages/characterPresentation.ts`
- Modify: `apps/web/src/app/components/SpellDetailDrawer.tsx`

**Step 1: Write the failing test**

Only add another focused test if a small helper refinement needs explicit coverage.

**Step 2: Run test to verify it fails**

Run the focused test only if added.

**Step 3: Write minimal implementation**

Polish spacing, disclosure defaults, mobile behavior, and drawer rhythm so the page reads as one coherent review surface.

**Step 4: Run test to verify it passes**

Run:

```bash
PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run test --prefix apps/web
PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run build --prefix apps/web
```

Expected: all tests pass and the Vite build succeeds.

**Step 5: Commit**

```bash
git add apps/web/src/app/pages/CharacterPage.tsx apps/web/src/app/__tests__/character-presentation.test.ts apps/web/src/app/pages/characterPresentation.ts apps/web/src/app/components/SpellDetailDrawer.tsx
git commit -m "feat: finish character verification list polish"
```
