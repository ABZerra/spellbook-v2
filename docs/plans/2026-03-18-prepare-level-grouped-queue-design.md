# Prepare Level-Grouped Queue Design

**Date:** 2026-03-18

## Goal

Refine the Prepare page so the left queue uses spell level as its organizing structure instead of treating level as row metadata.

This pass should:

- group queued spells on the left by level
- sort spells by name within each level group
- remove level from the row metadata band
- keep the right rail grouped by spell list exactly as it is

## Problem

The queue rows are now visually disciplined, but `level` still feels misplaced because it is being shown inside row metadata rather than acting as a section heading.

That makes the left queue do two organizational jobs at once:

- the row is trying to handle per-spell editing
- the metadata is trying to express level grouping

## Direction

Use the Character page as the structural reference, not the visual container model.

On the left:

- `Cantrips`, `Level 1`, `Level 2`, and so on become section headings
- each section contains queued spells sorted alphabetically
- each row keeps its current interactive controls

On the right:

- keep the grouped list-based final check as-is

## Layout

### Queue Structure

Replace the flat `queuedRows.map(...)` structure with grouped sections:

- section heading
- divider line
- editable rows beneath

The groups should stay light and editorial, not boxed.

### Row Content

Once level becomes a section heading, rows no longer need to display level in the list column.

That means:

- the list column can just be `List`
- the replace column can stay focused on replacement behavior
- the row becomes easier to scan because it carries fewer competing hierarchies

## Constraints

- preserve current queue logic and validation behavior
- preserve all current per-row actions
- avoid turning the left queue back into a card stack

## Validation

- add a focused presentation test for grouping queued rows by level and name
- run the web test suite
- run a production build
