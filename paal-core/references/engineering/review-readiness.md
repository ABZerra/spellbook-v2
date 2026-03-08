# Review Readiness

## Make The Diff Easy To Read

- Keep unrelated changes out of the same branch when practical.
- Separate mechanical updates from behavior changes if the combined diff would hide risk.
- Name files and sections so reviewers can tell where UI, domain, and configuration work live.

## Give Reviewers Context Up Front

A good review summary should answer:

- What changed?
- Why now?
- How was it verified?
- Where is the risk?

## Draft Reviewer Focus Areas

Call out the parts that deserve extra attention:

- risky edge cases
- domain rule changes
- API contract updates
- migrations or rollout toggles

This helps both humans and AI review tools spend effort in the right place.

## Include Honest Risk Notes

- Mention known gaps instead of hoping reviewers will infer them.
- Mark follow-up work that is intentionally deferred.
- Note any missing verification so reviewers can judge whether the tradeoff is acceptable.

## Use AI Review Tools Well

- Feed them clean PR summaries and explicit test notes.
- Keep prompts focused on bug risk, regressions, and missing checks.
- Do not assume the tool understands project conventions unless those conventions are documented in the repo.
