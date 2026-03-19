# Spellbook UX Decisions

**Last updated:** 2026-03-19

This document records the UI and interaction decisions behind the current Spellbook web experience so future changes can preserve the same product intent.

## Product posture

Spellbook should feel like a player preparing for a session, not an admin dashboard parsing spell data.

The UI should optimize for:

- quick confidence
- one active character at a time
- progressive disclosure for rare actions
- dense, readable review surfaces over decorative cards

## Cross-screen decisions

### 1. Character-first flow

- the active character is sticky across the app
- the user should always know which character they are editing
- character switching should stay visible, but not consume prime layout space

### 2. Verify first, edit second

- the most common paths are review and confirmation, not configuration
- high-frequency information stays visible
- low-frequency setup tools are present, but visually demoted

### 3. Browse and queue, then decide

- the catalog is for finding and staging spells quickly
- the prepare screen is for reviewing intent and committing a plan
- the character screen is for verifying the final prepared state against character rules

### 4. Details should be contextual

- spell descriptions should not bloat list views
- clicking a spell should open contextual detail beside the current workflow when possible
- dense list screens should stay dense

### 5. Avoid generic dashboard patterns

The app should avoid:

- hero metric blocks that push real work below the fold
- cards inside cards
- equally loud panels competing for attention
- internal or implementation-flavored copy

## Catalog decisions

The catalog should feel like a browse surface, not a spreadsheet.

- filtered spell count remains visible because it supports confidence while browsing
- the large hero summary was removed because it cost too much vertical space
- spell name, level, and queue state are primary
- secondary detail should open on demand, not live in every row

## Character page decisions

The Character page is a quick verification board.

- profile switching belongs in the review header
- the active character cue stays compact
- preparation rules are always visible near the top because they are part of review, not buried setup
- preparation rules remain editable in place because visible rules must also be actionable
- `Current Prepared` is grouped by level and sorted by level, then name
- prepared spells should read like a spellbook list, not rows in a management table
- reassigning a list is an occasional adjustment, so it should appear on demand instead of as a permanent control
- `Always Prepared` and identity editing are occasional tools and stay lower on the page

## Prepare page decisions

The Prepare page is a decision workbench.

- the queue is the main working surface
- the left queue is grouped by spell level and sorted by spell name within each level
- `Replace` is the default queued intent when the character already has prepared spells
- search and queue rows stay compact; spell descriptions open on demand
- the final review stays grouped by spell list because list limits are the real final-check constraint
- list headers in the final review carry the active `used/limit` context, so limits do not need a second summary block
- the final review must include warning states so the user can commit confidently

## Copy decisions

Copy should describe player intent, not interface architecture.

Prefer:

- `Browse spells`
- `Current Prepared`
- `Add Always Prepared`
- `Preparation Rules`

Avoid:

- `secondary reference center`
- `queue-only` as a primary label without context
- explanatory text that repeats what the layout already shows
