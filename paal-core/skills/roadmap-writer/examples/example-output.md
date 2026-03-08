# Example Output: roadmap-writer

## Scenario A: Roadmap mode (`roadmap`)

# Product Roadmap: Workspace Product (Q2-Q3 2026)

## Roadmap Metadata

- Status: Draft
- Planning window: Q2-Q3 2026
- Last updated: 2026-02-26
- Owner: Product leadership
- Prioritization approach: MoSCoW (selected because scope-shaping context was provided without effort-impact scoring)
- Additional frameworks to consider: MoSCoW, 2x2, Eisenhower, RICE

## Epic Portfolio

### Epic: Improve onboarding activation

- Objective: Increase first-week admin activation from 41% to 60%.
- JTBD: When a first-time admin creates a workspace, they want to finish setup quickly and safely, so they can start collaborating right away.
- Owner: Product DRI (TBD)
- Status: In Review
- Priority approach and rating: Must Have (MoSCoW)
- Dependencies: Mobile release 3.8, analytics dashboard instrumentation
- Links: PRD-ONB-24
- Optional time window: Q2 2026

#### Initiatives

- Initiative: Simplify permission rationale content (optional window: early Q2)
- Initiative: Redesign invite teammate step (optional window: mid Q2)
- Initiative: Add activation funnel quality checks (optional window: late Q2)

### Epic: Strengthen reporting reliability

- Objective: Reduce weekly dashboard data mismatch incidents by 50%.
- JTBD: When analysts review weekly performance, they want trustworthy dashboards, so they can make decisions without manual reconciliation.
- Owner: Engineering DRI (TBD)
- Status: Draft
- Priority approach and rating: Should Have (MoSCoW)
- Dependencies: Data pipeline SLA updates, alerting ownership
- Links: Incident review IR-92
- Optional time window: Q3 2026

#### Initiatives

- Initiative: Add schema-change compatibility guardrails (optional window: early Q3)
- Initiative: Introduce dashboard freshness monitoring (optional window: mid Q3)

## Scenario B: Epic-only mode (`epic-only`)

# Epic: Billing self-serve controls

## Epic Metadata

- Status: Draft
- Owner: Product DRI (TBD)
- Optional time window: Q3 2026
- Prioritization approach: 2x2 (selected because impact-vs-effort context was provided)
- Additional frameworks to consider: MoSCoW, 2x2, Eisenhower, RICE
- Links: PRD-BILL-08, finance policy doc

## JTBD

Primary JTBD: When admins need to manage billing without opening a support case, they want self-serve controls for the common tasks, so they can keep the workspace running without delay.

## Objective and Success Signal

Enable admins to complete core billing tasks without support intervention and reduce billing-related support tickets by 30%.

## Dependencies

- Finance sign-off on invoice policy wording.
- Backend entitlement API updates.

## Initiatives

- Initiative: Self-serve invoice download for admins (optional window: early Q3)
- Initiative: Payment method update flow with audit trail (optional window: mid Q3)
- Initiative: Subscription change confirmation with cost delta preview (optional window: late Q3)

## Open Questions

- Which billing actions require extra role checks beyond admin?
- Do we need regional tax disclosure variants in v1?
