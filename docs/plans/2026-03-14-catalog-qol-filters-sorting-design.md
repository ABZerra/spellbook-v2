# Catalog QOL Filters And Sorting Design

**Date:** 2026-03-14

## Summary

Add two quality-of-life improvements to the catalog:

- a character-aware browsing lens that can surface spells relevant to the active character
- sortable table columns with preferences that persist across page switches and full browser reloads

The goal is to make the catalog faster to scan without changing queueing rules, spell data, or the overall catalog-first workflow.

## Problem

The current catalog supports search, queue state, and detail inspection, but it does not help the user prioritize spells that match the active character's available lists. It also uses a fixed row order with no column sorting, which makes it harder to quickly answer common browsing questions such as:

- which eligible spells are available for this character right now
- which spells are already prepared or queued
- which spells should be grouped by level, save, or casting time

Because the catalog resets to its default presentation each time it mounts, even small browsing preferences require repeated manual effort.

## Goals

- Add a simple catalog view control tied to the active character.
- Support an `Eligible First` mode that keeps all spells visible while prioritizing eligible rows.
- Support an `Eligible Only` mode that hides ineligible rows.
- Make column headers sortable with ascending and descending order.
- Persist catalog preferences across route changes and browser reloads.
- Keep existing queueing, preparation, and spell-detail behavior unchanged.

## Non-Goals

- Persist catalog preferences to character data or across devices.
- Redesign the catalog layout beyond the necessary controls and sort affordances.
- Change spell eligibility rules.
- Change queue/apply logic or provider storage shape.

## User Experience

### Catalog View Modes

The catalog toolbar should include a compact `View` control next to search with three states:

- `All`
- `Eligible First`
- `Eligible Only`

Eligibility should continue to be derived from the active character's `availableLists` using the existing domain logic. `Eligible First` keeps all rows in the table but ranks eligible spells above ineligible ones before the active column sort is applied. `Eligible Only` filters the table down to eligible spells.

The default view mode should be `Eligible First`, since that best matches the main catalog workflow while still preserving broad browsing.

### Sorting

Each visible column header should be clickable and cycle through:

- ascending
- descending
- off, which returns to the default sort

Only one explicit column sort should be active at a time. Sorting should be available for visible columns, including row-status columns such as `Prepared` and `Next Preparation`. If the list column is hidden because the active character has only one available list, it should not participate in sort selection.

The default sort should be `Name` ascending. When multiple rows compare equally for a selected column, `Name` ascending should act as the stable tiebreaker so the table feels predictable.

### Empty States

If search removes all rows, the page should continue to show the existing empty-search message. If `Eligible Only` removes all rows, the empty state should make that cause explicit so the user understands that the active character lens, not search alone, is hiding results.

## State And Persistence

Catalog preferences should stay local to [`CatalogPage.tsx`](/Users/alvarobezerra/Documents/spellbook-v2-main/apps/web/src/app/pages/CatalogPage.tsx) and be stored in `localStorage` under a catalog-specific key.

The stored preference model should be small and UI-focused:

```ts
interface CatalogPreferences {
  viewMode: 'all' | 'eligible_first' | 'eligible_only';
  sortKey: CatalogSortKey;
  sortDirection: 'asc' | 'desc';
}
```

If stored data is missing, invalid, or incompatible, the page should silently fall back to:

- `viewMode = eligible_first`
- `sortKey = name`
- `sortDirection = asc`

This keeps the feature resilient without introducing migration work.

## Data Flow

The catalog rows should be built from a single derived pipeline:

1. start with all spells
2. annotate each spell with derived row flags such as `eligible`, `prepared`, and `queued`
3. apply search filtering
4. apply the selected view mode
5. apply sorting

This keeps row rendering simple and ensures filter and sort logic stays consistent across the page.

Eligibility should reuse `isSpellEligibleForCharacter`. Prepared and queued state should continue to derive from the active character's prepared spell IDs and next-preparation queue.

If there is no active character, the page should behave defensively by treating all spells as eligible and keeping the controls functional.

## Architecture Impact

### Catalog Page

Most of the change should live inside [`CatalogPage.tsx`](/Users/alvarobezerra/Documents/spellbook-v2-main/apps/web/src/app/pages/CatalogPage.tsx):

- local state for `search`
- local state for persisted `viewMode`
- local state for persisted sort selection
- derived row annotation and ordering
- header button affordances for sorting

The spell detail modal, queue buttons, and queue error handling should remain unchanged.

### Supporting Helpers

If the row-derivation logic becomes hard to read inline, it should be extracted into a small pure helper that accepts:

- spells
- active character
- search query
- view mode
- sort configuration

That helper can then return ordered rows ready for rendering. This is the preferred place to put comparison and persistence-fallback behavior because it is easy to unit test.

## Error Handling

- Invalid `localStorage` payloads should be ignored and replaced with defaults.
- Sorting should handle blank values consistently so fields such as `save`, `notes`, or `castingTime` do not produce unstable ordering.
- Filtering and sorting must never change queue eligibility rules or bypass existing disabled states.

## Testing Strategy

Add focused tests around the derived catalog behavior, preferably through a small pure helper rather than only page-level interaction tests.

Cover at least:

- `Eligible Only` hides ineligible spells
- `Eligible First` ranks eligible rows before ineligible rows without removing them
- sort toggles ascending, descending, and default reset correctly
- persisted preferences restore from storage
- invalid stored preferences fall back to defaults safely

Run the existing repository test suite with `npm test` after implementation.

## Risks

- Sorting logic can become noisy if all comparison rules live inline in the page component.
- Status-style columns such as `Prepared` and `Next Preparation` need explicit ordering rules so the results feel intuitive.
- Persisted UI preferences are browser-local, which may surprise users if they use multiple devices or browsers.

## Recommendation

Implement the feature as a catalog-local enhancement with browser persistence. This is the lightest change that improves day-to-day browsing, avoids unnecessary data-model work, and preserves the current character and provider architecture.
