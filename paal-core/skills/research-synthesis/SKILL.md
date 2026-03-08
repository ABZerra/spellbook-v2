---
name: research-synthesis
description: Use when mixed discovery evidence must be synthesized into a coherent input for discovery or definition. Do not use when evidence is already synthesized or the request is only for final ticket drafting.
version: 0.1.0
owner: Alvaro Bezerra
---

# Purpose

Produce a discovery-ready research synthesis input that consolidates mixed discovery evidence, surfaces signal and contradiction, and frames JTBD candidates without overstating certainty.

# When to use

- Evidence is spread across multiple discovery sources and needs one coherent synthesis.
- Discovery or PRD work is blocked by fragmented research notes, competing signals, or unclear user progress.
- A team needs a reusable evidence summary before locking a JTBD, scope, or research agenda.

# When NOT to use

- The evidence is already synthesized into a reliable discovery or PRD input.
- The request is only to write a final PRD, ticket, or acceptance criteria set from already validated inputs.
- There is only one trivial source and no real cross-source synthesis work to do.

# Inputs

- A research question, opportunity area, or decision the synthesis needs to support.
- Mixed discovery evidence such as interview notes, survey comments, support themes, sales notes, usability findings, or analytics summaries.
- Optional upstream hypotheses, personas, or current JTBD assumptions.

# Outputs

- A Markdown synthesis input using `references/templates/research_synthesis_input_template.md`.
- Research question, source inventory, evidence strength notes, converging themes, contradictions, gaps, and JTBD candidates.
- A closing handoff with `Next likely skill(s)`, `What to pass forward`, and `Suggested next prompts`.

# Workflow

1. Step 0: If relevant, read `references/org/process_overview.md`, `references/workflows/ai-product-delivery-flow.md`, `references/product/jtbd-framework.md`, `references/product/research-synthesis-framework.md`, and `references/templates/research_synthesis_input_template.md`.
2. Normalize the mixed discovery evidence: record source type, segment, timing, and any caveats before combining findings.
3. Group repeated findings into converging themes, keeping the supporting evidence visible instead of flattening it away.
4. Call out contradictions, segment differences, and outliers explicitly; do not smooth them into false agreement.
5. Label evidence strength qualitatively and derive JTBD candidates only when the evidence supports them. Keep uncertain jobs as candidates or `TBD`.
6. Draft the synthesis in template order with discovery questions that naturally follow from the evidence.
7. Keep the output discovery-first. Even when the synthesis was requested from PRD or meeting context, default the handoff to `discovery-plan` unless the user explicitly asks to reuse it elsewhere.
8. End with the canonical handoff fields:
   - `Next likely skill(s)`
   - `What to pass forward`
   - `Suggested next prompts`

# Examples

- Input example: `skills/research-synthesis/examples/example-input.md`
- Output example: `skills/research-synthesis/examples/example-output.md`
