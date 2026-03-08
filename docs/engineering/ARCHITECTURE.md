# Architecture Overview

- `apps/web`: primary React application (catalog, prepare, character workflows).
- `apps/api`: minimal production API for spell catalog read + Notion sync refresh.
- `apps/extension`: browser extension that consumes sync payload v3 and applies operations.
- `data/spells.snapshot.json`: canonical spell snapshot source for local/pages and API bootstrap.
- `scripts/import-spells-csv.mjs`: deterministic CSV-to-snapshot generator.
