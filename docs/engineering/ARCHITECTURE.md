# Architecture Overview

- `apps/web`: primary React application (catalog, prepare, character workflows).
- `apps/extension`: browser extension that consumes sync payload v3 and applies operations.
- `data/spells.snapshot.json`: canonical spell snapshot source for all app runtimes.
- `data/artifacts/spells.dndbeyond.filtered.scraped.with-notes.csv`: canonical raw import artifact.
- `scripts/import-spells-csv.mjs`: deterministic CSV-to-snapshot generator.
