---
name: meeting-output-writer
description: Use when the user provides completed meeting material and explicitly wants only a meeting summary, decisions list, and action items. Do not use for transcript-driven post-meeting routing, agenda preparation, live facilitation, or non-meeting summaries.
version: 0.1.0
owner: Alvaro Bezerra
---

# Purpose

Generate standardized post-meeting outputs in Markdown with a concise summary, explicit decisions, and accountable action items.

# When to use

- The request is explicitly limited to summary, decisions, and action items.
- The user asks for minutes cleanup, follow-up notes, or action tracking without asking PAAL to decide additional downstream artifacts.
- The prompt or attached file clearly indicates meeting context (for example: meeting notes, minutes, transcript, sync follow-up).
- Source material is raw or semi-structured and needs conversion into a consistent output format.

# When NOT to use

- The user asks for agenda preparation, meeting planning, or pre-read generation.
- The user asks for live facilitation support during an active meeting.
- The task is a generic summary unrelated to a meeting artifact.
- No meeting source material is provided.
- Do not use for transcript-driven post-meeting output requests unless the user explicitly limits scope to summary, decisions, and action items.
- The task is to route a meeting into multiple downstream artifacts such as discovery plans, PRDs, acceptance criteria, or tickets; use `meeting-artifact-router` instead.

# Inputs

- Meeting notes, minutes, transcript text, or follow-up bullets from a completed meeting.
- Optional meeting metadata (title, date, participants, context).
- Optional existing task tracker context to preserve exact wording for action items.

# Outputs

- A Markdown document following `references/templates/meeting_output_template.md` in template order.
- Required sections: `Summary`, `Key Decisions`, and `Action Items`.
- A Markdown action-item table with columns `Action | Owner | Due Date | Status`.
- Explicit `TBD` placeholders when `Owner` or `Due Date` is missing in source input.
- A closing handoff with `Next likely skill(s)`, `What to pass forward`, and `Suggested next prompts`.

# Workflow

1. Step 0: If relevant, read `references/org/process_overview.md`, `references/org/glossary.md`, and any template under `references/templates/`.
2. Confirm the request is post-meeting and that meeting cues appear in the prompt or attached files.
3. Extract only evidence-backed facts from source notes: summary points, decisions, and action candidates.
4. Draft output in exact template order: `# Meeting Output`, `## Summary`, `## Key Decisions`, `## Action Items`.
5. Convert actions into table rows with `Action`, `Owner`, `Due Date`, and `Status`.
6. Set `Owner` and `Due Date` to `TBD` when not explicitly provided; do not invent missing values.
7. Set `Status` to `Open` by default unless the source explicitly states another value.
8. Run a final quality check: all required sections are present and there are no action items outside the table.
9. End with the canonical handoff fields:
   - `Next likely skill(s)`
   - `What to pass forward`
   - `Suggested next prompts`

# Examples

- Input example: `skills/meeting-output-writer/examples/example-input.md`
- Output example: `skills/meeting-output-writer/examples/example-output.md`
