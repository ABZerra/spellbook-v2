# Prepare Dense Workbench Design

**Date:** 2026-03-18

## Goal

Refine the Prepare page so it behaves like a dense preparation ledger instead of a noisy dashboard.

This pass should:

- make `Queued Changes` and `Preparation Limits` the main verification surfaces
- reduce the prominence and noise of the current apply preview
- simplify search into compact staging rows
- keep frequently used queue actions visible without turning every row into a cluttered card
- move spell details into the side drawer instead of default row metadata

## Problem

The current Prepare page has the right flow, but the presentation still fights the user’s actual review behavior:

- the apply preview is louder than the information the player really double-checks
- the right rail spends too much space on metrics and explanatory copy
- search includes explanatory UI that the input already covers
- search results and staged spells are both too card-like and metadata-heavy
- repeated chips, borders, and controls make the page feel like management UI

## Direction

The page should feel like a preparation workbench:

- compact staging
- dense visible queue actions
- clear limits and warnings
- one confident apply step

The user should be able to:

1. search
2. stage
3. adjust intent/list/replace target
4. verify changes and limits
5. apply

without being distracted by decorative preview blocks.

## Layout

### Header

Keep the page title and top-level actions, but reduce ceremony. The header should support the workbench, not compete with it.

### Search / Stage Another Spell

The search area becomes:

- title
- search input
- clear action
- compact result rows

Remove the extra explanatory empty-state tooltip copy. The placeholder is enough.

Each search row should show:

- clickable spell name
- light summary such as level or assignment availability
- `Stage Spell`

Spell details should open in the side drawer from the spell name, matching the Character page pattern.

### Next Rest Workbench

This stays the primary editing surface, but becomes denser.

Each staged item should keep visible actions because they are used every time:

- spell name
- intent controls
- assigned list control
- replace target control when relevant
- remove action

What should go away by default:

- casting time chips
- save chips
- extra decorative metadata
- oversized card framing

The row should feel compact and operational rather than descriptive.

### Right Rail

The right rail should become a compact `Final Check` area.

Priority order:

1. queued changes
2. preparation limits
3. warnings
4. apply button

The current `Apply Preview` metrics and explanatory copy should be removed or greatly reduced. The player cares more about what changes and whether limits still work than about decorative counts.

## Interaction Notes

- frequently used actions remain visible in the staged queue
- spell details move to the side drawer instead of living in every row
- warnings should stay obvious, but not dominate the entire page when none exist
- the final apply area should feel quieter and more confident

## Constraints

- preserve current queue logic and validation behavior
- preserve replace as the default staged intent when appropriate
- avoid introducing hidden workflow steps for intent/list/replace edits
- keep the page readable on mobile without reverting to large stacked cards

## Validation

- add focused presentation/helper tests only if a new pure helper is introduced
- run the web test suite
- run a production build
- manually verify desktop and mobile Prepare-page rhythm
