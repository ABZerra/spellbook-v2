#!/usr/bin/env python3
from __future__ import annotations

import re
import sys
from pathlib import Path

REQUIRED_TEMPLATE_FILES: dict[str, tuple[str, ...]] = {
    "references/templates/ticket_template.md": (
        "# Ticket",
        "## Title",
        "## Type",
        "## Story / Problem",
        "## JTBD",
        "## Scope",
        "## Acceptance Criteria",
        "## Metadata",
        "## Tasks",
        "## Links / Dependencies",
        "## Out of Scope",
    ),
    "references/templates/ticket_feature_template.md": (
        "# Feature Ticket",
        "## JTBD",
        "## Acceptance Criteria",
        "## Metadata",
    ),
    "references/templates/ticket_bug_template.md": (
        "# Bug Ticket",
        "## JTBD",
        "## Steps to Reproduce",
        "## Expected Behavior",
        "## Actual Behavior",
        "## Acceptance Criteria",
    ),
    "references/templates/ticket_chore_template.md": (
        "# Chore Ticket",
        "## JTBD",
        "## Acceptance Criteria",
        "## Metadata",
    ),
    "references/templates/ticket_spike_template.md": (
        "# Spike Ticket",
        "## JTBD",
        "## Timebox",
        "## Deliverable",
        "## Acceptance Criteria",
    ),
    "references/templates/acceptance_criteria_template.md": (
        "# Acceptance Criteria",
        "## Criteria (Gherkin Checklist)",
        "- JTBD:",
    ),
}

REQUIRED_SHARED_FILES: dict[str, tuple[str, ...]] = {
    "references/product/jtbd-framework.md": (
        "# Jobs To Be Done (JTBD) Framework",
        "## Core format",
        "## How To Apply It Across Artifacts",
    ),
}

REQUIRED_FORM_FILES: dict[str, dict[str, tuple[str, ...] | str]] = {
    ".github/ISSUE_TEMPLATE/feature.yml": {
        "type_label": "type:feature",
        "extra_ids": (),
    },
    ".github/ISSUE_TEMPLATE/bug.yml": {
        "type_label": "type:bug",
        "extra_ids": ("steps_to_reproduce", "expected_behavior", "actual_behavior"),
    },
    ".github/ISSUE_TEMPLATE/chore.yml": {
        "type_label": "type:chore",
        "extra_ids": (),
    },
    ".github/ISSUE_TEMPLATE/spike.yml": {
        "type_label": "type:spike",
        "extra_ids": ("timebox", "deliverable"),
    },
}

REQUIRED_FORM_TOP_LEVEL_KEYS = ("name", "description", "title", "labels", "body")
REQUIRED_COMMON_FORM_IDS = (
    "story_problem",
    "jtbd",
    "scope",
    "acceptance_criteria",
    "assignee",
    "reporter",
    "priority",
    "labels",
    "component",
    "epic_initiative",
    "estimate",
    "due_date",
    "tasks",
    "related_links",
    "out_of_scope",
)
REQUIRED_ISSUE_CONFIG = ".github/ISSUE_TEMPLATE/config.yml"

TICKET_SKILL_SNIPPETS = (
    "`references/product/jtbd-framework.md`",
    "## JTBD",
    "one primary job",
)

ACCEPTANCE_CRITERIA_SKILL_SNIPPETS = (
    "`references/product/jtbd-framework.md`",
    "primary JTBD",
    "supports the JTBD",
)


def line_has_top_level_key(text: str, key: str) -> bool:
    return re.search(rf"^{re.escape(key)}:", text, flags=re.MULTILINE) is not None


def has_id(text: str, field_id: str) -> bool:
    pattern = re.compile(
        rf"^\s*id:\s*['\"]?{re.escape(field_id)}['\"]?\s*$", flags=re.MULTILINE
    )
    return pattern.search(text) is not None


def validate_templates(repo_root: Path, issues: list[str]) -> None:
    for rel_path, required_snippets in REQUIRED_TEMPLATE_FILES.items():
        path = repo_root / rel_path
        if not path.exists():
            issues.append(f"missing required template file: {rel_path}")
            continue

        text = path.read_text(encoding="utf-8")
        if not text.strip():
            issues.append(f"template file is empty: {rel_path}")
            continue

        for snippet in required_snippets:
            if snippet not in text:
                issues.append(f"{rel_path}: missing required section/snippet '{snippet}'")

        if "## Acceptance Criteria" in text and "- [ ] Given" not in text:
            issues.append(
                f"{rel_path}: acceptance criteria section must include Gherkin checklist examples"
            )
        if "## JTBD" in text and "When " not in text:
            issues.append(f"{rel_path}: JTBD section must include a When/I want/so I can example")


def validate_issue_forms(repo_root: Path, issues: list[str]) -> None:
    for rel_path, expectations in REQUIRED_FORM_FILES.items():
        path = repo_root / rel_path
        if not path.exists():
            issues.append(f"missing required issue form: {rel_path}")
            continue

        text = path.read_text(encoding="utf-8")
        if not text.strip():
            issues.append(f"issue form is empty: {rel_path}")
            continue

        for key in REQUIRED_FORM_TOP_LEVEL_KEYS:
            if not line_has_top_level_key(text, key):
                issues.append(f"{rel_path}: missing required top-level key '{key}'")

        expected_type_label = str(expectations["type_label"])
        if expected_type_label not in text:
            issues.append(f"{rel_path}: missing required default label '{expected_type_label}'")
        if "triage" not in text:
            issues.append(f"{rel_path}: missing required default label 'triage'")
        if re.search(r"type:[a-z0-9-]+", text) is None:
            issues.append(f"{rel_path}: at least one label must use the 'type:*' prefix")

        for field_id in REQUIRED_COMMON_FORM_IDS:
            if not has_id(text, field_id):
                issues.append(f"{rel_path}: missing required field id '{field_id}'")

        for field_id in expectations["extra_ids"]:
            if not has_id(text, str(field_id)):
                issues.append(f"{rel_path}: missing required field id '{field_id}'")

        if not has_id(text, "acceptance_criteria"):
            issues.append(f"{rel_path}: missing acceptance criteria field")

        for keyword in ("Given", "When", "Then"):
            if re.search(keyword, text, flags=re.IGNORECASE) is None:
                issues.append(
                    f"{rel_path}: acceptance criteria guidance must mention '{keyword}'"
                )

        if has_id(text, "jtbd") and not any(
            phrase in text for phrase in ("so I can", "so they can")
        ):
            issues.append(
                f"{rel_path}: JTBD guidance must include 'so I can' or 'so they can'"
            )


def validate_issue_config(repo_root: Path, issues: list[str]) -> None:
    config_path = repo_root / REQUIRED_ISSUE_CONFIG
    if not config_path.exists():
        issues.append(f"missing issue template config: {REQUIRED_ISSUE_CONFIG}")
        return

    text = config_path.read_text(encoding="utf-8")
    if not text.strip():
        issues.append(f"issue template config is empty: {REQUIRED_ISSUE_CONFIG}")
        return

    if not line_has_top_level_key(text, "blank_issues_enabled"):
        issues.append(
            f"{REQUIRED_ISSUE_CONFIG}: missing required top-level key 'blank_issues_enabled'"
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

    for rel_path, snippets in REQUIRED_SHARED_FILES.items():
        validate_file_contains(repo_root, rel_path, snippets, issues)

    validate_templates(repo_root, issues)
    validate_issue_forms(repo_root, issues)
    validate_issue_config(repo_root, issues)
    validate_file_contains(repo_root, "skills/ticket-writer/SKILL.md", TICKET_SKILL_SNIPPETS, issues)
    validate_file_contains(
        repo_root,
        "skills/acceptance-criteria-extractor/SKILL.md",
        ACCEPTANCE_CRITERIA_SKILL_SNIPPETS,
        issues,
    )

    if issues:
        print(f"Ticket artifact validation failed with {len(issues)} issue(s):")
        for issue in issues:
            print(f"- {issue}")
        return 1

    print(
        "Ticket artifact validation passed "
        f"({len(REQUIRED_TEMPLATE_FILES)} templates, "
        f"{len(REQUIRED_FORM_FILES)} issue forms, shared JTBD reference, and skill contracts checked)."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
