# Class/Subclass Registry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a hardcoded registry of official 2014 D&D 5e classes/subclasses so character creation shows complete subclass options, and clean homebrew/2024 entries from spell data.

**Architecture:** A static `CLASS_REGISTRY` array in a new data file provides the canonical class/subclass list. `extractClassInfo()` and `extractListNames()` in `catalog.ts` are modified to seed from this registry and merge spell-data entries defensively. Spell snapshot is cleaned of non-Legacy and homebrew `availableFor` entries.

**Tech Stack:** TypeScript, Vitest, Node.js (for data cleanup script)

**Spec:** `docs/superpowers/specs/2026-03-26-class-subclass-registry-design.md`

---

## File Structure

| File | Responsibility |
|------|---------------|
| `apps/web/src/app/domain/classRegistry.ts` | **New** — Static registry of 11 classes with all official 2014 subclasses |
| `apps/web/src/app/domain/catalog.ts` | **Modify** — Seed `extractClassInfo()` and `extractListNames()` from registry |
| `apps/web/src/app/__tests__/catalog.test.ts` | **New** — Unit tests for registry-backed catalog functions |
| `data/spells.snapshot.json` | **Modify** — Remove non-Legacy and homebrew `availableFor` entries |

---

### Task 1: Create the Class Registry Data File

**Files:**
- Create: `apps/web/src/app/domain/classRegistry.ts`

- [ ] **Step 1: Create the registry file with all 11 classes and their subclasses**

```typescript
// apps/web/src/app/domain/classRegistry.ts

export interface ClassRegistryEntry {
  name: string;
  subclasses: string[];
}

/**
 * Official 2014 D&D 5e spellcasting classes and subclasses.
 * Source of truth: dndbeyond.com (Legacy / 2014 rules).
 * Includes PHB, XGtE, TCoE, SCAG, EGtW, VRGtR, FToD, DSotDQ, ERftLW, DMG.
 */
export const CLASS_REGISTRY: ClassRegistryEntry[] = [
  {
    name: 'Artificer',
    subclasses: ['Alchemist', 'Armorer', 'Artillerist', 'Battle Smith'],
  },
  {
    name: 'Bard',
    subclasses: [
      'College of Creation',
      'College of Eloquence',
      'College of Glamour',
      'College of Lore',
      'College of Spirits',
      'College of Swords',
      'College of Valor',
      'College of Whispers',
    ],
  },
  {
    name: 'Cleric',
    subclasses: [
      'Arcana Domain',
      'Death Domain',
      'Forge Domain',
      'Grave Domain',
      'Knowledge Domain',
      'Life Domain',
      'Light Domain',
      'Nature Domain',
      'Order Domain',
      'Peace Domain',
      'Tempest Domain',
      'Trickery Domain',
      'Twilight Domain',
      'War Domain',
    ],
  },
  {
    name: 'Druid',
    subclasses: [
      'Circle of Dreams',
      'Circle of Spores',
      'Circle of Stars',
      'Circle of the Land',
      'Circle of the Moon',
      'Circle of the Shepherd',
      'Circle of Wildfire',
    ],
  },
  {
    name: 'Fighter',
    subclasses: ['Eldritch Knight'],
  },
  {
    name: 'Paladin',
    subclasses: [
      'Oath of Conquest',
      'Oath of Devotion',
      'Oath of Glory',
      'Oath of Redemption',
      'Oath of the Ancients',
      'Oath of the Crown',
      'Oath of the Watchers',
      'Oath of Vengeance',
      'Oathbreaker',
    ],
  },
  {
    name: 'Ranger',
    subclasses: [
      'Beast Master',
      'Drakewarden',
      'Fey Wanderer',
      'Gloom Stalker',
      'Horizon Walker',
      'Hunter',
      'Monster Slayer',
      'Swarmkeeper',
    ],
  },
  {
    name: 'Rogue',
    subclasses: ['Arcane Trickster'],
  },
  {
    name: 'Sorcerer',
    subclasses: [
      'Aberrant Mind',
      'Clockwork Soul',
      'Draconic Bloodline',
      'Divine Soul',
      'Lunar Sorcery',
      'Shadow Magic',
      'Storm Sorcery',
      'Wild Magic',
    ],
  },
  {
    name: 'Warlock',
    subclasses: [
      'The Archfey',
      'The Celestial',
      'The Fathomless',
      'The Fiend',
      'The Genie',
      'The Great Old One',
      'The Hexblade',
      'The Undead',
      'The Undying',
    ],
  },
  {
    name: 'Wizard',
    subclasses: [
      'Bladesinging',
      'Chronurgy Magic',
      'Graviturgy Magic',
      'Order of Scribes',
      'School of Abjuration',
      'School of Conjuration',
      'School of Divination',
      'School of Enchantment',
      'School of Evocation',
      'School of Illusion',
      'School of Necromancy',
      'School of Transmutation',
      'War Magic',
    ],
  },
];
```

- [ ] **Step 2: Verify the file compiles**

Run: `cd apps/web && npx tsc --noEmit`

Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/domain/classRegistry.ts
git commit -m "feat: add static class/subclass registry for 2014 D&D 5e"
```

---

### Task 2: Write Failing Tests for Registry-Backed Catalog Functions

**Files:**
- Create: `apps/web/src/app/__tests__/catalog.test.ts`

- [ ] **Step 1: Write the test file**

```typescript
// apps/web/src/app/__tests__/catalog.test.ts
import { describe, expect, it } from 'vitest';
import { extractClassInfo, extractListNames } from '../domain/catalog';
import { CLASS_REGISTRY } from '../domain/classRegistry';

describe('extractClassInfo', () => {
  it('returns all 11 registry classes with empty spell array', () => {
    const result = extractClassInfo([]);
    expect(result).toHaveLength(11);

    const names = result.map((c) => c.name);
    for (const entry of CLASS_REGISTRY) {
      expect(names).toContain(entry.name);
    }
  });

  it('includes all registry subclasses for each class', () => {
    const result = extractClassInfo([]);
    for (const entry of CLASS_REGISTRY) {
      const found = result.find((c) => c.name === entry.name);
      expect(found).toBeDefined();
      for (const sub of entry.subclasses) {
        expect(found!.subclasses).toContain(sub);
      }
    }
  });

  it('merges spell-data subclasses into registry classes without duplicates', () => {
    const spells = [
      { availableFor: ['Cleric (Legacy) - Life Domain'] },
    ];
    const result = extractClassInfo(spells);
    const cleric = result.find((c) => c.name === 'Cleric')!;

    // Life Domain is already in registry — should not duplicate
    const count = cleric.subclasses.filter((s) => s === 'Life Domain').length;
    expect(count).toBe(1);
  });

  it('merges a novel spell-data subclass into the correct registry class', () => {
    const spells = [
      { availableFor: ['Wizard (Legacy) - School of Hypothetics'] },
    ];
    const result = extractClassInfo(spells);
    const wizard = result.find((c) => c.name === 'Wizard')!;
    expect(wizard.subclasses).toContain('School of Hypothetics');
  });

  it('returns results sorted alphabetically by class name', () => {
    const result = extractClassInfo([]);
    const names = result.map((c) => c.name);
    expect(names).toEqual([...names].sort());
  });

  it('has correct subclass counts for key classes', () => {
    const result = extractClassInfo([]);
    const find = (name: string) => result.find((c) => c.name === name)!;
    expect(find('Artificer').subclasses).toHaveLength(4);
    expect(find('Bard').subclasses).toHaveLength(8);
    expect(find('Cleric').subclasses).toHaveLength(14);
    expect(find('Druid').subclasses).toHaveLength(7);
    expect(find('Fighter').subclasses).toHaveLength(1);
    expect(find('Paladin').subclasses).toHaveLength(9);
    expect(find('Ranger').subclasses).toHaveLength(8);
    expect(find('Rogue').subclasses).toHaveLength(1);
    expect(find('Sorcerer').subclasses).toHaveLength(8);
    expect(find('Warlock').subclasses).toHaveLength(9);
    expect(find('Wizard').subclasses).toHaveLength(13);
  });

  it('returns subclasses sorted alphabetically within each class', () => {
    const result = extractClassInfo([]);
    for (const entry of result) {
      expect(entry.subclasses).toEqual([...entry.subclasses].sort());
    }
  });
});

describe('extractListNames', () => {
  it('returns all 11 registry class names (uppercased) with empty spell array', () => {
    const result = extractListNames([]);
    expect(result).toHaveLength(11);

    for (const entry of CLASS_REGISTRY) {
      expect(result).toContain(entry.name.toUpperCase());
    }
  });

  it('merges additional class names from spell data', () => {
    const spells = [
      { availableFor: ['Mystic (Legacy)'] },
    ];
    const result = extractListNames(spells);
    expect(result).toContain('MYSTIC');
    // Registry classes still present
    expect(result).toContain('WIZARD');
  });

  it('returns sorted results', () => {
    const result = extractListNames([]);
    expect(result).toEqual([...result].sort());
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/web && npx vitest run src/app/__tests__/catalog.test.ts --reporter=verbose`

Expected: FAIL — `extractClassInfo([])` currently returns `[]` (no spells → no classes). Tests expecting 11 classes will fail.

- [ ] **Step 3: Commit failing tests**

```bash
git add apps/web/src/app/__tests__/catalog.test.ts
git commit -m "test: add failing tests for registry-backed catalog functions"
```

---

### Task 3: Update `extractClassInfo()` and `extractListNames()` to Use Registry

**Files:**
- Modify: `apps/web/src/app/domain/catalog.ts`

- [ ] **Step 1: Update `extractClassInfo()` to seed from `CLASS_REGISTRY`**

Replace the current `extractClassInfo` function body. The new logic:
1. Seed `displayNames` and `subclassesMap` from `CLASS_REGISTRY`
2. Then iterate spell `availableFor` entries as before, merging into existing maps
3. Return sorted results as before

```typescript
import { CLASS_REGISTRY } from './classRegistry';

export function extractClassInfo(spells: Pick<SpellRecord, 'availableFor'>[]): CatalogClassInfo[] {
  const displayNames = new Map<string, string>();
  const subclassesMap = new Map<string, Set<string>>();

  // Seed from registry
  for (const entry of CLASS_REGISTRY) {
    const key = entry.name.toLowerCase();
    displayNames.set(key, entry.name);
    subclassesMap.set(key, new Set(entry.subclasses));
  }

  // Merge from spell data
  for (const spell of spells) {
    for (const entry of spell.availableFor || []) {
      const parsed = parseAvailableForEntry(entry);
      if (!parsed) continue;

      const key = parsed.className.toLowerCase();

      if (!displayNames.has(key)) {
        displayNames.set(key, parsed.className);
        subclassesMap.set(key, new Set());
      }

      if (parsed.subclass) {
        subclassesMap.get(key)!.add(parsed.subclass);
      }
    }
  }

  const results: CatalogClassInfo[] = [];

  for (const [key, subclasses] of subclassesMap) {
    results.push({
      name: displayNames.get(key)!,
      subclasses: [...subclasses].sort((a, b) => a.localeCompare(b)),
    });
  }

  return results.sort((a, b) => a.name.localeCompare(b.name));
}
```

- [ ] **Step 2: Update `extractListNames()` to seed from `CLASS_REGISTRY`**

Replace the current `extractListNames` function body:

```typescript
export function extractListNames(spells: Pick<SpellRecord, 'availableFor'>[]): string[] {
  const names = new Set<string>();

  // Seed from registry
  for (const entry of CLASS_REGISTRY) {
    names.add(entry.name.toUpperCase());
  }

  // Merge from spell data
  for (const spell of spells) {
    for (const entry of spell.availableFor || []) {
      const parsed = parseAvailableForEntry(entry);
      if (parsed) {
        names.add(parsed.className.toUpperCase());
      }
    }
  }

  return [...names].sort((a, b) => a.localeCompare(b));
}
```

- [ ] **Step 3: Run tests to verify they pass**

Run: `cd apps/web && npx vitest run src/app/__tests__/catalog.test.ts --reporter=verbose`

Expected: All tests PASS.

- [ ] **Step 4: Run full test suite to check for regressions**

Run: `cd apps/web && npx vitest run --reporter=verbose`

Expected: All existing tests still pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/domain/catalog.ts apps/web/src/app/__tests__/catalog.test.ts
git commit -m "feat: seed extractClassInfo and extractListNames from class registry"
```

---

### Task 4: Clean Spell Snapshot Data

**Files:**
- Modify: `data/spells.snapshot.json`

- [ ] **Step 1: Write a cleanup script**

Create a temporary Node.js script `scripts/clean-spell-snapshot.mjs` that:
1. Loads `data/spells.snapshot.json`
2. For each spell, filters `availableFor` to remove:
   - Entries whose class name (before " - ") does NOT contain "(Legacy)" AND is not a subclass-only entry of a Legacy class (i.e., remove all non-Legacy base class entries like plain "Bard", "Cleric", "Wizard")
   - Homebrew entries matching this blacklist (checked against the full raw entry before cleaning):
     - Class-level: `Illrigger`
     - Subclass-level (match after the " - "): `Blood Domain`, `Community Domain`, `Festus Domain`, `Inquisition Domain`, `Keeper Domain`, `Moon Domain`, `Night Domain`, `Shadow Domain`, `Circle of Shadows`, `Circle of Wicker`, `Circle of the Hive`, `Circle of the Old Ways`, `Oath of Castigation`, `Oath of Zeal`, `Oath of the Harvest`, `Oath of the Open Sea`, `Oath of the River`, `Oath of the Spelldrinker`, `Grim Harbinger`, `Highway Rider`, `Crimson Dynasty`, `Mother of Sorrows`, `The Great Fool`, `The Horned King`, `The Lantern`, `The Many`, `The Predator`
3. Writes cleaned data back to `data/spells.snapshot.json`
4. Prints a summary of removed entries

```javascript
#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = path.join(ROOT, 'data', 'spells.snapshot.json');

const HOMEBREW_CLASSES = new Set(['Illrigger']);

const HOMEBREW_SUBCLASSES = new Set([
  'Blood Domain', 'Community Domain', 'Festus Domain', 'Inquisition Domain',
  'Keeper Domain', 'Moon Domain', 'Night Domain', 'Shadow Domain',
  'Circle of Shadows', 'Circle of Wicker', 'Circle of the Hive', 'Circle of the Old Ways',
  'Oath of Castigation', 'Oath of Zeal', 'Oath of the Harvest', 'Oath of the Open Sea',
  'Oath of the River', 'Oath of the Spelldrinker',
  'Grim Harbinger', 'Highway Rider', 'Crimson Dynasty',
  'Mother of Sorrows', 'The Great Fool', 'The Horned King', 'The Lantern',
  'The Many', 'The Predator',
]);

function cleanParenthetical(value) {
  return value.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
}

function shouldRemoveEntry(entry) {
  const raw = entry.trim();
  if (!raw) return true;

  const dashIndex = raw.indexOf(' - ');
  const classRaw = dashIndex >= 0 ? raw.slice(0, dashIndex).trim() : raw;
  const subRaw = dashIndex >= 0 ? raw.slice(dashIndex + 3).trim() : null;

  const classClean = cleanParenthetical(classRaw);

  // Remove homebrew classes
  if (HOMEBREW_CLASSES.has(classClean)) return true;

  // Remove non-Legacy entries (no "(Legacy)" in class name)
  if (!classRaw.includes('(Legacy)')) return true;

  // Remove homebrew subclasses
  if (subRaw) {
    const subClean = cleanParenthetical(subRaw);
    if (HOMEBREW_SUBCLASSES.has(subClean)) return true;
  }

  return false;
}

const data = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
let totalRemoved = 0;
const removedEntries = new Map();

for (const spell of data.spells) {
  if (!spell.availableFor) continue;
  const original = spell.availableFor.length;
  spell.availableFor = spell.availableFor.filter((entry) => {
    if (shouldRemoveEntry(entry)) {
      const count = removedEntries.get(entry) || 0;
      removedEntries.set(entry, count + 1);
      return false;
    }
    return true;
  });
  totalRemoved += original - spell.availableFor.length;
}

fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(data, null, 2) + '\n');

console.log(`Removed ${totalRemoved} availableFor entries.`);
console.log(`\nUnique entries removed:`);
for (const [entry, count] of [...removedEntries.entries()].sort()) {
  console.log(`  ${entry} (×${count})`);
}
```

- [ ] **Step 2: Run the cleanup script**

Run: `node scripts/clean-spell-snapshot.mjs`

Expected: Prints summary of removed entries. No errors.

- [ ] **Step 3: Verify the cleanup results**

Run a quick validation to check no homebrew or non-Legacy entries remain:

```bash
node -e "
const data = JSON.parse(require('fs').readFileSync('data/spells.snapshot.json', 'utf8'));
const entries = new Set();
for (const spell of data.spells) {
  for (const e of spell.availableFor || []) entries.add(e);
}
for (const e of [...entries].sort()) console.log(e);
" | head -60
```

Expected: Only entries containing "(Legacy)" remain. No homebrew class/subclass names.

- [ ] **Step 4: Run full test suite to check nothing broke**

Run: `cd apps/web && npx vitest run --reporter=verbose`

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add data/spells.snapshot.json
git commit -m "data: remove non-Legacy and homebrew availableFor entries from spell snapshot"
```

- [ ] **Step 6: Delete the temporary cleanup script and commit**

```bash
rm scripts/clean-spell-snapshot.mjs
git add -u scripts/clean-spell-snapshot.mjs
git commit -m "chore: remove one-time spell snapshot cleanup script"
```

Note: If the script was never committed (only created locally), just `rm` it — no git step needed.

---

### Task 5: Run Full Verification

**Files:** None (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm test`

Expected: All tests pass across web, extension, and docs.

- [ ] **Step 2: Run the dev server and manually verify**

Run: `npm run dev`

Check in browser:
1. Open character creation modal — verify all 11 classes appear in dropdown
2. Select "Bard" — verify 8 subclasses appear (College of Lore, College of Valor, etc.)
3. Select "Wizard" — verify 13 subclasses appear (School of Abjuration, etc.)
4. Select "Cleric" — verify 14 subclasses appear
5. Select "Fighter" — verify "Eldritch Knight" appears
6. Select "Rogue" — verify "Arcane Trickster" appears
7. Verify no homebrew classes (Illrigger) or subclasses appear

- [ ] **Step 3: Build to verify no compile errors**

Run: `npm run build`

Expected: Build succeeds.
