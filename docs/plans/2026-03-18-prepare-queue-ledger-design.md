# Prepare Queue Ledger Design

**Date:** 2026-03-18

## Goal

Refine the Prepare page again so the staged queue uses horizontal space more efficiently and the final review rail audits changes by spell list instead of repeating list labels inline.

This pass should:

- compress staged queue rows toward a single desktop line by default
- make `Replace` feel like the normal case visually
- reunite `View Current Prepared` and `Reset To Current Prepared` in a more natural order
- group final-check review items by spell list with limit context

## Problem

The recent Prepare refactor improved hierarchy, but the queue still spends too much vertical space per spell:

- each staged spell is denser than before, but still reads as a stacked block
- the most common action, `Replace`, does not yet feel dominant enough
- the “view baseline” and “reset baseline” tools are separated and ordered awkwardly
- the final-check list still repeats list names in sentence form instead of using list-level grouping

## Direction

The page should feel like a preparation ledger.

On the left:

- each staged spell should fit into one desktop row by default whenever possible
- the row should prioritize action over description

On the right:

- queued changes should become a compact audit board grouped by spell list
- each list header should show current usage versus limit

## Layout

### Header / Utility Actions

Place `View Current Prepared` before `Reset To Current Prepared` so the user can check the current state before deciding to reset back to it.

These two actions should feel like related baseline tools, not unrelated buttons living in different regions.

### Preparation Queue

Compress each row toward:

- spell name
- primary `Replace` control
- secondary intent controls
- spell list selector
- replace target selector when relevant
- remove action

Desktop rows should use horizontal layout first, with wrapping only where unavoidable.

The goal is not to hide actions, but to stop stacking them vertically by default.

### Intent Hierarchy

`Replace` should feel like the assumed path.

That means:

- stronger selected treatment for `Replace`
- quieter treatment for `Prepare` and `Save For Later`
- copy and spacing that reinforce replacement as the default case

### Final Check

Replace the flat text list of queued changes with grouped sections such as:

- `Druid 4/8`
- `Replace Healing Word`
- `Prepare Faerie Fire`

This should remove the need to repeat `[DRUID]` and `[CLERIC]` on every item while making the audit surface easier to scan.

## Interaction Notes

- staged row controls stay visible because they are used constantly
- the queue should still adapt cleanly on mobile, but desktop should stop wasting horizontal room
- the grouped final-check rail should still show warnings and apply below the grouped change list

## Constraints

- preserve current queue logic and validation behavior
- preserve the side-drawer spell detail pattern
- avoid turning the queue into a hidden or multi-step interaction

## Validation

- add focused helper tests if grouping or label logic moves into presentation helpers
- run the web test suite
- run a production build
- manually verify the Prepare page on desktop width and a narrow viewport
