# Slack MCP Pull Mode (Codex Local, Single Workspace v1)

Use this runbook when Codex should fetch Slack data on demand and optionally post only on explicit request.

## Scope and defaults

- Official Slack MCP server is the primary choice.
- Runtime is local only (your machine).
- v1 supports one configured Slack workspace.
- No Slack-triggered automation (`@codex` listener) is included.

## How to "summon" in current mode

In pull mode, summon happens in Codex prompts, not inside Slack.

- Supported now:
  - Paste a Slack link in Codex and ask for action (`summarize`, `extract tasks`, `draft reply`, `post reply`).
- Not supported now:
  - Slack `@mention` listeners.
  - Slack slash-command webhooks.

Those two require a running Slack gateway/listener service, which is intentionally out of scope for this mode.

## PAAL-first workstation defaults (macOS)

Use this setup when PAAL is your primary Codex workspace.

Set one reusable variable first:

```bash
export PAAL_ROOT="/absolute/path/to/PAAL"
```

Persist the same value in `~/.zshrc` so aliases and startup jobs keep working after restart.

1. Register official Slack MCP endpoint in Codex:

```bash
codex mcp add slack --url https://mcp.slack.com/mcp
```

2. Set shell default so `codex` starts in PAAL:

```bash
cat >> ~/.zshrc <<'EOF'
# >>> codex-paal-default >>>
export PAAL_ROOT="/absolute/path/to/PAAL"
alias codex='codex -C "$PAAL_ROOT"'
alias codex-here='command codex'
# <<< codex-paal-default <<<
EOF
```

3. Auto-open Codex in PAAL at login (LaunchAgent, optional):

- LaunchAgent path: `~/Library/LaunchAgents/com.<user>.codex-paal.plist`
- Command: `/Applications/Codex.app/Contents/Resources/codex app "$PAAL_ROOT"`
- Enable with `launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.<user>.codex-paal.plist`

`codex-here` remains available for non-PAAL directories.

## Manual auth path for Codex (when `codex mcp login slack` is unavailable)

If OAuth dynamic client registration is not available for your Codex build:

1. Enable `Model Context Protocol` in the Slack app (`Agents & AI Apps`).
2. Configure Slack app user scopes for your test scope (read-only first; add `chat:write` only when needed).
3. Obtain a user OAuth token (`xoxp-...`) via Slack OAuth flow.
4. Store token in system keychain (or equivalent secure local secret store).
5. Export token into login-session env var from keychain:

```bash
launchctl setenv SLACK_MCP_USER_TOKEN "$(security find-generic-password -a "$USER" -s CODEX_SLACK_MCP_TOKEN -w)"
```

6. Register Slack MCP with bearer-token env var:

```bash
codex mcp remove slack
codex mcp add slack --url https://mcp.slack.com/mcp --bearer-token-env-var SLACK_MCP_USER_TOKEN
```

7. Verify:

```bash
codex mcp list
```

Expected: `slack` shows `Auth` as `Bearer token`.

Note: avoid placing raw `xoxp` tokens directly in command history or committed files.

## Local setup

1. Create a Slack app for the target workspace.
2. Grant read scopes required by your workflows and `chat:write` for explicit posting.
3. Install the app to the workspace and capture required credentials for the chosen MCP server.
4. Configure a local Codex MCP profile for this Slack server in `~/.codex/config.toml` (or via `codex mcp add`).
5. Start the Slack MCP server locally before running Codex tasks that need Slack.

## Recommended Slack scopes (minimum baseline)

Read baseline:

- `channels:history`
- `groups:history`
- `im:history`
- `mpim:history`
- `channels:read`
- `groups:read`
- `im:read`
- `mpim:read`
- `files:read`

Write baseline for explicit posting:

- `chat:write`

If your MCP server or workspace policy requires additional scopes, document and approve them explicitly.

## Local startup model

1. Start Slack MCP server process.
2. Verify Codex can discover Slack tools from the configured profile.
3. Run a small read test against a known channel/thread.
4. Keep server running while Codex executes Slack tasks.

## Posting and replying from terminal (current setup)

This repository no longer runs a Slack gateway listener, so posting is terminal-driven.

Use:

```bash
python3 scripts/slack_post_message.py --link "<slack-message-or-thread-link>" --text "Reply text"
```

Notes:

- The script posts as `bot` by default and reads token from `SLACK_BOT_TOKEN`.
- Use `--identity user` to post as yourself via `SLACK_MCP_USER_TOKEN`.
- If env vars are missing, the script falls back to macOS keychain:
  - bot: `CODEX_SLACK_BOT_TOKEN`
  - user: `CODEX_SLACK_MCP_TOKEN`
- If `--link` points to a message, the reply is posted in that thread.
- You can also post directly to a channel:

```bash
python3 scripts/slack_post_message.py --channel C024F5AHP --text "New channel message"
```

## One-time bot-token setup (no recurring UI work)

Store bot token in login keychain:

```bash
read -s "bot_token?Paste Slack bot token (xoxb-...): " && echo
security add-generic-password -U -a "$USER" -s CODEX_SLACK_BOT_TOKEN -w "$bot_token" ~/Library/Keychains/login.keychain-db
unset bot_token
```

Refresh login env immediately:

```bash
launchctl setenv SLACK_BOT_TOKEN "$(security find-generic-password -a "$USER" -s CODEX_SLACK_BOT_TOKEN -w ~/Library/Keychains/login.keychain-db)"
```

## Behavior contract references

- Workspace resolution and fail-fast mismatch behavior: `references/integrations/slack/mcp-pull-contract.md`.
- Write gate for `read` vs `explicit_post` intent: `references/integrations/slack/mcp-pull-contract.md`.

## E2E demo checklist

### 1) Connectivity

- MCP server is running locally.
- Codex can discover Slack tools.
- Auth test to Slack succeeds.

### 2) Fetch flow (`read` intent)

- Prompt references a Slack thread or channel.
- Codex fetches context and returns synthesized output.
- Response includes source Slack links when available.

### 3) Explicit post flow (`explicit_post` intent)

- Prompt explicitly asks to post/publish/send.
- For bot identity, run `scripts/slack_post_message.py` (not MCP write tools).
- Response confirms destination and includes the resulting Slack link.

### 4) Negative checks

- Missing scope returns actionable remediation.
- Invalid Slack link is rejected with correction guidance.
- Non-explicit prompt does not publish.

## Troubleshooting matrix

| Symptom | Likely cause | Remediation |
| --- | --- | --- |
| Slack tools are not visible in Codex | MCP server not started or profile misconfigured | Restart server and re-check MCP profile registration |
| Authentication failures | Invalid or expired token, wrong workspace app install | Reinstall app, rotate token, and verify workspace install target |
| Read works but posting fails | Missing `chat:write` or channel permission | Add required write scope and reauthorize app |
| Link-based fetch fails | Malformed Slack URL or workspace mismatch | Use canonical Slack message link; verify link workspace matches configured workspace |
| Intermittent errors | Rate limits or transient network issues | Retry with backoff and smaller fetch scope |
| Tool call errors for specific methods | MCP server capability mismatch | Confirm official Slack MCP server version and supported tools |
| `Dynamic client registration not supported` during `codex mcp login slack` | Slack MCP OAuth dynamic registration is unavailable in the current flow | Keep server registered, then authenticate with the currently supported Slack MCP method for your Codex version (for example bearer-token env var or updated OAuth flow) |

## Logging and redaction guidance

- Never print raw tokens or authorization headers.
- Redact secrets in screenshots, transcripts, and docs.
- Log minimally: operation type, workspace identifier, target channel/thread, status.

## Multi-workspace expansion appendix

This v1 runbook intentionally configures one workspace. To expand later:

1. Add one MCP profile per workspace.
2. Add workspace alias metadata for prompt-level resolution.
3. Apply resolution precedence from `mcp-pull-contract.md`.
4. Keep v1 behavior as default fallback to avoid prompt regressions.
