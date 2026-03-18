# Character Page Header Pills Design

**Date:** 2026-03-16

## Goal

Refocus the Character page around the day-to-day task of reviewing and managing currently prepared spells, while demoting low-frequency character switching and profile configuration.

## Problem

The current Character page still spends premium horizontal space on the left sidebar even though character switching is rare. That squeezes the content that matters most:

- the active character cue
- the `Current Prepared` work surface
- the room needed for a growing prepared list

The profile and rules information also still reads too prominently for something the user mostly sets once and later revisits as a reference.

## Direction

The page should behave like a working preparation board, not an account/settings screen.

- Move character switching into compact pills in the page header.
- Remove the dedicated left sidebar.
- Keep the active character identity visible, but small and reminder-like.
- Give `Current Prepared` the widest and most prominent area on the page.
- Move profile editing, preparation rules, and always-prepared management into a secondary expandable section below the main work area.

## Layout

### Header

The top section keeps the page title but becomes more functional:

- page title and short guidance
- character switcher pills
- subdued `Create Character` trigger

On narrow screens, the character pills become a horizontally scrollable row instead of wrapping into a large block.

### Active Character Cue

Below the header, show a compact active-character strip:

- character name
- class and subclass reminder
- small stat chips such as prepared, always prepared, and queued
- delete action

This strip is present for orientation, not as the dominant visual element.

### Main Surface

`Current Prepared` becomes a full-width primary section. It should be the first major block users encounter and the one with the most horizontal room. The prepared list must be able to grow without competing with a side panel.

### Secondary Surface

Below the main section, a quieter `Profile Basics` area groups low-frequency setup work into collapsible sections:

- basic character information
- preparation rules
- always prepared

This keeps configuration on the page for trust and review, but visually subordinate to active preparation review.

## Interaction Notes

- Switching characters should remain one click through visible pills.
- Creating a character stays available, but not as a large persistent form.
- The default reading order should always be: identify active character, review prepared spells, optionally open profile basics.

## Constraints

- Preserve the existing character domain behavior.
- Keep changes inside the current React/Vite/Tailwind structure.
- Avoid adding new complex page state beyond light disclosure/expansion behavior.

## Validation

- Add or update a small presentation helper test if the compact header/cue logic changes.
- Run the web test suite.
- Run a production build.
