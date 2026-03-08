# PR Review Automation

This reference defines how PAAL handles PR preparation and review automation without overclaiming what GitHub or external tools can guarantee.

## Defaults

- `Codex review` is mandatory inside `pr-preparation`.
- `GitHub Copilot review` is recommended and should be audited, not assumed.
- `1` human approval is recommended when available, but not enforced by default for solo workflows.
- `superpowers` is optional, external, user-managed, and auto-detected when downstream config allows it.

## Automation split

### Codex

- Review the local diff before finalizing PR output.
- Call out correctness risks, regressions, missing verification, and reviewer hotspots.
- Draft the commit summary and PR body.

### GitHub CLI

- Create or update the PR when the user explicitly wants PR action.
- Request configured human or team reviewers when `reviewer_handles` are defined.
- Never assume GitHub CLI can enable repository-wide AI review settings on its own.

### GitHub settings

- Enable automatic Copilot review when the repository or organization supports it.
- Use `.github/copilot-instructions.md` to improve Copilot review quality.
- Treat missing Copilot auto-review as an advisory setup gap, not a workflow failure.

### External tools

- `superpowers` can be used as an optional extra review layer before or after a PR update.
- PAAL does not vendor, install, or depend on `superpowers`.
- Downstream repos should default to `external_tool: auto` so `pr-preparation` uses `superpowers` automatically when it is available locally.
- `external_tool: none` disables it entirely.
- `external_tool: superpowers` keeps the same behavior but makes the preference explicit.
- Detect availability in this order:
  - the current session exposes the `requesting-code-review` skill
  - `~/.agents/skills/superpowers/requesting-code-review/SKILL.md` exists
  - `~/.codex/superpowers/skills/requesting-code-review/SKILL.md` exists
- If no local install is available, continue with Codex review only and record that the optional layer was skipped.

## Operational policy

- Keep PR automation inside `pr-preparation` so readiness, review, and PR mutation stay in one workflow.
- Only mutate GitHub PR state when the user intent is clearly PR-action oriented.
- If GitHub auth is unavailable, fall back to a non-mutating PR-preparation report.
- If `superpowers` is auto-detected, use it automatically through `requesting-code-review` as an additional local review pass without making the workflow depend on it.
- Keep required merge governance in GitHub rulesets or branch protection, not in skill prose.

## Sources

- [GitHub Copilot code review](https://docs.github.com/en/copilot/concepts/code-review)
- [Configure automatic review](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/request-a-code-review/configure-automatic-review)
- [Adding repository custom instructions for GitHub Copilot](https://docs.github.com/en/copilot/customizing-copilot/adding-custom-instructions/adding-repository-custom-instructions-for-github-copilot)
- [obra/superpowers](https://github.com/obra/superpowers)
