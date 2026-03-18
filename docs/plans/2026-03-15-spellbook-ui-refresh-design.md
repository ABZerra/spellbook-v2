# Spellbook UI Refresh Design

**Date:** 2026-03-15

## Goal

Prepare a local version of Spellbook that preserves the current dark-fantasy tone while fixing the biggest UX issues from the critique:

- weak action hierarchy
- a spreadsheet-like Catalog
- cramped mobile navigation
- an overstuffed Character page
- dry, internal-facing copy

## Direction

This is a focused usability pass, not a full rebrand.

- Keep the existing serif-led fantasy identity.
- Preserve the current data model and domain behavior.
- Improve the experience by changing layout, copy, emphasis, and responsive behavior.

## Screen Changes

### App Shell

- Make the header adapt to narrow screens instead of compressing all controls into one line.
- Give the product title and character context more structure.
- Make the active route feel clearly selected.

### Catalog

- Replace the dense table presentation with browse-first list cards.
- Lead with spell name, level, list, and queue state.
- Push secondary metadata into compact tags and short summaries.
- Add a stronger “review queue” path when spells are already staged.

### Prepare

- Promote the preparation summary and apply action.
- Reframe queue management as a step-by-step workflow.
- Make intent and replacement state easier to scan.

### Character

- Break the page into clearer sections: profile setup, limits, current prepared, always prepared.
- Keep the left rail for switching characters and creating new ones, but make the main panel read like a dashboard instead of one long editor.

### Copy

- Replace internal-feeling labels with player-facing guidance.
- Make empty states explain what to do next.

## Constraints

- Stay inside the existing React/Vite/Tailwind setup.
- Avoid changing the underlying spell preparation rules unless required for presentation.
- Keep the UI performant with large spell lists.

## Validation

- Add small unit tests for new presentation helpers.
- Run the web test suite and a production build.
