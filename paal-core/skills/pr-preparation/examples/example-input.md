# Example Input: PR Preparation

Prepare and open the PR for this branch if the change is ready.

Current change:
- Added invite retry handling for onboarding step 3.
- Updated the invite success state to mark the step complete.
- Added targeted tests for the happy path and retry behavior.

Checks already run:
- `npm run lint`
- `npm run test -- invite-flow`

Checks not yet run:
- manual staging validation for duplicate-invite prevention

Known risk:
- retry cleanup after rapid repeated clicks still needs staging confirmation

Review config from `.paal/project.yaml`:
- `codex_review: required`
- `recommended_human_approvals: 1`
- `reviewer_handles: ["example/team-platform"]`
- `github_ai_review: recommended`
- `external_tool: auto`
