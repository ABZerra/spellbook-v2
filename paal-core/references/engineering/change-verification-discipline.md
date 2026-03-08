# Change Verification Discipline

## Before Commit

Confirm the change is coherent on its own.

- The diff has a single clear purpose.
- The relevant fast checks ran, or there is a documented reason they did not.
- Generated files or indexes are updated when required.
- The change summary is understandable without re-reading the entire diff.

## Before Pull Request

Confirm the change is ready for someone else to review.

- The branch passes the intended validation checks.
- The PR summary explains what changed and why.
- Tests or verification notes are explicit.
- Known risks, follow-ups, or missing work are called out.
- Reviewer focus areas are stated when parts of the diff deserve extra attention.

## What Belongs In CI

Put deterministic, high-signal rules in CI:

- validation scripts
- generated-file drift
- linting
- type checks
- fast tests
- PR hygiene checks

Keep heavier or slower checks separate through manual or scheduled workflows when they would slow down normal PR feedback loops.

## What Stays In A Human Checklist

Keep judgment calls outside strict CI:

- whether the change boundary is right-sized
- whether the summary explains the intent well
- whether reviewer focus areas are clear
- whether the rollout or risk notes are honest enough

## Readiness Outcomes

- `Commit ready`: the change can be recorded locally without hiding obvious verification gaps.
- `PR ready`: the change is reviewable by someone else with clear context and supporting checks.
- `Not ready`: missing verification, unclear risk, or poor reviewability still needs attention.
