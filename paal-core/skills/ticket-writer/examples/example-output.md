# Example Output: Ticket Writer

## Single Ticket Output

# Feature Ticket

## Title

[Feature] Add weekly digest email scheduling in notification settings

## Type

feature

## Story / Problem

As a user, I want to control weekly digest emails so that updates arrive on a predictable schedule.

## JTBD

When I want to catch up on product updates without checking the app every day, I want a weekly digest, so I can stay informed on a predictable schedule.

## Scope

- Add digest on/off toggle in notification settings.
- Schedule digest dispatch every Monday at 09:00 in user local time.
- Retry one time on send failure and log failure details.

## Acceptance Criteria

- [ ] Given a user on notification settings, when they enable weekly digest, then the preference is saved and active.
- [ ] Given weekly digest is enabled, when Monday 09:00 user local time is reached, then the digest email is sent exactly once.
- [ ] Given the initial send attempt fails, when retry policy runs, then one retry occurs and failure context is logged if retry also fails.

## Metadata

- Assignee: TBD
- Reporter: PM
- Priority: Medium
- Labels: type:feature, triage
- Component: Notifications
- Epic / Initiative: Engagement Q2
- Estimate: 5 points
- Due Date: TBD

## Tasks

- [ ] Add settings toggle and persistence.
- [ ] Implement schedule trigger and timezone handling.
- [ ] Add retry + logging behavior and automated tests.

## Links / Dependencies

- Related PRD: docs/notification-roadmap.md
- Related designs: Figma notification settings flow
- Related tickets: none
- Blocked by: none

## Out of Scope

- SMS or push notification digests.

## Batch Ticket Output

### Ticket 1

- Title: [Chore] Migrate analytics dashboard queries to the new query layer
- Type: chore
- JTBD: When analysts review dashboard performance, they need reliable data foundations, so they can trust the reported metrics.
- Primary dependency: blocks Ticket 2 and Ticket 3

Acceptance Criteria:

- [ ] Given dashboard widgets use the legacy query layer, when migration is completed, then widgets read from the new query layer.
- [ ] Given migration changes are deployed, when smoke tests run, then critical dashboard views load without errors.

### Ticket 2

- Title: [Feature] Add caching for top dashboard widgets
- Type: feature
- JTBD: When analysts repeatedly check top widgets, they want results to load quickly, so they can assess performance without waiting on refresh delays.
- Primary dependency: depends on Ticket 1

Acceptance Criteria:

- [ ] Given widget query results are available, when top widgets are requested repeatedly, then cached results are served within the target TTL.
- [ ] Given cached data expires, when a new request arrives, then cache refreshes without breaking widget rendering.

### Ticket 3

- Title: [Spike] Validate metric parity and rollout recommendation for dashboard migration
- Type: spike
- JTBD: When the team is deciding whether to complete the dashboard migration, they need evidence on parity and rollout risk, so they can make a confident go/no-go decision.
- Primary dependency: depends on Ticket 1 and references Ticket 2

Acceptance Criteria:

- [ ] Given old and new query outputs, when parity checks run, then metric deltas outside agreed thresholds are documented.
- [ ] Given parity and performance findings, when spike closes, then a clear rollout recommendation is published.
