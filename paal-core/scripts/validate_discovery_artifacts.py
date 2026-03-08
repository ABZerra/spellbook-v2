#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path

REQUIRED_DISCOVERY_TEMPLATE_SNIPPETS: dict[str, tuple[str, ...]] = {
    "references/product/jtbd-framework.md": (
        "# Jobs To Be Done (JTBD) Framework",
        "## Evidence Grounding",
        "## Candidate vs Validated JTBD",
        "## How To Apply It Across Artifacts",
        "- Discovery plan:",
    ),
    "references/templates/discovery_plan_template.md": (
        "# Discovery Plan",
        "## Objective",
        "## Evidence Synthesis",
        "## JTBD",
        "## Questions to Answer",
        "## Risks and Assumptions",
        "## Research Activities",
        "## Initiatives",
        "## Decision Criteria",
        "## Deliverables",
    ),
}

REQUIRED_DISCOVERY_EXAMPLE_SNIPPETS: dict[str, tuple[str, ...]] = {
    "skills/discovery-plan/examples/example-input.md": (
        "# Example Input: Discovery Plan",
        "Evidence synthesis input:",
        "Primary JTBD:",
    ),
    "skills/discovery-plan/examples/example-output.md": (
        "# Example Output: Discovery Plan",
        "## Evidence Synthesis",
        "## JTBD",
        "## Questions to Answer",
        "## What to pass forward",
    ),
}

DISCOVERY_SKILL_SNIPPETS = (
    "`references/product/jtbd-framework.md`",
    "`references/templates/research_synthesis_input_template.md`",
    "research-synthesis input",
    "Primary JTBD if known",
    "evidence-backed",
    "Identify the primary JTBD",
    "problem statement, JTBD, validated assumptions",
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

    for rel_path, snippets in REQUIRED_DISCOVERY_TEMPLATE_SNIPPETS.items():
        validate_file_contains(repo_root, rel_path, snippets, issues)

    for rel_path, snippets in REQUIRED_DISCOVERY_EXAMPLE_SNIPPETS.items():
        validate_file_contains(repo_root, rel_path, snippets, issues)

    validate_file_contains(
        repo_root,
        "skills/discovery-plan/SKILL.md",
        DISCOVERY_SKILL_SNIPPETS,
        issues,
    )

    if issues:
        print(f"Discovery artifact validation failed with {len(issues)} issue(s):")
        for issue in issues:
            print(f"- {issue}")
        return 1

    print(
        "Discovery artifact validation passed "
        f"({len(REQUIRED_DISCOVERY_TEMPLATE_SNIPPETS)} templates, "
        f"{len(REQUIRED_DISCOVERY_EXAMPLE_SNIPPETS)} examples, discovery skill contract checked)."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
