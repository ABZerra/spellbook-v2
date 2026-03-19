# Spellbook Product Requirements (JTBD)

## Primary JTBD
When I am preparing spells before a session, I want to quickly curate the next preparation plan for one character, so I can confidently sync the right spells with minimal friction.

## Outcome Summary
- Character-first planning with sticky active character.
- Catalog-first flow for fast browse and queue.
- Character page optimized for fast verification with visible rules and a dense prepared list.
- Preparation queue that supports Add, Replace, and Queue-only intent, grouped by spell level for faster scanning.
- Explicit same-list replacement and a final review grouped by spell list before apply.

See also: `docs/product/UX_DECISIONS.md`

## Scope
- In scope: catalog, prepare queue intent flow, character setup/limits, extension sync payload v3, snapshot-backed web runtime, committed spell dataset workflow.
- Out of scope: user auth/account management, campaign collaboration, non-spell character sheet systems.

## Success Criteria
- Users can create/select a character and prepare without seeing runtime mode or data-source toggles.
- Replace flow always maps queued spell to a prepared spell from the same list.
- Queue-only items are never applied and remain queued after apply.
- Local testing and production builds both use the same committed spell snapshot.
