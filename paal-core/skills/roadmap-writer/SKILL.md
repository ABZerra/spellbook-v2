---
name: roadmap-writer
description: Use when creating or refining strategic roadmap artifacts that organize work into epics and initiatives, including full roadmap planning or a standalone epic definition. Do not use for ticket-only execution planning, meeting summaries, or bug-fix triage.
version: 0.1.0
owner: Alvaro Bezerra
---

# Purpose

Generate roadmap-ready planning artifacts in Markdown using an initiative-first structure, either as a multi-epic roadmap or a single standalone epic.

# When to use

- The request is to plan or communicate a roadmap across one or more epics.
- The user needs an epic definition that stands alone without full roadmap context.
- The output needs strategic prioritization guidance (MoSCoW, 2x2, Eisenhower, or RICE) at epic/initiative level.

# When NOT to use

- The request is to write delivery tickets, acceptance criteria, or sprint task breakdowns.
- The request is post-meeting notes, PRD drafting, or discovery-only research planning.
- The request is bug triage or implementation debugging without roadmap or epic planning scope.

# Inputs

- Planning horizon or release window (if known).
- Epic candidates, objectives, JTBD context, dependencies, and ownership context.
- User context on prioritization signals (scope-shaping vs effort/impact tradeoffs).
- Optional links to PRDs, issues, dashboards, or decision notes.

# Outputs

- A roadmap document in Markdown using `references/templates/roadmap_template.md` when the mode is `roadmap`.
- A standalone epic document in Markdown using `references/templates/epic_template.md` when the mode is `epic-only`.
- Initiative-first structure under each epic, with explicit JTBD framing and optional timeline fields (not mandatory dates).
- Explicit prioritization approach selection with rationale and suggested alternatives in this order: MoSCoW, 2x2, Eisenhower, RICE.
- A closing handoff with `Next likely skill(s)`, `What to pass forward`, and `Suggested next prompts`.

# Workflow

1. Step 0: If relevant, read `references/org/process_overview.md`, `references/org/glossary.md`, `references/product/jtbd-framework.md`, and any template under `references/templates/`.
2. Detect output mode from user intent: choose `roadmap` for multi-epic planning artifacts; choose `epic-only` for single epic creation or refinement.
3. Run a question-first pass before drafting: capture missing objective, JTBD, owner, dependencies, prioritization cues, and optional planning window as `TBD` instead of guessing.
4. Build the epic structure with explicit JTBD framing and initiative lists, keeping initiatives outcome-oriented and not tied to fixed dates unless the user provides timeline constraints.
5. Prefer a validated upstream JTBD from discovery or PRD context. Do not over-derive a new job from thin evidence when `TBD` or the upstream statement is more honest.
6. Order initiatives by how directly they unlock the epic JTBD; if ordering is constrained by dependencies, make that visible.
7. Select default prioritization logic from context:
   - Use MoSCoW when the user is shaping scope without clear effort-impact tradeoff data.
   - Use 2x2 when the user provides or requests impact-vs-effort tradeoffs.
8. If prioritization context is unclear, default to MoSCoW and state this fallback explicitly.
9. Include additional prioritization suggestions in this order: MoSCoW, 2x2, Eisenhower, RICE.
10. Validate final output for clarity: each epic has JTBD, objective, owner, status, dependencies, links, priority approach, and initiatives; unresolved details remain explicit as `TBD`.
11. End with the canonical handoff fields:
   - `Next likely skill(s)`
   - `What to pass forward`
   - `Suggested next prompts`

# Examples

- Input example: `skills/roadmap-writer/examples/example-input.md`
- Output example: `skills/roadmap-writer/examples/example-output.md`
