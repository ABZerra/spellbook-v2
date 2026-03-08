# Example Output: Acceptance Criteria Extractor

## Ticket / Story Context
- Ticket/Story ID: PAAL-342
- Linked PRD requirement(s): R2
- JTBD: When a first-time admin sets up a workspace, they want to invite teammates during onboarding, so they can start collaborating right away.
- User outcome summary: Invite at least one teammate during onboarding.

## Preconditions
- Authenticated first-time workspace admin is on onboarding step 3.

## Criteria (Gherkin Checklist)
- [ ] Given the user is on step 3, when they enter a valid teammate email and tap Send Invite, then an invite is created and the step is marked complete.
- [ ] Given an invite is sent successfully, when the user remains on onboarding, then they see confirmation and can continue to the next step.
- [ ] Given a network failure during send, when the user retries, then the system attempts the invite again and does not create duplicate invites.

## Edge Cases (Gherkin Checklist)
- [ ] Given an invalid email format, when the user attempts to send an invite, then send is blocked and an inline validation message is shown.
- [ ] Given an email that is already invited, when the user attempts to send again, then the UI shows a clear already-invited state.

## Notes
- Invitation delivery service must be reachable in staging for validation.

## Next likely skill(s)
- `repo-bootstrap`

## What to pass forward
- Ticket ID PAAL-342, the onboarding invite JTBD, retry behavior, and staging validation needs.

## Suggested next prompts
- "Create a repo bootstrap plan for implementing this onboarding invite flow."
- "Recommend a lightweight repo structure and validation baseline for this feature work."
