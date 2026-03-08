# Ticketing Standards

## Purpose

Define a consistent ticket format so work can move from triage to delivery with minimal ambiguity.

## Required Ticket Sections

Every ticket must include these sections in this order:

1. `Title`
2. `Type`
3. `Story / Problem`
4. `JTBD`
5. `Scope`
6. `Acceptance Criteria`
7. `Metadata`
8. `Tasks`
9. `Links / Dependencies`
10. `Out of Scope`

## JTBD Rules

- Every ticket must state one primary JTBD.
- Use the framing in `references/product/jtbd-framework.md`.
- JTBD must describe the progress being enabled, not the implementation task being performed.
- If a ticket appears to solve multiple distinct jobs, split it or make the primary job explicit.

## Acceptance Criteria Rules

- Acceptance criteria are mandatory for every ticket type.
- Criteria must be a checklist using Gherkin phrasing:
  - `Given ...`
  - `when ...`
  - `then ...`
- Criteria must describe observable outcomes, not implementation details.
- Add edge-case criteria when failure paths or constraints are known.

## Metadata Rules

The metadata block must include:

- `Assignee`
- `Reporter`
- `Priority`
- `Labels`
- `Component`
- `Epic / Initiative`
- `Estimate`
- `Due Date`

Use prefixed labels for type classification:

- `type:feature`
- `type:bug`
- `type:chore`
- `type:spike`

Add `triage` by default for new intake.

## Ticket Type Guidance

- Feature: user-facing behavior or capability.
- Bug: broken behavior with reproducible steps.
- Chore: maintenance, refactor, dependency, or operational task.
- Spike: timeboxed research to reduce uncertainty.

## Batch Ticket Rules

- Split large scopes into cohesive, independently actionable tickets.
- Keep one primary outcome per ticket.
- Record explicit dependencies across sibling tickets.
- Do not merge unrelated work into one ticket for convenience.
