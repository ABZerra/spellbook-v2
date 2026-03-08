#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path

REQUIRED_FILES: dict[str, tuple[str, ...]] = {
    "README.md": (
        "docs/tickets/*.md",
        "`meeting-artifact-router`",
        "meeting-driven routing",
        "transcript-driven post-meeting requests",
    ),
    "INTEGRATION.md": (
        "docs/tickets/",
        "meeting-artifact-router",
        "typed folders under `docs/`",
        "paal-core/skills/",
    ),
    "references/README.md": (
        "`references/meeting-router/`",
        "`references/templates/meeting_open_questions_template.md`",
    ),
    "references/meeting-router/README.md": (
        "# Meeting Router Reference",
        "## Output Registry",
        "## Router-Generated Frontmatter",
        "## Fallback Behavior",
        "If no non-meeting artifact qualifies",
    ),
    "references/meeting-router/output-registry.yaml": (
        "outputs:",
        "- id: meeting_output",
        "- id: discovery_plan",
        "- id: prd",
        "- id: acceptance_criteria",
        "- id: ticket",
        "output_folder: docs/tickets",
    ),
    "references/templates/meeting_open_questions_template.md": (
        "# Meeting Open Questions",
        "## Blocking Questions",
        "## Assumptions Waiting For Confirmation",
        "## Recommended Next Step",
    ),
    "references/templates/project-repo/.paal/run-template.md": (
        "`docs/tickets/<slug>.md`",
        "docs/meetings/<slug>.md",
        "`paal-core/skills/`",
        "`paal-core/references/`",
        "`org/skills/`",
        "`meeting-artifact-router`",
    ),
    "skills/meeting-artifact-router/SKILL.md": (
        "meeting transcript",
        "references/meeting-router/output-registry.yaml",
        "Always produce a meeting output",
        "Any transcript-driven post-meeting output request should start here",
        "If no non-meeting artifacts qualify, fall back to `meeting-output-writer`",
        "If GitHub context is unavailable",
        "does not replace `meeting-output-writer`",
    ),
    "skills/meeting-output-writer/SKILL.md": (
        "explicitly limited to summary, decisions, and action items",
        "Do not use for transcript-driven post-meeting output requests unless the user explicitly limits scope",
    ),
    "skills/meeting-artifact-router/examples/example-input.md": (
        "# Example Input: Meeting Artifact Router",
        "github_repo:",
        "Transcript:",
    ),
    "skills/meeting-artifact-router/examples/example-output.md": (
        "artifact_type: meeting_output",
        "router_output_id: meeting_output",
        "artifact_type: prd",
        "artifact_type: ticket",
        "open_questions_path:",
    ),
    "skills/meeting-artifact-router/examples/example-discovery-output.md": (
        "artifact_type: discovery_plan",
        "router_output_id: discovery_plan",
        "docs/discovery/",
    ),
    "skills/meeting-artifact-router/examples/example-fallback-output.md": (
        "generation_basis: fallback",
        "artifact_type: meeting_output",
        "github_context_used: false",
        "# Meeting Open Questions",
    ),
    "scripts/normalize_meeting_transcript.py": (
        "SUPPORTED_EXTENSIONS",
        "def normalize_markdown",
        "def normalize_text",
        "def normalize_json",
    ),
    "scripts/fetch_github_context.py": (
        "api.github.com",
        "def build_failure_payload",
        "def build_success_markdown",
        "GITHUB_TOKEN",
    ),
}

EXPECTED_OUTPUT_FOLDERS = (
    "docs/meetings",
    "docs/discovery",
    "docs/prd",
    "docs/acceptance-criteria",
    "docs/tickets",
)


def validate_file_contains(
    repo_root: Path, rel_path: str, required_snippets: tuple[str, ...], issues: list[str]
) -> None:
    path = repo_root / rel_path
    if not path.exists():
        issues.append(f"missing required file: {rel_path}")
        return

    text = path.read_text(encoding="utf-8")
    if not text.strip():
        issues.append(f"file is empty: {rel_path}")
        return

    for snippet in required_snippets:
        if snippet not in text:
            issues.append(f"{rel_path}: missing required section/snippet '{snippet}'")


def validate_registry_output_folders(repo_root: Path, issues: list[str]) -> None:
    path = repo_root / "references/meeting-router/output-registry.yaml"
    if not path.exists():
        return

    text = path.read_text(encoding="utf-8")
    for folder in EXPECTED_OUTPUT_FOLDERS:
        if folder not in text:
            issues.append(
                "references/meeting-router/output-registry.yaml: "
                f"missing required output folder '{folder}'"
            )


def main() -> int:
    repo_root = Path(__file__).resolve().parent.parent
    issues: list[str] = []

    for rel_path, snippets in REQUIRED_FILES.items():
        validate_file_contains(repo_root, rel_path, snippets, issues)

    validate_registry_output_folders(repo_root, issues)

    if issues:
        print(f"Meeting router validation failed with {len(issues)} issue(s):")
        for issue in issues:
            print(f"- {issue}")
        return 1

    print(
        "Meeting router validation passed "
        f"({len(REQUIRED_FILES)} files checked, registry output folders validated)."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
