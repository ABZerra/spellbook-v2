# Character Quick Verification Design

**Date:** 2026-03-18

## Goal

Refocus the Character page around a player doing a fast pre-session verification:

- confirm the active character
- confirm list-by-list preparation constraints
- scan the currently prepared spells
- only then open rare-edit tools if needed

## Problem

The current Character page is better organized than before, but it still gives too much space and weight to the wrong things:

- prepared spells still render as mini cards instead of a compact verification list
- the most important at-a-glance data, preparation rules, lives too low on the page
- rare-edit controls still compete visually with the daily review task

## Direction

This page should feel like a compact audit board, not a spell management dashboard.

- keep character switching in compact header pills
- keep the active character cue small
- promote list-by-list preparation rules into an always-visible strip near the top
- replace spell cards with dense prepared rows
- move truly occasional tools to the bottom

## Layout

### Header

Keep the current top structure:

- page title
- character switcher pills
- subdued create-character disclosure

### Active Cue + Rules

The active cue remains compact, but the old summary chips should stop being the main summary. Instead, directly under or inside the cue area, show an always-visible preparation rules strip.

Each rule item should show:

- spell list name
- current used count
- preparation limit
- max spell level

This is the information the player actually needs at a glance.

### Current Prepared

Replace the current two-column card grid with a dense row list.

Each row should prioritize:

- spell name
- assigned list
- level
- always-prepared state

Compact row actions can still allow:

- reassigning the list when multiple lists are valid
- removing the spell

Secondary metadata such as casting time should not dominate this page.

### Rare-Edit Area

Move only rare-edit content below the main verification surface:

- profile details
- always prepared

Preparation rules should no longer be tucked into this bottom area.

## Interaction Notes

- the page should support a “10 second verification” scan
- the first meaningful glance should answer: “what are my limits?” and “does this prepared list look right?”
- rare-edit sections should be collapsed by default unless there is a strong reason otherwise

## Constraints

- preserve the existing domain logic and mutation handlers
- keep the React/Vite/Tailwind implementation simple
- prefer denser layout over richer card presentation

## Validation

- add a small presentation helper test for the new rules summary
- run the web test suite
- run a production build
