---
name: pr-preparation
description: Use when preparing a change for commit or a pull request, especially when you need verification, a mandatory Codex review pass, review-ready PR content, or help opening/updating the PR. Do not use for implementing the change itself or debugging failing GitHub Actions runs.
version: 0.1.0
owner: Alvaro Bezerra
---

# Purpose

Evaluate whether a change is ready for commit or PR preparation, run a mandatory Codex review pass, and optionally create or update the PR when the user explicitly wants PR action.

# When to use

- A meaningful diff exists and the next question is whether it is ready to commit.
- A branch is about to open or update a PR and needs concise preparation help.
- The user wants draft commit or PR summaries, reviewer automation, or missing-check guidance.

# When NOT to use

- The primary task is still implementing the change.
- The task is to debug failing GitHub Actions runs.
- The task is to respond to review comments already left on a PR.

# Inputs

- Current repo state, branch state, or diff summary.
- Checks already run and checks still missing.
- Known risks, rollout notes, or reviewer concerns.
- Optional PR template or repo-specific verification conventions.
- Optional `.paal/project.yaml` review metadata.
- Optional existing PR URL or PR number.
- Optional indication that the user wants actual PR mutation.
- Optional local `superpowers` availability through the `requesting-code-review` skill or a known install path.

# Outputs

- A PR-preparation report in Markdown using `references/templates/change_preflight_template.md`.
- Separate `commit readiness` and `PR readiness` states.
- Mandatory `Codex review findings`.
- Missing verification, reviewer focus, risk hotspots, and a draft PR summary.
- `PR automation status`, `reviewer request status`, `GitHub AI review status`, and `external review tool status`.
- A closing handoff section with `Next likely skill(s)`, `What to pass forward`, and `Suggested next prompts`.

# Workflow

1. Step 0: If relevant, read `references/engineering/change-verification-discipline.md`, `references/engineering/review-readiness.md`, `references/engineering/pr-review-automation.md`, `references/workflows/ai-product-delivery-flow.md`, `references/templates/change_preflight_template.md`, and `references/templates/pull_request_template.md`.
2. Inspect the current repo state, changed files, diff summary, verification evidence, and local review metadata if present.
3. Run a mandatory Codex review pass focused on correctness, regression risk, missing verification, risky behavior changes, and unclear reviewer hotspots.
4. Decide `commit readiness` and `PR readiness` separately; do not assume they are the same.
5. Compare the available checks against the guidance in `references/engineering/change-verification-discipline.md` and call out deterministic gaps clearly.
6. Draft review-readiness notes: reviewer focus, risk hotspots, and a concise PR summary that another person or AI review tool can follow.
7. Determine mode:
   - stay in `Readiness mode` when the user only wants readiness or draft output
   - enter `PR action mode` when the user explicitly asks to open, create, update, or prepare the actual PR
8. In `PR action mode`:
   - verify `gh` auth
   - inspect whether a PR already exists for the current branch
   - update the PR if it already exists
   - create the PR if it does not exist
   - if `PR readiness` is `Not ready` but the user explicitly wants the PR opened, create or update it as draft
   - if `PR readiness` is `Ready`, create or update it as an open PR
9. Reviewer and AI-review behavior:
   - request `reviewer_handles` with `gh` when local review metadata defines them
   - skip reviewer requests when none are configured and state that clearly
   - always mention that `1` human approval is recommended when available
   - if `github_ai_review: recommended`, note that repository or organization settings should enable automatic Copilot review
   - determine external review behavior from local config:
     - `external_tool: none` disables external review
     - `external_tool: auto` means auto-detect `superpowers`
     - `external_tool: superpowers` means prefer `superpowers` explicitly
   - detect `superpowers` availability in this order:
     - the current session exposes the `requesting-code-review` skill
     - `~/.agents/skills/superpowers/requesting-code-review/SKILL.md` exists
     - `~/.codex/superpowers/skills/requesting-code-review/SKILL.md` exists
   - when `external_tool` is `auto` or `superpowers` and `superpowers` is available locally, run that extra review pass automatically via `requesting-code-review` before finalizing the output
   - when `superpowers` is configured or auto-detected but unavailable locally, continue without blocking and state that the optional layer was skipped
10. Route follow-up work when appropriate:
   - recommend `gh-address-comments` if review feedback exists
   - recommend `gh-fix-ci` if GitHub Actions fail
11. End with the canonical handoff fields:
   - `Next likely skill(s)`
   - `What to pass forward`
   - `Suggested next prompts`

# Examples

- PR action mode input example: `skills/pr-preparation/examples/example-input.md`
- PR action mode output example: `skills/pr-preparation/examples/example-output.md`
- Readiness mode input example: `skills/pr-preparation/examples/example-input-readiness-only.md`
- Readiness mode output example: `skills/pr-preparation/examples/example-output-readiness-only.md`
