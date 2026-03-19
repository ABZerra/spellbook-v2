# Prepare Queue Row Alignment Design

**Date:** 2026-03-18

## Goal

Refine the Prepare queue row one more time so it feels clean and deliberate after the recent ledger compaction.

This pass should:

- remove the passive `Pick what this replaces.` helper
- keep the stronger validation message only when the user is actually blocked from applying
- top-align the queue row so the name, list column, replace column, and remove action share the same visual start
- preserve the current wider spell-name treatment and the list-column secondary metadata

## Problem

The queue is close, but one small piece still makes the row feel noisier and less aligned than it should:

- the passive replace helper adds another line of explanatory text to an otherwise compact row
- the row still needs stronger visual alignment so the new disposition reads as intentional instead of improvised

## Direction

Treat each staged spell like a strict top-aligned ledger row.

- the spell name remains the left headline
- the list column continues to carry the secondary metadata
- the replace column becomes a compact `label + select` stack
- validation copy appears only when it is actionable

## Layout

### Replace Column

When a replace target is missing:

- show nothing by default while the user is still editing
- show `Choose a prepared spell before applying.` only when validation errors are active

This removes the passive tooltip-like text without hiding the real blocking state.

### Row Alignment

The entire desktop row should align to the top edge of the spell name:

- list selector stack starts at the same top line
- replace selector stack starts at the same top line
- `Remove` aligns to the top rather than drifting toward the vertical center

## Constraints

- preserve current queue logic and validation behavior
- keep the row compact and readable on mobile
- avoid reworking the broader Prepare page again

## Validation

- add a focused presentation test for the replace-column message behavior
- run the web test suite
- run a production build
