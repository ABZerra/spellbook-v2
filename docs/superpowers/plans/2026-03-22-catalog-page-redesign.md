# Catalog Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Catalog page controls, spell cards, and action buttons to be more intuitive and consolidated.

**Architecture:** Presentation-layer changes only across 4 files. The view model (`catalogViewModel.ts`) gets a simplified `viewMode` type and updated filter logic. The presentation layer (`catalogPresentation.ts`) gets updated button labels. The page component (`CatalogPage.tsx`) gets the bulk of UI changes. The shell (`AppShell.tsx`) gets a nav label rename.

**Tech Stack:** React 18, TypeScript, Tailwind CSS 4, Vitest

**Spec:** `docs/superpowers/specs/2026-03-22-catalog-page-redesign.md`

**Test runner:** `cd apps/web && npx vitest run`

**Dev server:** Already running via `preview_start` (serverId in session). Use `preview_screenshot` to verify visual changes.

---

### Task 1: Update catalogViewModel — simplify viewMode and fix defaults

**Files:**
- Modify: `apps/web/src/app/pages/catalogViewModel.ts`
- Test: `apps/web/src/app/__tests__/catalog-view-model.test.ts`

**Context:** The `CatalogViewMode` type currently has three values: `'all' | 'eligible_first' | 'eligible_only'`. We're replacing this with `'all' | 'character_filtered'`. The `'character_filtered'` mode filters to spells where `isSpellEligibleForCharacter` returns true AND `getAddableAssignmentLists` returns a non-empty array. The `'eligible_first'` priority sort is removed.

- [ ] **Step 1: Update tests for new viewMode**

Replace tests that reference `'eligible_first'` and `'eligible_only'` with `'character_filtered'` equivalents. Update the default preferences test expectation.

In `apps/web/src/app/__tests__/catalog-view-model.test.ts`:

1. Change the test `'filters to eligible spells in eligible-only mode'` — rename to `'filters to character-eligible spells in character_filtered mode'`. Change `viewMode: 'eligible_only'` to `viewMode: 'character_filtered'`. The expected result changes: `character_filtered` checks BOTH `isSpellEligibleForCharacter` AND `getAddableAssignmentLists.length > 0`. With the test fixture's `activeCharacter` having `maxSpellLevel: 9` and `availableLists: ['Wizard']`, all Wizard spells pass both checks. Expected IDs remain: `['acid-arrow', 'magic-missile', 'shield']`.

2. Change the test `'returns no rows when eligible-only mode has no eligible matches'` — update `viewMode: 'eligible_only'` to `viewMode: 'character_filtered'`.

3. Change the test `'ranks eligible spells ahead of ineligible spells in eligible-first mode'` — this behavior is being removed. Replace with a test that verifies `'character_filtered'` excludes ineligible spells entirely (same as test 1 but with the full spell set to confirm `bless` is excluded).

4. Change the test `'restores valid persisted preferences'` — update from `'eligible_only'` to `'character_filtered'`.

5. Change the test `'resets sorting without changing the selected view mode'` — this test verifies `resetCatalogSort` preserves viewMode. But the new `resetCatalogSort` SHOULD reset viewMode to `'all'`. Update the test: input `viewMode: 'character_filtered'`, expect output `viewMode: 'all'`.

6. Change the test `'treats all spells as eligible when there is no active character'` — update `viewMode: 'eligible_only'` to `viewMode: 'character_filtered'`. When `activeCharacter` is null, `character_filtered` should behave like `'all'` (all spells shown, all eligible).

7. Update the default preferences test `'falls back to default preferences for invalid stored payloads'` — the default will now return `viewMode: 'all'` instead of `'eligible_first'`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/web && npx vitest run src/app/__tests__/catalog-view-model.test.ts`
Expected: Multiple failures because the source code still has old types/logic.

- [ ] **Step 3: Update catalogViewModel.ts**

In `apps/web/src/app/pages/catalogViewModel.ts`:

1. Change `CatalogViewMode` type (line 4):
```typescript
export type CatalogViewMode = 'all' | 'character_filtered';
```

2. Change `VALID_VIEW_MODES` (line 41):
```typescript
const VALID_VIEW_MODES: CatalogViewMode[] = ['all', 'character_filtered'];
```

3. Change `getDefaultCatalogPreferences` (line 46-51) — return `viewMode: 'all'`:
```typescript
export function getDefaultCatalogPreferences(): CatalogPreferences {
  return {
    viewMode: 'all',
    sortKey: 'name',
    sortDirection: 'asc',
  };
}
```

4. Change `resetCatalogSort` (line 53-59) — also reset viewMode:
```typescript
export function resetCatalogSort(preferences: CatalogPreferences): CatalogPreferences {
  return {
    ...preferences,
    viewMode: 'all',
    sortKey: 'name',
    sortDirection: 'asc',
  };
}
```

5. Remove `eligible_first` sort priority in `compareRows` (line 136-138). Delete these lines:
```typescript
  if (preferences.viewMode === 'eligible_first' && left.eligible !== right.eligible) {
    return Number(right.eligible) - Number(left.eligible);
  }
```

6. Change filter logic in `buildCatalogRows` (line 181-183). The `character_filtered` mode needs to check both eligibility AND addable lists. Import `getAddableAssignmentLists` at the top. Update the filtering:
```typescript
  const filteredRows = input.preferences.viewMode === 'character_filtered' && input.activeCharacter
    ? rows.filter((row) => {
        if (!row.eligible) return false;
        const addable = getAddableAssignmentLists(row.spell, input.activeCharacter!);
        return addable.length > 0;
      })
    : rows;
```

Add `getAddableAssignmentLists` to the existing import at line 1 (which already imports `getSpellAssignmentList, getSpellLists, isSpellEligibleForCharacter`):
```typescript
import { getAddableAssignmentLists, getSpellAssignmentList, getSpellLists, isSpellEligibleForCharacter } from '../domain/character';
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/web && npx vitest run src/app/__tests__/catalog-view-model.test.ts`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/pages/catalogViewModel.ts apps/web/src/app/__tests__/catalog-view-model.test.ts
git commit -m "refactor: simplify viewMode to all/character_filtered"
```

---

### Task 2: Update catalogPresentation — combined button labels

**Files:**
- Modify: `apps/web/src/app/pages/catalogPresentation.ts`
- Test: `apps/web/src/app/__tests__/catalog-presentation.test.ts`

**Context:** The action button now carries both the status info and the interaction label. `stateLabel` is no longer shown separately — it's merged into `actionLabel`. The `stateLabel` field can be kept for card dimming logic but `actionLabel` changes.

- [ ] **Step 1: Update tests for new actionLabel values**

In `apps/web/src/app/__tests__/catalog-presentation.test.ts`:

1. Update the queued test: `actionLabel` changes from `'Remove'` to `'Queued ✓'`.

2. Update the off-list test: `actionLabel` changes from `'Unavailable'` to `'Off-list'`.

3. Update the too-high test: `actionLabel` changes from `'Blocked'` to `'Too High'`.

4. Add a new test for the prepared state:
```typescript
it('shows prepared spells as queueable with distinct label', () => {
  const result = getCatalogRowPresentation({
    row: {
      spell: { id: 'shield', name: 'Shield', level: 1, save: '', castingTime: '1 Reaction', notes: '' } as any,
      eligible: true,
      prepared: true,
      queued: false,
      displayList: 'WIZARD',
    },
    addableLists: ['WIZARD'],
  });

  expect(result.actionLabel).toBe('Prepared · Queue');
  expect(result.disabled).toBe(false);
});
```

5. Add a test confirming queued takes priority over prepared:
```typescript
it('shows queued label when spell is both prepared and queued', () => {
  const result = getCatalogRowPresentation({
    row: {
      spell: { id: 'shield', name: 'Shield', level: 1, save: '', castingTime: '1 Reaction', notes: '' } as any,
      eligible: true,
      prepared: true,
      queued: true,
      displayList: 'WIZARD',
    },
    addableLists: ['WIZARD'],
  });

  expect(result.actionLabel).toBe('Queued ✓');
  expect(result.disabled).toBe(false);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/web && npx vitest run src/app/__tests__/catalog-presentation.test.ts`
Expected: Failures on the updated actionLabel values.

- [ ] **Step 3: Update catalogPresentation.ts**

In `apps/web/src/app/pages/catalogPresentation.ts`, update `actionLabel` values:

1. Queued branch (line 22): `actionLabel: 'Remove'` → `actionLabel: 'Queued ✓'`
2. Off-list branch (line 31): `actionLabel: 'Unavailable'` → `actionLabel: 'Off-list'`
3. Too High branch (line 40): `actionLabel: 'Blocked'` → `actionLabel: 'Too High'`
4. Prepared branch (line 49): `actionLabel: 'Queue'` → `actionLabel: 'Prepared · Queue'`
5. Available branch (line 57): stays `actionLabel: 'Queue'` (no change)

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/web && npx vitest run src/app/__tests__/catalog-presentation.test.ts`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/pages/catalogPresentation.ts apps/web/src/app/__tests__/catalog-presentation.test.ts
git commit -m "refactor: update catalog button labels to carry status info"
```

---

### Task 3: Rename nav label and remove header label

**Files:**
- Modify: `apps/web/src/app/components/AppShell.tsx`
- Modify: `apps/web/src/app/pages/CatalogPage.tsx`

**Context:** Nav button says "Browse", change to "Catalog". In CatalogPage, the `<div className="flex flex-wrap items-center gap-3">` wrapper contains two children: the "Catalog" label `<p>` and the "Showing X of Y" `<span>`. Both are being relocated or removed, so delete the entire wrapper div.

- [ ] **Step 1: Update AppShell.tsx nav label**

In `apps/web/src/app/components/AppShell.tsx`, line 47: change `Browse` to `Catalog`.

- [ ] **Step 2: Remove header label wrapper in CatalogPage.tsx**

In `apps/web/src/app/pages/CatalogPage.tsx`, remove the entire `<div className="flex flex-wrap items-center gap-3">` block (lines 155-160) containing the "Catalog" `<p>` and the "Showing X of Y" `<span>`. The "Showing" pill will be re-added in Task 5.

- [ ] **Step 3: Verify visually**

Use `preview_screenshot` to confirm the nav says "Catalog" and the header no longer has the "CATALOG" label or "SHOWING" pill (they'll come back in a later task).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/components/AppShell.tsx apps/web/src/app/pages/CatalogPage.tsx
git commit -m "feat: rename nav to Catalog and remove header label"
```

---

### Task 4: Replace filter buttons with character toggle

**Files:**
- Modify: `apps/web/src/app/pages/CatalogPage.tsx`

**Context:** Replace the three-button group ("All" / "Best Fits" / "Fits Now") with a single toggle button showing the active character name. When toggled ON, `viewMode` is `'character_filtered'`. When OFF, `viewMode` is `'all'`. When no character is active, the toggle is hidden and viewMode is forced to `'all'`.

- [ ] **Step 1: Add viewMode force to 'all' when no character**

Add a `useEffect` in CatalogPage that forces `viewMode` to `'all'` when `activeCharacter` becomes null:

```typescript
useEffect(() => {
  if (!activeCharacter && preferences.viewMode === 'character_filtered') {
    setPreferences((current) => ({ ...current, viewMode: 'all' }));
  }
}, [activeCharacter, preferences.viewMode]);
```

- [ ] **Step 2: Replace the three-button group with character toggle**

In `CatalogPage.tsx`, find the block that renders the three view mode buttons (the `{activeCharacter ? (` block with `{[ { value: 'all', ...}, { value: 'eligible_first', ...}, { value: 'eligible_only', ...} ]}`). Replace it with:

```tsx
{activeCharacter ? (
  <button
    type="button"
    className={`rounded-full border px-4 py-2 text-sm transition-colors ${
      effectivePreferences.viewMode === 'character_filtered'
        ? 'border-accent-soft bg-accent-soft/25 text-text'
        : 'border-border-dark bg-bg text-text-muted hover:bg-bg-2 hover:text-text'
    }`}
    onClick={() => setPreferences((current) => ({
      ...current,
      viewMode: current.viewMode === 'character_filtered' ? 'all' : 'character_filtered',
    }))}
  >
    {effectivePreferences.viewMode === 'character_filtered'
      ? `${activeCharacter.name} ✕`
      : activeCharacter.name}
  </button>
) : null}
```

- [ ] **Step 3: Verify Reset View behavior**

The Reset View button's onClick already calls `resetCatalogSort` (which now resets viewMode from Task 1) AND `setSearch('')` (which clears the search). Both are in the same handler. No additional change needed — verify both work together.

- [ ] **Step 4: Update emptyStateMessage**

Change the empty state message logic. Replace the current check for `'eligible_only'`:

```typescript
const emptyStateMessage = effectivePreferences.viewMode === 'character_filtered' && searchMatchedRows.length > 0
  ? 'No spells match for this character and search.'
  : 'No spells match this search yet.';
```

- [ ] **Step 5: Verify visually**

Use `preview_screenshot` to confirm:
- Character toggle button appears with character name
- Clicking it filters the spell list
- Clicking again shows all spells

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/pages/CatalogPage.tsx
git commit -m "feat: replace filter buttons with character toggle"
```

---

### Task 5: Move "Showing X of Y" pill and add dismissible filter pills

**Files:**
- Modify: `apps/web/src/app/pages/CatalogPage.tsx`

**Context:** The "Showing X of Y" pill was removed in Task 3. Re-add it as the first item in the info row under the search bar. Then add a new row of dismissible pills showing active filter/sort criteria.

- [ ] **Step 1: Add "Showing X of Y" to the info row**

In the info row section (the `<div className="mt-4 flex flex-wrap gap-2 text-xs text-text-muted">` block), add the "Showing" pill as the first child:

```tsx
<span className="rounded-full border border-border-dark bg-bg px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-text-muted">
  Showing {rows.length} of {spells.length}
</span>
```

Make sure this info row is always visible (remove the `{activeCharacter ? (...) : null}` conditional wrapper if present). When no character is active, the "Eligible on screen" and "Queued" pills will show 0 — this is acceptable since the counts are still meaningful context.

- [ ] **Step 2: Add dismissible filter pills row**

After the info row, add a new conditionally-rendered row for active filter pills. Compute which pills to show:

```tsx
{(() => {
  const isCharFiltered = effectivePreferences.viewMode === 'character_filtered' && activeCharacter;
  const isNonDefaultSort = effectivePreferences.sortKey !== 'name' || effectivePreferences.sortDirection !== 'asc';
  const hasSearch = search.trim().length > 0;
  if (!isCharFiltered && !isNonDefaultSort && !hasSearch) return null;

  const sortLabel = SORTABLE_COLUMNS.find((c) => c.key === effectivePreferences.sortKey)?.label || effectivePreferences.sortKey;
  const sortArrow = effectivePreferences.sortDirection === 'asc' ? '↑' : '↓';

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {isCharFiltered ? (
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full border border-accent-soft bg-accent-soft/25 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-text transition-colors hover:border-blood-soft"
          onClick={() => setPreferences((current) => ({ ...current, viewMode: 'all' }))}
        >
          Character: {activeCharacter.name}
          <span className="text-[9px] opacity-50" aria-hidden="true">✕</span>
        </button>
      ) : null}
      {isNonDefaultSort ? (
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full border border-border-dark bg-bg px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-text-muted transition-colors hover:border-blood-soft"
          onClick={() => setPreferences((current) => ({ ...current, sortKey: 'name', sortDirection: 'asc' }))}
        >
          Sort: {sortLabel} {sortArrow}
          <span className="text-[9px] opacity-50" aria-hidden="true">✕</span>
        </button>
      ) : null}
      {hasSearch ? (
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full border border-border-dark bg-bg px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-text-muted transition-colors hover:border-blood-soft"
          onClick={() => setSearch('')}
        >
          Search: &ldquo;{search}&rdquo;
          <span className="text-[9px] opacity-50" aria-hidden="true">✕</span>
        </button>
      ) : null}
    </div>
  );
})()}
```

- [ ] **Step 3: Verify visually**

Use `preview_screenshot` to confirm:
- "Showing X of Y" pill appears under the search bar
- Setting a sort or search shows dismissible pills
- Clicking ✕ on a pill removes that filter
- "Reset View" clears all pills

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/pages/CatalogPage.tsx
git commit -m "feat: add showing pill and dismissible filter pills"
```

---

### Task 6: Make spell cards clickable and remove Details button

**Files:**
- Modify: `apps/web/src/app/pages/CatalogPage.tsx`

**Context:** The entire `<article>` element becomes clickable to open the detail modal. The "Details" button is removed. The spell name `<button>` wrapper is replaced with a plain element. The action button uses `stopPropagation` to prevent opening the modal when clicking it. Keyboard accessibility is added.

- [ ] **Step 1: Make article clickable with keyboard support**

On the `<article>` element, add:
```tsx
<article
  key={spell.id}
  role="button"
  tabIndex={0}
  aria-label={`View details for ${spell.name}`}
  className="cursor-pointer rounded-[1.45rem] border border-border-dark bg-bg-1/92 p-4 transition-colors hover:border-gold-soft/40 hover:bg-bg-1"
  onClick={() => setSelectedSpellId(spell.id)}
  onKeyDown={(event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setSelectedSpellId(spell.id);
    }
  }}
>
```

- [ ] **Step 2: Replace spell name button with plain text**

Replace the `<button>` wrapping the spell name with a semantic `<h3>` (appropriate for a heading within a card list):

```tsx
<h3 className="text-left font-display text-2xl text-text">
  {spell.name}
</h3>
```

- [ ] **Step 3: Add stopPropagation to the action button**

On the queue/action button's `onClick`, add `event.stopPropagation()` before the queue toggle:

```tsx
onClick={(event) => {
  event.stopPropagation();
  event.preventDefault();
  void onQueueToggle(spell.id);
}}
```

- [ ] **Step 4: Remove the "Details" button**

Delete the entire `<button>` element that renders "Details" (the one with `onClick={() => setSelectedSpellId(spell.id)}`).

- [ ] **Step 5: Verify visually and interactively**

Use `preview_screenshot` and `preview_click` to confirm:
- Clicking a spell card opens the detail modal
- Clicking the Queue button does NOT open the modal (it queues/unqueues)
- Cards have cursor:pointer on hover

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/pages/CatalogPage.tsx
git commit -m "feat: make spell cards clickable, remove Details button"
```

---

### Task 7: Update action button styles and remove state label pill

**Files:**
- Modify: `apps/web/src/app/pages/CatalogPage.tsx`

**Context:** The separate state label pill (Queued/Available/Off-list/etc.) in the spell tags row is removed. The action button now carries the status via its label (from Task 2) and has 5 distinct styles. Off-list and Too High cards get dimmed opacity.

- [ ] **Step 1: Remove the state label pill from spell tags**

In the spell tags `<div className="flex flex-wrap items-center gap-2">`, remove the `{activeCharacter ? (<span className={...}>{presentation.stateLabel}</span>) : null}` block entirely.

- [ ] **Step 2: Update action button styles for 5 states**

Replace the action button's className logic with distinct styles for each state:

```tsx
{activeCharacter ? (
  <button
    type="button"
    className={`rounded-2xl border px-4 py-3 text-sm transition-colors ${
      presentation.disabled
        ? 'cursor-not-allowed border-border-dark bg-bg text-text-dim opacity-55'
        : presentation.stateLabel === 'Queued'
          ? 'border-gold-soft bg-gold-soft/20 text-text hover:bg-gold-soft/30'
          : presentation.stateLabel === 'Prepared'
            ? 'border-accent-soft bg-accent-soft/25 text-text hover:bg-accent-soft/35'
            : 'border-moon-border bg-moon-paper text-moon-ink hover:opacity-92'
    }`}
    disabled={presentation.disabled}
    title={presentation.helperText}
    aria-label={presentation.helperText}
    onClick={(event) => {
      event.stopPropagation();
      event.preventDefault();
      void onQueueToggle(spell.id);
    }}
  >
    {presentation.actionLabel}
  </button>
) : null}
```

- [ ] **Step 3: Add dimmed opacity for Off-list and Too High cards**

On the `<article>` element, add conditional opacity:

```tsx
className={`cursor-pointer rounded-[1.45rem] border border-border-dark bg-bg-1/92 p-4 transition-colors hover:border-gold-soft/40 hover:bg-bg-1 ${
  presentation.disabled ? 'opacity-60' : ''
}`}
```

Note: `presentation.disabled` is true for both Off-list and Too High states.

- [ ] **Step 4: Verify visually**

Use `preview_screenshot` to confirm:
- No state label pills in the tags row
- Queue button is cream, Queued is gold, Prepared is purple, Off-list/Too High are dimmed
- Off-list and Too High cards have reduced opacity

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/pages/CatalogPage.tsx
git commit -m "feat: consolidate status into action button, dim unavailable cards"
```

---

### Task 8: Update spec with data correction

**Files:**
- Modify: `docs/superpowers/specs/2026-03-22-catalog-page-redesign.md`

**Context:** The spec says to detect Ritual/Concentration from `spell.spellTags`, but inspection of the actual snapshot data (`apps/web/public/spells.snapshot.json`) shows: Ritual is in `castingTime` (e.g., "1 Minute Ritual" — 37 spells) and Concentration is in `duration` (e.g., "Concentration 1 Minute" — 232 spells). The `spellTags` array contains values like "Damage", "Buff", "Control" — never "Ritual" or "Concentration".

- [ ] **Step 1: Update spec section 7**

Change the Detection paragraph from:
> Check `spell.spellTags` array for entries containing "Ritual" or "Concentration"

To:
> Ritual: check `spell.castingTime` for substring "Ritual" (case-insensitive). Concentration: check `spell.duration` starts with "Concentration" (case-insensitive).

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/2026-03-22-catalog-page-redesign.md
git commit -m "docs: correct ritual/concentration detection in spec"
```

---

### Task 9: Add Ritual and Concentration tags (detection corrected in Task 8)

**Files:**
- Modify: `apps/web/src/app/pages/CatalogPage.tsx`

**Context:** Add pill tags for Ritual and Concentration spells. **Important data note:** These are NOT in `spellTags`. Ritual is detected from `spell.castingTime` containing "Ritual" (e.g., "1 Minute Ritual"). Concentration is detected from `spell.duration` starting with "Concentration" (e.g., "Concentration 1 Minute").

- [ ] **Step 1: Add helper functions at the top of CatalogPage.tsx**

Add these detection functions near the existing helpers:

```typescript
function isRitualSpell(spell: SpellRecord): boolean {
  return (spell.castingTime || '').toLowerCase().includes('ritual');
}

function isConcentrationSpell(spell: SpellRecord): boolean {
  return (spell.duration || '').toLowerCase().startsWith('concentration');
}
```

Note: Import `SpellRecord` type if not already imported (it may come via the view model types).

- [ ] **Step 2: Add tag pills in the spell tags row**

In the spell tags `<div>`, after the Level and List `<span>` pills, add:

```tsx
{isRitualSpell(spell) ? (
  <span className="rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em]"
    style={{ borderColor: 'rgba(68,170,153,0.5)', background: 'rgba(68,170,153,0.12)', color: '#6cc' }}>
    Ritual
  </span>
) : null}
{isConcentrationSpell(spell) ? (
  <span className="rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em]"
    style={{ borderColor: 'rgba(200,160,64,0.5)', background: 'rgba(200,160,64,0.1)', color: '#d4b060' }}>
    Concentration
  </span>
) : null}
```

- [ ] **Step 3: Verify visually**

Use `preview_screenshot` to confirm:
- Ritual spells show a teal "RITUAL" tag
- Concentration spells show an amber "CONCENTRATION" tag
- Tags appear after Level and List pills

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/pages/CatalogPage.tsx
git commit -m "feat: add Ritual and Concentration tags to spell cards"
```

---

### Task 10: Run full test suite and verify

**Files:** None (verification only)

- [ ] **Step 1: Run full test suite**

Run: `cd apps/web && npx vitest run`
Expected: All tests pass.

- [ ] **Step 2: Full visual verification**

Use `preview_screenshot` to verify the complete redesigned page:
- Nav says "Catalog"
- No "CATALOG" label in header
- Character toggle button works
- "Showing X of Y" under search bar
- Filter pills appear and dismiss correctly
- Spell cards are clickable (no Details button)
- Action buttons show correct states
- Ritual/Concentration tags appear
- Off-list/Too High cards are dimmed

- [ ] **Step 3: Commit any remaining fixes**

If any issues found, fix and commit.

