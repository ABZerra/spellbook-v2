# Spellbook

Spellbook is a character-centric spell preparation planner with a catalog-first workflow.

## Repository Layout
- `apps/web`: primary web app powered by the committed spell snapshot
- `apps/extension`: browser extension for sync payload execution
- `data/spells.snapshot.json`: canonical spell snapshot file
- `data/artifacts/`: raw source artifacts, including the D&D Beyond spell export
- `scripts/`: snapshot import and deploy build helpers
- `docs/`: JTBD-focused product and engineering docs
- `paal-core/`: PAAL skills and references used for doc workflows

## Development
- Web only: `npm run dev:web`
- Full checks: `npm test`

## Build
- Web build: `npm run build`
- GitHub Pages bundle: `npm run build:pages`

## Snapshot Workflow
1. Place the new CSV in a local path.
2. Run: `npm run snapshot:import -- <path/to/Spells.csv>`
3. Commit updated `data/spells.snapshot.json` and `apps/web/public/spells.snapshot.json`.
4. Treat the committed snapshot as the source of truth for both local testing and production builds.
