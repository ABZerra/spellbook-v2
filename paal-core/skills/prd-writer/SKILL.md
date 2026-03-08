---
name: prd-writer
description: Use when defining or refining a feature-level PRD that aligns multiple tickets and stakeholders. Do not use for a single ticket, bug fix, or minor tweak.
version: 0.3.0
owner: Alvaro Bezerra
---

# Purpose

Create a feature-level PRD in Markdown that aligns business context, scope priorities, and delivery decisions before ticket-level execution.

# When to use

- The work is a feature-level capability, not a single sprint-sized ticket.
- Multiple tickets/stories or cross-functional stakeholders are expected.
- Teams need shared decisions on goals, MoSCoW scope, and success metrics.

# When NOT to use

- The request is a single ticket, bug fix, copy tweak, or minor refactor.
- The task can be fully defined and verified in one ticket without PRD-level coordination.
- Inputs are too vague and should first go through discovery planning.

# Inputs

- Problem framing, business goal, and known constraints.
- Available research/evidence, user context, journey notes, and any research-synthesis input.
- Stakeholder/dependency context and any decision history.

# Outputs

- A PRD in Markdown using `references/templates/prd_template.md`.
- Explicit JTBD framing, MoSCoW scope, requirement-level verification cues, and success metrics.
- Research evidence that can cite an upstream synthesis input when one exists.
- Open questions tracked as `TBD` when information is missing.
- No ticket-level acceptance criteria by default (those belong in ticket/story artifacts).
- A short closing handoff section with `Next likely skill(s)`, `What to pass forward`, and `Suggested next prompts`.

# Workflow

1. Step 0: If relevant, read `references/org/process_overview.md`, `references/org/glossary.md`, `references/product/jtbd-framework.md`, `references/workflows/ai-product-delivery-flow.md`, `references/templates/research_synthesis_input_template.md`, and templates under `references/templates/`.
2. Confirm the work meets the feature-level PRD trigger; if not, recommend ticket-level handling.
3. Run a question-first pass: identify missing baseline/target, primary user JTBD, constraints/guardrails, and ownership. Use `references/product/jtbd-framework.md` to keep the job statement focused on user progress. Prefer a validated JTBD from discovery or a research-synthesis input; only derive directly from evidence when the source material is strong enough, and keep unknowns as `TBD` instead of guessing.
4. Draft sections in template order, keeping business context, evidence, JTBD/journey, synthesis-source notes, and dependencies explicit.
5. Build MoSCoW scope with all four categories and ensure each Must Have maps to at least one requirement and clearly supports the primary JTBD.
6. Fill the requirements table with MoSCoW and a short verification cue per requirement; keep ticket links optional/neutral.
7. Add a lightweight decision log for only significant decisions.
8. Order rollout initiatives according to what most directly unlocks the JTBD first; if initiative ordering differs from job logic, explain why.
9. Validate clarity: non-goals and Won't Have are explicit, success metrics are measurable, and unresolved items remain visible as open questions.
10. If requirement intent is concrete enough for ticket/story definition of done, point to `acceptance-criteria-extractor` as the next likely skill and list the requirement IDs, JTBD summary, user outcomes, and edge-case notes to pass forward.

# Examples

- Input example: `skills/prd-writer/examples/example-input.md`
- Output example: `skills/prd-writer/examples/example-output.md`
