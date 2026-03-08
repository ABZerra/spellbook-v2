# Example Input: PR Preparation Readiness Only

Check whether this branch is ready for PR prep, but do not open or update any PR yet.

Current change:
- Added a project settings save indicator.
- Added form-state tests around failed saves and retry behavior.

Checks already run:
- `pnpm lint`
- `pnpm test -- settings-form`

Checks not yet run:
- manual browser validation on slow network conditions

Known risk:
- the save indicator may flicker on rapid retries

Review config from `.paal/project.yaml`:
- `codex_review: required`
- `github_ai_review: recommended`
- `external_tool: auto`
