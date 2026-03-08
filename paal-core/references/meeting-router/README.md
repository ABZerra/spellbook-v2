# Meeting Router Reference

The meeting router is a connection-agnostic orchestration layer for completed meeting transcripts.
Transcript-driven post-meeting requests should start here by default.
It always produces a meeting output first, then evaluates whether the transcript contains enough evidence to route into additional eligible artifacts such as discovery plans, PRDs, acceptance criteria, or tickets.

## Output Registry

`references/meeting-router/output-registry.yaml` is the only source of truth for meeting-triggerable outputs.

Registry entries define:

- the output id
- whether the output is enabled for meeting-derived generation
- the backing skill or template
- the typed downstream output folder
- whether multiple outputs of that type are allowed
- whether clarification is required before generation
- the transcript signals that must be present

The router must not infer eligibility from skill descriptions alone.
If an artifact is not listed in the registry with `meeting_eligible: true`, it is not eligible for meeting-driven generation.

## Router-Generated Frontmatter

Every router-generated artifact should start with stable frontmatter so downstream repos can publish or transform it later without changing PAAL core:

```yaml
artifact_type: prd
artifact_slug: 2026-03-03-product-sync-prd
source_meeting: 2026-03-03-product-sync
backing_skill: prd-writer
router_output_id: prd
status: draft
generation_basis: clarified
github_context_used: true
open_questions_path: docs/meetings/2026-03-03-product-sync-open-questions.md
```

Recommended values:

- `artifact_type`: `meeting_output`, `discovery_plan`, `prd`, `acceptance_criteria`, or `ticket`
- `status`: `draft`
- `generation_basis`: `explicit`, `clarified`, or `fallback`

## Fallback Behavior

GitHub context is the normal path for v1 routing.
If GitHub context is unavailable, the router should still normalize the transcript and generate:

- a meeting output
- next steps
- open questions when appropriate

In fallback mode, non-meeting artifacts should be suppressed.
The router should not pretend PRD, ticket, or acceptance-criteria context exists when it does not.

If no non-meeting artifact qualifies even with GitHub context available, the router should still keep the meeting summary and stop there.
That fallback stays inside the router rather than bypassing it at skill selection time.

## Typed Output Paths

Router outputs belong in downstream typed folders under `docs/`:

- `docs/meetings/`
- `docs/discovery/`
- `docs/prd/`
- `docs/acceptance-criteria/`
- `docs/tickets/`

The router is free to select multiple outputs for the same transcript, but each output still lands in its own typed destination.

## Downstream Extension Model

PAAL core stays connection-agnostic.
Downstream repositories can add their own Notion, Linear, Jira, or custom publishing code by consuming:

- the stable frontmatter keys
- the typed output paths
- the relay-safe project context export under `docs/context/`

Core should not define provider-specific auth, mapping rules, or update semantics.
