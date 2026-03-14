# Spell List Assignment Design

**Date:** 2026-03-14

## Summary

Add explicit spell-list ownership to queued and prepared spells so multi-list characters can manage preparation limits, replacements, and sync behavior deterministically. Level 0 spells still require a chosen list, but they do not consume that list's preparation limit. Duplicate prepared spells are allowed, with non-blocking warnings when the same spell is allocated more than once.

## Problem

The current app stores prepared spells as plain spell IDs and infers list ownership from spell metadata plus the character's available lists. That works for single-list characters, but it breaks down when:

- a character has multiple spell lists
- a spell belongs to more than one of those lists
- the user needs different limits per list
- replace and sync behavior depends on a specific list assignment

The create-character flow also only supports one shared preparation limit value across all selected lists, which conflicts with per-list preparation management.

## Goals

- Let users set a preparation limit for each spell list during character creation.
- Make queued spells carry an explicit assigned list.
- Make prepared spells carry an explicit assigned list after apply.
- Exclude level 0 spells from list-limit counting.
- Allow the same spell to be prepared more than once across different lists.
- Warn when duplicates exist without blocking apply.
- Remove list ambiguity from replacement and extension sync behavior.

## Non-Goals

- Redesign the overall Character or Prepare page layout.
- Change extension payload versioning.
- Add account sync or server-side migrations.

## User Experience

### Character Creation

The create form should render one limit input per selected list instead of a single shared limit input. Users enter the character name, define one or more available lists, and then set the numeric cap for each list before creating the character.

### Queueing Spells

When a spell is available on exactly one of the character's lists, the app can auto-assign that list. When a spell is available on multiple owned lists, the user must choose the target list at queue time. Each queued row should show the assigned list and allow reassignment to another valid owned list for that spell.

### Replacements

Replace targets must come from currently prepared spells assigned to the same list as the queued spell. This turns replacement from an inferred-list behavior into a deterministic same-list action.

### Warnings And Errors

Warnings are non-blocking:

- duplicate spell prepared more than once in the projected result
- queued spell that still lacks a required list assignment

Errors block apply:

- replace intent without a replace target
- invalid assigned list for the spell or character
- projected non-cantrip count exceeding a list limit

## Data Model

### Prepared Spell Entries

Replace `preparedSpellIds: string[]` with explicit prepared entries:

```ts
interface PreparedSpellEntry {
  spellId: string;
  assignedList: string;
}
```

Character profiles should store:

```ts
preparedSpells: PreparedSpellEntry[]
```

### Queue Entries

Extend queued rows with explicit list assignment:

```ts
interface NextPreparationQueueEntry {
  spellId: string;
  intent: 'add' | 'replace' | 'queue_only';
  assignedList?: string;
  replaceTarget?: string;
  createdAt?: string;
}
```

`assignedList` can be auto-filled for single-list matches and required for multi-list matches.

## Domain Rules

### List Validation

An assigned list is valid only when:

- it exists in the character's available lists
- it exists in the spell's normalized list set

### Limit Counting

Preparation limits are evaluated per assigned list. Only spells with `level > 0` count toward the cap. Level 0 spells still require assignment so they can participate in replacement filtering, UI labeling, and sync operations.

### Duplicate Handling

The same `spellId` may appear more than once in prepared state as long as each entry is valid. Duplicate detection should produce warnings for projected prepared results and preview surfaces, but should not throw errors.

## Migration Strategy

No separate migration script is required. During profile normalization, legacy `preparedSpellIds` should be converted into explicit prepared entries using the existing fallback assignment behavior once. This is a best-effort conversion for older profiles and preserves current data without breaking load.

Legacy queued entries without `assignedList` should also be normalized forward where possible:

- assign automatically if there is exactly one valid owned list
- leave unassigned if multiple valid owned lists exist, then surface a warning in UI

## Architecture Impact

### Types And Normalization

Update shared types so explicit list ownership is represented in queue and prepared state. Character normalization becomes the compatibility layer between old stored data and the new shape.

### Character Domain

The character domain should expose helpers to:

- validate assigned lists
- compute effective per-list counts ignoring level 0 spells
- build per-list limit summaries
- detect duplicate prepared spells

### Queue Domain

Apply computation should preserve assigned lists into final prepared entries, enforce same-list replacement, and return warnings alongside blocking validation errors.

### Prepare UI

The Prepare page should:

- require or allow list selection when queueing
- display assigned lists in search results, queue rows, current prepared views, and diff output
- filter replace targets by assigned list
- surface duplicate warnings without blocking apply

### Extension Sync

Sync payload generation should use explicit assigned lists from prepared and queued results instead of inferred list selection. This should eliminate current ambiguous-list issues for multi-list spells while keeping payload version `3`.

## Testing Strategy

Add or update tests for:

- per-list limits during character creation
- normalization of legacy profiles into explicit prepared entries
- queue assignment validation for single-list and multi-list spells
- cantrips not counting against limits
- same-list replacement enforcement using assigned lists
- duplicate warnings for projected prepared results
- extension payload using explicit assigned lists directly

## Risks

- Existing saved profiles with ambiguous multi-list prepared spells will be assigned using fallback logic the first time they load, which may not match the user's original mental model.
- UI complexity increases slightly because queue rows now need explicit list-selection affordances.
- Test fixtures that assume `preparedSpellIds` will need coordinated updates.

## Recommendation

Use explicit list assignment across queued and prepared state. It is the smallest durable change that supports per-list limits, cantrip exemption, duplicate preparation, deterministic replacement, and sync accuracy without introducing fragile inference rules.
