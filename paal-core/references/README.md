# References Directory

`references/` stores shared context that skills can read by path.

## Structure

- `references/org/`: org context such as glossary, principles, process overview, and ticketing standards.
- `references/product/`: shared product frameworks and decision aids.
- `references/engineering/`: shared guidance for repo design, verification, review-readiness, and AI-assisted coding conventions.
- `references/integrations/`: integration-specific runbooks and behavior contracts (for example local Slack MCP pull mode).
- `references/meeting-router/`: meeting-routing registry, frontmatter contract, and fallback guidance for transcript-driven artifact orchestration.
- `references/workflows/`: canonical handoff maps that connect skills into larger delivery flows.
- `references/templates/`: reusable output templates for skills.
- `references/links/`: canonical links skills can reuse.

Template examples currently in this repo:

- `references/templates/discovery_plan_template.md`
- `references/templates/roadmap_template.md`
- `references/templates/epic_template.md`
- `references/templates/prd_template.md`
- `references/templates/acceptance_criteria_template.md`
- `references/templates/meeting_output_template.md`
- `references/templates/meeting_open_questions_template.md`
- `references/templates/project_template_template.md`
- `references/templates/project_context_bootstrap_template.md`
- `references/templates/repo_bootstrap_template.md`
- `references/templates/lightweight_agents_template.md`
- `references/templates/change_preflight_template.md`
- `references/templates/pull_request_template.md`
- `references/templates/ticket_template.md`
- `references/templates/ticket_feature_template.md`
- `references/templates/ticket_bug_template.md`
- `references/templates/ticket_chore_template.md`
- `references/templates/ticket_spike_template.md`
- `references/product/jtbd-framework.md`

## Usage in skills

Skills should cite and read these files directly, for example:

- `references/org/process_overview.md`
- `references/org/glossary.md`
- `references/org/ticketing_standards.md`
- `references/product/jtbd-framework.md`
- `references/engineering/agentic-coding-principles.md`
- `references/engineering/codex-claude-concept-mapping.md`
- `references/engineering/pr-review-automation.md`
- `references/workflows/ai-product-delivery-flow.md`
- files under `references/templates/`

Some templates are designed to be copied into project repositories after they are tailored to the target stack and team conventions, including files under `references/templates/project-repo/` such as `.github/copilot-instructions.md`.
That also includes starter context files under `references/templates/project-repo/project-context/` and the relay artifact scaffold at `references/templates/project-repo/docs/context/project-context-export.md`.
