#!/usr/bin/env python3
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

SKILL_NAME_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
OWNER_DEFAULT = "Alvaro Bezerra"


def build_skill_template(skill_name: str) -> str:
    return f"""---
name: {skill_name}
description: Use when this focused workflow is needed. Do not use when a broader or different workflow is required.
version: 0.1.0
owner: {OWNER_DEFAULT}
---

# Purpose

Describe the single outcome this skill produces.

# When to use

- State concrete trigger conditions for this skill.

# When NOT to use

- State clear boundaries and exclusions.

# Inputs

- List required source inputs.

# Outputs

- Describe expected output artifacts.
- Add a closing handoff with `Next likely skill(s)`, `What to pass forward`, and `Suggested next prompts`.

# Workflow

1. Step 0: If relevant, read the shared docs under `references/`, the relevant workflow map under `references/workflows/`, and any template under `references/templates/`.
2. Add the workflow steps needed to produce the output.
3. End with the canonical handoff fields:
   - `Next likely skill(s)`
   - `What to pass forward`
   - `Suggested next prompts`

# Examples

- Input example: `skills/{skill_name}/examples/example-input.md`
- Output example: `skills/{skill_name}/examples/example-output.md`
"""


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python3 scripts/new_skill.py <skill-name>")
        return 1

    skill_name = sys.argv[1].strip()
    if not SKILL_NAME_PATTERN.fullmatch(skill_name):
        print(
            "Error: skill-name must be kebab-case using lowercase letters, numbers, and hyphens."
        )
        return 1

    repo_root = Path(__file__).resolve().parent.parent
    skill_dir = repo_root / "skills" / skill_name
    skill_file = skill_dir / "SKILL.md"
    examples_dir = skill_dir / "examples"

    if skill_file.exists():
        print(f"Error: {skill_file} already exists.")
        return 1

    if skill_dir.exists() and any(skill_dir.iterdir()):
        print(f"Error: {skill_dir} exists and is not empty.")
        return 1

    skill_dir.mkdir(parents=True, exist_ok=True)
    examples_dir.mkdir(parents=True, exist_ok=True)

    skill_file.write_text(build_skill_template(skill_name), encoding="utf-8")
    (examples_dir / "example-input.md").write_text(
        f"# Example Input: {skill_name}\n\nAdd a realistic input sample for this skill.\n",
        encoding="utf-8",
    )
    (examples_dir / "example-output.md").write_text(
        f"# Example Output: {skill_name}\n\nAdd a realistic output sample for this skill.\n",
        encoding="utf-8",
    )

    reindex_script = repo_root / "scripts" / "reindex_skills.py"
    result = subprocess.run([sys.executable, str(reindex_script)], cwd=repo_root, check=False)
    if result.returncode != 0:
        print("Error: skill created, but reindex failed.")
        return result.returncode

    print(f"Created skill scaffold at {skill_dir}")
    print(
        "Placeholder example files were created. Replace them before running "
        "`make validate` or `python3 scripts/validate_skills.py`, or validation will fail."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
