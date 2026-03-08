# Adoption Guide: Template Mode (New Project Repository)

Use this guide when creating a new project repository that should start PAAL-ready from day one.

## Goal

Create a reusable project template repository with PAAL submodule integration, contracts, and governance defaults already included.

## 1. Create baseline project template repository

Recommended baseline layout:

```text
.
├── paal-core/                 # git submodule
├── .paal/
│   ├── project.yaml
│   └── run-template.md
├── org/skills/
├── project-context/
│   ├── README.md
│   ├── project-overview.md
│   └── glossary.md
├── docs/
│   ├── context/
│   ├── prd/
│   ├── discovery/
│   ├── roadmap/
│   ├── acceptance-criteria/
│   ├── meetings/
│   └── tickets/
└── .github/
    ├── workflows/
    │   ├── paal-core-update.yml
    │   ├── paal-core-policy.yml
    │   ├── paal-repo-baseline.yml
    │   ├── paal-pr-hygiene.yml
    │   └── paal-<overlay>.yml   # optional, copy zero or one overlay
    ├── copilot-instructions.md
    └── PULL_REQUEST_TEMPLATE/
        ├── default.md
        └── docs.md
```

## 2. Bootstrap the template repository

```bash
git init
git checkout -b main
git submodule add https://github.com/ABZerra/PAAL.git paal-core
git submodule update --init --recursive
mkdir -p .paal org/skills project-context docs/{context,prd,discovery,roadmap,acceptance-criteria,meetings,tickets} .github/workflows .github/PULL_REQUEST_TEMPLATE
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
git add .
git commit -m "chore: bootstrap PAAL-ready project template"
```

Push to GitHub and mark as a template repository.

If the template should include an overlay, copy at most one of these files and rename it without `.example`:

```bash
cp paal-core/references/templates/project-repo/.github/workflows/paal-node-typescript-overlay.yml.example .github/workflows/paal-node-typescript-overlay.yml
cp paal-core/references/templates/project-repo/.github/workflows/paal-python-overlay.yml.example .github/workflows/paal-python-overlay.yml
```

## 3. Required default governance

1. Protect `main` branch.
2. Require pull requests for merge.
3. Require status checks:
   - `Validate PAAL core submodule shape`
   - `Validate PAAL project repo contract`
   - `Docs and config hygiene`
   - `Validate PR metadata`
4. If an overlay is enabled, also require its fast-check job:
   - `Node and TypeScript fast checks`
   - `Python fast checks`
5. Allow GitHub Actions to create pull requests.

## 4. New project creation from template

When creating a new project from this template:

1. Update `.paal/project.yaml` metadata.
2. Confirm the `ci.overlay` value reflects the copied overlay (`none`, `node-typescript`, or `python`).
3. Keep the `review` block aligned with your workflow defaults.
4. Fill in `project-context/README.md`, `project-context/project-overview.md`, and `project-context/glossary.md`.
5. Optionally add custom skills under `org/skills/`.
6. Run `python3 paal-core/scripts/check_github_review_setup.py --repo owner/name`.
7. Run `project-context-bootstrap` if the context baseline still needs structure.
8. Run discovery and PRD work inside this repo context as needed.
9. Review and tailor `docs/context/project-context-export.md` as the initial relay artifact.
10. Run first docs generation PR to validate end-to-end flow, including `docs/context/` when relaying project context downstream.
    Transcript-driven post-meeting requests should start at `meeting-artifact-router`, which always emits a meeting summary and should still land additional outputs in typed folders, with ticket drafts under `docs/tickets/`.

## 5. Review automation defaults

- `Codex review` is mandatory through `pr-preparation`.
- Recommend `1` human approval when another reviewer exists, but do not require it by default for solo repos.
- Keep `.github/copilot-instructions.md` in the template so GitHub Copilot review has repository guidance.
- Enable automatic GitHub Copilot review in repository or organization settings when available.
- Keep `external_tool: auto` in `.paal/project.yaml` so `pr-preparation` uses `superpowers` automatically when the user has it installed locally, while still proceeding without it.

## 6. Maintenance model

- Keep PAAL version current by merging `paal-core-update` PRs.
- Keep all generated docs in the appropriate `docs/` subdirectory.
- Keep meeting-router outputs in typed paths such as `docs/meetings/`, `docs/prd/`, `docs/acceptance-criteria/`, and `docs/tickets/`.
- Keep `project-context/` as the maintained source of truth and use `docs/context/` for Markdown relay artifacts.
- Keep PAAL core read-only inside project repositories.
