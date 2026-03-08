# Slack MCP Pull Contract (Codex Local)

This contract defines pull-first Slack MCP behavior for local Codex usage.

## Scope

- Runtime: local machine only.
- Workspace support: single workspace in v1.
- Trigger model: pull mode only (no always-on event listener).

## Workspace Resolution Contract v1

### Inputs

- User prompt text.
- Optional Slack link (`https://<workspace>.slack.com/...`).
- Configured default workspace identity (`workspace_domain` and optional `team_id`).

### Resolution rules

1. Parse Slack links and references from prompt text.
2. If no link/reference is present, use configured default workspace.
3. If link/reference is present, compare link workspace to configured default workspace.
4. If they match, continue.
5. If they do not match, stop and return remediation guidance.

### Fail-fast behavior

When workspace mismatch is detected, do not continue with fallback guesses. Return a clear remediation response that asks the user to:

- re-share a link from the configured workspace, or
- switch to the matching workspace profile once multi-workspace support is enabled.

## Intent Contract v1 (`read` vs `explicit_post`)

### Intent classes

- `read`: fetch, summarize, analyze, extract, compare, draft.
- `explicit_post`: prompt explicitly requests publish/send/post/reply in Slack.

### Write gate

- `read` intent must never call write tools.
- `explicit_post` intent may call write tools only after input parsing succeeds.
- "draft a reply" remains `read` unless the prompt explicitly asks to post.

### Response requirements

- `read` intent returns synthesized output with source Slack links when available.
- `explicit_post` intent returns destination details (channel/thread and message link) and the posted body summary.

## Slack Link Parsing Contract v1

Supported forms:

- Message link: `https://<workspace>.slack.com/archives/<channel_id>/p<ts>`
- Thread message link with query parameters (for example `thread_ts`, `cid`).
- Channel links under `https://<workspace>.slack.com/archives/<channel_id>`.

Unsupported or malformed links must be rejected with correction guidance.

## Posting Policy Contract v1

- Posting is allowed across Slack surfaces supported by the active MCP server and granted app scopes.
- Posting is never implicit.
- If prompt wording is ambiguous about posting, default to `read` behavior and return draft text.

## Expansion Contract (future-ready)

When multi-workspace support is added, resolution precedence will be:

1. explicit workspace alias in prompt
2. workspace derived from Slack link domain/team
3. configured default workspace

v1 prompt behavior must remain backward compatible under this precedence model.
