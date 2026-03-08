# Repo Design For AI

## Plain-Language Terms

- `UI`: screens, components, styles, and interaction logic that users see directly.
- `Business logic`: the rules that decide how the product behaves, regardless of screen layout.
- `Shared logic`: code that more than one app, surface, or feature area can reuse.

## Choose The Smallest Structure That Makes Boundaries Obvious

Start simple, then add boundaries when they remove confusion.

### Single-App Starter

Use this when:

- there is one main product surface
- reuse is low
- speed matters more than long-term modularity

Typical shape:

```text
src/
  app/
  components/
  domain/
  lib/
tests/
docs/
```

### Modular Product Default

Use this when:

- one main app exists today
- shared logic is likely
- the team wants clearer separation without over-engineering

Typical shape:

```text
apps/
  web/
packages/
  core/
  ui/
  config/
docs/
```

### Multi-Surface Product

Use this when:

- multiple apps or delivery surfaces already exist
- an API, automation, and UI will evolve separately
- different layers need different release cadences

Typical shape:

```text
apps/
  web/
  api/
packages/
  core/
  ui/
  config/
docs/
```

## Signals That Justify Splitting Into Packages

- More than one app or interface will consume the same logic.
- UI conventions need to stay separate from domain rules.
- The repo already mixes API, automation, and product UI work.
- Team members repeatedly ask where new logic should live.
- Review noise comes from unrelated parts of the stack changing together.

## When Not To Modularize Yet

- The project is a small single-surface experiment.
- Reuse is unlikely in the next release horizon.
- The extra folders would create ceremony without reducing confusion.

## When Stack Becomes Relevant

- Ask about the tech stack only after the project shape, delivery surfaces, reuse expectations, and verification needs are clear.
- Use the stack to finalize commands, CI overlays, starter files, and deployment assumptions.
- Do not let missing stack details block repo setup guidance.

## How To Handle Unclear Stack Input

- Accept vague product descriptions and infer a reasonable recommendation when there is enough signal.
- If the user skips the stack or confidence is low, mark it as `Stack deferred`.
- When the stack is deferred, keep commands generic and avoid stack-specific CI overlays until the repo has a clearer technical direction.
- Product planning skills can accept stack as optional context, but they should not require it or ask for it by default.

## Commands Every Repo Should Define Early

- `validate`: quick policy or repo-specific checks.
- `test`: the fastest relevant automated tests.
- `lint`: formatting or static checks that catch obvious issues.
- `typecheck`: type validation when the stack supports it.

If the stack does not support one of these commands, document the closest equivalent.

## What A Lightweight Repo AGENTS File Should Cover

- What the product is and what matters most.
- A short architecture note that explains the main layers or packages when the repo is not trivially small.
- The key commands to run before commit or PR.
- The main code organization rules.
- Watch-outs the agent cannot infer from code alone.
- Pointers to deeper docs instead of long inline explanations.
