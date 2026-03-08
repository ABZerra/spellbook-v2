# Codex Claude Concept Mapping

These notes explain how PAAL translates common Claude-oriented workflow concepts into Codex-friendly equivalents.

## Why Translation Matters

- Some ideas from Claude workflows are generally good.
- Some mechanisms are product-specific.
- PAAL should copy the useful intent, not force a 1:1 imitation when Codex works differently.

## Concept Mapping

### Repo Guidance Files

- Claude pattern: `CLAUDE.md` as a repo onboarding file.
- Codex/PAAL equivalent: a lean repo-local `AGENTS.md`, with a tiny global `~/.codex/AGENTS.md` only for cross-repo defaults.
- Rule: keep always-loaded guidance short and move detailed instructions into references and skills.

### `# Architecture`

- Claude pattern: a dedicated architecture section in the onboarding file.
- Codex/PAAL equivalent: a short `Architecture` section in repo-local `AGENTS.md` when the repo has meaningful structural boundaries.
- Rule: keep it to a few bullets about where the main layers live and why. If the explanation is long, point to `docs/architecture.md` or another deeper doc instead.

### Commands

- Claude pattern: reusable commands under `.claude/commands` or similar command files.
- Codex/PAAL equivalent:
  - `Key commands` in `AGENTS.md`
  - stable scripts or `Makefile` targets in the repo
  - reusable prompt patterns embedded in skills
- Rule: define the real commands the repo expects before commit or PR, but do not invent a fake command system just to mirror Claude.

### Subagents

- Claude pattern: dedicated subagents for specialized tasks.
- Codex/PAAL equivalent:
  - single-purpose skills
  - canonical workflow routing between skills
  - specialized follow-up skills such as `gh-fix-ci` and `gh-address-comments`
- Rule: split expertise into separate skills when the task has a distinct trigger and output contract. Use workflow handoffs instead of trying to emulate a subagent feature that Codex does not expose the same way.

### Hooks

- Claude pattern: local hooks that run checks or enforce rules automatically.
- Codex/PAAL equivalent:
  - validation scripts
  - `make validate`
  - GitHub Actions and PR hygiene workflows
  - other deterministic automation
- Rule: if something must always hold, prefer CI or validation instead of relying on prose in `AGENTS.md`.

## Practical Guidance

- Add `Architecture` when it reduces ambiguity for the agent.
- Keep commands real and executable, not aspirational.
- Treat skills as the main specialization mechanism.
- Treat CI and validators as the main enforcement mechanism.
- Avoid copying Claude folder structures literally unless Codex gains an equivalent feature that makes them useful.
