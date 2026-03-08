#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path

REQUIRED_PRD_TEMPLATE_SNIPPETS: dict[str, tuple[str, ...]] = {
    "references/product/jtbd-framework.md": (
        "# Jobs To Be Done (JTBD) Framework",
        "## Core format",
        "## Evidence Grounding",
        "## Candidate vs Validated JTBD",
        "## How To Apply It Across Artifacts",
    ),
    "references/templates/prd_template.md": (
        "# PRD:",
        "## Summary",
        "## Business Context and Strategic Fit",
        "## Problem Definition",
        "## Users, JTBD, and Journey",
        "### JTBD (required; use TBD when unknown)",
        "Synthesis input:",
        "This JTBD should directly inform Must Have scope and initiative ordering.",
        "## Goals, Non-goals, and Scope",
        "## Requirements and Verification",
        "## Success Metrics and Measurement Plan",
        "## Rollout and Initiatives",
    ),
}

REQUIRED_PRD_EXAMPLE_SNIPPETS: dict[str, tuple[str, ...]] = {
    "skills/prd-writer/examples/example-input.md": (
        "Feature proposal:",
        "Known context:",
    ),
    "skills/prd-writer/examples/example-output.md": (
        "Research synthesis input:",
        "## Users, JTBD, and Journey",
        "### JTBD (required; use TBD when unknown)",
        "When I create a workspace for the first time",
        "## Rollout and Initiatives",
    ),
}

PRD_SKILL_SNIPPETS = (
    "`references/product/jtbd-framework.md`",
    "`references/templates/research_synthesis_input_template.md`",
    "`references/templates/prd_template.md`",
    "validated JTBD from discovery",
    "primary user JTBD",
    "JTBD/journey",
    "Must Have",
    "initiative ordering",
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


def main() -> int:
    repo_root = Path(__file__).resolve().parent.parent
    issues: list[str] = []

    for rel_path, snippets in REQUIRED_PRD_TEMPLATE_SNIPPETS.items():
        validate_file_contains(repo_root, rel_path, snippets, issues)

    for rel_path, snippets in REQUIRED_PRD_EXAMPLE_SNIPPETS.items():
        validate_file_contains(repo_root, rel_path, snippets, issues)

    validate_file_contains(repo_root, "skills/prd-writer/SKILL.md", PRD_SKILL_SNIPPETS, issues)

    if issues:
        print(f"PRD artifact validation failed with {len(issues)} issue(s):")
        for issue in issues:
            print(f"- {issue}")
        return 1

    print(
        "PRD artifact validation passed "
        f"({len(REQUIRED_PRD_TEMPLATE_SNIPPETS)} templates, "
        f"{len(REQUIRED_PRD_EXAMPLE_SNIPPETS)} examples, PRD skill contract checked)."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
