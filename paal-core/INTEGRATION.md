# PAAL Integration Guide (No UI)

This guide defines how to use PAAL across multiple project repositories without building a central UI.

This guide describes consumer project repositories, not PAAL core's own internal layout.

PAAL core remains a single toolkit repo:

- skill fixtures live under `skills/*/examples/`
- self-hosted generated artifacts live under `docs/outputs/`

Consumer project repositories use semantically named folders under `docs/`.

## 1. Responsibilities and Boundaries

- PAAL core repository:
  - Owns reusable skills, references, templates, and validation rules.
  - Must remain project-agnostic.
- Project repositories:
  - Own project context and generated artifacts.
  - May add organization-specific skills outside core.

### Read-only boundary for core

In each project repository, PAAL is mounted as a git submodule at `paal-core/`.

Rules:

1. Do not edit files inside `paal-core/` directly.
2. Update core only by bumping the submodule pointer via PR.
3. Keep customizations in `org/skills/` and `project-context/`.
4. Treat `project-context/` as the maintained working source of truth for project context.

## 2. Required Project Contract

Each project repository should include:

1. `.paal/project.yaml` from `references/templates/project-repo/.paal/project.yaml.example`
2. `.paal/run-template.md` from `references/templates/project-repo/.paal/run-template.md`
3. `.github/copilot-instructions.md` from `references/templates/project-repo/.github/copilot-instructions.md`
4. Default PAAL workflows under `.github/workflows/`
5. Default PR templates under `.github/PULL_REQUEST_TEMPLATE/`
6. Required context files under `project-context/`
7. `docs/` directory with type-based folders

Required project context files:

- `project-context/README.md`
- `project-context/project-overview.md`
- `project-context/glossary.md`

Required output folders:

- `docs/context/`
- `docs/prd/`
- `docs/discovery/`
- `docs/roadmap/`
- `docs/acceptance-criteria/`
- `docs/meetings/`
- `docs/tickets/`

Required workflow files:

- `.github/workflows/paal-core-policy.yml`
- `.github/workflows/paal-core-update.yml`
- `.github/workflows/paal-repo-baseline.yml`
- `.github/workflows/paal-pr-hygiene.yml`

Required PR templates:

- `.github/PULL_REQUEST_TEMPLATE/default.md`
- `.github/PULL_REQUEST_TEMPLATE/docs.md`

Required review asset:

- `.github/copilot-instructions.md`

Optional overlay workflow files:

- `.github/workflows/paal-node-typescript-overlay.yml`
- `.github/workflows/paal-python-overlay.yml`

## 3. Repo-native Assistant Workflow (Codex and ChatGPT)

For each documentation run:

1. Open the target project repository.
2. Ensure the PAAL submodule is present and up to date.
3. Seed and maintain structured project context under `project-context/`, usually before discovery or PRD work begins.
4. Run the assistant with `.paal/run-template.md` as the execution contract.
   In downstream repos, the first search roots should be `paal-core/skills/`, `paal-core/references/`, and `org/skills/`.
   Skill choice should be intent-first and automatic: for product-oriented requests, PAAL skills are the default router; Codex/superpower skills are mainly implementation and review support.
5. Write generated markdown files under the intended `docs/` subdirectory, including `docs/context/` for relay-safe project context exports.
   Transcript-driven post-meeting requests should start at `meeting-artifact-router`, which always emits a meeting summary and may also emit multiple additional outputs from the same transcript, but each output must still land in its typed folder (`docs/meetings/`, `docs/discovery/`, `docs/prd/`, `docs/acceptance-criteria/`, `docs/tickets/`).
6. Run `pr-preparation` so Codex review, PR summary drafting, and optional PR mutation happen in one workflow.
7. Open or update a PR using the default or docs template with the required headings.

This keeps every artifact versioned and reviewable in the project repository.
Discovery and PRD work are expected to happen inside this repo context while using the PAAL core submodule.

## 4. Onboarding Checklist

1. Add PAAL submodule (`paal-core/`).
2. Copy `.paal` templates into the project repo.
3. Copy required `project-context/` seed files.
4. Create typed `docs/` folders.
5. Copy the starter relay artifact `docs/context/project-context-export.md` if the project wants an initial shareable export scaffold.
6. Copy default workflows:
   - `paal-core-policy.yml`
   - `paal-core-update.yml`
   - `paal-repo-baseline.yml`
   - `paal-pr-hygiene.yml`
7. Copy both default PR templates:
   - `default.md`
   - `docs.md`
8. Copy `.github/copilot-instructions.md`.
9. Copy at most one optional overlay workflow:
   - Node/TypeScript
   - Python
   - none
10. Confirm CI passes for the baseline PAAL status checks.
11. Audit review setup with `python3 paal-core/scripts/check_github_review_setup.py --repo owner/name`.

## 5. Required default governance

1. Protect `main`.
2. Require pull requests for merge.
3. Require these status checks:
   - `Validate PAAL core submodule shape`
   - `Validate PAAL project repo contract`
   - `Docs and config hygiene`
   - `Validate PR metadata`
4. If an overlay is enabled, also require the overlay fast-check job:
   - `Node and TypeScript fast checks`
   - `Python fast checks`
5. Allow GitHub Actions to create pull requests for PAAL core submodule updates.

## 6. Review automation defaults

- `Codex review` is mandatory through `pr-preparation`.
- Recommend `1` human approval when available, but do not require it by default for solo repos.
- Keep the `review` block in `.paal/project.yaml`.
- Keep `.github/copilot-instructions.md` in the project repo.
- Enable automatic GitHub Copilot review in repo or organization settings when available.
- Default `external_tool: auto` lets `pr-preparation` use `superpowers` automatically when the user has it installed locally, while continuing normally when it is absent.
- Run `python3 paal-core/scripts/check_github_review_setup.py --repo owner/name` after onboarding and after major GitHub governance changes.

## 7. Troubleshooting

### Submodule update PR has no changes

- Ensure new PAAL tags exist.
- Verify `paal_remote` and `submodule_path` inputs.
- Confirm the project already tracks an older PAAL commit.

### Policy check fails: core path is not submodule mode

- Verify `paal-core` is tracked as git mode `160000`.
- Re-add submodule if needed and commit pointer correctly.

### Generated docs rejected on push

- Docs under `docs/` must reach protected branches via PR.
- Commit to a feature branch and merge through pull request.
- Meeting-router outputs should stay in typed folders under `docs/` rather than a custom per-meeting bundle root.

### PR metadata check fails

- Ensure the PR body contains `## Summary`, `## Tests`, `## Risks`, and `## Reviewer Focus`.
- If `docs/` changed, also include `### Skills used`, `### Source context files`, `### Output artifacts`, and `### Acceptance checks`.

## 8. Optional Local Slack MCP Pull Integration

Use this mode when Codex should query Slack on demand from a local machine without Slack-triggered bot automation.

- Runbook: `references/integrations/slack/mcp-pull-mode.md`
- Behavior contract: `references/integrations/slack/mcp-pull-contract.md`

Default constraints:

1. Single configured workspace in v1.
2. Local runtime only (no always-on listener requirement).
3. Posting allowed only on explicit prompt intent.
4. Workspace mismatch from shared Slack links must fail fast with remediation guidance.

If PAAL is the primary workspace on a workstation, apply the `PAAL-first workstation defaults (macOS)` section in `references/integrations/slack/mcp-pull-mode.md` so `codex` starts in PAAL by default and Codex Desktop opens in PAAL at login.

Bot reply default for this mode:

1. Use `scripts/slack_post_message.py` for channel posts and thread replies.
2. Script default identity is `bot` using `SLACK_BOT_TOKEN`.
3. Store `SLACK_BOT_TOKEN` in login keychain (`CODEX_SLACK_BOT_TOKEN`) and load it into session env at login.
4. Use `--identity user` only when you explicitly want reply attribution as the user.
