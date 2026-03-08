# Project Context

This directory is the working source of truth for project context inside the repo.

Start here before writing a PRD, refining discovery, or implementing product behavior.

## Default Assistant Search Roots

When the assistant needs repo-local skills or references, check these locations first:

- `paal-core/skills/`
- `paal-core/references/`
- `org/skills/`

## Skill Routing Default

- Infer skills from request intent and desired output; do not require the user to name a skill.
- Treat PAAL skills as primary for product and delivery artifacts.
- Use Codex/superpower skills as secondary execution support for implementation, debugging, testing, and review work.

## Required Files

- `project-overview.md`: current problem, users, outcomes, and constraints.
- `glossary.md`: project-specific terms and definitions, maintained from day one.

## Working Rule

If product context changes, update the relevant file in `project-context/` in the same PR instead of only editing Notion, Jira, Linear, or chat notes.

If the source material is a completed meeting transcript and the user asks for post-meeting outputs without explicitly limiting scope, start with `meeting-artifact-router` before considering narrower writing skills.

## Canonical and Relay Rules

- This repo is canonical for project context.
- Downstream tools consume exported Markdown from `docs/context/`.
- If a downstream tool drifts from the repo, fix the repo first and re-export from there.
- Keep unknowns explicit as `TBD` instead of guessing.
- When terminology changes, update `glossary.md` before or with related PRD and ticket changes.
