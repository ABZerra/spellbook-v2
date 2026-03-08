# Spellbook Product Requirements (JTBD)

## Primary JTBD
When I am preparing spells before a session, I want to quickly curate the next preparation plan for one character, so I can confidently sync the right spells with minimal friction.

## Outcome Summary
- Character-first planning with sticky active character.
- Catalog-first flow for fast browse and queue.
- Preparation queue that supports Add, Replace, and Queue-only intent.
- Explicit same-list replacement and clear final review before apply.

## Scope
- In scope: catalog, prepare queue intent flow, character setup/limits, extension sync payload v3, local/pages runtime, production API + Notion catalog sync.
- Out of scope: user auth/account management, campaign collaboration, non-spell character sheet systems.

## Success Criteria
- Users can create/select a character and prepare without seeing runtime mode toggles.
- Replace flow always maps queued spell to a prepared spell from the same list.
- Queue-only items are never applied and remain queued after apply.
- Local/pages runtime works without Node API; production runtime uses API + Notion sync.
