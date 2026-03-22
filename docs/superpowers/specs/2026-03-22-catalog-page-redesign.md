# Catalog Page Redesign

Improve the Browse (now Catalog) page UI by consolidating controls, making spell cards directly interactive, and surfacing spell status on action buttons.

## Scope

**In scope:**
- Rename page and nav to "Catalog"
- Character-based filter toggle replacing "All / Best Fits / Fits Now"
- Move "Showing X of Y" pill under search bar
- Dismissible active filter/sort pills
- Clickable spell cards (whole row opens detail modal)
- Status labels on action buttons (5 states)
- Ritual and Concentration tags on spell cards

**Deferred:**
- Advanced filter adaptability (boolean vs asc/desc for different fields)
- Editable fields with role-based permissions (super admin vs normal user)

## Changes

### 1. Rename to "Catalog"

- Navigation button label: "Browse" → "Catalog"
- Route stays `/catalog` (unchanged)
- Remove the "CATALOG" uppercase label text from the header section (line 157 of CatalogPage)
- Page title "Browse The Spell Shelf" stays as-is

**Files:** `AppShell.tsx` (nav label)

### 2. Character filter toggle

Replace the three-button group ("All" / "Best Fits" / "Fits Now") with a single toggle button showing the active character name.

**Behavior:**
- **Toggle ON:** Filter spells to only those where `isSpellEligibleForCharacter` returns true AND the spell level is within `getAddableAssignmentLists` (i.e., both list-eligible and level-appropriate). This combines the old "Fits Now" with level checking.
- **Toggle OFF:** Show all spells (equivalent to "All" mode today).
- Button displays character name (e.g., "Sazel Testing") with an accent/purple style when active, neutral style when inactive.
- Clicking the ✕ on the pill or clicking the button again toggles it off.

**Data flow:**
- `viewMode` preference simplifies from `'all' | 'eligible_first' | 'eligible_only'` to `'all' | 'character_filtered'`.
- `'character_filtered'` applies both `isSpellEligibleForCharacter` and `getAddableAssignmentLists.length > 0` checks.
- `'eligible_first'` sort priority is removed (no more "Best Fits" partial sort).

**Files:** `CatalogPage.tsx`, `catalogViewModel.ts`

### 3. Move "Showing X of Y" pill

- Remove the "Showing X of Y" pill from its current position next to the "CATALOG" label.
- Place it under the search bar as the first item in the info row, before "Search matches", "Eligible on screen", and "Queued" pills.
- Keep current pill styling (rounded-full, border, uppercase, 11px).

**Files:** `CatalogPage.tsx`

### 4. Dismissible active filter/sort pills

Add a row of pills below the info row showing all active criteria. Each pill is individually dismissible (✕ button). "Reset View" clears all.

**Pills shown when active:**
- **Character filter:** "Character: {name}" — purple accent style, dismissible (toggles character filter off)
- **Sort:** "Sort: {column} {↑/↓}" — shown when sort is not the default (Spell Name Asc). Dismissible (resets sort to default).
- **Search:** "Search: "{query}"" — shown when search input is non-empty. Dismissible (clears search).

**When no active filters/sorts exist beyond defaults, the row is hidden.**

**Files:** `CatalogPage.tsx`

### 5. Clickable spell cards

- Make the entire `<article>` element clickable — clicking anywhere on the card opens the spell detail modal via `setSelectedSpellId(spell.id)`.
- Exception: the action button (Queue/Remove/etc.) handles its own click with `event.stopPropagation()` and does not open the modal.
- Remove the "Details" button entirely.
- Add `cursor: pointer` to the card.
- Hover state already exists (`hover:border-gold-soft/40 hover:bg-bg-1`) — keep it.
- Remove the current `<button>` wrapper around the spell name (it's no longer the click target — the card is).

**Files:** `CatalogPage.tsx`

### 6. Action button states

Consolidate the state label pill and action button into a single button. The button label communicates the spell's status and what clicking it does.

| State | Condition | Button Label | Style | Clickable | Action |
|-------|-----------|-------------|-------|-----------|--------|
| Available | Eligible + level OK + not queued + not prepared | `Queue` | Cream (moon-paper/moon-ink) | Yes | Queue spell |
| Queued | In `nextPreparationQueue` | `Queued ✓` | Gold border + gold bg | Yes | Remove from queue |
| Prepared | In `preparedSpellIds` + not queued | `Prepared · Queue` | Purple accent border + bg | Yes | Queue spell |
| Off-list | Not on character's `availableLists` | `Off-list` | Dimmed, dark bg | No | — |
| Too High | On list but `getAddableAssignmentLists` empty | `Too High` | Dimmed, dark bg | No | — |

- Remove the separate state label pill from the spell tags row (the `presentation.stateLabel` span).
- The action button now carries both the status info and the interaction.
- Off-list and Too High cards get a dimmed appearance (reduced opacity on the card).

**Files:** `CatalogPage.tsx`, `catalogPresentation.ts`

### 7. Ritual and Concentration tags

Add pill tags for Ritual and Concentration spells in the spell tags row (alongside Level and List pills).

**Detection:** Check `spell.spellTags` array for entries containing "Ritual" or "Concentration" (case-insensitive match).

**Styling:**
- **Ritual:** Teal — border `rgba(68,170,153,0.5)`, bg `rgba(68,170,153,0.12)`, text `#6cc`
- **Concentration:** Amber — border `rgba(200,160,64,0.5)`, bg `rgba(200,160,64,0.1)`, text `#d4b060`

**Placement:** After the Level and List pills, before any other tags.

**Files:** `CatalogPage.tsx`

## Component changes summary

| File | Changes |
|------|---------|
| `AppShell.tsx` | Nav label "Browse" → "Catalog" |
| `CatalogPage.tsx` | All UI changes (sections 1-7) |
| `catalogPresentation.ts` | Update `getCatalogRowPresentation` to return combined button labels |
| `catalogViewModel.ts` | Simplify `viewMode` type, update `buildCatalogRows` filter logic |

## Data model

No changes to `SpellRecord`, `CharacterProfile`, or persistence. All changes are presentation-layer only.

`CatalogPreferences.viewMode` changes from `'all' | 'eligible_first' | 'eligible_only'` to `'all' | 'character_filtered'`. Existing persisted preferences with old values should fall back to `'all'` via `sanitizeCatalogPreferences`.
