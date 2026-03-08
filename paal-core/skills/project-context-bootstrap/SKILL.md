---
name: project-context-bootstrap
description: Use when setting up or reorganizing a project repo so product context lives in `project-context/`, starts with a glossary, stays current through PRs, and can be relayed to other tools via Markdown. Do not use for repo structure or CI setup only, or for exact Notion/Jira/Linear schema mapping.
version: 0.1.0
owner: Alvaro Bezerra
---

# Purpose

Create a repo-native project context baseline that teams can maintain in Git, use during discovery and PRD work, and relay to downstream tools through Markdown exports.

# When to use

- A new project repo exists or is being created and needs product context seeded inside the repo.
- A repo already exists, but product context is scattered across tools or chat and needs a canonical home.
- A PM wants engineers, product, and other stakeholders to work from the same in-repo context files.
- The team needs portable Markdown outputs for downstream tools without making those tools canonical.

# When NOT to use

- The request is only about repo shape, stack selection, AGENTS guidance, or CI defaults.
- The request is for exact Notion, Jira, or Linear field/page/database mapping.
- The work is only to write a discovery plan, PRD, roadmap, or ticket from already seeded repo context.

# Inputs

- Current project intent, audience, and known constraints.
- Existing repo shape and whether `project-context/` already exists.
- Current clarity level for domain terms, problem framing, and scope.
- Downstream tools that will consume Markdown outputs.
- Expectations for how often context should be updated through PRs.

# Outputs

- A project context bootstrap artifact in Markdown using `references/templates/project_context_bootstrap_template.md`.
- Required seed-file guidance for `project-context/README.md`, `project-context/project-overview.md`, and `project-context/glossary.md`.
- A portable relay recommendation centered on `docs/context/project-context-export.md`.
- A closing handoff with `Next likely skill(s)`, `What to pass forward`, and `Suggested next prompts`.

# Workflow

1. Step 0: If relevant, read `INTEGRATION.md`, `references/workflows/ai-product-delivery-flow.md`, `references/templates/project_context_bootstrap_template.md`, and the seed files under `references/templates/project-repo/project-context/`.
2. Confirm the request is about making the repo the working source of truth for project context. If the request is only repo structure or CI setup, route to `repo-bootstrap`. If it is exact tool schema mapping, route to `project-template-writer`.
3. Capture baseline context: audience, current project clarity, known constraints, downstream tools, and update expectations.
4. Require glossary-first seeding when the domain or terminology is still forming. Seed the glossary even when only a few terms are known.
5. Keep uncertain details explicit as `TBD` instead of guessing. Do not hide ambiguity in polished prose.
6. Define the required `project-context/` baseline files and what each one must contain.
7. Define the repo source-of-truth contract, including the rule that downstream tools consume exported Markdown and do not replace the repo as canonical source.
8. Define the portable relay artifact at `docs/context/project-context-export.md` and state what content belongs there versus what should stay in `project-context/`.
9. Define maintenance rules: when context files must be updated, how context changes travel through PRs, and how to resolve drift between the repo and downstream tools.
10. End with the next likely skill based on project maturity:
    - `discovery-plan` when the repo/context exists but the problem framing is still uncertain.
    - `prd-writer` when feature-level scope is concrete enough to write.
    - `roadmap-writer` when initiative ordering or sequencing is the next need.
    - implementation when the context and scope are already concrete enough to build.

# Examples

- Input example: `skills/project-context-bootstrap/examples/example-input.md`
- Output example: `skills/project-context-bootstrap/examples/example-output.md`
