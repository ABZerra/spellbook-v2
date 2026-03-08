# PAAL Skills Kit (v1)

Portable product and delivery workflows plus shared references, designed for Codex-first authoring.

## What this repository is

This repository stores reusable skills in a portable structure that can be copied to other teams or projects. Each skill is a single-purpose workflow with strict trigger boundaries.

PAAL core is a single toolkit repo, not a product monorepo. It owns reusable skills, references, templates, validation, and automation. Project-specific modularity belongs in downstream repos that consume PAAL as a submodule and add product, design, business, and delivery-surface context.

## No-UI Multi-Repo Model

PAAL remains the authoritative source of truth for skills and templates. Project repositories consume PAAL through a `paal-core` git submodule and generate project-specific documents locally via Codex or ChatGPT.

Responsibilities are split as follows:

- PAAL (`this` repo): core skills, references, templates, validation, reusable automation.
- Project repositories: project context, organization-specific extensions, generated docs, and any product-specific code structure.

See [INTEGRATION.md](INTEGRATION.md) for full operational guidance.

## Artifact Locations

PAAL core uses distinct artifact locations:

- `skills/*/examples/`: canonical committed fixtures that document each skill's expected input and output shape.
- `docs/outputs/`: PAAL-core self-hosted generated artifacts when PAAL is used on PAAL.
- `docs/`: semantically named committed artifact folders for downstream project repositories that consume PAAL.

## Canonical Project Repository Layout

The layout below describes a consumer project repository, not PAAL core itself.

```text
.
├── paal-core/                 # git submodule (read-only in practice)
├── org/skills/                # org or project-specific skill extensions
├── project-context/           # structured project context files and source of truth
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
└── .paal/
    ├── project.yaml
    └── run-template.md
```

## Documentation Output Policy

Generated documentation should be committed as files through pull requests, never as chat-only output.

PAAL core stores its own self-hosted artifacts under `docs/outputs/`. Consumer project repositories use typed folders under `docs/`:

- `docs/prd/*.md`
- `docs/discovery/*.md`
- `docs/context/*.md`
- `docs/roadmap/*.md`
- `docs/acceptance-criteria/*.md`
- `docs/meetings/*.md`
- `docs/tickets/*.md`

Research synthesis remains a discovery input in PAAL core rather than a new permanent artifact family.

## Quick start

1. Clone the repository.
2. Add or edit skills with Codex and/or scripts.
3. Run `make validate`.
4. Commit and push.

## Use with Codex

Common prompts:

- Create a new skill called `<name>` using repo standards, add examples.
- Route this completed meeting transcript into the right post-meeting artifacts using `meeting-artifact-router`.
- Produce only a summary, decisions list, and action items from these meeting notes using `meeting-output-writer`.
- Synthesize mixed discovery evidence into one discovery-ready input using `research-synthesis`.
- Tighten the skill description so it triggers only when `<X>` and never when `<Y>`.
- Update references docs with `<new policy/definitions>` and adjust dependent skills.
- Create a repo bootstrap plan for `<project>` using `repo-bootstrap`, then seed the repo-native project context using `project-context-bootstrap`.
- Review these changes and prepare or open/update the PR using `pr-preparation`.
- Generate a delivery ticket with embedded acceptance criteria using `ticket-writer`.
- Run validation and fix issues.

## Additional workflows

PAAL also supports adjacent delivery workflows when they benefit from the same skill-plus-template model:

- Repo setup for AI-assisted work.
- Repo-native project context bootstrap with Markdown relay outputs.
- meeting-driven routing into downstream discovery, PRD, acceptance criteria, and ticket artifacts.
- mixed-source research synthesis that feeds discovery and PRD work without creating a new top-level artifact family.
- Lightweight AI coding conventions and repo-local onboarding notes.
- Commit and pull request preflight checks.
- Review-readiness guidance and GitHub Actions starter workflows.
- PR review automation with mandatory Codex review and optional GitHub-native AI review guidance.
- Local Slack MCP pull mode for on-demand Codex context fetch (no Slack bot listener).

## Downstream CI defaults

PAAL core validates its own structured artifacts with repository validators and generated-index checks. Downstream project-repo templates now ship with a universal CI baseline and PR hygiene workflows by default, while deeper application checks come from optional Node/TypeScript or Python overlays.

## Downstream review defaults

Downstream project-repo templates also ship with lightweight PR review automation defaults: `pr-preparation` requires a Codex review pass, `.github/copilot-instructions.md` gives GitHub Copilot repository guidance, and `.paal/project.yaml` records review preferences such as recommended human approvals and auto-detected optional external tools like `superpowers`.

## Included skills

- `acceptance-criteria-extractor`: Turn source requirements or flows into testable acceptance criteria.
- `pr-preparation`: Review a change, prepare PR-ready content, and optionally open or update the PR with reviewer automation notes.
- `discovery-plan`: Build a structured discovery plan with questions, risks, and initiatives.
- `meeting-output-writer`: Generate only summary, decisions, and action-item outputs from completed meeting material when the request is explicitly limited to that scope.
- `meeting-artifact-router`: Route transcript-driven post-meeting requests into a meeting summary plus any additional eligible downstream artifacts while keeping outputs Markdown-first and connection-agnostic.
- `prd-writer`: Create or refine PRDs from concrete product inputs.
- `project-context-bootstrap`: Establish repo-native project context, glossary-first source-of-truth rules, and Markdown relay outputs.
- `project-template-writer`: Define or refine the tool-agnostic Project Kickstart template across delivery tools.
- `research-synthesis`: Consolidate mixed discovery evidence into a reusable discovery-ready input with themes, contradictions, gaps, and JTBD candidates.
- `repo-bootstrap`: Recommend a repo structure, lightweight AGENTS content, and GitHub Actions baseline for AI-assisted coding.
- `roadmap-writer`: Create multi-epic roadmaps or standalone epic definitions with initiative-first structure and contextual prioritization.
- `ticket-writer`: Create implementation-ready tickets (single or batch) with embedded Gherkin checklist acceptance criteria.

## Add a new skill

```bash
python3 scripts/new_skill.py my-new-skill
make validate
```

Then edit `skills/my-new-skill/SKILL.md` and examples.

## Edit existing skills

1. Update the target `skills/<skill-name>/SKILL.md`.
2. Update example files under `skills/<skill-name>/examples/`.
3. Run validation and reindex:

```bash
make validate
```

## Validation

Run:

```bash
make validate
```

Low-level equivalents:

```bash
python3 scripts/validate_skills.py
python3 scripts/validate_research_artifacts.py
python3 scripts/validate_discovery_artifacts.py
python3 scripts/validate_ticket_artifacts.py
python3 scripts/validate_roadmap_artifacts.py
python3 scripts/validate_prd_artifacts.py
python3 scripts/validate_project_repo_templates.py
python3 scripts/validate_meeting_router.py
python3 scripts/reindex_skills.py
```

Validation enforces required frontmatter keys, required sections, trigger-boundary heuristics, folder/name consistency, committed skill-example fixtures, ticket template/issue-form integrity, and roadmap template/roadmap skill artifact integrity.

## Replicate for another team

1. Copy this repository (or use it as a template later).
2. Replace files under `references/org/` and `references/links/`.
3. Add or adapt skills under `skills/`.
4. Keep using the same scripts and validation rules.

## Integration quick links

- Architecture and operations: `INTEGRATION.md`
- PR review automation reference: `references/engineering/pr-review-automation.md`
- Existing consumer repo onboarding: `references/project-integration/adoption-copy-mode.md`
- New consumer repo template onboarding: `references/project-integration/adoption-template-mode.md`
- Project config template: `references/templates/project-repo/.paal/project.yaml.example`
- Assistant run contract: `references/templates/project-repo/.paal/run-template.md`
- Project workflow templates: `references/templates/project-repo/.github/workflows/`
- Slack MCP pull-mode index: `references/integrations/slack/README.md`
- Slack MCP pull-mode runbook: `references/integrations/slack/mcp-pull-mode.md`
- Slack MCP pull-mode behavior contract: `references/integrations/slack/mcp-pull-contract.md`
- Slack terminal post/reply helper: `scripts/slack_post_message.py`
- Project Copilot review instructions: `references/templates/project-repo/.github/copilot-instructions.md`
- Project PR templates: `references/templates/project-repo/.github/PULL_REQUEST_TEMPLATE/`
- Project context relay starter: `references/templates/project-repo/docs/context/project-context-export.md`
