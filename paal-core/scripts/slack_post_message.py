#!/usr/bin/env python3
"""Post a message (or thread reply) to Slack using a local user/bot token."""

from __future__ import annotations

import argparse
import json
import os
import re
import ssl
import subprocess
import sys
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse
from urllib.request import Request, urlopen

SLACK_POST_URL = "https://slack.com/api/chat.postMessage"
TS_PATH_PATTERN = re.compile(r"^/archives/([A-Z0-9]+)/p([0-9]{16})$")
LOGIN_KEYCHAIN_PATH = Path.home() / "Library/Keychains/login.keychain-db"
KEYCHAIN_SERVICE_BY_IDENTITY = {
    "bot": "CODEX_SLACK_BOT_TOKEN",
    "user": "CODEX_SLACK_MCP_TOKEN",
}


def parse_slack_link(link: str) -> tuple[str, str | None]:
    parsed = urlparse(link)
    channel_id = ""
    thread_ts: str | None = None

    match = TS_PATH_PATTERN.match(parsed.path)
    if match:
        channel_id = match.group(1)
        raw = match.group(2)
        message_ts = f"{raw[:10]}.{raw[10:]}"
        thread_ts = message_ts
    elif parsed.path.startswith("/archives/"):
        parts = parsed.path.split("/")
        if len(parts) >= 3:
            channel_id = parts[2]

    query = parse_qs(parsed.query)
    if "thread_ts" in query and query["thread_ts"]:
        thread_ts = query["thread_ts"][0]

    if not channel_id:
        raise ValueError("Could not parse channel ID from Slack link")

    return channel_id, thread_ts


def load_text(args: argparse.Namespace) -> str:
    if args.text and args.text_file:
        raise ValueError("Use only one of --text or --text-file")
    if args.text:
        return args.text.strip()
    if args.text_file:
        return Path(args.text_file).read_text(encoding="utf-8").strip()
    raise ValueError("Provide --text or --text-file")


def load_keychain_token(identity: str) -> str:
    if sys.platform != "darwin":
        return ""

    service = KEYCHAIN_SERVICE_BY_IDENTITY.get(identity, "")
    if not service:
        return ""

    cmd = [
        "security",
        "find-generic-password",
        "-a",
        os.getenv("USER", ""),
        "-s",
        service,
        "-w",
        str(LOGIN_KEYCHAIN_PATH),
    ]
    try:
        result = subprocess.run(
            cmd,
            check=False,
            capture_output=True,
            text=True,
        )
    except Exception:
        return ""

    if result.returncode != 0:
        return ""
    return result.stdout.strip()


def post_message(token: str, payload: dict[str, Any]) -> dict[str, Any]:
    body = json.dumps(payload).encode("utf-8")
    request = Request(
        SLACK_POST_URL,
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json; charset=utf-8",
        },
    )
    # macOS Python environments can miss CA linkage. Prefer an explicit cafile
    # when available; otherwise use the default trust store.
    cafile = "/etc/ssl/cert.pem"
    ssl_context = (
        ssl.create_default_context(cafile=cafile)
        if Path(cafile).exists()
        else ssl.create_default_context()
    )
    try:
        with urlopen(request, timeout=20, context=ssl_context) as response:
            raw = response.read().decode("utf-8")
            return json.loads(raw)
    except Exception as exc:
        # Preserve clear error wording without leaking token details.
        if getattr(exc, "code", None) is not None:
            raise RuntimeError(f"Slack API HTTP error: {exc.code}") from exc
        if getattr(exc, "reason", None) is not None:
            raise RuntimeError(f"Slack API network error: {exc.reason}") from exc
        raise RuntimeError("Slack API request failed") from exc


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Post to Slack channel or thread via chat.postMessage",
    )
    parser.add_argument(
        "--identity",
        choices=("bot", "user"),
        default="bot",
        help="Post as bot (default) or user token",
    )
    parser.add_argument(
        "--token-env",
        help="Override environment variable containing Slack token",
    )
    parser.add_argument("--channel", help="Slack channel ID, e.g. C024F5AHP")
    parser.add_argument(
        "--thread-ts",
        help="Thread timestamp, e.g. 1700000000.123456",
    )
    parser.add_argument(
        "--link",
        help="Slack message/thread URL; extracts channel and thread_ts automatically",
    )
    parser.add_argument("--text", help="Message text")
    parser.add_argument("--text-file", help="Path to text file containing message body")
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    try:
        text = load_text(args)
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 2

    default_token_env = "SLACK_BOT_TOKEN" if args.identity == "bot" else "SLACK_MCP_USER_TOKEN"
    token_env = args.token_env or default_token_env
    token = os.getenv(token_env, "").strip()
    if not token:
        token = load_keychain_token(args.identity)
    if not token:
        print(
            f"Error: missing token env var {token_env} and keychain token for identity '{args.identity}'",
            file=sys.stderr,
        )
        return 2

    channel = args.channel
    thread_ts = args.thread_ts

    if args.link:
        try:
            parsed_channel, parsed_thread = parse_slack_link(args.link)
        except Exception as exc:
            print(f"Error: {exc}", file=sys.stderr)
            return 2
        channel = channel or parsed_channel
        thread_ts = thread_ts or parsed_thread

    if not channel:
        print("Error: provide --channel or --link", file=sys.stderr)
        return 2

    payload: dict[str, Any] = {"channel": channel, "text": text}
    if thread_ts:
        payload["thread_ts"] = thread_ts

    try:
        result = post_message(token, payload)
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    if not result.get("ok"):
        print(json.dumps(result, indent=2))
        return 1

    summary = {
        "ok": True,
        "channel": result.get("channel"),
        "ts": result.get("ts"),
        "message_link": result.get("message", {}).get("permalink"),
    }
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
