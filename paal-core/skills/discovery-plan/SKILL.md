---
name: discovery-plan
description: Use when a team needs a structured discovery plan with questions, risks, research activities, and initiatives. Do not use when requirements are already validated and delivery is in progress.
version: 0.2.0
owner: Alvaro Bezerra
---

# Purpose

Produce a discovery plan that reduces uncertainty before execution decisions.

# When to use

- Problem framing is incomplete and key assumptions are unvalidated.
- A team needs structured research and decision initiatives.

# When NOT to use

- Requirements are validated and implementation has already started.
- The request is only to detail engineering delivery tasks.

# Inputs

- Current problem statement, constraints, and unknowns.
- Optional research-synthesis input when discovery starts from mixed evidence.
- Primary JTBD if known, or enough context to derive it.
- Stakeholder goals and timeline considerations.

# Outputs

- A discovery plan in Markdown using `references/templates/discovery_plan_template.md`.
- An `## Evidence Synthesis` section that captures research question, synthesized themes, contradictions, gaps, and source notes.
- Explicit JTBD framing that is evidence-backed when possible, plus clear decision criteria, risks, and initiative dates/owners.
- A short closing handoff section with `Next likely skill(s)`, `What to pass forward`, and `Suggested next prompts`.

# Workflow

1. Step 0: If relevant, read `references/org/process_overview.md`, `references/org/glossary.md`, `references/product/jtbd-framework.md`, `references/product/research-synthesis-framework.md`, `references/workflows/ai-product-delivery-flow.md`, `references/templates/research_synthesis_input_template.md`, and any template under `references/templates/`.
2. If a research-synthesis input exists, carry its research question, converging themes, contradictions, gaps, and JTBD candidates into the plan before adding new discovery structure.
3. Populate `## Evidence Synthesis` first so the discovery plan makes the evidence basis explicit.
4. Identify the primary JTBD for the discovery effort. Preserve upstream JTBD when available; otherwise derive an evidence-backed job from the problem framing and mark it as `TBD` if still unclear.
5. List top questions that block confident delivery decisions or a confident JTBD definition.
6. Map questions to research activities and owners.
7. Capture risks, assumptions, and mitigation probes, including risks that could invalidate the current JTBD framing.
8. Define initiatives and decision criteria for go/no-go outcomes.
9. If discovery reduced the main unknowns enough to define feature scope, point to `prd-writer` as the next likely skill and list the problem statement, JTBD, validated assumptions, and open questions to pass forward.

# Examples

- Input example: `skills/discovery-plan/examples/example-input.md`
- Output example: `skills/discovery-plan/examples/example-output.md`
