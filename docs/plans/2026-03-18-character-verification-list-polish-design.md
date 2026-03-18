# Character Verification List Polish Design

**Date:** 2026-03-18

## Goal

Polish the Character page so it feels like a player-first verification surface:

- profiles belong inside the review header
- preparation rules stay visible and become editable in place
- the prepared area reads like a spell list, not a spreadsheet
- always-prepared tools stay simple and lightweight
- spell details open beside the list without losing context

## Problem

The current Character page is now pointed in the right direction, but a few pieces still work against the intended flow:

- profiles still live in their own separate top block
- preparation rules are visible but not editable where they matter
- prepared rows still feel columnar and admin-like
- always-prepared still reads like a mini workflow instead of a simple utility
- spell names do not yet open contextual details from the list

## Direction

This pass should make the page feel like a spellbook index:

- compact top review header
- clear at-a-glance constraints
- grouped prepared list by level
- optional details in a side drawer
- quiet editing tools below

## Layout

### Review Header

Fold profiles into the main review header:

- page title
- short guidance
- profile pills
- subdued `New Character` trigger

This should remove the feeling of “title block plus separate profile block.”

### Active Cue + Editable Rules

Keep the active cue small:

- name
- class and subclass
- delete action

Immediately below it, keep the preparation rules visible. Each rule should show:

- list name
- used / limit
- max spell level

Rules should also be editable in place through a compact edit affordance or inline collapsed editor.

### Current Prepared

Move further away from a row-grid/spreadsheet feel and toward a grouped list. Default sort should be:

1. spell level
2. spell name

Each level group should show simple spell rows:

- clickable spell name
- assigned list
- always-prepared marker when relevant
- compact remove action

Reassign list should still be possible, but should feel secondary rather than column-primary.

### Spell Details

Clicking a spell name should open the spell details in a right-side drawer so the user can inspect the spell without losing their place in the prepared list.

### Bottom Tools

Keep the bottom area for occasional edits only:

- identity
- add always prepared

`Add Always Prepared` should be simplified to a clear title and search field, with extra controls only when ambiguity requires them.

## Constraints

- preserve existing domain behavior and mutation handlers
- avoid reintroducing bulky cards or sidebars
- keep the verification flow fast on desktop and mobile

## Validation

- add a focused presentation/helper test if needed for the editable rules or sorting behavior
- run the web test suite
- run a production build
