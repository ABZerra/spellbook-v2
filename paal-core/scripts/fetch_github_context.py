#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from typing import Any

API_ROOT = "https://api.github.com"
DEFAULT_LIMIT = 5


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Fetch normalized GitHub context for a PAAL downstream repo."
    )
    parser.add_argument("--repo", required=True, help="GitHub repo slug in owner/name form.")
    parser.add_argument(
        "--format",
        choices=("markdown", "json"),
        default="markdown",
        help="Output format for the normalized context bundle.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=DEFAULT_LIMIT,
        help="Maximum open issues, pulls, labels, and milestones to include.",
    )
    parser.add_argument(
        "--output",
        help="Optional destination file. Defaults to stdout.",
    )
    return parser.parse_args()


def build_failure_payload(repo: str, reason: str, detail: str) -> dict[str, Any]:
    return {
        "status": "failure",
        "repo": repo,
        "reason": reason,
        "detail": detail,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


def github_request(path: str, token: str | None) -> Any:
    url = f"{API_ROOT}{path}"
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "PAAL-Meeting-Router",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    request = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(request, timeout=20) as response:
        return json.loads(response.read().decode("utf-8"))


def fetch_bundle(repo: str, limit: int, token: str | None) -> dict[str, Any]:
    repo_info = github_request(f"/repos/{repo}", token)
    labels = github_request(f"/repos/{repo}/labels?per_page={limit}", token)
    issues = github_request(f"/repos/{repo}/issues?state=open&per_page={limit}", token)
    pulls = github_request(f"/repos/{repo}/pulls?state=open&per_page={limit}", token)
    milestones = github_request(f"/repos/{repo}/milestones?state=open&per_page={limit}", token)

    filtered_issues = [item for item in issues if isinstance(item, dict) and "pull_request" not in item]

    return {
        "status": "success",
        "repo": repo,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "repo_info": {
            "name": repo_info.get("full_name", repo),
            "description": repo_info.get("description") or "TBD",
            "default_branch": repo_info.get("default_branch") or "main",
            "homepage": repo_info.get("homepage") or "",
            "html_url": repo_info.get("html_url") or f"https://github.com/{repo}",
            "open_issues_count": repo_info.get("open_issues_count", 0),
        },
        "labels": [
            {
                "name": item.get("name", ""),
                "description": item.get("description") or "",
            }
            for item in labels
            if isinstance(item, dict)
        ],
        "issues": [
            {
                "number": item.get("number"),
                "title": item.get("title", ""),
                "url": item.get("html_url", ""),
            }
            for item in filtered_issues
        ],
        "pulls": [
            {
                "number": item.get("number"),
                "title": item.get("title", ""),
                "url": item.get("html_url", ""),
            }
            for item in pulls
            if isinstance(item, dict)
        ],
        "milestones": [
            {
                "title": item.get("title", ""),
                "description": item.get("description") or "",
                "url": item.get("html_url", ""),
            }
            for item in milestones
            if isinstance(item, dict)
        ],
    }


def build_success_markdown(bundle: dict[str, Any]) -> str:
    repo_info = bundle["repo_info"]
    lines = [
        "---",
        "status: success",
        f"repo: {bundle['repo']}",
        f"generated_at: {bundle['generated_at']}",
        "---",
        "",
        "# GitHub Context",
        "",
        "## Repo Summary",
        "",
        f"- Repository: {repo_info['name']}",
        f"- Description: {repo_info['description']}",
        f"- Default branch: {repo_info['default_branch']}",
        f"- GitHub URL: {repo_info['html_url']}",
        f"- Homepage: {repo_info['homepage'] or 'TBD'}",
        f"- Open issue count: {repo_info['open_issues_count']}",
        "",
        "## Labels",
        "",
    ]

    if bundle["labels"]:
        for label in bundle["labels"]:
            description = f" - {label['description']}" if label["description"] else ""
            lines.append(f"- `{label['name']}`{description}")
    else:
        lines.append("- None returned.")

    lines.extend(["", "## Open Issues", ""])
    if bundle["issues"]:
        for issue in bundle["issues"]:
            lines.append(f"- #{issue['number']} {issue['title']} ({issue['url']})")
    else:
        lines.append("- None returned.")

    lines.extend(["", "## Open Pull Requests", ""])
    if bundle["pulls"]:
        for pull in bundle["pulls"]:
            lines.append(f"- #{pull['number']} {pull['title']} ({pull['url']})")
    else:
        lines.append("- None returned.")

    lines.extend(["", "## Open Milestones", ""])
    if bundle["milestones"]:
        for milestone in bundle["milestones"]:
            description = f" - {milestone['description']}" if milestone["description"] else ""
            lines.append(f"- {milestone['title']}{description} ({milestone['url']})")
    else:
        lines.append("- None returned.")

    return "\n".join(lines).rstrip() + "\n"


def failure_to_markdown(payload: dict[str, Any]) -> str:
    lines = [
        "---",
        "status: failure",
        f"repo: {payload['repo']}",
        f"reason: {payload['reason']}",
        f"generated_at: {payload['generated_at']}",
        "---",
        "",
        "# GitHub Context",
        "",
        "## Failure",
        "",
        f"- Reason: {payload['reason']}",
        f"- Detail: {payload['detail']}",
        "- Next step: fall back to meeting output plus next steps in v1.",
    ]
    return "\n".join(lines).rstrip() + "\n"


def render_payload(bundle: dict[str, Any], output_format: str) -> str:
    if output_format == "json":
        return json.dumps(bundle, indent=2, sort_keys=True) + "\n"
    if bundle.get("status") == "success":
        return build_success_markdown(bundle)
    return failure_to_markdown(bundle)


def write_output(content: str, output_path: str | None) -> None:
    if output_path:
        with open(output_path, "w", encoding="utf-8") as handle:
            handle.write(content)
    else:
        sys.stdout.write(content)


def main() -> int:
    args = parse_args()
    token = os.environ.get("GITHUB_TOKEN")

    try:
        bundle = fetch_bundle(args.repo, max(1, args.limit), token)
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace").strip() or str(exc)
        bundle = build_failure_payload(args.repo, f"http_{exc.code}", detail)
        write_output(render_payload(bundle, args.format), args.output)
        return 1
    except urllib.error.URLError as exc:
        bundle = build_failure_payload(args.repo, "network_unavailable", str(exc.reason))
        write_output(render_payload(bundle, args.format), args.output)
        return 1
    except Exception as exc:  # noqa: BLE001
        bundle = build_failure_payload(args.repo, "unexpected_error", str(exc))
        write_output(render_payload(bundle, args.format), args.output)
        return 1

    write_output(render_payload(bundle, args.format), args.output)
    return 0


if __name__ == "__main__":
    sys.exit(main())
