#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path

REQUIRED_ROADMAP_TEMPLATE_SNIPPETS: dict[str, tuple[str, ...]] = {
    "references/templates/roadmap_template.md": (
        "# Product Roadmap:",
        "## Summary",
        "## Roadmap Metadata",
        "## Prioritization Notes",
        "## Epic Portfolio",
        "### Epic:",
        "- JTBD:",
        "#### Initiatives",
        "## Cross-Epic Risks and Dependencies",
        "## Review Cadence",
    ),
    "references/templates/epic_template.md": (
        "# Epic:",
        "## Summary",
        "## Epic Metadata",
        "## JTBD",
        "## Objective and Success Signal",
        "## Dependencies",
        "## Initiatives",
        "## Open Questions",
    ),
}

REQUIRED_ROADMAP_EXAMPLE_SNIPPETS: dict[str, tuple[str, ...]] = {
    "skills/roadmap-writer/examples/example-input.md": (
        "Scenario A",
        "Scenario B",
    ),
    "skills/roadmap-writer/examples/example-output.md": (
        "Scenario A",
        "Scenario B",
        "`roadmap`",
        "`epic-only`",
        "JTBD",
        "Initiative:",
    ),
}

ROADMAP_SKILL_SNIPPETS = (
    "`references/product/jtbd-framework.md`",
    "`references/templates/roadmap_template.md`",
    "`references/templates/epic_template.md`",
    "`roadmap`",
    "`epic-only`",
    "JTBD",
    "MoSCoW",
    "2x2",
    "Eisenhower",
    "RICE",
)

ROADMAP_ARTIFACT_PATHS = (
    "references/product/jtbd-framework.md",
    "references/templates/roadmap_template.md",
    "references/templates/epic_template.md",
    "skills/roadmap-writer/SKILL.md",
    "skills/roadmap-writer/examples/example-input.md",
    "skills/roadmap-writer/examples/example-output.md",
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


def validate_no_milestone_terms(repo_root: Path, issues: list[str]) -> None:
    for rel_path in ROADMAP_ARTIFACT_PATHS:
        path = repo_root / rel_path
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8").lower()
        if "milestone" in text:
            issues.append(
                f"{rel_path}: roadmap artifacts must use initiative terminology, not milestone"
            )


def main() -> int:
    repo_root = Path(__file__).resolve().parent.parent
    issues: list[str] = []

    for rel_path, snippets in REQUIRED_ROADMAP_TEMPLATE_SNIPPETS.items():
        validate_file_contains(repo_root, rel_path, snippets, issues)

    for rel_path, snippets in REQUIRED_ROADMAP_EXAMPLE_SNIPPETS.items():
        validate_file_contains(repo_root, rel_path, snippets, issues)

    validate_file_contains(
        repo_root,
        "skills/roadmap-writer/SKILL.md",
        ROADMAP_SKILL_SNIPPETS,
        issues,
    )
    validate_no_milestone_terms(repo_root, issues)

    if issues:
        print(f"Roadmap artifact validation failed with {len(issues)} issue(s):")
        for issue in issues:
            print(f"- {issue}")
        return 1

    print(
        "Roadmap artifact validation passed "
        f"({len(REQUIRED_ROADMAP_TEMPLATE_SNIPPETS)} templates, "
        f"{len(REQUIRED_ROADMAP_EXAMPLE_SNIPPETS)} examples, roadmap skill contract checked)."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
