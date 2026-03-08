# Agentic Coding Principles

These notes translate Miguel Palhas's and J. Pedro Oliveira's guidance into Codex-friendly defaults for PAAL.

## Keep Always-Loaded Context Small

- Treat repo and global `AGENTS.md` files as lightweight onboarding notes, not full manuals.
- Put long instructions, examples, and specialized workflows in skills or references.
- Prefer linking to deeper docs over repeating them inline.
- A large global instruction file is harmful because it burns context and weakens instruction priority. Keep `~/.codex/AGENTS.md` tiny.

## Prefer Progressive Disclosure

- Put stable, always-relevant facts in repo-local `AGENTS.md`.
- Put task-specific expertise in skills.
- Put reusable detail in references and templates.
- Let the next relevant skill load only when the workflow reaches that point.

## Translate Tool-Specific Features Instead Of Copying Them Blindly

- Keep the intent of a pattern even when the original tool uses different feature names.
- Prefer a Codex-native combination of `AGENTS.md`, skills, scripts, and CI over mimicking Claude-only mechanisms literally.
- See `references/engineering/codex-claude-concept-mapping.md` for the practical mapping used in PAAL.

## Structure Repos So Boundaries Are Obvious

- Keep a single app layout when the project has one surface and low reuse.
- Split into `apps/*` and `packages/*` when multiple surfaces, shared logic, or different delivery cadences are expected.
- Separate UI from business logic when doing so reduces ambiguity, reuse risk, or style drift.
- Do not split modules just because the pattern sounds cleaner; complexity should justify the boundary.

## Use Deterministic Enforcement For Hard Rules

- If a rule must always hold, prefer CI, validation scripts, or automation.
- Keep `AGENTS.md` guidance focused on intent, conventions, and watch-outs.
- Keep fast PR checks separate from slower or manual checks.
- Check generated artifacts, validation outputs, and template drift in CI when practical.

## Optimize For Reviewability

- Prefer small diffs, clear PR summaries, and explicit verification notes.
- Draft reviewer focus areas instead of making reviewers infer risk.
- Use AI review tools as accelerators, not substitutes for understandable changes.
- When a workflow naturally advances, hand off to the next skill instead of restating the entire downstream process.
