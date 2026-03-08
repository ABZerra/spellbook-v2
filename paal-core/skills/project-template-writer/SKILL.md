---
name: project-template-writer
description: Use when defining or refining the tool-agnostic Project Kickstart template (Vision -> Roadmap -> Initiatives -> Resources) and mapping it consistently across delivery tools (for example Notion, Word, Excel, and Jira). Do not use for repo-native project creation, project-context bootstrap, source-of-truth maintenance, Markdown-first relay flows, unrelated template models, or ticket breakdown tasks.
version: 0.1.0
owner: Alvaro Bezerra
---

# Purpose

Create a reusable, tool-agnostic Project Kickstart specification that preserves the original baseline structure and maps it consistently to selected destination tools.

# When to use

- The user needs the Project Kickstart template represented in multiple tools without losing fidelity.
- The canonical model must preserve `Vision -> Roadmap -> Initiatives -> Resources`.
- The output must include concrete field contracts, view/layout contracts, mapping tables, and import/export contract details.

# When NOT to use

- The request is for a different domain model than Project Kickstart baseline.
- The request is to make a repo the source of truth for product context or to seed `project-context/`.
- The request is to define ongoing source-of-truth maintenance rules or Markdown-first relay outputs for a project repo.
- The request is only for one tool implementation with no cross-tool portability need.
- The request is a feature PRD, roadmap, or ticket-writing task.
- The task is implementation/debugging of an existing adapter rather than template definition.

# Inputs

- Baseline source artifacts for fidelity (for example screenshot and analysis/report).
- Project context, audience, and planning workflow constraints.
- Required canonical entities, relationships, and field-level rules.
- Destination tools in scope and any adapter-specific limits.
- Import/export expectations, validation expectations, and known risks.

# Outputs

- A project template specification in Markdown using `references/templates/project_template_template.md`.
- An explicit fidelity contract for required layout sections, database views, and required fields.
- A `Notion Exact Page Blueprint` section whenever Notion is in scope, including block order, exact view names, property contracts, and seed records.
- Adapter mapping tables for each selected tool.
- Test scenarios, risks, and open questions with `TBD` where information is missing.
- A closing handoff with `Next likely skill(s)`, `What to pass forward`, and `Suggested next prompts`.

# Workflow

1. Step 0: If relevant, read `references/org/process_overview.md`, `references/org/glossary.md`, and `references/templates/project_template_template.md`.
2. Confirm this is a Project Kickstart baseline request with cross-tool portability scope; if not, recommend the right skill and stop.
3. Capture baseline decisions: audience, in-scope tools, import/export modes, and non-goals.
4. Draft the artifact in exact template order with the fidelity section first, including required top-level page sections and the exact default Notion view names.
5. If Notion is in scope, include a strict Notion blueprint with exact page block order, exact section titles, exact database names, exact view names, and required view configuration notes.
6. Keep the canonical model concrete: include required entities, field names, field types, enums, and relationship rules.
7. Map each canonical field to destination-tool equivalents for Notion, Word, Excel, and Jira; state gaps explicitly.
8. Add import/export contract details, including required CSV filenames, relation keys, output artifacts, and validation/error expectations.
9. Add test scenarios that cover happy path, mapping fidelity, import errors, idempotent reruns, and permission/config failures.
10. Keep unresolved decisions explicit in `## Open Questions` as `TBD` instead of guessing, but do not leave required Notion baseline fields/views as `TBD`.
11. End with the canonical handoff fields:
   - `Next likely skill(s)`
   - `What to pass forward`
   - `Suggested next prompts`

# Examples

- Input example: `skills/project-template-writer/examples/example-input.md`
- Output example: `skills/project-template-writer/examples/example-output.md`
