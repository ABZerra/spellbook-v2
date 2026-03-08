# PAAL Documentation Run Template

Use this template to request deterministic documentation output from Codex or ChatGPT.

## Default Skill And Reference Roots

When working in a downstream repo, load skill and reference context from these paths first:

- `paal-core/skills/`
- `paal-core/references/`
- `org/skills/`

Skill routing is intent-first: infer the best skill automatically from the request and target artifact.
For product-oriented work, prioritize PAAL skills first and then use Codex/superpower skills for implementation execution or review follow-through.

When a completed meeting transcript is the source material and the user asks for post-meeting outputs without explicitly limiting scope, start with `meeting-artifact-router`.
The router must always produce a meeting summary first and may also emit additional docs such as discovery, PRD, acceptance criteria, or ticket outputs.
Use `meeting-output-writer` directly only when the user explicitly asks for summary, decisions, and action items only.

## Request Metadata

- Request title:
- Requestor:
- Date:
- Target branch:

## Selected Skills (Optional)

Leave blank when you want the assistant to auto-select skills.

- Skill 1:
- Skill 2:

## Source Context Paths

List exact files or directories used as input.

- `paal-core/skills/...` (if applicable)
- `paal-core/references/...` (if applicable)
- `project-context/README.md`
- `project-context/project-overview.md`
- `project-context/glossary.md`
- `org/skills/...` (if applicable)

## Output File Plan

List every output artifact and destination path under the appropriate `docs/` subdirectory.

- `docs/prd/<slug>.md`
- `docs/discovery/<slug>.md`
- `docs/context/<slug>.md`
- `docs/acceptance-criteria/<slug>.md`
- `docs/meetings/<slug>.md`
- `docs/tickets/<slug>.md`

## Acceptance Checklist

- [ ] Output uses selected skill structure (or the inferred structure when skills were auto-selected).
- [ ] Output reflects provided context files.
- [ ] Output is markdown and saved under the intended `docs/` subdirectory.
- [ ] PR includes summary of artifacts and sources.
- [ ] No file inside `paal-core/` was edited.
