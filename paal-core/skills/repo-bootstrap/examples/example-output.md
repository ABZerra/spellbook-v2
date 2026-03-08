# Example Output: Repo Bootstrap

## Project Snapshot
- Project type: mixed product
- Delivery surfaces: web app, backend, shared logic
- Reuse expectation: yes
- V1 priority: balanced
- Verification strictness: balanced

## Tech Stack
- Status: Recommended stack
- User-provided preferences: no fixed stack; wants a sensible default for a small team
- Recommended stack or deferred note: TypeScript-first stack with `Next.js` for the web app, a Node/TypeScript backend if the API splits out, `Postgres` for core product data, `pnpm` for package management, and Vercel/Render-style hosting
- Why this is enough for now: it keeps the recommendation concrete enough to define commands and CI, but still leaves room to defer detailed service choices such as auth or payment providers

## Recommended Structure
- Recommended default: Multi-surface product
- Why this fits now: the product already has UI and backend concerns, and pricing logic will be reused across both.
- Why simpler was not chosen: a single-app layout would make shared pricing rules harder to place and easier to mix with UI concerns.
- Why more modular was not chosen: separate packages beyond `core`, `ui`, and `config` would add ceremony before the first release proves the need.

## Proposed Layout

```text
apps/
  web/
  api/
packages/
  core/
  ui/
  config/
docs/
tests/
```

## Key Commands
- `validate`: repo policy and generated-file checks
- `lint`: fast static checks
- `typecheck`: interface and type validation
- `test`: fast unit or integration coverage for the changed slice

## Lightweight Repo AGENTS Seed

### Project summary
- Customer-facing subscription product with separate web and API layers sharing pricing and entitlement rules.

### Tech stack
- TypeScript-first repo with `Next.js`, a Node/TypeScript backend path if the API separates, `Postgres`, and `pnpm`.

### Architecture
- `apps/web` owns the customer-facing UI.
- `apps/api` owns transport and server-side orchestration.
- `packages/core` holds pricing and entitlement rules so both surfaces use the same business logic.

### Key commands
- `validate`, `lint`, `typecheck`, `test`

### Conventions
- UI code lives in `apps/web` and `packages/ui`.
- shared pricing and entitlement rules live in `packages/core`.
- repo-wide config lives in `packages/config`.

### Watch-outs
- Do not place pricing rules in UI components.
- Keep reusable domain logic independent from framework styling choices.

### Deeper docs
- `docs/architecture.md`
- `docs/api-contracts.md`

## GitHub Actions Recommendation
- Baseline: balanced
- Required baseline workflows: `PAAL Core Policy`, `PAAL Repo Baseline`, and `PAAL PR Hygiene`
- Chosen overlay: Node/TypeScript
- Fast PR checks to require: `Validate PAAL core submodule shape`, `Validate PAAL project repo contract`, `Docs and config hygiene`, `Validate PR metadata`, and `Node and TypeScript fast checks`
- Strictness mapping: `basic` = baseline workflows only, `balanced` = baseline plus overlay fast checks, `strict` = balanced plus the overlay full-check workflow on schedule or manual dispatch
- If the stack stayed deferred instead, keep only the generic baseline checks and postpone any stack-specific overlay choice.
- Job summary expectations: each workflow should write a short job summary for quick review context

## Pull Request Template Recommendation
- Required summary sections: Summary, Tests, Risks, Reviewer Focus
- Required verification sections: what ran and what did not
- Required risk sections: domain rule changes and rollout follow-ups

## Review Automation Recommendation
- `.paal/project.yaml` review block: set `codex_review: required`, `recommended_human_approvals: 1`, `enforce_human_approvals: false`, `reviewer_handles: []`, `github_ai_review: recommended`, and `external_tool: auto`
- `.github/copilot-instructions.md`: copy the PAAL template so GitHub Copilot review has repository-specific review priorities
- `Codex review` expectation: every meaningful diff should pass through `pr-preparation` before PR creation or update
- Human approval recommendation: recommend one human approval when the team has another reviewer, but do not block solo workflows on it
- GitHub Copilot review note: recommend enabling automatic Copilot review in repo or org settings and auditing it with `check_github_review_setup.py`
- Optional external tool note: `external_tool: auto` lets `pr-preparation` use `superpowers` automatically when the user already has it installed, while continuing normally when it is absent

## First Implementation Milestone
- First slice to build: scaffold the repo, add lightweight AGENTS guidance, and establish shared pricing types in `packages/core`
- Why this slice is the right starting boundary: it creates the shared seams the later UI and API work will depend on

## Next likely skill(s)
- `project-context-bootstrap`
- `discovery-plan` if problem framing is still uncertain once the repo exists
- `prd-writer` if feature scope is already concrete enough to define inside the project repo
- implementation work after repo setup and project context are both concrete enough

## What to pass forward
- Proposed layout, command names, AGENTS seed, GitHub Actions baseline, first milestone scope, and the expectation that `project-context/` is the next workspace baseline to seed

## Suggested next prompts
- "Use `project-context-bootstrap` to seed `project-context/` and the first Markdown relay artifact for this repo."
- "Copy the PAAL baseline workflows, Copilot instructions, default PR templates, and the Node/TypeScript overlay into this repo."
