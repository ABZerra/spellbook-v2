# Catalog QOL Filters And Sorting Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a character-aware catalog lens and persistent column sorting so the catalog is faster to browse without changing queueing behavior.

**Architecture:** Keep the feature local to the catalog surface. Extract the row derivation and preference parsing into a small pure helper module, then wire `CatalogPage` to that helper and persist the chosen view mode and sort state in browser `localStorage`.

**Tech Stack:** React 18, TypeScript, React Router, Vitest, browser `localStorage`

---

### Task 1: Add a pure catalog view-model helper

**Files:**
- Create: `apps/web/src/app/pages/catalogViewModel.ts`
- Test: `apps/web/src/app/__tests__/catalog-view-model.test.ts`

**Step 1: Write the failing test**

Create `apps/web/src/app/__tests__/catalog-view-model.test.ts` with focused unit tests for:

```ts
import { describe, expect, it } from 'vitest';
import { buildCatalogRows, getDefaultCatalogPreferences, readCatalogPreferences } from '../pages/catalogViewModel';

describe('catalog view model', () => {
  it('filters to eligible spells in eligible-only mode', () => {
    const rows = buildCatalogRows({
      spells: [
        { id: 'magic-missile', name: 'Magic Missile', notes: '', description: '', level: 1, save: '', castingTime: '1 Action', availableFor: ['Wizard (Legacy)'] },
        { id: 'bless', name: 'Bless', notes: '', description: '', level: 1, save: '', castingTime: '1 Action', availableFor: ['Cleric (Legacy)'] },
      ] as any,
      activeCharacter: { availableLists: ['Wizard'], preparedSpellIds: [], nextPreparationQueue: [] } as any,
      search: '',
      preferences: { viewMode: 'eligible_only', sortKey: 'name', sortDirection: 'asc' },
    });

    expect(rows.map((row) => row.spell.id)).toEqual(['magic-missile']);
  });
});
```

Add additional tests in the same file for:

- `eligible_first` ranking eligible rows above ineligible rows
- sorting by `level` ascending and descending
- sorting by `prepared` and `queued`
- invalid stored preferences falling back to defaults
- missing active character treating all rows as eligible

**Step 2: Run test to verify it fails**

Run: `npm run test --prefix apps/web -- catalog-view-model`

Expected: FAIL with module-not-found or missing export errors for `catalogViewModel`

**Step 3: Write minimal implementation**

Create `apps/web/src/app/pages/catalogViewModel.ts` with:

- a `CatalogViewMode` union:

```ts
export type CatalogViewMode = 'all' | 'eligible_first' | 'eligible_only';
```

- a `CatalogSortKey` union covering visible sortable columns:

```ts
export type CatalogSortKey =
  | 'prepared'
  | 'level'
  | 'name'
  | 'list'
  | 'save'
  | 'action'
  | 'notes'
  | 'queued';
```

- a `CatalogPreferences` type:

```ts
export interface CatalogPreferences {
  viewMode: CatalogViewMode;
  sortKey: CatalogSortKey;
  sortDirection: 'asc' | 'desc';
}
```

- `getDefaultCatalogPreferences()` returning:

```ts
{ viewMode: 'eligible_first', sortKey: 'name', sortDirection: 'asc' }
```

- `readCatalogPreferences(raw: string | null): CatalogPreferences` that:
  - parses JSON safely
  - validates `viewMode`, `sortKey`, and `sortDirection`
  - falls back to defaults for missing or invalid values

- `buildCatalogRows(...)` that:
  - annotates each spell with `eligible`, `prepared`, `queued`, and `displayList`
  - applies search over `name`, `notes`, and `description`
  - filters rows for `eligible_only`
  - ranks eligible rows first for `eligible_first`
  - sorts by the requested key with `name` ascending as the stable tiebreaker

Keep the helper independent of React and browser globals so it stays easy to test.

**Step 4: Run test to verify it passes**

Run: `npm run test --prefix apps/web -- catalog-view-model`

Expected: PASS for the new `catalog-view-model.test.ts` cases

**Step 5: Commit**

```bash
git add apps/web/src/app/pages/catalogViewModel.ts apps/web/src/app/__tests__/catalog-view-model.test.ts
git commit -m "test: add catalog view model coverage"
```

### Task 2: Persist catalog preferences and wire the derived rows into the page

**Files:**
- Modify: `apps/web/src/app/pages/CatalogPage.tsx`
- Modify: `apps/web/src/app/pages/catalogViewModel.ts`

**Step 1: Write the failing test**

Extend `apps/web/src/app/__tests__/catalog-view-model.test.ts` with a persistence-focused test:

```ts
it('restores persisted preferences when storage payload is valid', () => {
  const prefs = readCatalogPreferences(JSON.stringify({
    viewMode: 'eligible_only',
    sortKey: 'level',
    sortDirection: 'desc',
  }));

  expect(prefs).toEqual({
    viewMode: 'eligible_only',
    sortKey: 'level',
    sortDirection: 'desc',
  });
});
```

Then add a page-level smoke test only if needed. If the helper coverage already proves parsing and ordering, skip a page test to avoid unnecessary React test setup.

**Step 2: Run test to verify it fails**

Run: `npm run test --prefix apps/web -- catalog-view-model`

Expected: FAIL because persistence parsing or the requested sort behavior is not fully implemented yet

**Step 3: Write minimal implementation**

Update `apps/web/src/app/pages/CatalogPage.tsx` to:

- add a local constant such as:

```ts
const CATALOG_PREFERENCES_KEY = 'spellbook.catalogPreferences';
```

- initialize preferences from `localStorage` in the state initializer:

```ts
const [preferences, setPreferences] = useState(() => {
  if (typeof window === 'undefined') return getDefaultCatalogPreferences();
  return readCatalogPreferences(window.localStorage.getItem(CATALOG_PREFERENCES_KEY));
});
```

- persist updates with `useEffect`:

```ts
useEffect(() => {
  window.localStorage.setItem(CATALOG_PREFERENCES_KEY, JSON.stringify(preferences));
}, [preferences]);
```

- replace the current `rows` computation with `buildCatalogRows(...)`
- render a compact `View` control beside search with `All`, `Eligible First`, and `Eligible Only`
- make each sortable header a `<button>` that toggles:
  - same column: `asc -> desc -> default name asc`
  - new column: `asc`
- keep the queue button, selected spell modal, and error banner logic unchanged
- use the derived row metadata for:
  - prepared label
  - list display
  - queue state
  - ineligible disabled state

If the list column is hidden, do not offer sorting on it and do not leave `sortKey: 'list'` active; reset to default when needed.

**Step 4: Run test to verify it passes**

Run: `npm run test --prefix apps/web -- catalog-view-model`

Expected: PASS for the helper tests, including persisted preference parsing and sort behavior

**Step 5: Commit**

```bash
git add apps/web/src/app/pages/CatalogPage.tsx apps/web/src/app/pages/catalogViewModel.ts apps/web/src/app/__tests__/catalog-view-model.test.ts
git commit -m "feat: add catalog filters and sorting"
```

### Task 3: Polish empty states and hidden-column behavior

**Files:**
- Modify: `apps/web/src/app/pages/CatalogPage.tsx`
- Test: `apps/web/src/app/__tests__/catalog-view-model.test.ts`

**Step 1: Write the failing test**

Add tests for edge cases in `apps/web/src/app/__tests__/catalog-view-model.test.ts`:

- `eligible_only` with no matching eligible rows returns an empty array
- blank `save`, `notes`, and `castingTime` values still sort deterministically
- hidden list-column scenarios reset invalid `list` sorting back to the default sort

Use fixtures that mix blank strings and duplicate levels so the stable name tiebreaker is exercised.

**Step 2: Run test to verify it fails**

Run: `npm run test --prefix apps/web -- catalog-view-model`

Expected: FAIL on the new edge-case assertions

**Step 3: Write minimal implementation**

Update the helper and page to:

- normalize blank values before comparison
- keep `name` ascending as the final tiebreaker
- show a specific empty-state message when `preferences.viewMode === 'eligible_only'` and search is empty or still has zero eligible matches, for example:

```ts
'No spells match this character filter.'
```

- preserve the existing generic search empty state for all other no-results cases

**Step 4: Run test to verify it passes**

Run: `npm run test --prefix apps/web -- catalog-view-model`

Expected: PASS for the full helper suite, including empty-state and hidden-column edge cases

**Step 5: Commit**

```bash
git add apps/web/src/app/pages/CatalogPage.tsx apps/web/src/app/pages/catalogViewModel.ts apps/web/src/app/__tests__/catalog-view-model.test.ts
git commit -m "fix: polish catalog sorting edge cases"
```

### Task 4: Run full verification and capture the final state

**Files:**
- Modify: `docs/plans/2026-03-14-catalog-qol-filters-sorting.md` only if implementation discoveries require plan notes

**Step 1: Run the focused web tests**

Run: `npm run test --prefix apps/web -- catalog-view-model`

Expected: PASS

**Step 2: Run the full repository verification**

Run: `npm test`

Expected: PASS for:

- `npm run test:web`
- `npm run test:extension`
- `npm run test:docs`

**Step 3: Review the diff**

Run: `git diff --stat HEAD~3..HEAD`

Expected: only the catalog page, helper, and test files from this feature

**Step 4: Commit any final cleanups**

```bash
git add apps/web/src/app/pages/CatalogPage.tsx apps/web/src/app/pages/catalogViewModel.ts apps/web/src/app/__tests__/catalog-view-model.test.ts
git commit -m "chore: verify catalog qol feature"
```

Skip this commit if no files changed after verification.

**Step 5: Prepare handoff notes**

Document in the final handoff:

- the persisted storage key
- the default view and sort behavior
- any edge cases intentionally deferred
