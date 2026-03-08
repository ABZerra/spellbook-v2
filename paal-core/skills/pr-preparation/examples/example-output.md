# Example Output: PR Preparation

## Readiness
- Commit readiness: Ready.
- PR readiness: Ready to open as a draft PR while staging validation is still pending.

## Change Summary
- What changed: onboarding invite retry handling and step completion behavior
- Why it changed: reduce invite-step failures without forcing the user to restart onboarding

## Verification Run
- Checks completed: `npm run lint`, `npm run test -- invite-flow`
- Checks intentionally skipped: none

## Missing Verification
- Manual staging validation for duplicate-invite prevention and rapid retry cleanup

## Codex Review Findings
- No blocking correctness issue found in the described diff.
- Reviewer attention should stay on retry-state cleanup and duplicate-invite prevention because those risks are only partially covered by current verification.

## Reviewer Focus
- Retry-state cleanup after repeated clicks
- Duplicate-invite prevention

## Risk Hotspots
- Known risk: duplicate invite edge cases may still fail outside the targeted test path
- Follow-up work: capture staging validation notes before converting the PR from draft to open

## Draft Commit Summary
- Add onboarding invite retry handling and completion updates

## Draft PR Summary

### Summary

Adds retry handling for onboarding invites and updates step completion behavior after a successful invite.

### Tests

Ran `npm run lint` and `npm run test -- invite-flow`. Manual staging validation is still pending for duplicate-invite prevention.

### Risks

Rapid repeated-click cleanup still needs staging confirmation.

### Reviewer Focus

Please pay extra attention to retry-state cleanup and duplicate-invite prevention.

## PR Automation
- Mode: `PR action mode`
- Status: Draft PR created or updated because the user explicitly asked to open the PR while one manual validation step remains.
- PR URL or draft note: `https://github.com/example/repo/pull/42`

## Review Automation
- Reviewer request status: requested `example/team-platform`
- GitHub AI review status: recommended and settings-driven; repository or organization Copilot auto-review should handle any automatic bot review
- External review tool status: auto-detected `superpowers` and ran an extra local review pass through `requesting-code-review`; the PR flow would still continue without it if the install were absent

## Next likely skill(s)
- `gh-fix-ci` if GitHub Actions fail after the PR opens
- `gh-address-comments` if reviewer feedback arrives

## What to pass forward
- PR URL, checks completed, missing staging validation note, Codex review findings, reviewer focus areas, and PR summary draft

## Suggested Next Prompts
- "Re-check readiness after I complete the staging validation and update the PR."
- "Request another review pass once the draft PR has fresh commits."
