# Example Output: PRD Writer

## Summary

Increase first-time mobile onboarding completion from 41% to 60% in two quarters by reducing friction in permission and teammate-invite steps for new workspace admins.

## PRD Metadata (Optional)

- Status: Draft
- DRI (Product): Jane Doe
- Design DRI: Priya Shah
- Engineering DRI: Marco Lima
- Last updated: 2026-02-26
- Links: Onboarding dashboard, design draft, epic PAAL-ONB-24

## Business Context and Strategic Fit

### Business goal(s)

- Target metric(s): Onboarding completion -> 60%
- Baseline (today): 41% (Mixpanel funnel, Jan 2026)
- Time horizon: End of Q3 2026

### Why now

Activation has stagnated for two quarters and support volume is rising for first-day setup blockers.

### Expected impact narrative

If we simplify permissions and teammate invite for first-time admins, we expect higher activation and lower early abandonment because users reach collaboration value faster.

## Problem Definition

### User problem statement

First-time admins abandon onboarding when permission prompts and invite steps feel risky or unclear, delaying team setup and reducing activation.

### Evidence snapshot

- Quantitative evidence: 53% drop-off at permission + invite step.
- Qualitative evidence: interview participants reported uncertainty about permission consequences.
- Synthesis input: Research synthesis input RS-12 - cross-source theme that trust and collaboration value are both unclear during setup.

### Constraints and guardrails

- Constraints (hard): no backend identity migration this quarter.
- Guardrails (must not regress): support tickets per new workspace, onboarding p95 latency.

## Users, JTBD, and Journey

### Users

- Primary: first-time workspace admin (mobile)
- Secondary: invited teammate

### JTBD (required; use TBD when unknown)

When I create a workspace for the first time, I want to finish setup quickly and safely, so I can start collaborating with my team right away.

This JTBD should directly inform Must Have scope and initiative ordering.

### Journey (current -> future, required; use TBD when unknown)

- Scenario trigger: user creates a new workspace on mobile.
- Current phases and pain points: account setup -> permission request (confusing) -> invite teammates (high drop-off).
- Future phases and desired experience: setup -> clear permission rationale -> simple invite with progress state.

## Research Log and Open Questions

### Research completed

- Research synthesis input: RS-12 - setup friction synthesis across interviews, support tags, and funnel analytics - docs/discovery/onboarding-setup-synthesis.md
- 7 interviews - trust concerns around permission prompts - research note RN-44
- Support analysis - invite step confusion for new admins - support report SR-19

### Open questions tracker

| Question | Why it matters | Current answer (or TBD) | Owner | Due date |
| --- | --- | --- | --- | --- |
| What legal copy is required for permission prompts? | Affects UX copy and compliance | TBD | Legal partner | 2026-03-05 |
| Who owns experiment dashboard QA? | Required for metric confidence | TBD | Product analytics lead | 2026-03-03 |

## Goals, Non-goals, and Scope

### Goals

- Raise onboarding completion to 60%.
- Improve day-1 activation by 15%.

### Non-goals

- Rebuilding identity/account architecture.

### MoSCoW scope

Rule of thumb: keep Must Have scope lean; if Must looks larger than about 60% of total scope, re-slice before delivery.

#### Must Have

- Rewrite permission step with plain-language rationale.
- Add simplified teammate-invite path in onboarding flow.

#### Should Have

- Add progress indicator for invite completion.

#### Could Have

- Personalized tips after invite completion.

#### Won't Have (this time)

- Backend identity model changes.

## Requirements and Verification

Keep requirements outcome-oriented (what/why). Ticket-level acceptance criteria live on tickets/stories, not in this PRD.

| Req ID | Requirement | MoSCoW | Verification cue (PRD level) | Ticket links (optional) | Notes |
| --- | --- | --- | --- | --- | --- |
| R1 | Users understand why permission is requested before granting it. | Must | Permission-step completion rate increases vs baseline. | PAAL-341 | Copy pending legal review. |
| R2 | Users can invite at least one teammate without leaving onboarding. | Must | Invite-step abandonment drops by 20%. | PAAL-342 | Mobile only in v1. |
| R3 | Users can see setup progress through onboarding steps. | Should | Step-to-step progression rate improves. |  | Added if sprint capacity allows. |

## Dependencies and Stakeholders

### Stakeholders needed for completion

| Team/person | Needed for | When needed | Risk if missing |
| --- | --- | --- | --- |
| Design | Updated permission/invite UX | Sprint planning | Rework and delays |
| Legal | Permission copy approval | Before dev freeze | Compliance risk |
| Analytics | Dashboard + instrumentation QA | Before rollout | Cannot validate outcomes |

### Dependencies

| Dependency | Owner | Needed by | Status | Notes |
| --- | --- | --- | --- | --- |
| Mobile app release window | Mobile eng manager | 2026-04-01 | On track | Align with release 3.8 |
| Legal copy review | Legal partner | 2026-03-05 | At risk | First review not scheduled |

## Success Metrics and Measurement Plan

### Metrics

- Primary metric(s): onboarding completion rate.
- Leading indicators: permission-step completion, invite-step completion.
- Guardrail metrics: day-1 support tickets, onboarding p95 latency.

### Measurement plan

Track funnel metrics in Mixpanel and compare four-week pre/post rollout windows with weekly review.

## Risks and Mitigations

- Risk: Legal copy delay blocks launch. - Mitigation: provide copy options and escalate review by 2026-03-01.
- Risk: Invite step changes increase latency. - Mitigation: profile and cap added API calls before rollout.

## Decision Log (Lightweight)

Log only significant decisions that change scope, experience, dependencies, or success definition.

| Date | Decision | Owner | Rationale | Impacted requirement(s) | Link |
| --- | --- | --- | --- | --- | --- |
| 2026-02-20 | Keep backend identity out of scope for v1. | Product DRI | Preserves Q3 delivery window. | R1, R2 | Decision note DN-12 |
| 2026-02-22 | Prioritize permission clarity before personalization. | Product + Design | Largest measured drop-off is at permissions. | R1 | Research RN-44 |

## Rollout and Initiatives

### Rollout plan

Ship to 10% of new workspaces for one week, then 50%, then 100% if guardrails hold.

### Initiatives

- Initiative: UX and copy locked - 2026-03-08 - Design DRI
- Initiative: Engineering complete - 2026-04-05 - Engineering DRI
- Initiative: Full rollout decision - 2026-04-19 - Product DRI

## Next likely skill(s)

- `acceptance-criteria-extractor`

## What to pass forward

- Requirement IDs R1-R3, the onboarding JTBD, user outcomes, invite-step edge cases, and the legal-copy dependency.

## Suggested next prompts

- "Write ticket-ready acceptance criteria for requirement R2 from this PRD."
- "Turn the onboarding invite requirements into Gherkin checklist acceptance criteria."
