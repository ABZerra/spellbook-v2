#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path

REQUIRED_RESEARCH_FILES: dict[str, tuple[str, ...]] = {
    "references/product/research-synthesis-framework.md": (
        "# Research Synthesis Framework",
        "## Source Normalization",
        "## Evidence Strength Vocabulary",
        "## Convergence Analysis",
        "## Contradiction Analysis",
        "## Gap Detection",
        "## Segment-Difference Handling",
        "## Outlier Handling",
        "## JTBD Candidate Derivation",
        "## No Default Numeric Scoring",
    ),
    "references/templates/research_synthesis_input_template.md": (
        "# Research Synthesis Input",
        "## Research Question",
        "## Sources",
        "## Evidence Strength Notes",
        "## Converging Themes",
        "## Contradictions and Segment Differences",
        "## Gaps and Unknowns",
        "## JTBD Candidates",
        "## Discovery Questions to Carry Forward",
        "## Next likely skill(s)",
        "## What to pass forward",
        "## Suggested next prompts",
    ),
    "skills/research-synthesis/SKILL.md": (
        "references/product/research-synthesis-framework.md",
        "references/templates/research_synthesis_input_template.md",
        "mixed discovery evidence",
        "JTBD candidates",
        "converging themes",
        "contradictions",
        "discovery-plan",
        "Next likely skill(s)",
        "What to pass forward",
        "Suggested next prompts",
    ),
    "skills/research-synthesis/examples/example-input.md": (
        "# Example Input: Research Synthesis",
        "Research question:",
        "Source inventory:",
    ),
    "skills/research-synthesis/examples/example-output.md": (
        "# Example Output: Research Synthesis",
        "## JTBD Candidates",
        "## Next likely skill(s)",
        "`discovery-plan`",
    ),
}


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

    for rel_path, snippets in REQUIRED_RESEARCH_FILES.items():
        validate_file_contains(repo_root, rel_path, snippets, issues)

    if issues:
        print(f"Research artifact validation failed with {len(issues)} issue(s):")
        for issue in issues:
            print(f"- {issue}")
        return 1

    print(f"Research artifact validation passed ({len(REQUIRED_RESEARCH_FILES)} files checked).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
