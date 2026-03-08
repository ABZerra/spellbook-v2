# Example Output: project-context-bootstrap

# Project Context Bootstrap

## Summary

- Project: New product repo bootstrap
- Owner: Product + Engineering
- Current stage: early shaping
- Audience: PMs, engineers, designers, and stakeholders who need a shared repo-native context
- Downstream tools: Notion, Jira, Linear

## Project Context Goal

- Make the repo the maintained working source of truth for project context before delivery artifacts diverge across tools.
- Give engineers a clear entry point for product context inside the repo.
- Preserve portability through Markdown exports without making downstream tools canonical.

## Repo Source-of-Truth Contract

- Canonical source: `project-context/`
- Repo-native files: `project-context/README.md`, `project-context/project-overview.md`, and `project-context/glossary.md`
- Relay output: `docs/context/project-context-export.md`
- Non-canonical systems: Notion, Jira, Linear, meeting notes, and chat threads

## Required Project-Context Files

- `project-context/README.md`: engineer-facing entry point that explains what each context file is for and carries the canonical/relay rules.
- `project-context/project-overview.md`: current problem, user, outcomes, and constraints.
- `project-context/glossary.md`: mandatory day-one glossary, even if only a few terms are defined.

## Glossary-First Bootstrap

- Seed the glossary before pretending the project language is stable.
- Add terms as soon as they affect discovery, PRD wording, roadmap priorities, or implementation language.
- Leave immature terms as `TBD` rather than inventing final definitions.

## Portable Markdown Output Contract

- Primary relay artifact: `docs/context/project-context-export.md`
- Include the current summary, glossary excerpt, key constraints, and any relay-safe context needed by downstream tools.
- Keep working notes and repo-specific update rules in `project-context/`, not in relay exports.

## Maintenance and Update Rules

- Any PR that changes product context must update the relevant file under `project-context/`.
- Any terminology change must update `project-context/glossary.md`.
- Any downstream tool drift must be corrected in the repo first, then re-exported.
- Unknowns stay visible as `TBD`.

## Engineer Consumption Guidance

- Start at `project-context/README.md`.
- Use `project-overview.md` for the problem and outcomes.
- Use `glossary.md` when feature terms or business language feel ambiguous.
- Use `README.md` to understand update and relay expectations.

## Downstream Relay Guidance

- Export Markdown from the repo to downstream tools.
- Keep relay artifacts under `docs/context/`.
- Do not treat downstream tools as the only up-to-date copy.

## First Fill-In Checklist

- [ ] Fill in `project-context/project-overview.md`
- [ ] Add initial terms to `project-context/glossary.md`
- [ ] Produce `docs/context/project-context-export.md`

## Next likely skill(s)

- `discovery-plan` if problem framing is still uncertain
- `prd-writer` if feature scope is already clear enough to define
- `roadmap-writer` if project planning needs initiative sequencing

## What to pass forward

- Required context file paths
- Current glossary terms and `TBD` items
- Source-of-truth rules
- Relay artifact path

## Suggested next prompts

- "Seed the project-context files for this repo and create the first Markdown relay artifact."
- "Use the current project-context files to draft a discovery plan for the open questions."
