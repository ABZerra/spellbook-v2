#!/usr/bin/env python3
from __future__ import annotations

import argparse
import sys
from pathlib import Path

REQUIRED_DIRECTORIES = (
    ".paal",
    "project-context",
    ".github/workflows",
    ".github/PULL_REQUEST_TEMPLATE",
)

DOC_ROOT_CANDIDATES = ("docs", "docs-output")

REQUIRED_DOC_SUBDIRECTORIES = (
    "context",
    "prd",
    "discovery",
    "roadmap",
    "acceptance-criteria",
    "meetings",
    "tickets",
)

REQUIRED_FILES = (
    ".paal/project.yaml",
    ".paal/run-template.md",
    "project-context/README.md",
    "project-context/project-overview.md",
    "project-context/glossary.md",
    ".github/copilot-instructions.md",
    ".github/workflows/paal-core-policy.yml",
    ".github/workflows/paal-core-update.yml",
    ".github/workflows/paal-repo-baseline.yml",
    ".github/workflows/paal-pr-hygiene.yml",
    ".github/PULL_REQUEST_TEMPLATE/default.md",
)

DOC_TEMPLATE_CANDIDATES = (
    ".github/PULL_REQUEST_TEMPLATE/docs.md",
    ".github/PULL_REQUEST_TEMPLATE/docs-output.md",
)

REQUIRED_TEMPLATE_HEADINGS: dict[str, tuple[str, ...]] = {
    ".github/PULL_REQUEST_TEMPLATE/default.md": (
        "## Summary",
        "## Tests",
        "## Risks",
        "## Reviewer Focus",
    ),
}

DOC_TEMPLATE_HEADINGS = (
    "## Summary",
    "## Tests",
    "## Risks",
    "## Reviewer Focus",
    "### Skills used",
    "### Source context files",
    "### Output artifacts",
    "### Acceptance checks",
)

REQUIRED_FILE_SNIPPETS: dict[str, tuple[str, ...]] = {
    ".paal/run-template.md": (
        "`paal-core/skills/`",
        "`paal-core/references/`",
        "`org/skills/`",
        "`meeting-artifact-router`",
    ),
    "project-context/README.md": (
        "`paal-core/skills/`",
        "`paal-core/references/`",
        "`org/skills/`",
    ),
}

REQUIRED_PROJECT_CONFIG_SNIPPETS = (
    "review:",
    "codex_review:",
    "recommended_human_approvals:",
    "enforce_human_approvals:",
    "reviewer_handles:",
    "github_ai_review:",
    "external_tool:",
)


def display_path(path: Path, root: Path) -> str:
    try:
        return str(path.relative_to(root))
    except ValueError:
        return str(path)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate the required PAAL downstream project repository contract."
    )
    parser.add_argument(
        "--repo-root",
        default=".",
        help="Project repository root to validate. Defaults to the current directory.",
    )
    parser.add_argument(
        "--paal-core-path",
        default="paal-core",
        help="Expected PAAL core path in the consumer repo. Informational in this validator.",
    )
    return parser.parse_args()


def validate_required_paths(repo_root: Path, issues: list[str]) -> None:
    for rel_path in REQUIRED_DIRECTORIES:
        path = repo_root / rel_path
        if not path.exists():
            issues.append(f"missing required directory: {rel_path}")
        elif not path.is_dir():
            issues.append(f"required directory path is not a directory: {rel_path}")

    existing_docs_roots: list[str] = []
    complete_docs_roots: list[str] = []
    for candidate in DOC_ROOT_CANDIDATES:
        path = repo_root / candidate
        if not path.exists():
            continue
        if not path.is_dir():
            issues.append(f"required docs root path is not a directory: {candidate}")
            continue
        existing_docs_roots.append(candidate)
        if all((repo_root / candidate / name).is_dir() for name in REQUIRED_DOC_SUBDIRECTORIES):
            complete_docs_roots.append(candidate)

    docs_root: str | None = None
    if complete_docs_roots:
        docs_root = "docs" if "docs" in complete_docs_roots else complete_docs_roots[0]
    elif existing_docs_roots:
        docs_root = "docs" if "docs" in existing_docs_roots else existing_docs_roots[0]

    if docs_root is None:
        issues.append("missing required docs root: docs (preferred) or docs-output (legacy)")
    else:
        for name in REQUIRED_DOC_SUBDIRECTORIES:
            rel_path = f"{docs_root}/{name}"
            path = repo_root / rel_path
            if not path.exists():
                issues.append(f"missing required directory: {rel_path}")
            elif not path.is_dir():
                issues.append(f"required directory path is not a directory: {rel_path}")

    for rel_path in REQUIRED_FILES:
        path = repo_root / rel_path
        if not path.exists():
            issues.append(f"missing required file: {rel_path}")
        elif not path.is_file():
            issues.append(f"required file path is not a file: {rel_path}")

    docs_template_found = False
    for rel_path in DOC_TEMPLATE_CANDIDATES:
        path = repo_root / rel_path
        if not path.exists():
            continue
        if not path.is_file():
            issues.append(f"required file path is not a file: {rel_path}")
            continue
        docs_template_found = True

    if not docs_template_found:
        issues.append(
            "missing required docs PR template: "
            ".github/PULL_REQUEST_TEMPLATE/docs.md "
            "(legacy .github/PULL_REQUEST_TEMPLATE/docs-output.md is also accepted)"
        )


def validate_template_headings(repo_root: Path, issues: list[str]) -> None:
    for rel_path, headings in REQUIRED_TEMPLATE_HEADINGS.items():
        path = repo_root / rel_path
        if not path.exists() or not path.is_file():
            continue

        text = path.read_text(encoding="utf-8")
        if not text.strip():
            issues.append(f"required file is empty: {rel_path}")
            continue

        for heading in headings:
            if heading not in text:
                issues.append(f"{rel_path}: missing required heading '{heading}'")

    for rel_path in DOC_TEMPLATE_CANDIDATES:
        path = repo_root / rel_path
        if not path.exists() or not path.is_file():
            continue

        text = path.read_text(encoding="utf-8")
        if not text.strip():
            issues.append(f"required file is empty: {rel_path}")
            continue

        for heading in DOC_TEMPLATE_HEADINGS:
            if heading not in text:
                issues.append(f"{rel_path}: missing required heading '{heading}'")


def validate_project_config(repo_root: Path, issues: list[str]) -> None:
    path = repo_root / ".paal/project.yaml"
    if not path.exists() or not path.is_file():
        return

    text = path.read_text(encoding="utf-8")
    if not text.strip():
        issues.append("required file is empty: .paal/project.yaml")
        return

    for snippet in REQUIRED_PROJECT_CONFIG_SNIPPETS:
        if snippet not in text:
            issues.append(f".paal/project.yaml: missing required review key '{snippet}'")


def validate_non_empty_files(repo_root: Path, issues: list[str]) -> None:
    for rel_path in (
        ".github/copilot-instructions.md",
        "project-context/README.md",
        "project-context/project-overview.md",
        "project-context/glossary.md",
    ):
        path = repo_root / rel_path
        if not path.exists() or not path.is_file():
            continue
        if not path.read_text(encoding="utf-8").strip():
            issues.append(f"required file is empty: {rel_path}")


def validate_required_file_snippets(repo_root: Path, issues: list[str]) -> None:
    for rel_path, snippets in REQUIRED_FILE_SNIPPETS.items():
        path = repo_root / rel_path
        if not path.exists() or not path.is_file():
            continue

        text = path.read_text(encoding="utf-8")
        for snippet in snippets:
            if snippet not in text:
                issues.append(f"{rel_path}: missing required snippet '{snippet}'")


def main() -> int:
    args = parse_args()
    repo_root = Path(args.repo_root).resolve()

    if not repo_root.exists():
        print(f"Validation failed: repo root does not exist: {repo_root}")
        return 1

    issues: list[str] = []
    validate_required_paths(repo_root, issues)
    validate_template_headings(repo_root, issues)
    validate_project_config(repo_root, issues)
    validate_non_empty_files(repo_root, issues)
    validate_required_file_snippets(repo_root, issues)

    if issues:
        print(f"Project repo contract validation failed with {len(issues)} issue(s):")
        for issue in issues:
            print(f"- {issue}")
        return 1

    print(
        "Project repo contract validation passed for "
        f"{display_path(repo_root, repo_root)} "
        f"(PAAL core path hint: {args.paal_core_path})."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
