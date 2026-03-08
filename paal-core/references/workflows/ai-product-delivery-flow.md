# AI Product Delivery Flow

This flow connects PAAL skills so one action can naturally hand off to the next without forcing a strict waterfall. The default model is context-first: establish the project workspace and source-of-truth files first, then use discovery, PRD, roadmap, and ticket-definition skills iteratively inside that repo context.

## Default Working Model

1. Establish the project working environment
   - `repo-bootstrap`
   - `project-context-bootstrap`
2. Define the product inside that context
   - `research-synthesis` when evidence is fragmented and must be consolidated before locking discovery or PRD inputs
   - `discovery-plan`
   - `meeting-artifact-router` when the source material is a completed meeting transcript and the task is any transcript-driven post-meeting output request, even if the final result may be a meeting summary only
   - `prd-writer`
   - `acceptance-criteria-extractor`
   - `roadmap-writer` when planning needs initiative sequencing
   - these skills are iterative and not strictly ordered once the repo context exists
3. Implement
4. Prepare and review the PR
   - `pr-preparation`
   - `gh-address-comments`
   - `gh-fix-ci`

## Handoff Rules

### `repo-bootstrap` -> `project-context-bootstrap`

Use this handoff when the repo environment is being created or clarified and the next step is to seed `project-context/` as the working source of truth.

Pass forward:

- recommended repo shape
- key commands
- AGENTS seed
- GitHub Actions recommendations
- first milestone boundary

### `project-context-bootstrap` -> `discovery-plan`

Use this handoff when the repo context exists but the problem framing, risks, or main unknowns still need structured discovery.

Pass forward:

- current `project-context/` file paths
- glossary terms and unresolved `TBD` items
- known constraints
- downstream tool expectations

### `project-context-bootstrap` -> `research-synthesis`

Use this handoff when repo context exists, but the discovery evidence is still fragmented across multiple sources and needs one consolidated input before discovery or PRD work.

Pass forward:

- current `project-context/` file paths
- research question or decision to support
- evidence source inventory
- known terminology or glossary constraints
- open gaps that still need validation

### `research-synthesis` -> `discovery-plan`

Use this handoff by default when evidence has been consolidated but the team still needs questions, activities, risks, and decision criteria.

Pass forward:

- research question
- source inventory
- converging themes
- contradictions or segment differences
- gaps and JTBD candidates

### `project-context-bootstrap` -> `meeting-artifact-router`

Use this handoff when a completed meeting transcript exists, project context already exists, and the next step is to route that meeting into post-meeting outputs.

Pass forward:

- current `project-context/` file paths
- glossary terms and unresolved `TBD` items
- GitHub repository slug if known
- expected typed output folders under `docs/`

### `meeting-artifact-router` -> downstream writing skills

Use this handoff when meeting-derived routing produced a justified candidate for a narrower artifact skill.

Pass forward:

- normalized meeting transcript path or excerpt
- GitHub context summary and whether it was available
- generated open questions path if any
- artifact-specific evidence that justified routing
- intended output path under `docs/`

### `project-context-bootstrap` -> `prd-writer`

Use this handoff when the repo context exists and feature-level scope is already concrete enough to write a PRD.

Pass forward:

- current `project-context/` file paths
- problem framing and outcomes from `project-overview.md`
- glossary terms that affect requirement language
- open questions that still need to stay visible

### `discovery-plan` -> `prd-writer`

Use this handoff when discovery reduced the main unknowns enough to define goals, scope, and constraints.

Pass forward:

- objective
- primary JTBD
- validated assumptions
- open questions that still matter
- timing or milestone context

### `prd-writer` -> `acceptance-criteria-extractor`

Use this handoff when the PRD contains requirements that need ticket-ready definition of done.

Pass forward:

- requirement IDs
- JTBD summary
- user outcomes
- constraints and edge cases
- linked designs or flows

### `acceptance-criteria-extractor` -> implementation

Use this handoff when implementation is about to start and the repo plus project context baseline already exist.

Pass forward:

- key feature scope
- JTBD summary
- verification needs
- linked requirements or ticket summaries
- relevant `project-context/` files

### implementation -> `pr-preparation`

Use this handoff when a meaningful diff exists or a change is otherwise ready for commit/PR evaluation, PR creation or update, mandatory Codex review, or review automation.

Pass forward:

- changed files or diff summary
- checks already run
- known risks or open questions
- optional local review metadata

### `pr-preparation` -> GitHub follow-up skills

- Hand off to `gh-address-comments` when review feedback exists and the work is about addressing comments.
- Hand off to `gh-fix-ci` when GitHub Actions fail and the work is about debugging or fixing those failures.

Pass forward:

- PR URL if one exists or was created
- checks completed
- Codex review findings
- reviewer focus
- GitHub AI review status
- CI follow-up context

## Optional Entry Points

- Start directly at `repo-bootstrap` when only repo setup guidance is missing.
- Start directly at `project-context-bootstrap` when the repo exists but the context baseline is missing.
- Start directly at `research-synthesis` when mixed evidence exists but discovery or PRD inputs are not yet coherent.
- Start directly at `meeting-artifact-router` when the source material is a completed meeting transcript and the task is any post-meeting output request that is not explicitly limited to summary, decisions, and action items.
- Start directly at `discovery-plan` or `prd-writer` when the repo and `project-context/` baseline already exist.
- Start directly at `pr-preparation` when implementation already happened and the question is about readiness, not planning.

## Skill Handoff Contract

Relevant skills should end with:

- `Next likely skill(s)`
- `What to pass forward`
- `Suggested next prompts`

This keeps the flow connected while still letting each skill stay single-purpose.
