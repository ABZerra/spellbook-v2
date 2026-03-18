# Character Editorial Prepared List Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Flatten the Character page's prepared section into a spellbook-style verification list with low-noise actions and on-demand reassignment.

**Architecture:** Keep the current Character-page data flow, grouping, and drawer behavior, but simplify the prepared-list presentation. The main work lives in `CharacterPage.tsx`: remove boxed level groups, render typographic level headers, turn rows into open list lines, and replace the always-visible reassignment select with row-scoped disclosure state. Only add helper/test changes if a small pure formatter is needed to keep the component readable.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, Tailwind utility classes

---

### Task 1: Add a focused test for any new prepared-row presentation helper

**Files:**
- Modify: `apps/web/src/app/__tests__/character-presentation.test.ts`
- Modify: `apps/web/src/app/pages/characterPresentation.ts`

**Step 1: Write the failing test**

Add one minimal test only if a new pure helper is introduced for this pass. A good target would be a helper that formats the quiet row metadata or normalizes row display text for `assignedList` and `Always`.

Example:

```ts
it('formats quiet prepared row metadata', () => {
  expect(formatPreparedRowMeta({ assignedList: 'Wizard', mode: 'always' })).toBe('Wizard · Always');
  expect(formatPreparedRowMeta({ assignedList: 'Cleric', mode: 'normal' })).toBe('Cleric');
});
```

**Step 2: Run test to verify it fails**

Run: `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run test --prefix apps/web -- character-presentation.test.ts`

Expected: FAIL because the new helper does not exist yet.

**Step 3: Write minimal implementation**

Add the smallest helper needed to satisfy the test. Skip this task entirely if the component update stays readable without a new pure function.

**Step 4: Run test to verify it passes**

Run: `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run test --prefix apps/web -- character-presentation.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/app/__tests__/character-presentation.test.ts apps/web/src/app/pages/characterPresentation.ts
git commit -m "test: cover character prepared row presentation"
```

### Task 2: Flatten level groups into editorial sections

**Files:**
- Modify: `apps/web/src/app/pages/CharacterPage.tsx`

**Step 1: Write the failing test**

If Task 1 added a helper, stop after the helper test and use manual verification for this layout-only change. Otherwise, document the current failure as the UI still rendering boxed level groups and bordered rows.

**Step 2: Run test to verify it fails**

Run the focused helper test if one exists, or verify locally that the current UI still uses:

- rounded level containers
- section header bars
- boxed row separators

**Step 3: Write minimal implementation**

Update `Current Prepared` so it renders:

- one parent prepared section
- plain level headings such as `Cantrips` and `Level 1`
- one thin divider under each heading
- open spell rows beneath with no level-card background

Remove the boxed empty state styling if it now feels too component-like inside the flatter list.

**Step 4: Run test to verify it passes**

Verify locally that `Current Prepared` now reads as one continuous list instead of stacked modules.

**Step 5: Commit**

```bash
git add apps/web/src/app/pages/CharacterPage.tsx
git commit -m "feat: flatten prepared levels into editorial sections"
```

### Task 3: Make prepared rows read like list lines, not table rows

**Files:**
- Modify: `apps/web/src/app/pages/CharacterPage.tsx`

**Step 1: Write the failing test**

If Task 1 introduced a pure helper, add one more focused failing case there for the final row text. Otherwise, document the current UI issue: spell rows still present permanent action controls and column-like alignment.

**Step 2: Run test to verify it fails**

Run the focused helper test if applicable, or verify manually that:

- the assigned-list select is always visible when multiple lists are valid
- `Remove` still looks like a boxed button
- `Always` still reads like a badge instead of inline metadata

**Step 3: Write minimal implementation**

Refactor each row so the default reading order is:

1. clickable spell name
2. quiet assigned-list label
3. optional inline `Always`
4. subdued `Remove` text action

Reduce visual borders and button chrome. Keep the list readable on mobile, but do not return to card blocks.

**Step 4: Run test to verify it passes**

Verify locally that rows feel like lines in a spellbook index rather than a spreadsheet.

**Step 5: Commit**

```bash
git add apps/web/src/app/pages/CharacterPage.tsx apps/web/src/app/__tests__/character-presentation.test.ts apps/web/src/app/pages/characterPresentation.ts
git commit -m "feat: simplify prepared rows into spellbook list lines"
```

### Task 4: Move list reassignment to on-demand editing

**Files:**
- Modify: `apps/web/src/app/pages/CharacterPage.tsx`

**Step 1: Write the failing test**

Add a focused helper test only if row-edit state logic gets extracted. Otherwise, document the current failure as permanent visible selects competing with the verification flow.

**Step 2: Run test to verify it fails**

Verify the current prepared rows still show reassignment controls by default for multi-list spells.

**Step 3: Write minimal implementation**

Introduce row-scoped UI state in `CharacterPage.tsx` so:

- the assigned list is plain text by default
- clicking that label opens an inline select for that row
- changing the selection calls the existing `reassignPreparedSpell(...)`
- closing or completing the change returns the row to read mode

Keep this state local and small. Only one row needs to be editable at a time.

**Step 4: Run test to verify it passes**

Verify locally that reassignment is still available but no longer dominates the prepared list.

**Step 5: Commit**

```bash
git add apps/web/src/app/pages/CharacterPage.tsx
git commit -m "feat: make prepared list reassignment on demand"
```

### Task 5: Trim section chrome and verify the page

**Files:**
- Modify: `apps/web/src/app/pages/CharacterPage.tsx`
- Optionally Modify: `apps/web/src/app/components/SpellDetailDrawer.tsx`

**Step 1: Write the failing test**

Only add another focused test if a new pure helper was added during implementation and still needs explicit coverage.

**Step 2: Run test to verify it fails**

Run that focused test if added. Otherwise, verify the current page still includes extra explanatory copy or styling that weakens the editorial-list feel.

**Step 3: Write minimal implementation**

Trim the `Current Prepared` header so the title does the work. Remove the descriptive subtitle first, then keep or refine the spell count based on the flatter layout. Make any final drawer or spacing adjustments needed so the page feels cohesive.

**Step 4: Run test to verify it passes**

Run:

```bash
PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run test --prefix apps/web
PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run build --prefix apps/web
```

Expected: all tests pass and the web build succeeds.

**Step 5: Commit**

```bash
git add apps/web/src/app/pages/CharacterPage.tsx apps/web/src/app/components/SpellDetailDrawer.tsx apps/web/src/app/__tests__/character-presentation.test.ts apps/web/src/app/pages/characterPresentation.ts
git commit -m "feat: finish editorial prepared list refinement"
```
