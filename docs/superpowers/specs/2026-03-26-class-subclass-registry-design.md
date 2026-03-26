# Class/Subclass Registry — Design Spec

**Date:** 2026-03-26
**Status:** Approved

## Problem

Subclasses are dynamically extracted from spell `availableFor` data. Classes whose subclasses don't add expanded spell lists (Bard, Wizard, Sorcerer, Ranger, etc.) show zero subclass options in character creation. Additionally, the spell data contains homebrew/third-party content and 2024 edition entries that should be removed.

## Decision

**Approach A: Hardcoded Subclass Registry.** A static `CLASS_REGISTRY` defines all official 2014 D&D 5e classes and subclasses. Character creation reads from this registry. Spell filtering continues to use `availableFor` for subclass-specific spells.

## Scope

### In Scope
- New static registry file with all official 2014 classes/subclasses (including expansion books)
- Modify `extractClassInfo()` to merge registry with spell-data-derived subclasses
- Clean spell data: remove non-Legacy entries, remove homebrew, normalize names
- Fighter (Eldritch Knight) and Rogue (Arcane Trickster) included as spellcasting subclasses

### Out of Scope
- Changes to spell filtering or preparation logic
- UI changes to CreateCharacterModal or CharacterPage (they already consume `catalogClasses`)
- Changes to how `availableFor` is used for spell eligibility

## Design

### 1. New File: `apps/web/src/app/data/classRegistry.ts`

Static registry of all official 2014 D&D 5e spellcasting classes and their subclasses.

```typescript
export interface ClassRegistryEntry {
  name: string;
  subclasses: string[];
}

export const CLASS_REGISTRY: ClassRegistryEntry[] = [/* ... */];
```

**Complete class/subclass list:**

| Class | Subclasses |
|-------|-----------|
| Artificer | Alchemist, Armorer, Artillerist, Battle Smith |
| Bard | College of Creation, College of Eloquence, College of Glamour, College of Lore, College of Spirits, College of Swords, College of Valor, College of Whispers |
| Cleric | Arcana Domain, Death Domain, Forge Domain, Grave Domain, Knowledge Domain, Life Domain, Light Domain, Nature Domain, Order Domain, Peace Domain, Tempest Domain, Trickery Domain, Twilight Domain, War Domain |
| Druid | Circle of Dreams, Circle of Spores, Circle of Stars, Circle of the Land, Circle of the Moon, Circle of the Shepherd, Circle of Wildfire |
| Fighter | Eldritch Knight |
| Paladin | Oath of Conquest, Oath of Devotion, Oath of Glory, Oath of Redemption, Oath of the Ancients, Oath of the Crown, Oath of the Watchers, Oath of Vengeance, Oathbreaker |
| Ranger | Beast Master, Drakewarden, Fey Wanderer, Gloom Stalker, Horizon Walker, Hunter, Monster Slayer, Swarmkeeper |
| Rogue | Arcane Trickster |
| Sorcerer | Aberrant Mind, Clockwork Soul, Draconic Bloodline, Divine Soul, Lunar Sorcery, Shadow Magic, Storm Sorcery, Wild Magic |
| Warlock | The Archfey, The Celestial, The Fathomless, The Fiend, The Genie, The Great Old One, The Hexblade, The Undead, The Undying |
| Wizard | Bladesinging, Chronurgy Magic, Graviturgy Magic, Order of Scribes, School of Abjuration, School of Conjuration, School of Divination, School of Enchantment, School of Evocation, School of Illusion, School of Necromancy, School of Transmutation, War Magic |

### 2. Modify: `apps/web/src/app/domain/catalog.ts`

`extractClassInfo()` changes:
1. Start from `CLASS_REGISTRY` as the base list of classes and subclasses
2. Merge in any additional subclass entries found in spell `availableFor` data (preserves spell-data-derived subclass info)
3. Match on cleaned/normalized names (the existing `cleanName()` function already strips parentheticals like "(Legacy)")

```typescript
export function extractClassInfo(
  spells: Pick<SpellRecord, 'availableFor'>[],
): CatalogClassInfo[] {
  // 1. Seed from CLASS_REGISTRY
  // 2. Parse spell availableFor and merge subclasses into matching classes
  // 3. Return sorted results
}
```

The `CatalogClassInfo` interface remains unchanged.

### 3. Clean: `data/spells.snapshot.json`

Remove from `availableFor` entries:
- **Non-Legacy entries:** All class names without "(Legacy)" suffix (these are 2024 edition)
- **Homebrew entries:** Illrigger, Blood Domain, Community Domain, Festus Domain, Inquisition Domain, Keeper Domain, Moon Domain, Night Domain, Shadow Domain, Circle of Shadows, Circle of Wicker, Circle of the Hive, Circle of the Old Ways, Oath of Castigation, Oath of Zeal, Oath of the Harvest, Oath of the Open Sea, Oath of the River, Oath of the Spelldrinker, Grim Harbinger, Highway Rider, Crimson Dynasty, Mother of Sorrows, The Great Fool, The Horned King, The Lantern, The Many, The Predator

### 4. Name Normalization

The existing `cleanName()` in `catalog.ts` strips parenthetical text:
- `"Bard (Legacy)"` → `"Bard"` ✓
- `"Knowledge Domain (Legacy)"` → `"Knowledge Domain"` ✓
- `"Oath of Redemption (XGtE)"` → `"Oath of Redemption"` ✓

No changes needed to this function.

### 5. No UI Changes Required

Both `CreateCharacterModal.tsx` and `CharacterPage.tsx` already:
- Receive `catalogClasses: CatalogClassInfo[]`
- Render class dropdowns from `catalogClasses`
- Render subclass dropdowns from `classInfo.subclasses`
- Disable subclass dropdown when `subclasses.length === 0`

They will automatically show the complete subclass lists once the registry is in place.

### 6. `AppContext.tsx`

No interface changes. The `catalogClasses` memo stays the same:
```typescript
const catalogClasses = useMemo(() => extractClassInfo(spells), [spells]);
```

## Testing Strategy

- Unit tests for the updated `extractClassInfo()`: verify registry classes always appear, verify spell-data subclasses merge correctly
- Verify no homebrew or 2024 entries remain in spell data
- Manual verification that character creation shows all subclasses for every class

## Files Changed

| File | Change |
|------|--------|
| `apps/web/src/app/data/classRegistry.ts` | **New** — static registry |
| `apps/web/src/app/domain/catalog.ts` | Modify `extractClassInfo()` to use registry as base |
| `data/spells.snapshot.json` | Remove non-Legacy and homebrew `availableFor` entries |
| `apps/web/src/app/__tests__/character-domain.test.ts` | Update tests |
