#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path
from urllib.parse import quote

LOCAL_REQUIRED_FILES = (
    ".paal/project.yaml",
    ".github/copilot-instructions.md",
    ".github/PULL_REQUEST_TEMPLATE/default.md",
)

DOC_TEMPLATE_CANDIDATES = (
    ".github/PULL_REQUEST_TEMPLATE/docs.md",
    ".github/PULL_REQUEST_TEMPLATE/docs-output.md",
)

REQUIRED_PROJECT_CONFIG_SNIPPETS = (
    "review:",
    "codex_review:",
    "recommended_human_approvals:",
    "enforce_human_approvals:",
    "reviewer_handles:",
    "github_ai_review:",
    "external_tool:",
)

SUPERPOWERS_SKILL_PATH_CANDIDATES = (
    Path.home() / ".agents/skills/superpowers/requesting-code-review/SKILL.md",
    Path.home() / ".codex/superpowers/skills/requesting-code-review/SKILL.md",
    Path.home() / ".codex/skills/superpowers/requesting-code-review/SKILL.md",
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Audit local and GitHub-side PR review setup for a PAAL-enabled project repo."
    )
    parser.add_argument("--repo", required=True, help="GitHub repository in owner/name form.")
    parser.add_argument(
        "--project-config",
        default=".paal/project.yaml",
        help="Relative path to the local project config file. Defaults to .paal/project.yaml.",
    )
    parser.add_argument(
        "--local-repo",
        default=".",
        help="Local repo root to inspect. Defaults to the current directory.",
    )
    return parser.parse_args()


def run_command(command: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        command,
        capture_output=True,
        text=True,
        check=False,
    )


def run_gh_json(path: str) -> tuple[object | None, str | None]:
    result = run_command(["gh", "api", path])
    if result.returncode != 0:
        message = result.stderr.strip() or result.stdout.strip() or "gh api request failed"
        return None, message
    try:
        return json.loads(result.stdout), None
    except json.JSONDecodeError as exc:
        return None, f"invalid JSON from gh api: {exc}"


def contains_token(value: object, needle: str) -> bool:
    if isinstance(value, dict):
        return any(contains_token(item, needle) for item in value.values())
    if isinstance(value, list):
        return any(contains_token(item, needle) for item in value)
    if isinstance(value, str):
        return needle.casefold() in value.casefold()
    return False


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def extract_line_value(text: str, key: str) -> str | None:
    prefix = f"{key}:"
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith(prefix):
            return stripped.split(":", 1)[1].strip() or "(empty)"
    return None


def detect_superpowers_locations() -> list[str]:
    locations: list[str] = []
    executable = shutil.which("superpowers")
    if executable:
        locations.append(executable)
    for path in SUPERPOWERS_SKILL_PATH_CANDIDATES:
        if path.exists():
            locations.append(str(path))
    deduped: list[str] = []
    for value in locations:
        if value not in deduped:
            deduped.append(value)
    return deduped


def print_section(title: str) -> None:
    print(f"## {title}")
    print()


def main() -> int:
    args = parse_args()
    local_repo = Path(args.local_repo).resolve()
    project_config_path = local_repo / args.project_config

    local_failures: list[str] = []
    local_notes: list[str] = []
    next_steps: list[str] = []
    config_values: dict[str, str] = {}

    if shutil.which("gh") is None:
        print("GitHub review setup audit failed: `gh` is not installed.", file=sys.stderr)
        return 1

    auth_result = run_command(["gh", "auth", "status"])
    if auth_result.returncode != 0:
        message = auth_result.stderr.strip() or auth_result.stdout.strip() or "`gh auth status` failed"
        print(f"GitHub review setup audit failed: {message}", file=sys.stderr)
        return 1

    for rel_path in LOCAL_REQUIRED_FILES:
        path = local_repo / rel_path
        if not path.exists():
            local_failures.append(f"missing required local file: {rel_path}")
            continue
        if not path.is_file():
            local_failures.append(f"required local path is not a file: {rel_path}")
            continue
        if not read_text(path).strip():
            local_failures.append(f"required local file is empty: {rel_path}")

    docs_template_found = False
    for rel_path in DOC_TEMPLATE_CANDIDATES:
        path = local_repo / rel_path
        if not path.exists():
            continue
        if not path.is_file():
            local_failures.append(f"required local path is not a file: {rel_path}")
            continue
        if not read_text(path).strip():
            local_failures.append(f"required local file is empty: {rel_path}")
            continue
        docs_template_found = True

    if not docs_template_found:
        local_failures.append(
            "missing required local docs PR template: "
            ".github/PULL_REQUEST_TEMPLATE/docs.md "
            "(legacy .github/PULL_REQUEST_TEMPLATE/docs-output.md is also accepted)"
        )

    if project_config_path.exists() and project_config_path.is_file():
        config_text = read_text(project_config_path)
        for snippet in REQUIRED_PROJECT_CONFIG_SNIPPETS:
            if snippet not in config_text:
                local_failures.append(
                    f"{args.project_config}: missing required review key '{snippet}'"
                )
        for key in (
            "codex_review",
            "recommended_human_approvals",
            "enforce_human_approvals",
            "reviewer_handles",
            "github_ai_review",
            "external_tool",
        ):
            value = extract_line_value(config_text, key)
            if value is not None:
                config_values[key] = value
                local_notes.append(f"`{key}`: {value}")
    else:
        local_failures.append(f"missing required local file: {args.project_config}")

    external_tool_setting = config_values.get("external_tool")
    superpowers_locations = detect_superpowers_locations()

    repo_data, repo_error = run_gh_json(f"repos/{args.repo}")
    if repo_error is not None or not isinstance(repo_data, dict):
        message = repo_error or "unable to load repository metadata"
        print(f"GitHub review setup audit failed: {message}", file=sys.stderr)
        return 1

    default_branch = str(repo_data.get("default_branch") or "main")
    branch_path = f"repos/{args.repo}/branches/{quote(default_branch, safe='')}/protection"
    protection_data, protection_error = run_gh_json(branch_path)
    ruleset_data, ruleset_error = run_gh_json(f"repos/{args.repo}/rulesets")

    print(f"# GitHub Review Setup Audit for `{args.repo}`")
    print()
    print(f"- Default branch: `{default_branch}`")
    print(f"- Repository URL: {repo_data.get('html_url', '(unknown)')}")
    print()

    print_section("Local assets")
    if local_failures:
        for issue in local_failures:
            print(f"- Missing or invalid: {issue}")
    else:
        print("- Required local review assets are present.")
    for note in local_notes:
        print(f"- Config: {note}")
    print("- Copilot repository instructions file should stay short and review-oriented.")
    print()

    print_section("PR workflow defaults")
    print("- `Codex review` is expected to run inside `pr-preparation` before PR output is finalized.")
    print("- `1` human approval is recommended when available, but not enforced by default.")
    if external_tool_setting == "none":
        print("- External review tool: disabled by local project metadata.")
    elif external_tool_setting == "auto":
        if superpowers_locations:
            print("- External review tool: `superpowers` is auto-detected and will be used automatically by `pr-preparation` as an extra local review layer.")
            for location in superpowers_locations:
                print(f"  - detected at `{location}`")
        else:
            print("- External review tool: auto-detection is enabled, but no local `superpowers` install was found. `pr-preparation` will continue without it.")
    elif external_tool_setting == "superpowers":
        if superpowers_locations:
            print("- External review tool: `superpowers` is explicitly configured and available locally.")
            for location in superpowers_locations:
                print(f"  - detected at `{location}`")
        else:
            print("- External review tool: `superpowers` is explicitly configured, but no local install was found. `pr-preparation` will continue without it.")
            next_steps.append(
                "Install superpowers locally or switch `.paal/project.yaml` to `external_tool: auto` or `external_tool: none`."
            )
    elif external_tool_setting:
        print(f"- External review tool: unrecognized config value `{external_tool_setting}`.")
        next_steps.append(
            "Set `.paal/project.yaml` `external_tool` to `auto`, `none`, or `superpowers`."
        )
    else:
        print("- External review tool: local project metadata did not expose an `external_tool` setting.")
    print()

    print_section("GitHub protection and checks")
    if protection_error is None and isinstance(protection_data, dict):
        required_checks = protection_data.get("required_status_checks") or {}
        contexts = list(required_checks.get("contexts") or [])
        checks = required_checks.get("checks") or []
        named_checks = [
            str(item.get("context"))
            for item in checks
            if isinstance(item, dict) and item.get("context")
        ]
        combined = contexts + [check for check in named_checks if check not in contexts]
        if combined:
            print("- Visible required status checks:")
            for check in combined:
                print(f"  - `{check}`")
        else:
            print("- Branch protection is visible, but no required status checks were listed through the legacy protection endpoint.")
            next_steps.append("Confirm branch protection or rulesets require the expected PAAL status checks.")
    else:
        print(f"- Branch protection visibility: manual verification required ({protection_error or 'not visible'}).")
        next_steps.append("Confirm branch protection or rulesets on the default branch.")

    if ruleset_error is None and isinstance(ruleset_data, list):
        if ruleset_data:
            print("- Visible repository rulesets:")
            for ruleset in ruleset_data:
                name = str(ruleset.get("name") or "(unnamed)")
                enforcement = str(ruleset.get("enforcement") or "unknown")
                print(f"  - `{name}` (`{enforcement}`)")
        else:
            print("- No repository rulesets were returned by `gh api repos/<repo>/rulesets`.")
    else:
        print(f"- Ruleset visibility: manual verification required ({ruleset_error or 'not visible'}).")
    print()

    print_section("GitHub AI review setup")
    if ruleset_error is None and isinstance(ruleset_data, list) and contains_token(ruleset_data, "copilot"):
        print("- A Copilot-related ruleset signal was visible through the repository ruleset data.")
    else:
        print("- Automatic Copilot review is settings-driven and could not be confirmed through a stable public API in this helper.")
        next_steps.append(
            "Verify repository or organization Copilot automatic review settings manually."
        )
    print("- Local `.github/copilot-instructions.md` is the repository-side guidance surface for Copilot review.")
    print("- Missing GitHub AI review setup is advisory, not a blocker for PAAL validation.")
    print()

    print_section("Recommended next steps")
    if local_failures:
        print("- Fix the missing local review assets before relying on PR automation.")
    if not next_steps and not local_failures:
        print("- Local assets are in place. Confirm Copilot auto-review settings manually if you want GitHub-native bot reviews.")
    else:
        for step in next_steps:
            print(f"- {step}")

    return 1 if local_failures else 0


if __name__ == "__main__":
    sys.exit(main())
