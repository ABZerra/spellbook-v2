# D&D Beyond Additional Spell Lists Design

## Summary

Spellbook should support D&D Beyond's optional class feature spell grants for the 2014 classes that can add older PHB spells to their class spell lists. We want to preserve where those extra list memberships came from at the data level, but once the app loads the spell data, those spells should behave exactly like native members of that class list.

This supersedes the earlier idea of adding a visible `Additional Spells` column in the catalog. The distinction matters for maintainability and auditing, not for runtime UX.

## Goals

- Preserve D&D Beyond optional-feature provenance in the spell snapshot data.
- Make granted spells behave exactly like ordinary members of the added class list everywhere in the app.
- Keep the source mapping explicit and reviewable in the repo.
- Avoid UI distinctions that suggest these spells behave differently during prep or sync.

## Non-Goals

- Recreate D&D Beyond's per-character optional feature toggles.
- Add new catalog or preparation UI for optional-feature provenance.
- Rework the broader spell schema or character model beyond what this feature needs.

## Constraints

- The imported snapshot remains the app's spell source of truth.
- Existing list normalization rules still need to support entries like `Wizard (Legacy)` and subclass-qualified list labels.
- Extension sync and preparation logic must continue to reason in terms of canonical class list names like `WIZARD`.

## Proposed Model

### Canonical provenance mapping

Add a repo-owned mapping file that enumerates the D&D Beyond optional-feature spell grants by base class list. The mapping should be small, explicit, and easy to review. A JSON file under `data/` is sufficient.

Example shape:

```json
{
  "BARD": ["Aid", "Color Spray"],
  "WIZARD": ["Augury", "Divination"]
}
```

This file is the maintainable record of which spells are extra grants rather than native CSV `availableFor` entries.

### Snapshot shape

Each normalized spell in `data/spells.snapshot.json` and `apps/web/public/spells.snapshot.json` gains a new field:

- `additionalSpellLists: string[]`

This field contains canonical base class list names such as `BARD` or `WIZARD`. It exists only to preserve provenance.

Example:

```json
{
  "name": "Aid",
  "availableFor": ["Cleric (Legacy)", "Paladin (Legacy)", "Artificer (Legacy)"],
  "additionalSpellLists": ["BARD", "RANGER"]
}
```

## Runtime Behavior

### Unified list membership

At runtime, spell list helpers should treat `additionalSpellLists` as fully merged into the spell's eligible class lists.

That means:

- `getSpellLists()` returns the union of normalized `availableFor` class lists and `additionalSpellLists`.
- `isSpellEligibleForCharacter()` treats those granted lists as ordinary list membership.
- `getSpellAssignmentList()` can assign one of those added lists without special handling.
- preparation limits apply the same way they do for native list entries.
- extension sync emits the added class list exactly as if it had come from `availableFor`.

### No visible distinction in product behavior

The catalog, preparation flow, and prepared-spell UI should not add badges, columns, or alternate copy for these spells. If a spell is granted to `BARD`, it should appear and behave exactly like a bard spell in the app.

## Import Flow

The CSV importer should remain responsible for composing the final snapshot. During import:

1. Parse the raw D&D Beyond CSV row as today.
2. Look up the spell's name in the repo-owned additional-spell mapping.
3. Add `additionalSpellLists` to the emitted snapshot record.
4. Do not mutate the raw `availableFor` array in the snapshot.

Keeping `availableFor` untouched preserves fidelity to the imported D&D Beyond CSV while still giving the app enough structured data to merge behavior at runtime.

## Testing Strategy

Coverage should prove both provenance retention and merged behavior:

- importer tests verify mapped spells receive the correct `additionalSpellLists`.
- provider normalization tests verify the new field survives loading into `SpellRecord`.
- character-domain tests verify added lists count for eligibility and assignment.
- extension sync tests verify operations use the merged list when the spell only belongs through `additionalSpellLists`.

## Risks and Mitigations

### Name-based mapping drift

Risk: spell-name mismatches between the mapping file and imported CSV could silently drop provenance.

Mitigation:

- keep the mapping file small and explicit
- add importer tests for representative spells across several classes
- fail loudly if we decide later to require 100% mapping coverage checks

### Ambiguous list assignment

Risk: a spell can belong to multiple native and additional lists.

Mitigation:

- preserve current `getSpellAssignmentList()` behavior
- only broaden the set of recognized lists rather than inventing new assignment rules

## Rollout

1. Add the mapping file and snapshot field.
2. Update runtime types and list helpers to merge the field.
3. refresh the snapshot from the canonical CSV.
4. verify web, extension, and docs checks.
