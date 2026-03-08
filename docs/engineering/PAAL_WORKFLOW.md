# PAAL Workflow (JTBD Docs)

This repository keeps JTBD-focused product documentation only.

## Included PAAL module
- `paal-core/` is included in-repo.

## Recommended PAAL skills for docs refresh
- `paal-core/skills/prd-writer/SKILL.md`
- `paal-core/skills/acceptance-criteria-extractor/SKILL.md`

## Regeneration flow
1. Update JTBD context and evidence inputs.
2. Run PRD writer workflow to refresh `docs/product/PRD.md`.
3. Run acceptance criteria extractor to refresh `docs/product/ACCEPTANCE_CRITERIA.md`.
4. Update `docs/product/USER_STORIES.md` to keep stories aligned with the primary JTBD.
5. Run `npm run test:docs` to validate required JTBD docs exist.
