# Character Editorial Prepared List Design

**Date:** 2026-03-18

## Goal

Refine the Character page so `Current Prepared` feels like a calm spellbook index instead of a softened table.

This pass should:

- keep the strong quick-verification hierarchy already in place
- flatten the prepared section into a typographic list
- keep spell details available without turning every row into a control panel
- preserve editable preparation rules near the top

## Problem

The page direction is now correct, but `Current Prepared` still reads too much like admin UI:

- each level is boxed into its own container
- row dividers and controls create a column layout
- `Remove` and list reassignment are visually too present for a review-first screen
- the section intro explains what the list is already showing

The result is better than a card grid, but it still does not feel like a player scanning a prepared spellbook.

## Direction

Lean further into an editorial list:

- one prepared surface
- level headers as typographic chapter markers
- a single divider under each header
- open rows with minimal chrome
- actions that appear secondary to reading

The target feeling is:

- quick to verify
- calm
- confident
- closer to a printed spell index than a dashboard table

## Layout

### Current Prepared

Keep the main section title, but trim explanatory copy. The title should do the work.

Inside the section:

- remove rounded level cards
- render `Cantrips`, `Level 1`, `Level 2`, and so on as simple headers
- place a single horizontal rule below each header
- render spell rows directly beneath with no boxed background

### Spell Rows

Each row should read left to right as a sentence:

- clickable spell name
- assigned list
- optional `Always` marker
- quiet `Remove` action

Desktop should feel like:

`Shield ................................ Wizard ................................ Remove`

Mobile can stack lightly, but should still avoid turning back into cards.

### Reassignment

List reassignment is still needed, but should not be visible as a permanent select for every row.

Preferred behavior:

- the assigned list renders as quiet text by default
- clicking or focusing the list label reveals the inline select for that row
- only one row needs to feel “editing” at a time

### Spell Details

Keep the spell-name click opening the right-side drawer. This already matches the intended review flow and should stay lightweight.

## Header Relationship

The top verification header is already in the right direction. The key change for this pass is restraint:

- keep `Current Prepared` title
- remove the descriptive subtitle first
- keep the spell count only if it still earns its space after the list flattens

## Constraints

- preserve existing prepared-spell mutations and validation logic
- avoid reintroducing cards, rails, or heavy row separators
- keep the page clear on mobile without hiding actions

## Validation

- add or extend a focused presentation test only if a new pure helper is introduced
- verify list sorting and grouping remain level-first, then name
- run the web test suite
- run a production build
- manually verify the Character page locally on desktop and narrow width
