# Prepare Audit Rail Design

**Date:** 2026-03-18

## Goal

Refine the Prepare page one more time so the right rail reads like a single audit board instead of a grouped review followed by a redundant limits summary.

This pass should:

- keep list sections first, with each header showing `used/limit`
- place any `Unassigned` section after the list sections
- keep `Warnings` below the review sections
- keep `Apply Next Preparation` last
- remove the separate bottom `Preparation Limits` block

## Problem

The current right rail already uses list headers such as `Cleric 15/22` and `Druid 4/8`, so the extra `Preparation Limits` block repeats information the user has already seen.

That duplication adds vertical noise and weakens the new audit-board structure.

## Direction

Treat the right rail as one compact checklist:

1. assigned list sections with limit context in the header
2. an `Unassigned` section if needed
3. `Warnings`
4. `Apply Next Preparation`

## Layout

### Queued Changes

Keep the current grouped sections, but make the ordering explicit:

- configured or assigned lists first
- `Unassigned` last

This keeps the main audit area focused on real list decisions before showing unresolved items.

### Limits

Remove the separate `Preparation Limits` block entirely.

The list headers already carry the relevant limit context, so a second recap is unnecessary.

### Warnings and Apply

After the grouped review sections:

- show `Warnings`
- then the apply button

This keeps the rail in a natural review-to-action order.

## Constraints

- preserve the current grouped review style
- preserve existing warning and apply behavior
- avoid adding a new layer of UI or extra copy

## Validation

- add a focused presentation test for review-group ordering with `Unassigned` last
- run the web test suite
- run a production build
