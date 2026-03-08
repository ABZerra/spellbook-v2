# Adoption Guide: Copy Mode (Existing Project Repository)

Use this guide when a project repository already exists and you want to onboard PAAL without a central UI.

## Goal

Set up the project so Codex or ChatGPT can generate documentation artifacts using PAAL core skills and project context, with PR-only writes.

## Prerequisites

- Existing GitHub repository
- Maintainer permissions
- Default branch configured (examples below use `main`)

## 1. Add PAAL as submodule

Run from the project repository root:

```bash
git submodule add https://github.com/ABZerra/PAAL.git paal-core
git submodule update --init --recursive
```

## 2. Create required directories

```bash
mkdir -p .paal \
  org/skills \
  project-context \
  docs/context \
  docs/prd \
  docs/discovery \
  docs/roadmap \
  docs/acceptance-criteria \
  docs/meetings \
  docs/tickets \
  .github/workflows \
  .github/PULL_REQUEST_TEMPLATE
```

## 3. Copy baseline PAAL integration templates

```bash
cp paal-core/references/templates/project-repo/.paal/project.yaml.example .paal/project.yaml
cp paal-core/references/templates/project-repo/.paal/run-template.md .paal/run-template.md
cp paal-core/references/templates/project-repo/project-context/README.md project-context/README.md
cp paal-core/references/templates/project-repo/project-context/project-overview.md project-context/project-overview.md
cp paal-core/references/templates/project-repo/project-context/glossary.md project-context/glossary.md
cp paal-core/references/templates/project-repo/docs/context/project-context-export.md docs/context/project-context-export.md
cp paal-core/references/templates/project-repo/.github/workflows/paal-core-update.yml .github/workflows/paal-core-update.yml
cp paal-core/references/templates/project-repo/.github/workflows/paal-core-policy.yml .github/workflows/paal-core-policy.yml
cp paal-core/references/templates/project-repo/.github/workflows/paal-repo-baseline.yml .github/workflows/paal-repo-baseline.yml
cp paal-core/references/templates/project-repo/.github/workflows/paal-pr-hygiene.yml .github/workflows/paal-pr-hygiene.yml
cp paal-core/references/templates/project-repo/.github/copilot-instructions.md .github/copilot-instructions.md
cp paal-core/references/templates/project-repo/.github/PULL_REQUEST_TEMPLATE/default.md .github/PULL_REQUEST_TEMPLATE/default.md
cp paal-core/references/templates/project-repo/.github/PULL_REQUEST_TEMPLATE/docs.md .github/PULL_REQUEST_TEMPLATE/docs.md
```

Copy at most one overlay and rename it without `.example`:

```bash
cp paal-core/references/templates/project-repo/.github/workflows/paal-node-typescript-overlay.yml.example .github/workflows/paal-node-typescript-overlay.yml
cp paal-core/references/templates/project-repo/.github/workflows/paal-python-overlay.yml.example .github/workflows/paal-python-overlay.yml
```

## 4. Commit onboarding baseline

```bash
git checkout -b chore/paal-onboarding
git add .
git commit -m "chore: onboard PAAL core submodule and contracts"
git push -u origin chore/paal-onboarding
```

Open a PR and merge.

## 5. Configure repository specifics

1. Edit `.paal/project.yaml` values (`project_id`, `display_name`, branch/path overrides, `ci.overlay`, and the `review` block).
2. Confirm default branch in `.github/workflows/paal-core-update.yml`.
3. Enable Actions in repository settings if disabled.
4. Decide whether the repo needs no overlay, the Node/TypeScript overlay, or the Python overlay.
5. Run `python3 paal-core/scripts/check_github_review_setup.py --repo owner/name`.

## 6. Required default governance

1. Protect `main`.
2. Require pull requests for merge.
3. Require these status checks:
   - `Validate PAAL core submodule shape`
   - `Validate PAAL project repo contract`
   - `Docs and config hygiene`
   - `Validate PR metadata`
4. If an overlay is enabled, also require its fast-check job:
   - `Node and TypeScript fast checks`
   - `Python fast checks`
5. Allow GitHub Actions to create pull requests for PAAL core submodule updates.

## 7. Review automation defaults

1. `Codex review` is mandatory through `pr-preparation`.
2. Recommend `1` human approval when another reviewer is available, but do not require it by default for solo repos.
3. Keep `.github/copilot-instructions.md` in the repo.
4. Enable automatic GitHub Copilot review in repository or organization settings when available.
5. Keep `external_tool: auto` in `.paal/project.yaml` so `pr-preparation` uses `superpowers` automatically when the user already has it installed locally, while still proceeding without it.

## 8. First documentation run checklist

1. Fill in `project-context/README.md`, `project-context/project-overview.md`, and `project-context/glossary.md`.
2. Start a feature branch.
3. Run `project-context-bootstrap` if the repo has not yet established a clean context baseline.
4. Run discovery and PRD work inside this repo context as needed.
5. Run Codex or ChatGPT using `.paal/run-template.md`.
   The downstream run contract should surface `paal-core/skills/`, `paal-core/references/`, and `org/skills/` immediately so submodule skills are discoverable from the first run.
6. Review and tailor `docs/context/project-context-export.md` as the initial relay artifact.
7. Write artifacts only under the appropriate `docs/...` path, including `docs/context/` for relay-safe project context exports.
   Transcript-driven post-meeting requests should start at `meeting-artifact-router`, which always generates a meeting summary and then any additional justified outputs in typed folders such as `docs/meetings/`, `docs/prd/`, `docs/acceptance-criteria/`, and `docs/tickets/`.
8. Run `pr-preparation` before opening or updating the PR.
9. Open PR using `default.md` or `docs.md` as appropriate.
10. Confirm these checks pass:
   - `Validate PAAL core submodule shape`
   - `Validate PAAL project repo contract`
   - `Docs and config hygiene`
   - `Validate PR metadata`
11. If an overlay is enabled, confirm its fast-check job also passes.

## 9. Expected steady state

- PAAL core updates arrive as submodule pointer PRs.
- Project docs are generated and reviewed as normal PRs.
- `project-context/` remains the working source of truth and `docs/context/` remains the relay layer to downstream tools.
- No direct edits inside `paal-core/`.
