# Prepare Queue Column Alignment Design

**Date:** 2026-03-18

## Goal

Refine the Prepare queue one final time so each desktop row follows the same vertical rhythm and no column feels visually ad hoc.

This pass should:

- keep the spell name as the top headline
- keep the intent buttons as the second line under the name
- give the list column a consistent `label -> value/select -> supporting line` pattern
- give the replace column the same `label -> value/select` pattern even when it is read-only
- align `Remove` with the main control/value line instead of letting it float independently

## Problem

The queue is structurally right now, but some columns still switch between stacked controls and plain text blocks.

That means rows can feel visually misaligned even when the data is correct:

- list columns with selects do not rhythmically match list columns with static text
- replace columns with a select do not rhythmically match `Prepare without replacement` or `Saved for later`
- `Remove` sits in its own visual position instead of sharing the same row rhythm as the main controls

## Direction

Treat each queued spell like a small editorial form row with a shared vertical cadence:

1. name or field label
2. control/value line
3. optional supporting line

The left spell column uses:

- spell name
- intent buttons

The list column uses:

- `List`
- select or value
- level / warning line

The replace column uses:

- `Replace`
- select or read-only state
- validation message only when necessary

`Remove` should align to the control/value line rather than the top label line.

## Constraints

- preserve the current queue logic
- preserve the current copy unless a tiny helper is needed for consistency
- avoid growing the row vertically more than necessary

## Validation

- add a focused presentation test for read-only replace-column copy
- run the web test suite
- run a production build
