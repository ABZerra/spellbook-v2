# Character Prepared Management Design

**Date:** 2026-03-14

## Summary

Expand character management so users can review and correct the current prepared list directly on the Character page, mark spells as always prepared, and configure per-list maximum spell levels for new additions. The app should keep explicit assigned-list ownership for every prepared spell and treat always-prepared entries as visible current prepared spells that never consume preparation capacity.

## Problem

The app now supports explicit spell-list assignment on prepared spells, but the Character page still focuses only on basic profile fields and per-list preparation limits. It does not let users:

- inspect the current prepared list from the Character page
- correct a prepared spell's assigned list directly
- remove a prepared spell directly when data is wrong
- manage always-prepared spells as long-lived character configuration
- gate queueing and new additions by a per-list maximum spell level

Those gaps force users into the Prepare page for correction flows and make ongoing character setup incomplete.

## Goals

- Show the current prepared list on the Character page.
- Let users remove a prepared spell directly from that list.
- Let users reassign the prepared spell's allocated list when the spell is valid on multiple owned lists.
- Support always-prepared spells as part of the same prepared collection with a visible badge.
- Exclude always-prepared spells from preparation-limit counting.
- Add a per-list maximum spell level that blocks only new additions and queueing.
- Preserve existing prepared spells if the per-list max level is lowered later.

## Non-Goals

- Redesign the entire Character page layout.
- Remove existing prepared spells automatically when list rules become more strict.
- Change extension payload versioning or add server-side migrations.

## User Experience

### Character Configuration

For each available spell list, the Character page should show two editable values:

- preparation limit
- maximum spell level for new additions on that list

The maximum spell level applies only when adding new prepared or always-prepared entries and when queueing from Catalog or Prepare. It does not force cleanup of existing entries when reduced later.

### Current Prepared List On Character

The Character page should display the current prepared list directly, mixed into one visible list rather than split into separate sections. Each row should show:

- spell name
- assigned list
- spell level
- a badge when the entry is always prepared

Each row should support correction actions:

- `Change List` if the spell is valid on more than one owned list
- `Remove` to delete that prepared entry directly

These actions are intended for error recovery and direct character maintenance.

### Always Prepared Spells

Always-prepared spells should be added from the Character page through a lightweight add flow:

- search for a spell
- choose the assigned list when needed
- add the prepared entry with mode `always`

Always-prepared entries should appear in the mixed prepared list with an `Always Prepared` badge. They still require valid assigned lists and still respect the per-list max spell level for new additions, but they count as `0` toward preparation limits.

## Data Model

### Prepared Entries

Extend prepared spell entries to include mode:

```ts
interface PreparedSpellEntry {
  spellId: string;
  assignedList: string;
  mode: 'normal' | 'always';
}
```

The character keeps one mixed collection:

```ts
preparedSpells: PreparedSpellEntry[]
```

This keeps list ownership, badges, duplicate warnings, sync diffing, and direct editing in one consistent model.

### Per-List Rules

Extend per-list configuration to include a forward-looking spell-level cap:

```ts
interface PreparationLimit {
  list: string;
  limit: number;
  maxSpellLevel?: number;
}
```

If older profiles do not have `maxSpellLevel`, normalization should provide a permissive default such as `9`.

## Domain Rules

### Preparation Limit Counting

Only prepared entries with:

- `mode === 'normal'`
- spell level greater than `0`

count toward the per-list preparation cap.

Always-prepared entries never count toward the cap, regardless of spell level.

### Max Spell Level Enforcement

Per-list max spell level is enforced only for new additions:

- queueing a new spell
- adding an always-prepared spell
- any direct future “add prepared spell” action

It is not enforced retroactively on entries that already exist. Lowering a max spell level later should not remove or invalidate current prepared or always-prepared spells.

### Prepared Entry Corrections

Prepared entries can be corrected directly on Character:

- `Change List` updates `assignedList` when the spell is valid on the target list
- `Remove` deletes only that prepared entry

These actions should not require queue/apply flow because they are maintenance operations for the local character state.

### Duplicate Handling

Duplicate warnings should remain non-blocking. The warning logic should continue to evaluate the mixed prepared collection, regardless of whether duplicates come from normal or always-prepared entries.

## Migration Strategy

No separate migration script is required. During profile normalization:

- existing prepared entries without `mode` should default to `normal`
- existing `PreparationLimit` entries without `maxSpellLevel` should default to `9`

This preserves backward compatibility while unlocking the richer character configuration model.

## Architecture Impact

### Types And Normalization

Character types and normalization become the compatibility boundary for:

- prepared entry `mode`
- per-list `maxSpellLevel`

Legacy records should load into the richer shape without user intervention.

### Character Domain

The character domain should expose helpers to:

- compute preparation usage excluding cantrips and always-prepared entries
- validate whether a spell can be newly added to a given list under the max spell level
- update or remove prepared entries safely
- derive warnings for duplicate prepared spells

### Character Page

The Character page should:

- display the current prepared list
- surface always-prepared badges
- support direct list reassignment and removal
- support adding always-prepared spells
- show and edit per-list `limit` and `maxSpellLevel`

### Catalog And Prepare

Queueing surfaces should block new additions above the selected list's max spell level with clear messaging. This is a forward-looking guard only; existing prepared entries can still be displayed and maintained even if they exceed the new max.

## Testing Strategy

Add or update tests for:

- normalization defaults for `mode` and `maxSpellLevel`
- limit counting that excludes always-prepared entries and cantrips
- max spell level blocking for queueing and always-prepared adds
- direct prepared-entry reassignment and removal
- Character page rendering of the mixed prepared list with badges
- existing entries remaining intact after max spell level is lowered

## Risks

- The Character page gains more controls and could feel crowded if sections are not clearly organized.
- Direct prepared-entry editing bypasses the queue/apply flow, so local state transitions need strong tests.
- Duplicate warnings may become more common once always-prepared entries share the same visible collection.

## Recommendation

Use one mixed prepared collection with a `mode` flag and per-list max spell levels. It is the smallest durable extension of the current explicit assignment model and supports correction flows, always-prepared behavior, and forward-looking queue gating without introducing multiple competing sources of truth.
