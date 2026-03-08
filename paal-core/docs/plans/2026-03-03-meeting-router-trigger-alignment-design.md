# Meeting Router Trigger Alignment Design

**Date:** 2026-03-03

## Goal

Make completed meeting transcript requests start at `meeting-artifact-router` by default in downstream repos, while preserving `meeting-output-writer` as the narrow skill for explicitly scoped summary-only cleanup.

## Root Cause

Two friction points showed up in downstream testing:

1. The downstream execution contract did not surface `paal-core/skills/`, `paal-core/references/`, and `org/skills/` early enough, so the submodule was present but not obvious to the assistant.
2. `meeting-output-writer` still had a broader trigger boundary than intended, so transcript-driven requests for "post-meeting outputs" could resolve to a summary-only skill before routing logic had a chance to run.

## Decision

- Treat `meeting-artifact-router` as the default entry point for any completed meeting transcript or normalized meeting notes when the user asks for post-meeting outputs without explicitly limiting scope.
- Make the router always produce a meeting summary first, then generate any additional eligible artifacts justified by the meeting context.
- If no non-meeting artifact qualifies, the router still returns the meeting summary and stops there.
- Keep `meeting-output-writer` only for requests explicitly limited to summary, decisions, and action items.
- Update downstream templates so the assistant sees the `paal-core` skill and reference roots from the first run.

## Implementation Surface

- Update `skills/meeting-artifact-router/SKILL.md`
- Update `skills/meeting-output-writer/SKILL.md`
- Update downstream templates:
  - `references/templates/project-repo/.paal/run-template.md`
  - `references/templates/project-repo/project-context/README.md`
- Update repo references and onboarding docs:
  - `README.md`
  - `INTEGRATION.md`
  - `references/meeting-router/README.md`
  - `references/project-integration/adoption-copy-mode.md`
  - `references/project-integration/adoption-template-mode.md`
  - `references/workflows/ai-product-delivery-flow.md`
- Strengthen validators so router-first behavior and downstream search-root guidance stay enforced.
