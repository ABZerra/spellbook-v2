---
name: repo-bootstrap
description: Use when creating a repo, choosing a project structure, or restructuring a repo so AI-assisted coding starts with clear boundaries and verification defaults. Do not use for routine feature work inside an already established repo.
version: 0.1.0
owner: Alvaro Bezerra
---

# Purpose

Produce a practical repo bootstrap plan that recommends project structure, lightweight repo guidance, and GitHub Actions defaults for AI-assisted coding before project context is seeded inside the repo.

# When to use

- A new repo needs a starting structure and coding workflow guidance.
- An existing repo feels muddled and needs clearer boundaries before more work continues.
- The user wants plain-language help deciding whether to keep one app layout or split into `apps/*` and `packages/*`.

# When NOT to use

- The repo structure is already clear and the work is routine feature implementation.
- The request is only to debug CI, address PR comments, or review an existing diff.
- Product scope is still too vague and should first go through discovery or PRD work.

# Inputs

- Project type, expected delivery surfaces, and reuse expectations.
- V1 priority (`ship quickly`, `balanced`, or `set up for growth`).
- Verification strictness (`basic`, `balanced`, or `strict`).
- Known constraints, current repo pain points, or planned stack details when available.
- Optional permission to recommend the stack when the user is not sure.

# Outputs

- A repo setup plan in Markdown using `references/templates/repo_bootstrap_template.md`.
- A recommended structure with plain-language rationale.
- A stack status of `Chosen stack`, `Recommended stack`, or `Stack deferred`.
- A lightweight repo `AGENTS.md` seed using `references/templates/lightweight_agents_template.md`.
- A short architecture note inside that `AGENTS.md` seed when the repo has meaningful boundaries to explain.
- A short stack note inside that `AGENTS.md` seed only when the stack is chosen or confidently recommended.
- A GitHub Actions recommendation that references `PAAL Core Policy`, `PAAL Repo Baseline`, `PAAL PR Hygiene`, and an optional Node/TypeScript or Python overlay using the templates under `references/templates/project-repo/`.
- A `Review automation recommendation` that references `.paal/project.yaml` review metadata, `.github/copilot-instructions.md`, mandatory Codex review through `pr-preparation`, recommended human approval, recommended GitHub Copilot review, and auto-detected optional `superpowers`.
- A closing handoff section with `Next likely skill(s)`, `What to pass forward`, and `Suggested next prompts`, with `project-context-bootstrap` as the default next step when project context has not yet been seeded.

# Workflow

1. Step 0: If relevant, read `references/engineering/agentic-coding-principles.md`, `references/engineering/codex-claude-concept-mapping.md`, `references/engineering/repo-design-for-ai.md`, `references/engineering/pr-review-automation.md`, `references/workflows/ai-product-delivery-flow.md`, `references/templates/repo_bootstrap_template.md`, `references/templates/lightweight_agents_template.md`, `references/templates/project-repo/.paal/project.yaml.example`, `references/templates/project-repo/.github/copilot-instructions.md`, `references/templates/project-repo/.github/workflows/paal-core-policy.yml`, `references/templates/project-repo/.github/workflows/paal-repo-baseline.yml`, `references/templates/project-repo/.github/workflows/paal-pr-hygiene.yml`, the relevant optional overlay example under `references/templates/project-repo/.github/workflows/`, and the PR templates under `references/templates/project-repo/.github/PULL_REQUEST_TEMPLATE/`.
2. Ask exactly these five plain-language questions and capture the answers:
   - What are you building: `web app`, `backend/API`, `automation`, `library`, or `mixed product`?
   - Which parts do you expect now: `UI`, `backend`, `shared logic`, `automation scripts`, `docs only`, or multiple?
   - Will any logic likely be reused across more than one part: `yes`, `no`, or `not sure`?
   - Which matters more for v1: `ship quickly`, `balanced`, or `set up for growth`?
   - How strict should verification be: `basic`, `balanced`, or `strict`?
3. Choose one default structure:
   - `Single-app starter` for one surface and low expected reuse.
   - `Modular product default` for one main app with likely shared logic or growth.
   - `Multi-surface product` when multiple delivery surfaces or independently evolving layers already exist.
4. After the repo shape is clear, ask an optional stack-guidance block. Make it explicit that every question may be skipped:
   - Do you already know the tech stack, or should I recommend one?
   - If there is a UI, do you have a frontend preference such as `Next.js`, `React`, `Vue`, `other`, or `not sure`?
   - If there is a backend, do you have a backend preference such as `Node`, `Python`, `other`, or `not sure`?
   - Do you already expect a data store such as `Postgres`, `SQLite`, `Firebase`, `none yet`, or `not sure`?
   - Do you already have tooling or hosting preferences such as `pnpm`, `npm`, `uv`, `pip`, `Vercel`, `Render`, `AWS`, `other`, or `not sure`?
5. If the stack input is vague, infer a reasonable recommendation from the product shape, expected surfaces, speed/growth tradeoff, and any constraints the user already gave.
6. If the user skips stack questions or the recommendation confidence is low, do not block the flow. Mark the result as `Stack deferred` and make only the minimum stack-dependent decisions.
7. Defend the recommendation in plain language: explain why it fits now, what problem it avoids, and why simpler or more modular alternatives were not chosen.
8. Draft the plan using `references/templates/repo_bootstrap_template.md`, including proposed layout, stack status, a short architecture note, key commands, lightweight `AGENTS.md` seed, review automation recommendation, and the first implementation milestone.
9. Map verification strictness to GitHub Actions guidance:
   - `basic`: `PAAL Core Policy` + `PAAL Repo Baseline` + `PAAL PR Hygiene`.
   - `balanced`: basic plus the chosen overlay fast-check job (`Node and TypeScript fast checks` or `Python fast checks`) when the repo stack warrants it.
   - `strict`: balanced plus the chosen overlay manual/nightly full-check job.
10. When stack is not clear enough, keep the GitHub Actions recommendation to the minimum generic baseline and explicitly defer any stack-specific overlay choice.
11. Add a `Review automation recommendation` section:
   - include the `.paal/project.yaml` review metadata block
   - include `.github/copilot-instructions.md` as a default downstream file
   - state that `Codex review` is required through `pr-preparation`
   - recommend `1` human approval when available without enforcing it
   - recommend GitHub Copilot review and note that it is settings-driven and should be audited
   - set `external_tool: auto` by default so `superpowers` is used automatically when the user already has it installed, while remaining optional to proceed without it
12. End with the canonical handoff fields:
   - `Next likely skill(s)`
   - `What to pass forward`
   - `Suggested next prompts`
13. Default the handoff to `project-context-bootstrap` when the repo environment is being established and `project-context/` has not yet been seeded. Only point directly to implementation when both repo setup and project context are already concrete enough.

# Examples

- Input example: `skills/repo-bootstrap/examples/example-input.md`
- Output example: `skills/repo-bootstrap/examples/example-output.md`
