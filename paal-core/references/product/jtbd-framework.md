# Jobs To Be Done (JTBD) Framework

## Purpose

Use JTBD to describe the progress a user, team, or operator is trying to make in a specific situation. JTBD keeps artifacts focused on the underlying job rather than jumping straight to a solution.

## Core format

Use this default shape unless a tighter variation is clearer:

`When <situation>, I want to <motivation or progress>, so I can <expected outcome>.`

For team or system-facing work, adapt the actor while keeping the same structure:

- `When the team is trying to <job>, they need <capability>, so they can <outcome>.`
- `When support is handling <situation>, they need <capability>, so they can <outcome>.`

## Rules

- State one primary job per artifact. If multiple distinct jobs appear, split the work or mark one as primary.
- Describe desired progress, not a feature, UI element, or implementation task.
- Keep the situation concrete enough to explain when the job matters.
- Keep the outcome meaningful enough to explain why the work matters.
- Use `TBD` when the job is still unknown rather than inventing one.

## Evidence Grounding

- Tie the job statement to actual evidence when research exists.
- Keep the evidence basis visible: quote, behavior, theme, or synthesis input.
- If the evidence is thin or conflicting, say so instead of polishing the statement into certainty.

## Candidate vs Validated JTBD

- A `candidate JTBD` is evidence-backed enough to guide discovery, but still provisional.
- A `validated JTBD` is strong enough to drive scope, requirement framing, and initiative ordering.
- If the available evidence does not justify either level, use `TBD` and make validation part of the next artifact.

## Secondary Lenses (Emotional and Social)

- Emotional and social jobs can clarify decision-making, but they are optional supporting lenses.
- Use them when they clearly explain why a user chooses, delays, or rejects a solution.
- Do not force every artifact into functional, emotional, and social buckets if the evidence does not support it.

## What Not To Do

- Do not restate a requested feature as if it were a job.
- Do not default to numeric importance, satisfaction, or opportunity scoring when the evidence is qualitative.
- Do not invent a polished JTBD when the research only supports a weak hypothesis.

## How To Apply It Across Artifacts

- Discovery plan: capture the primary JTBD early so research questions, risks, and decision criteria stay tied to the user or team progress that matters.
- PRD: capture the primary user JTBD and use it to shape Must Have scope, requirements, and initiative ordering.
- Epic or roadmap: capture the epic-level JTBD and order initiatives by how directly they unlock that job.
- Ticket: include one primary JTBD that explains the delivery slice being solved.
- Acceptance criteria: include the JTBD in context and ensure the criteria prove progress on that job.

## Examples

- Feature: `When I want to catch up on product updates without checking every day, I want a weekly digest, so I can stay informed on a predictable schedule.`
- Bug: `When I am trying to complete checkout, I want payment submission to work reliably, so I can place my order without retry anxiety.`
- Chore: `When the team ships auth changes, they need dependency updates to be low-risk and repeatable, so they can release safely.`
- Spike: `When the team is choosing an SSO approach, they need enough evidence to compare options, so they can make a confident delivery decision.`
