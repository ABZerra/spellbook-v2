---
name: meeting-artifact-router
description: Use when a completed meeting transcript or normalized meeting notes should drive post-meeting outputs, including cases where PAAL may need to choose between a meeting summary only or additional downstream artifacts. Do not use for live meetings or when no meeting source material exists.
version: 0.1.0
owner: Alvaro Bezerra
---

# Purpose

Route completed meeting transcripts into one or more eligible downstream PAAL artifacts while keeping the outputs Markdown-first, typed by destination folder, and ready for downstream publishing.

# When to use

- A completed meeting transcript or normalized meeting notes are available.
- Any transcript-driven post-meeting output request should start here, even when the user asks broadly for meeting outputs instead of naming a specific artifact.
- The user wants PAAL to decide which downstream artifacts should be produced from that meeting.
- The meeting may justify multiple outputs such as a meeting summary, discovery plan, PRD, acceptance criteria, or ticket drafts.
- GitHub context should be used first when it is available.

# When NOT to use

- The user explicitly limits the task to summary, decisions, and action items only; use `meeting-output-writer`.
- The user already knows they want a single downstream artifact such as a PRD or a ticket and does not need routing.
- The meeting is still in progress or the task is live facilitation.
- No meeting source material is provided.

# Inputs

- A completed meeting transcript in `.md`, `.txt`, or `.json` form, or equivalent normalized notes.
- Optional meeting metadata such as title, date, participants, and source.
- GitHub repository context when available.
- The meeting-output registry at `references/meeting-router/output-registry.yaml`.

# Outputs

- A baseline meeting output in Markdown using `references/templates/meeting_output_template.md`.
- Optional open questions in Markdown using `references/templates/meeting_open_questions_template.md`.
- Zero or more downstream artifacts backed by eligible PAAL skills and routed into typed folders such as `docs/discovery/`, `docs/prd/`, `docs/acceptance-criteria/`, and `docs/tickets/`.
- Stable router-generated frontmatter that records `artifact_type`, `artifact_slug`, `source_meeting`, `backing_skill`, `router_output_id`, `status`, `generation_basis`, `github_context_used`, and `open_questions_path`.
- A closing handoff on routed outputs with `Next likely skill(s)`, `What to pass forward`, and `Suggested next prompts` when downstream work continues.

# Workflow

1. Step 0: If relevant, read `references/meeting-router/output-registry.yaml`, `references/meeting-router/README.md`, `references/org/process_overview.md`, and the backing templates under `references/templates/`.
2. Confirm the source is a completed meeting artifact and normalize it with `scripts/normalize_meeting_transcript.py` when needed.
3. Gather GitHub context with `scripts/fetch_github_context.py` before evaluating non-meeting artifacts.
4. Always produce a meeting output first through the `meeting-output-writer` shape so every successful run includes a meeting summary, key decisions, and action items.
5. Evaluate every registry entry independently. The router may select multiple outputs for the same transcript, but it must not infer eligibility beyond `references/meeting-router/output-registry.yaml`.
6. Generate open questions when required signals are partial or ambiguous. Keep unknowns explicit instead of inventing missing owners, dates, ticket types, or acceptance criteria.
7. If no non-meeting artifacts qualify, fall back to `meeting-output-writer` output only and stop after the meeting summary plus any open questions or next steps.
8. Hand off only to backing skills that meet their routing thresholds. This skill does not replace `meeting-output-writer`, `discovery-plan`, `prd-writer`, `acceptance-criteria-extractor`, or `ticket-writer`; it only orchestrates them.
9. If GitHub context is unavailable, still produce a meeting output plus next steps or open questions, mark the result as fallback, and suppress non-meeting artifacts in v1.
10. When routing continues, end with the canonical handoff fields:
   - `Next likely skill(s)`
   - `What to pass forward`
   - `Suggested next prompts`

# Examples

- Input example: `skills/meeting-artifact-router/examples/example-input.md`
- Output example: `skills/meeting-artifact-router/examples/example-output.md`
