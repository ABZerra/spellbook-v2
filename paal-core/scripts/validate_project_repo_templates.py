#!/usr/bin/env python3
from __future__ import annotations

import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

TEMPLATE_ROOT = Path("references/templates/project-repo")

REQUIRED_TEMPLATE_FILES = (
    "references/templates/project_context_bootstrap_template.md",
    "references/templates/project-repo/.paal/project.yaml.example",
    "references/templates/project-repo/.paal/run-template.md",
    "references/templates/project-repo/docs/context/project-context-export.md",
    "references/templates/project-repo/project-context/README.md",
    "references/templates/project-repo/project-context/project-overview.md",
    "references/templates/project-repo/project-context/glossary.md",
    "references/templates/project-repo/.github/copilot-instructions.md",
    "references/templates/project-repo/.github/workflows/paal-core-policy.yml",
    "references/templates/project-repo/.github/workflows/paal-core-update.yml",
    "references/templates/project-repo/.github/workflows/paal-repo-baseline.yml",
    "references/templates/project-repo/.github/workflows/paal-pr-hygiene.yml",
    "references/templates/project-repo/.github/workflows/paal-node-typescript-overlay.yml.example",
    "references/templates/project-repo/.github/workflows/paal-python-overlay.yml.example",
    "references/templates/project-repo/.github/PULL_REQUEST_TEMPLATE/default.md",
    "references/templates/project-repo/.github/PULL_REQUEST_TEMPLATE/docs.md",
)

REQUIRED_TEMPLATE_HEADINGS: dict[str, tuple[str, ...]] = {
    "references/templates/project-repo/.github/PULL_REQUEST_TEMPLATE/default.md": (
        "## Summary",
        "## Tests",
        "## Risks",
        "## Reviewer Focus",
    ),
    "references/templates/project-repo/.github/PULL_REQUEST_TEMPLATE/docs.md": (
        "## Summary",
        "## Tests",
        "## Risks",
        "## Reviewer Focus",
        "### Skills used",
        "### Source context files",
        "### Output artifacts",
        "### Acceptance checks",
    ),
}

REQUIRED_TEMPLATE_SNIPPETS: dict[str, tuple[str, ...]] = {
    "references/templates/project-repo/.paal/run-template.md": (
        "`paal-core/skills/`",
        "`paal-core/references/`",
        "`org/skills/`",
        "`meeting-artifact-router`",
    ),
    "references/templates/project-repo/project-context/README.md": (
        "`paal-core/skills/`",
        "`paal-core/references/`",
        "`org/skills/`",
    ),
}

REQUIRED_WORKFLOW_FILENAMES = (
    "paal-core-policy.yml",
    "paal-core-update.yml",
    "paal-repo-baseline.yml",
    "paal-pr-hygiene.yml",
    "paal-node-typescript-overlay.yml.example",
    "paal-python-overlay.yml.example",
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


def validate_template_files(repo_root: Path, issues: list[str]) -> None:
    for rel_path in REQUIRED_TEMPLATE_FILES:
        path = repo_root / rel_path
        if not path.exists():
            issues.append(f"missing required template file: {rel_path}")
            continue
        if not path.is_file():
            issues.append(f"required template path is not a file: {rel_path}")
            continue
        if not path.read_text(encoding="utf-8").strip():
            issues.append(f"template file is empty: {rel_path}")


def validate_template_headings(repo_root: Path, issues: list[str]) -> None:
    for rel_path, headings in REQUIRED_TEMPLATE_HEADINGS.items():
        path = repo_root / rel_path
        if not path.exists() or not path.is_file():
            continue
        text = path.read_text(encoding="utf-8")
        for heading in headings:
            if heading not in text:
                issues.append(f"{rel_path}: missing required heading '{heading}'")


def validate_template_snippets(repo_root: Path, issues: list[str]) -> None:
    for rel_path, snippets in REQUIRED_TEMPLATE_SNIPPETS.items():
        path = repo_root / rel_path
        if not path.exists() or not path.is_file():
            continue

        text = path.read_text(encoding="utf-8")
        for snippet in snippets:
            if snippet not in text:
                issues.append(f"{rel_path}: missing required snippet '{snippet}'")


def validate_workflow_filenames(repo_root: Path, issues: list[str]) -> None:
    workflow_dir = repo_root / TEMPLATE_ROOT / ".github/workflows"
    if not workflow_dir.exists():
        issues.append(f"missing workflow template directory: {workflow_dir}")
        return

    existing = {path.name for path in workflow_dir.iterdir() if path.is_file()}
    for name in REQUIRED_WORKFLOW_FILENAMES:
        if name not in existing:
            issues.append(
                "references/templates/project-repo/.github/workflows: "
                f"missing required workflow file '{name}'"
            )


def validate_project_config_template(repo_root: Path, issues: list[str]) -> None:
    path = repo_root / "references/templates/project-repo/.paal/project.yaml.example"
    if not path.exists() or not path.is_file():
        return

    text = path.read_text(encoding="utf-8")
    for snippet in REQUIRED_PROJECT_CONFIG_SNIPPETS:
        if snippet not in text:
            issues.append(
                "references/templates/project-repo/.paal/project.yaml.example: "
                f"missing required review key '{snippet}'"
            )


def synthesize_project_repo(repo_root: Path, destination: Path) -> None:
    template_root = repo_root / TEMPLATE_ROOT

    (destination / ".paal").mkdir(parents=True, exist_ok=True)
    (destination / ".github/workflows").mkdir(parents=True, exist_ok=True)
    (destination / ".github/PULL_REQUEST_TEMPLATE").mkdir(parents=True, exist_ok=True)
    (destination / "project-context").mkdir(parents=True, exist_ok=True)
    (destination / "docs/context").mkdir(parents=True, exist_ok=True)
    (destination / "docs/prd").mkdir(parents=True, exist_ok=True)
    (destination / "docs/discovery").mkdir(parents=True, exist_ok=True)
    (destination / "docs/roadmap").mkdir(parents=True, exist_ok=True)
    (destination / "docs/acceptance-criteria").mkdir(parents=True, exist_ok=True)
    (destination / "docs/meetings").mkdir(parents=True, exist_ok=True)
    (destination / "docs/tickets").mkdir(parents=True, exist_ok=True)
    (destination / "paal-core").mkdir(parents=True, exist_ok=True)

    shutil.copy2(
        template_root / ".paal/project.yaml.example",
        destination / ".paal/project.yaml",
    )
    shutil.copy2(
        template_root / ".paal/run-template.md",
        destination / ".paal/run-template.md",
    )
    for filename in (
        "README.md",
        "project-overview.md",
        "glossary.md",
    ):
        shutil.copy2(
            template_root / "project-context" / filename,
            destination / "project-context" / filename,
        )
    shutil.copy2(
        template_root / "docs/context/project-context-export.md",
        destination / "docs/context/project-context-export.md",
    )
    shutil.copy2(
        template_root / ".github/copilot-instructions.md",
        destination / ".github/copilot-instructions.md",
    )

    for filename in (
        "paal-core-policy.yml",
        "paal-core-update.yml",
        "paal-repo-baseline.yml",
        "paal-pr-hygiene.yml",
    ):
        shutil.copy2(
            template_root / ".github/workflows" / filename,
            destination / ".github/workflows" / filename,
        )

    for filename in ("default.md", "docs.md"):
        shutil.copy2(
            template_root / ".github/PULL_REQUEST_TEMPLATE" / filename,
            destination / ".github/PULL_REQUEST_TEMPLATE" / filename,
        )


def validate_synthetic_repo(repo_root: Path, issues: list[str]) -> None:
    validator = repo_root / "scripts/validate_project_repo_contract.py"
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_root = Path(temp_dir)
        synthesize_project_repo(repo_root, temp_root)
        result = subprocess.run(
            [
                sys.executable,
                str(validator),
                "--repo-root",
                str(temp_root),
                "--paal-core-path",
                "paal-core",
            ],
            cwd=repo_root,
            capture_output=True,
            text=True,
            check=False,
        )
        if result.returncode != 0:
            issues.append(
                "synthetic project repo failed contract validation: "
                f"{result.stdout.strip() or result.stderr.strip()}"
            )


def main() -> int:
    repo_root = Path(__file__).resolve().parent.parent
    issues: list[str] = []

    validate_template_files(repo_root, issues)
    validate_template_headings(repo_root, issues)
    validate_template_snippets(repo_root, issues)
    validate_workflow_filenames(repo_root, issues)
    validate_project_config_template(repo_root, issues)
    if not issues:
        validate_synthetic_repo(repo_root, issues)

    if issues:
        print(f"Project repo template validation failed with {len(issues)} issue(s):")
        for issue in issues:
            print(f"- {issue}")
        return 1

    print(
        "Project repo template validation passed "
        f"({len(REQUIRED_TEMPLATE_FILES)} required template files, "
        f"{len(REQUIRED_WORKFLOW_FILENAMES)} workflow names, synthetic repo validated)."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
