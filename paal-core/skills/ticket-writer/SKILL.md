---
name: ticket-writer
description: Use when creating structured delivery tickets from concrete requirements, bug reports, maintenance requests, or research scopes and acceptance criteria must be embedded in the ticket. Do not use when writing a full PRD, a discovery plan, or meeting notes.
version: 0.1.0
owner: Alvaro Bezerra
---

# Purpose

Generate complete, implementation-ready tickets in Markdown with embedded Gherkin checklist acceptance criteria and explicit metadata.

# When to use

- You need one high-quality ticket with clear scope, tasks, and definition of done.
- You need to split a larger source document into multiple cohesive tickets.
- A delivery workflow requires standardized ticket format across feature, bug, chore, and spike types.

# When NOT to use

- The request is to produce a PRD, discovery plan, or post-meeting output.
- Inputs are too vague to define a concrete delivery ticket.
- The output needed is only a standalone acceptance criteria list without ticket context.

# Inputs

- Source requirements, bugs, notes, or scoped requests.
- Primary JTBD from upstream context, or enough problem context to derive it.
- Constraints, dependencies, and known risks.
- Optional owner, priority, component, and due-date preferences.

# Outputs

- Ticket Markdown using `references/templates/ticket_template.md` or the matching type-specific template.
- Required sections in template order, including `## JTBD` and `## Acceptance Criteria` with Gherkin checklist items.
- Metadata block with placeholders or explicit values for ownership and planning fields.
- A closing handoff with `Next likely skill(s)`, `What to pass forward`, and `Suggested next prompts`.

# Workflow

1. Step 0: If relevant, read `references/org/process_overview.md`, `references/org/glossary.md`, `references/org/ticketing_standards.md`, `references/product/jtbd-framework.md`, and relevant files under `references/templates/`.
2. Determine mode: single-ticket output or batch decomposition from a larger source.
3. Determine ticket type (`feature`, `bug`, `chore`, `spike`) based on the primary outcome and evidence in the source.
4. Identify one primary job per ticket. Preserve upstream JTBD from discovery or PRD context when provided; otherwise derive it from the source using `references/product/jtbd-framework.md` and mark it as `TBD` if the job is still ambiguous or the evidence is too thin.
5. Draft sections in template order: `Title`, `Type`, `Story / Problem`, `JTBD`, `Scope`, `Acceptance Criteria`, `Metadata`, `Tasks`, `Links / Dependencies`, `Out of Scope`.
6. Keep the JTBD outcome-focused. If one ticket appears to solve multiple distinct jobs, split it or make the primary job explicit.
7. Write acceptance criteria as checklist items using explicit `Given ... when ... then ...` phrasing.
8. Capture dependencies and blockers explicitly; do not hide cross-ticket dependencies in prose.
9. For batch mode, produce multiple tickets with one primary outcome each, one primary JTBD each, and include dependency links between sibling tickets.
10. Run a final quality pass to remove ambiguity, ensure testability, and keep each ticket implementation-ready.
11. End with the canonical handoff fields:
   - `Next likely skill(s)`
   - `What to pass forward`
   - `Suggested next prompts`

# Examples

- Input example: `skills/ticket-writer/examples/example-input.md`
- Output example: `skills/ticket-writer/examples/example-output.md`
