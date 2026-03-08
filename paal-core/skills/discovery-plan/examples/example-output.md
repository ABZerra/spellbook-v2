# Example Output: Discovery Plan

## Objective
Decide whether to proceed with AI-assisted ticket triage for pilot rollout in Q3.

## Evidence Synthesis
- Research question: what prevents support teams from trusting assisted ticket prioritization?
- Converging themes: agents need auditable rationale and visible override control before they trust automated urgency labels.
- Contradictions or segment differences: experienced agents want reviewability first, while newer agents are more willing to accept automation earlier.
- Gaps and unknowns: compliance rules for model-bound ticket data remain unresolved.
- Source notes: interview themes, historical queue analysis, and workflow observations from the support team.

## JTBD
Primary JTBD: When support teams triage a new queue of incoming tickets, they want reliable priority guidance, so they can focus attention on the most urgent cases without re-sorting everything manually.

## Questions to Answer
- Can we achieve at least 85% priority-classification precision?
- What PII controls are mandatory for model inputs and logs?
- Do support agents improve handling time with assisted triage?

## Risks and Assumptions
- Risk: weak auditability could cause agent rejection even if model precision is acceptable.
- Assumption: newer agents will adopt assisted triage faster than experienced agents.

## Research Activities
- Offline evaluation on anonymized historical tickets (owner: PM, week 1).
- Compliance review with legal/security (owner: Ops, week 1).
- Agent usability interviews with clickable prototype (owner: UX, week 2).

## Initiatives
- Initiative 1: Baseline model evaluation complete.
- Initiative 2: Compliance constraints approved.
- Initiative 3: Pilot go/no-go decision.

## Decision Criteria
- Assisted triage must meet precision and auditability thresholds without violating compliance constraints.

## Deliverables
- Pilot recommendation with evidence summary and open compliance blockers.

## Next likely skill(s)
- `prd-writer`

## What to pass forward
- Objective, JTBD, validated assumptions, open compliance questions, and target pilot timing.

## Suggested next prompts
- "Create a feature-level PRD from this discovery plan."
- "Turn this validated scope into a PRD with goals, guardrails, and success metrics."
