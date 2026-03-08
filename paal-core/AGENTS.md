# PAAL Core Working Agreements

## Project summary

- What this project is: a single toolkit repo for reusable skills, templates, references, validation, and automation.
- What matters most: keep PAAL core project-agnostic, keep skills single-purpose, and encode hard rules in validation or CI.

## Key commands

- `make validate`: run all repo validators and refresh `SKILLS_INDEX.md`.
- `make reindex`: rebuild `SKILLS_INDEX.md`.
- `python3 scripts/new_skill.py <skill-name>`: scaffold a new skill.
- Direct script fallback: `python3 scripts/validate_skills.py`, `python3 scripts/validate_ticket_artifacts.py`, `python3 scripts/validate_roadmap_artifacts.py`, `python3 scripts/validate_project_repo_templates.py`, `python3 scripts/reindex_skills.py`.

## Conventions

- PAAL stays a single toolkit repo, not a multi-surface product repo.
- Project-specific modularization belongs in downstream repos that consume PAAL as a submodule.
- Canonical skill fixtures live in `skills/*/examples/`.
- PAAL self-hosted generated artifacts live in `docs/outputs/`.
- Downstream project repositories use semantically named `docs/` subdirectories for committed artifacts.
- Shared reusable docs live under `references/` and must remain project-agnostic.

## Watch-outs

- Do not treat `docs/outputs/` as per-skill examples.
- Do not restructure PAAL into `apps/*` or `packages/*` unless PAAL itself gains multiple independently evolving software surfaces.
- Keep detailed workflow content in `references/` and skill files, not in this always-loaded guide.
- Stronger downstream project-repo enforcement lives in `references/templates/project-repo/.github/workflows/`, not in extra prose here.
- Downstream review automation defaults live in `references/engineering/pr-review-automation.md` and `references/templates/project-repo/.github/copilot-instructions.md`.
- In Slack local pull mode, use `scripts/slack_post_message.py` for posting/replying when bot identity is required.
- Do not use MCP Slack write tools for bot-identity replies; MCP posts as the authenticated user token.

## Deeper docs

- `README.md`
- `INTEGRATION.md`
- `references/engineering/agentic-coding-principles.md`
- `references/engineering/codex-claude-concept-mapping.md`
- `references/engineering/repo-design-for-ai.md`
- `references/engineering/change-verification-discipline.md`
- `references/engineering/pr-review-automation.md`

## Skill design rules

- Keep each skill single-purpose.
- Use strict trigger boundaries in `description`, including a negative condition.
- Keep skills project-agnostic and reusable.

## Skill routing defaults

- Do not require users to explicitly name a skill before running it.
- Infer the best skill from intent, source material, and target artifact.
- Default to PAAL skills for product-oriented work (`context`, `discovery`, `meeting`, `PRD`, `roadmap`, `acceptance-criteria`, `ticket`).
- Use Codex/superpower skills mainly for implementation execution discipline (`planning`, `TDD`, `debugging`, `review`, `CI`), not as the primary router for product artifact generation.
- When both are needed, start with the best-fit PAAL product skill, then hand off to Codex/superpower execution skills only at implementation and review stages.
- If the user explicitly limits scope, respect that constraint even when broader routing would otherwise apply.

## Required SKILL.md contract

Every `skills/<skill-name>/SKILL.md` must include:

- Frontmatter keys: `name`, `description`, `version`, `owner`
- Required headings (exact):
  - `# Purpose`
  - `# When to use`
  - `# When NOT to use`
  - `# Inputs`
  - `# Outputs`
  - `# Workflow`
  - `# Examples`

## Authoring conventions

- Reference shared docs by path under `references/`.
- Include at least one realistic example input and output per skill under `skills/<skill-name>/examples/`.
- Keep examples compact and directly relevant.
- Keep always-loaded guidance lean; move detailed workflow content to `references/` and skill-specific docs.
- Prefer canonical workflow handoffs over repeating downstream instructions inside every skill.

## Operational rules

- Update `SKILLS_INDEX.md` whenever skills change.
- Always run `make validate` before commit.
- If needed, use the direct `python3` validator commands as a lower-level fallback.
- If validation fails, fix issues before commit.
