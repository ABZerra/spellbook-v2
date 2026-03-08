#!/usr/bin/env python3
from __future__ import annotations

import re
import sys
from pathlib import Path

REQUIRED_KEYS = ("name", "description", "version", "owner")
REQUIRED_HEADINGS = (
    "# Purpose",
    "# When to use",
    "# When NOT to use",
    "# Inputs",
    "# Outputs",
    "# Workflow",
    "# Examples",
)
REQUIRED_DESCRIPTION_PREFIX = "Use when"
NEGATIVE_CONDITION_PATTERN = re.compile(r"\bNOT\b|Do not|don['’]t", re.IGNORECASE)
REQUIRED_EXAMPLE_FILES = ("examples/example-input.md", "examples/example-output.md")
PLACEHOLDER_TEXT = (
    "Add a realistic input sample for this skill.",
    "Add a realistic output sample for this skill.",
)
HANDOFF_STRINGS = (
    "Next likely skill(s)",
    "What to pass forward",
    "Suggested next prompts",
)
REPO_PATH_PREFIXES = ("references/", "skills/", "scripts/", "docs/")
VIRTUAL_DOC_PATH_PREFIXES = (
    "docs/context",
    "docs/prd",
    "docs/discovery",
    "docs/roadmap",
    "docs/acceptance-criteria",
    "docs/meetings",
    "docs/tickets",
)
DENY_LIST_PATTERNS = (
    (re.compile(r"`?context/personas\.md`?"), "non-PAAL context path `context/personas.md`"),
    (re.compile(r"`?context/product\.md`?"), "non-PAAL context path `context/product.md`"),
    (re.compile(r"~\/\.claude\/skills"), "personal Claude skill install path"),
    (re.compile(r"\/\.claude\/skills\/"), "personal Claude skill project install path"),
    (re.compile(r"(?<!\w)/jtbd\b"), "slash-command activation `/jtbd`"),
    (
        re.compile(r"(?<!\w)/research-synthesis\b"),
        "slash-command activation `/research-synthesis`",
    ),
    (re.compile(r"(?m)^## Installation\b"), "installation section"),
    (
        re.compile(r"Settings\s*[→>]+\s*Capabilities\s*[→>]+\s*Skills"),
        "platform upload/install instructions",
    ),
    (re.compile(r"(?m)^Built with\b"), "marketing/distribution footer"),
)


def display_path(path: Path, repo_root: Path) -> str:
    try:
        return str(path.relative_to(repo_root))
    except ValueError:
        return str(path)


def strip_quotes(value: str) -> str:
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        return value[1:-1]
    return value


def parse_frontmatter(path: Path) -> tuple[dict[str, str], list[str]]:
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()

    if not lines or lines[0].strip() != "---":
        raise ValueError("missing opening frontmatter delimiter '---'")

    end_index = None
    for idx in range(1, len(lines)):
        if lines[idx].strip() == "---":
            end_index = idx
            break
    if end_index is None:
        raise ValueError("missing closing frontmatter delimiter '---'")

    frontmatter: dict[str, str] = {}
    for raw in lines[1:end_index]:
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if ":" not in raw:
            raise ValueError(f"invalid frontmatter line: {raw!r}")
        key, value = raw.split(":", 1)
        key = key.strip()
        if not key:
            raise ValueError(f"invalid frontmatter key in line: {raw!r}")
        if key in frontmatter:
            raise ValueError(f"duplicate frontmatter key: {key}")
        frontmatter[key] = strip_quotes(value)

    body_lines = lines[end_index + 1 :]
    return frontmatter, body_lines


def section_bounds(lines: list[str], heading_positions: dict[str, int], heading: str) -> tuple[int, int]:
    start = heading_positions[heading]
    later_positions = [pos for pos in heading_positions.values() if pos > start]
    end = min(later_positions) if later_positions else len(lines)
    return start, end


def section_has_content(lines: list[str], heading_positions: dict[str, int], heading: str) -> bool:
    start, end = section_bounds(lines, heading_positions, heading)

    for raw in lines[start + 1 : end]:
        line = raw.strip()
        if not line:
            continue
        if line.startswith("#"):
            continue
        return True
    return False


def section_text(lines: list[str], heading_positions: dict[str, int], heading: str) -> str:
    start, end = section_bounds(lines, heading_positions, heading)
    return "\n".join(lines[start:end])


def path_is_virtual_doc_contract(path: str) -> bool:
    normalized = path.rstrip("/")
    return any(
        normalized == prefix or normalized.startswith(prefix + "/")
        for prefix in VIRTUAL_DOC_PATH_PREFIXES
    )


def validate_referenced_paths(text: str, repo_root: Path, display: str) -> list[str]:
    issues: list[str] = []
    seen_refs: set[str] = set()

    for ref in re.findall(r"`([^`]+)`", text):
        if ref in seen_refs or not ref.startswith(REPO_PATH_PREFIXES):
            continue
        seen_refs.add(ref)

        normalized = ref.rstrip("/")
        if normalized.startswith("docs/") and path_is_virtual_doc_contract(normalized):
            continue

        if not (repo_root / normalized).exists():
            issues.append(f"{display}: referenced path '{ref}' does not exist in repo")

    return issues


def validate_deny_list(text: str, display: str) -> list[str]:
    issues: list[str] = []

    for pattern, label in DENY_LIST_PATTERNS:
        if pattern.search(text):
            issues.append(f"{display}: contains disallowed non-PAAL content ({label})")

    return issues


def validate_example_file(example_path: Path, repo_root: Path) -> list[str]:
    issues: list[str] = []
    display = display_path(example_path, repo_root)

    if not example_path.exists():
        issues.append(f"{display}: missing required example file")
        return issues

    text = example_path.read_text(encoding="utf-8")
    if not text.strip():
        issues.append(f"{display}: example file must not be empty")
        return issues

    for placeholder in PLACEHOLDER_TEXT:
        if placeholder in text:
            issues.append(f"{display}: example file still contains scaffold placeholder text")
            break

    return issues


def validate_skill_dir(skill_dir: Path, repo_root: Path) -> tuple[list[str], str | None]:
    issues: list[str] = []
    skill_file = skill_dir / "SKILL.md"
    display_skill_file = display_path(skill_file, repo_root)

    if not skill_file.exists():
        issues.append(f"{display_path(skill_dir, repo_root)}: missing SKILL.md")
        return issues, None

    try:
        frontmatter, body_lines = parse_frontmatter(skill_file)
    except Exception as exc:  # noqa: BLE001
        issues.append(f"{display_skill_file}: {exc}")
        return issues, None

    text = skill_file.read_text(encoding="utf-8")

    for key in REQUIRED_KEYS:
        if key not in frontmatter or not frontmatter[key].strip():
            issues.append(f"{display_skill_file}: missing required frontmatter key '{key}'")

    name = frontmatter.get("name")
    if name and name != skill_dir.name:
        issues.append(
            f"{display_skill_file}: frontmatter name '{name}' must match folder '{skill_dir.name}'"
        )

    description = frontmatter.get("description", "")
    if description and not description.startswith(REQUIRED_DESCRIPTION_PREFIX):
        issues.append(
            f"{display_skill_file}: description must start with '{REQUIRED_DESCRIPTION_PREFIX}'"
        )
    if description and not NEGATIVE_CONDITION_PATTERN.search(description):
        issues.append(
            f"{display_skill_file}: description must include a negative condition "
            "(contains 'NOT', 'Do not', or \"don't\")"
        )

    heading_positions: dict[str, int] = {}
    for idx, raw in enumerate(body_lines):
        line = raw.strip()
        if line in REQUIRED_HEADINGS and line not in heading_positions:
            heading_positions[line] = idx

    for heading in REQUIRED_HEADINGS:
        if heading not in heading_positions:
            issues.append(f"{display_skill_file}: missing required heading '{heading}'")
            continue
        if not section_has_content(body_lines, heading_positions, heading):
            issues.append(f"{display_skill_file}: section '{heading}' must not be empty")

    heading_order = [heading_positions[heading] for heading in REQUIRED_HEADINGS if heading in heading_positions]
    if heading_order and heading_order != sorted(heading_order):
        issues.append(
            f"{display_skill_file}: required headings must appear in the documented contract order"
        )

    if "# Examples" in heading_positions:
        examples_text = section_text(body_lines, heading_positions, "# Examples")
        expected_refs = (
            f"skills/{skill_dir.name}/examples/example-input.md",
            f"skills/{skill_dir.name}/examples/example-output.md",
        )
        for expected_ref in expected_refs:
            if expected_ref not in examples_text:
                issues.append(
                    f"{display_skill_file}: # Examples must reference '{expected_ref}'"
                )

    missing_handoff = [marker for marker in HANDOFF_STRINGS if marker not in text]
    if missing_handoff:
        issues.append(
            f"{display_skill_file}: missing canonical handoff markers: {', '.join(missing_handoff)}"
        )

    for rel_path in REQUIRED_EXAMPLE_FILES:
        issues.extend(validate_example_file(skill_dir / rel_path, repo_root))

    issues.extend(validate_referenced_paths(text, repo_root, display_skill_file))
    issues.extend(validate_deny_list(text, display_skill_file))

    return issues, name


def main() -> int:
    repo_root = Path(__file__).resolve().parent.parent
    skills_dir = repo_root / "skills"

    if not skills_dir.exists() or not skills_dir.is_dir():
        print(f"Validation failed: missing directory {display_path(skills_dir, repo_root)}")
        return 1

    skill_dirs = sorted(path for path in skills_dir.iterdir() if path.is_dir())
    issues: list[str] = []
    seen_names: dict[str, Path] = {}

    for skill_dir in skill_dirs:
        skill_issues, name = validate_skill_dir(skill_dir, repo_root)
        issues.extend(skill_issues)
        if name:
            previous = seen_names.get(name)
            if previous is not None:
                issues.append(
                    f"duplicate skill name '{name}' found in "
                    f"{display_path(previous, repo_root)} and "
                    f"{display_path(skill_dir / 'SKILL.md', repo_root)}"
                )
            else:
                seen_names[name] = skill_dir / "SKILL.md"

    if issues:
        print(f"Validation failed with {len(issues)} issue(s):")
        for issue in issues:
            print(f"- {issue}")
        return 1

    print(f"Validation passed for {len(skill_dirs)} skill(s).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
