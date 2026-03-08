---
name: acceptance-criteria-extractor
description: Use when ticket or story requirements, designs, or flows are defined and you need testable acceptance criteria that can be pasted directly into delivery tickets. Do not use for high-level PRD drafting or vague ideas.
version: 0.3.0
owner: Alvaro Bezerra
---

# Purpose

Translate ticket/story requirements into clear, testable acceptance criteria in Markdown using Gherkin checklist format.

# When to use

- A ticket/story exists and needs a user-facing definition of done.
- A PRD requirement is being converted into implementation-ready ticket criteria.
- Specs, designs, or flow details are concrete enough to verify behavior.

# When NOT to use

- You are still defining feature strategy or writing a PRD.
- Inputs are a vague idea with no concrete requirement context.
- The request is to prioritize scope rather than define verifiable outcomes.

# Inputs

- Ticket/story statement, linked PRD requirement(s), primary JTBD, and design/flow artifacts.
- Constraints, assumptions, edge-case notes, and dependencies.

# Outputs

- Acceptance criteria in Markdown using `references/templates/acceptance_criteria_template.md`.
- JTBD-aware context plus criteria designed to paste directly into the `## Acceptance Criteria` section of ticket outputs.
- Given/When/Then criteria, preconditions, and relevant edge cases.
- A short closing handoff section with `Next likely skill(s)`, `What to pass forward`, and `Suggested next prompts`.

# Workflow

1. Step 0: If relevant, read `references/org/process_overview.md`, `references/org/glossary.md`, `references/product/jtbd-framework.md`, `references/workflows/ai-product-delivery-flow.md`, and templates under `references/templates/`.
2. Confirm source context includes a ticket/story scope and linked requirement intent.
3. Parse the source into the primary JTBD, discrete user outcomes, and failure paths. Preserve upstream JTBD language when it already came from discovery or PRD work instead of re-deriving it from thin notes.
4. Write checklist criteria using `Given ... when ... then ...` that are specific, observable, and testable.
5. Add preconditions and edge cases tied to known constraints/dependencies.
6. Remove ambiguous language and ensure each criterion can be validated in ticket-level testing, pasted into delivery tickets, and clearly supports the JTBD.
7. If repo setup or implementation structure is the next blocker, point to `repo-bootstrap` as the next likely skill and list the JTBD summary, delivery surfaces, shared-logic expectation, and verification needs to pass forward.

# Examples

- Input example: `skills/acceptance-criteria-extractor/examples/example-input.md`
- Output example: `skills/acceptance-criteria-extractor/examples/example-output.md`
