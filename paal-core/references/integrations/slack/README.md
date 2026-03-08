# Slack Integration (Local MCP Pull Mode)

PAAL supports a local Slack MCP pull mode for on-demand Codex usage without a Slack bot listener.

## Scope

- Local runtime only (your machine).
- Single workspace in v1.
- Explicit posting only (`read` intent never writes).

## Documents

- Runbook: `references/integrations/slack/mcp-pull-mode.md`
- Behavior contract: `references/integrations/slack/mcp-pull-contract.md`

## Posting identity

- Default posting path is bot-first via `scripts/slack_post_message.py`.
- Default token env for posting is `SLACK_BOT_TOKEN`.
- Script can fall back to login keychain token `CODEX_SLACK_BOT_TOKEN` on macOS.
- Fallback user identity is supported with `--identity user`.

This integration path is intentionally separate from any Slack-triggered bot or gateway automation.
