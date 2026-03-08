# Spellbook

Spellbook is a character-centric spell preparation planner with a catalog-first workflow.

## Repository Layout
- `apps/web`: primary web app (local/pages + production runtime paths)
- `apps/api`: production spell API with Notion sync refresh
- `apps/extension`: browser extension for sync payload execution
- `data/spells.snapshot.json`: canonical spell snapshot file
- `scripts/`: snapshot import and deploy build helpers
- `docs/`: JTBD-focused product and engineering docs
- `paal-core/`: PAAL skills and references used for doc workflows

## Development
- Web only: `npm run dev:web`
- API only: `npm run dev:api`
- Full checks: `npm test`

## Build
- Web build: `npm run build`
- GitHub Pages bundle: `npm run build:pages`
- Render build target: `npm run build:render`

## Snapshot Workflow
1. Place the new CSV in a local path.
2. Run: `npm run snapshot:import -- <path/to/Spells.csv>`
3. Commit updated `data/spells.snapshot.json` and `apps/web/public/spells.snapshot.json`.
