# Spell Triage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "mark prepared spells for replacement" triage flow that feeds into the existing preparation queue, with entry points on all three pages.

**Architecture:** Extend the existing `NextPreparationQueueEntry` with a new `'remove'` intent. Add three new context methods (`markPreparedForReplacement`, `unmarkPreparedForReplacement`, `fulfillRemoval`). Update `computeApplyResult` to handle pure removals. Update all three pages and the `PreparedDrawer` to surface the Replace/Undo actions.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, Tailwind CSS

---

### Task 1: Extend QueueIntent type with 'remove'

**Files:**
- Modify: `apps/web/src/app/types.ts:45`

- [ ] **Step 1: Update QueueIntent type**

In `apps/web/src/app/types.ts`, change line 45:

```typescript
// Before:
export type QueueIntent = 'add' | 'replace' | 'queue_only';

// After:
export type QueueIntent = 'add' | 'replace' | 'queue_only' | 'remove';
```

- [ ] **Step 2: Verify the build still compiles**

Run: `cd apps/web && npx vitest run 2>&1 | tail -5`
Expected: All existing tests pass (the new intent value is additive — no existing code breaks).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/types.ts
git commit -m "feat(types): add 'remove' intent to QueueIntent"
```

---

### Task 2: Handle 'remove' intent in computeApplyResult

**Files:**
- Modify: `apps/web/src/app/domain/prepareQueue.ts:57-133`
- Test: `apps/web/src/app/__tests__/prepare-queue-domain.test.ts`

- [ ] **Step 1: Write failing tests for 'remove' intent**

Add these test cases to `apps/web/src/app/__tests__/prepare-queue-domain.test.ts`:

```typescript
it('applies a remove entry as pure removal when no replacement is linked', () => {
  const profile = makeProfile();
  const spells = makeSpells();

  const output = computeApplyResult({
    profile,
    spellsById: new Map(spells.map((spell) => [spell.id, spell])),
    queue: [
      { spellId: 'shield', intent: 'remove', assignedList: 'WIZARD' },
    ],
  });

  expect(output.finalPreparedSpells).toEqual([
    { spellId: 'mage-armor', assignedList: 'WIZARD', mode: 'normal' },
  ]);
  expect(output.summary.removals).toBe(1);
});

it('skips remove entry when spell is not currently prepared', () => {
  const profile = makeProfile();
  const spells = makeSpells();

  const output = computeApplyResult({
    profile,
    spellsById: new Map(spells.map((spell) => [spell.id, spell])),
    queue: [
      { spellId: 'counterspell', intent: 'remove', assignedList: 'WIZARD' },
    ],
  });

  // Prepared spells unchanged — counterspell was never prepared
  expect(output.finalPreparedSpells).toEqual([
    { spellId: 'mage-armor', assignedList: 'WIZARD', mode: 'normal' },
    { spellId: 'shield', assignedList: 'WIZARD', mode: 'normal' },
  ]);
  expect(output.summary.removals).toBe(0);
});

it('applies remove alongside add and replace entries', () => {
  const profile = makeProfile();
  const spells = makeSpells();

  const output = computeApplyResult({
    profile,
    spellsById: new Map(spells.map((spell) => [spell.id, spell])),
    queue: [
      { spellId: 'shield', intent: 'remove', assignedList: 'WIZARD' },
      { spellId: 'absorb-elements', intent: 'add', assignedList: 'WIZARD' },
    ],
  });

  expect(output.finalPreparedSpells).toEqual([
    { spellId: 'mage-armor', assignedList: 'WIZARD', mode: 'normal' },
    { spellId: 'absorb-elements', assignedList: 'WIZARD', mode: 'normal' },
  ]);
  expect(output.summary).toEqual({
    adds: 1,
    replacements: 0,
    removals: 1,
    queueOnlySkipped: 0,
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/web && npx vitest run src/app/__tests__/prepare-queue-domain.test.ts 2>&1 | tail -10`
Expected: FAIL — `summary.removals` is undefined, and `'remove'` intent is not handled.

- [ ] **Step 3: Implement 'remove' intent in computeApplyResult**

In `apps/web/src/app/domain/prepareQueue.ts`:

1. Add `removals: number` to the `ApplySummary` interface (after line 23):

```typescript
interface ApplySummary {
  adds: number;
  replacements: number;
  removals: number;
  queueOnlySkipped: number;
}
```

2. Initialize `removals: 0` in the summary (after line 65):

```typescript
const summary: ApplySummary = {
  adds: 0,
  replacements: 0,
  removals: 0,
  queueOnlySkipped: 0,
};
```

3. Process `'remove'` entries first, before the main loop. Insert before the `for (const entry of queue)` loop (before line 68). The remove pass strips spells from `nextPrepared` before adds/replaces run:

```typescript
// Process removals first
const removeEntries = queue.filter((entry) => entry.intent === 'remove');
for (const entry of removeEntries) {
  const removeIndex = nextPrepared.findIndex((preparedEntry) => (
    preparedEntry.spellId === entry.spellId
    && preparedEntry.assignedList === (entry.assignedList || preparedEntry.assignedList)
  ));
  if (removeIndex !== -1) {
    nextPrepared.splice(removeIndex, 1);
    summary.removals += 1;
  }
}

const nonRemoveQueue = queue.filter((entry) => entry.intent !== 'remove');
```

4. Change the main loop to iterate over `nonRemoveQueue` instead of `queue`:

```typescript
for (const entry of nonRemoveQueue) {
```

5. Update `remainingQueue` filter to also preserve `'remove'` entries that weren't applied (though normally they all apply or silently skip):

```typescript
const remainingQueue = queue.filter((entry) => entry.intent === 'queue_only');
```

(No change needed — `'remove'` entries are always consumed or skipped, never carried over.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/web && npx vitest run src/app/__tests__/prepare-queue-domain.test.ts 2>&1 | tail -10`
Expected: All tests pass including the three new ones.

- [ ] **Step 5: Update existing test expectation for summary shape**

The existing test at line 58 asserts `output.summary` — update it to include the new `removals` field:

```typescript
expect(output.summary).toEqual({
  adds: 1,
  replacements: 1,
  removals: 0,
  queueOnlySkipped: 1,
});
```

- [ ] **Step 6: Run full test suite**

Run: `cd apps/web && npx vitest run 2>&1 | tail -10`
Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/app/domain/prepareQueue.ts apps/web/src/app/__tests__/prepare-queue-domain.test.ts
git commit -m "feat(prepareQueue): handle 'remove' intent in computeApplyResult"
```

---

### Task 3: Add context methods for triage

**Files:**
- Modify: `apps/web/src/app/state/AppContext.tsx`

- [ ] **Step 1: Add markPreparedForReplacement method**

Add after `unqueueSpellForNextPreparation` (after line 228):

```typescript
const markPreparedForReplacement = useCallback(async (spellId: string, assignedList: string) => {
  await mutateActiveCharacter((character) => {
    const alreadyQueued = character.nextPreparationQueue.some(
      (entry) => entry.spellId === spellId && entry.intent === 'remove',
    );
    if (alreadyQueued) return character;

    return {
      ...character,
      nextPreparationQueue: [
        ...character.nextPreparationQueue,
        { spellId, intent: 'remove' as const, assignedList, createdAt: new Date().toISOString() },
      ],
    };
  });
}, [mutateActiveCharacter]);
```

- [ ] **Step 2: Add unmarkPreparedForReplacement method**

Add after `markPreparedForReplacement`:

```typescript
const unmarkPreparedForReplacement = useCallback(async (spellId: string) => {
  await mutateActiveCharacter((character) => ({
    ...character,
    nextPreparationQueue: character.nextPreparationQueue.filter(
      (entry) => !(entry.spellId === spellId && entry.intent === 'remove'),
    ),
  }));
}, [mutateActiveCharacter]);
```

- [ ] **Step 3: Add fulfillRemoval method**

Add after `unmarkPreparedForReplacement`:

```typescript
const fulfillRemoval = useCallback(async (removeSpellId: string, replacementSpellId: string) => {
  await mutateActiveCharacter((character) => {
    const removeEntry = character.nextPreparationQueue.find(
      (entry) => entry.spellId === removeSpellId && entry.intent === 'remove',
    );
    if (!removeEntry) {
      throw new Error('No removal entry found for this spell.');
    }

    // Remove the 'remove' entry and add a 'replace' entry for the replacement spell
    const withoutRemoval = character.nextPreparationQueue.filter(
      (entry) => !(entry.spellId === removeSpellId && entry.intent === 'remove'),
    );

    return {
      ...character,
      nextPreparationQueue: [
        ...withoutRemoval,
        {
          spellId: replacementSpellId,
          intent: 'replace' as const,
          assignedList: removeEntry.assignedList,
          replaceTarget: removeSpellId,
          createdAt: new Date().toISOString(),
        },
      ],
    };
  });
}, [mutateActiveCharacter]);
```

- [ ] **Step 4: Add isSpellMarkedForReplacement helper**

Add after `isSpellQueuedForNextPreparation` (after line 233):

```typescript
const isSpellMarkedForReplacement = useCallback((spellId: string) => {
  if (!activeCharacter) return false;
  return activeCharacter.nextPreparationQueue.some(
    (entry) => entry.spellId === spellId && entry.intent === 'remove',
  );
}, [activeCharacter]);
```

- [ ] **Step 5: Add methods to AppContextValue interface and provider value**

Add to `AppContextValue` interface (after line 60):

```typescript
markPreparedForReplacement: (spellId: string, assignedList: string) => Promise<void>;
unmarkPreparedForReplacement: (spellId: string) => Promise<void>;
fulfillRemoval: (removeSpellId: string, replacementSpellId: string) => Promise<void>;
isSpellMarkedForReplacement: (spellId: string) => boolean;
```

Add to the `value` useMemo object and its dependency array (around lines 395-443):

```typescript
markPreparedForReplacement,
unmarkPreparedForReplacement,
fulfillRemoval,
isSpellMarkedForReplacement,
```

- [ ] **Step 6: Run full test suite**

Run: `cd apps/web && npx vitest run 2>&1 | tail -10`
Expected: All tests pass (new methods are additive, no existing behavior changes).

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/app/state/AppContext.tsx
git commit -m "feat(context): add markPreparedForReplacement, unmarkPreparedForReplacement, fulfillRemoval methods"
```

---

### Task 4: Update preparePresentation for 'remove' intent

**Files:**
- Modify: `apps/web/src/app/pages/preparePresentation.ts`
- Test: `apps/web/src/app/__tests__/prepare-presentation.test.ts`

- [ ] **Step 1: Write failing test for remove review label**

Add to `apps/web/src/app/__tests__/prepare-presentation.test.ts`:

```typescript
it('formats remove intent as removal label', () => {
  const result = formatPrepareReviewLabel({
    intent: 'remove',
    spellName: 'Shield',
    assignedList: 'WIZARD',
  });

  expect(result).toBe('Remove Shield');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run src/app/__tests__/prepare-presentation.test.ts 2>&1 | tail -10`
Expected: FAIL — `'remove'` case falls through to default.

- [ ] **Step 3: Add 'remove' case to formatPrepareReviewLabel**

In `apps/web/src/app/pages/preparePresentation.ts`, add before the final return in `formatPrepareReviewLabel` (before line 111):

```typescript
if (item.intent === 'remove') {
  return `Remove ${item.spellName}`;
}
```

- [ ] **Step 4: Add 'remove' case to getPrepareQueueReplaceSummary**

In `apps/web/src/app/pages/preparePresentation.ts`, add a case for `'remove'` in `getPrepareQueueReplaceSummary` (before line 61):

```typescript
if (intent === 'remove') return 'Marked for replacement';
```

- [ ] **Step 5: Update ApplySummary usage in PreparePage**

The `PreparePage.tsx` at line 191 references `output.summary.adds` and `output.summary.replacements`. The `onApply` function formats the result message. Update line 191 to also include removals:

In `apps/web/src/app/pages/PreparePage.tsx`, change the result message (around line 198):

```typescript
const executed = output.summary.adds + output.summary.replacements + (output.summary.removals || 0);
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd apps/web && npx vitest run 2>&1 | tail -10`
Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/app/pages/preparePresentation.ts apps/web/src/app/__tests__/prepare-presentation.test.ts apps/web/src/app/pages/PreparePage.tsx
git commit -m "feat(presentation): handle 'remove' intent in prepare presentation helpers"
```

---

### Task 5: Update catalogPresentation for 'remove' states

**Files:**
- Modify: `apps/web/src/app/pages/catalogPresentation.ts`
- Modify: `apps/web/src/app/pages/catalogViewModel.ts:26-32`
- Test: `apps/web/src/app/__tests__/catalog-presentation.test.ts`

- [ ] **Step 1: Add `markedForReplacement` to CatalogRow**

In `apps/web/src/app/pages/catalogViewModel.ts`, add to `CatalogRow` interface (line 30):

```typescript
export interface CatalogRow {
  spell: SpellRecord;
  eligible: boolean;
  prepared: boolean;
  queued: boolean;
  markedForReplacement: boolean;
  displayList: string;
}
```

Update `buildCatalogRows` (around line 165) to populate the new field. Add after `queuedSet`:

```typescript
const markedForReplacementSet = new Set(
  (input.activeCharacter?.nextPreparationQueue || [])
    .filter((entry) => entry.intent === 'remove')
    .map((entry) => entry.spellId),
);
```

And in the row mapping (around line 179), add:

```typescript
markedForReplacement: markedForReplacementSet.has(spell.id),
```

- [ ] **Step 2: Write failing test for new catalog presentation states**

Add to `apps/web/src/app/__tests__/catalog-presentation.test.ts`:

```typescript
it('shows prepared spell as replaceable with Replace action', () => {
  const result = getCatalogRowPresentation({
    row: {
      spell: { id: 'shield', name: 'Shield', level: 1, save: '', castingTime: '1 Reaction', notes: '' } as any,
      eligible: true,
      prepared: true,
      queued: false,
      markedForReplacement: false,
      displayList: 'WIZARD',
    },
    addableLists: ['WIZARD'],
  });

  expect(result.actionLabel).toBe('Prepared \u00b7 Replace');
  expect(result.disabled).toBe(false);
});

it('shows marked-for-replacement spell with Replacing checkmark', () => {
  const result = getCatalogRowPresentation({
    row: {
      spell: { id: 'shield', name: 'Shield', level: 1, save: '', castingTime: '1 Reaction', notes: '' } as any,
      eligible: true,
      prepared: true,
      queued: false,
      markedForReplacement: true,
      displayList: 'WIZARD',
    },
    addableLists: ['WIZARD'],
  });

  expect(result.stateLabel).toBe('Replacing');
  expect(result.actionLabel).toBe('Replacing \u2713');
  expect(result.disabled).toBe(false);
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd apps/web && npx vitest run src/app/__tests__/catalog-presentation.test.ts 2>&1 | tail -10`
Expected: FAIL — new states not handled yet.

- [ ] **Step 4: Update getCatalogRowPresentation**

In `apps/web/src/app/pages/catalogPresentation.ts`, add a new check for `markedForReplacement` after the `queued` check (after line 26), and change the `prepared` label:

```typescript
export function getCatalogRowPresentation({
  row,
  addableLists,
}: CatalogRowPresentationInput): CatalogRowPresentation {
  if (row.queued) {
    return {
      stateLabel: 'Queued',
      actionLabel: 'Queued \u2713',
      disabled: false,
      helperText: 'Already staged for the next preparation.',
    };
  }

  if (row.markedForReplacement) {
    return {
      stateLabel: 'Replacing',
      actionLabel: 'Replacing \u2713',
      disabled: false,
      helperText: 'Marked for replacement. Click to undo.',
    };
  }

  if (!row.eligible) {
    return {
      stateLabel: 'Off-list',
      actionLabel: 'Off-list',
      disabled: true,
      helperText: 'This spell is outside your active spell lists.',
    };
  }

  if (addableLists.length === 0) {
    return {
      stateLabel: 'Too High',
      actionLabel: 'Too High',
      disabled: true,
      helperText: 'This spell is above every owned list max spell level.',
    };
  }

  if (row.prepared) {
    return {
      stateLabel: 'Prepared',
      actionLabel: 'Prepared \u00b7 Replace',
      disabled: false,
      helperText: 'Prepared now. Click to mark for replacement.',
    };
  }

  return {
    stateLabel: 'Available',
    actionLabel: 'Queue',
    disabled: false,
    helperText: addableLists.length > 1
      ? 'Choose the best list after you stage it.'
      : `Ready for ${addableLists[0]}.`,
  };
}
```

- [ ] **Step 5: Update existing test expectations**

The existing test `'shows prepared spells as queueable with distinct label'` expects `'Prepared \u00b7 Queue'`. Update it to expect `'Prepared \u00b7 Replace'`.

Also add `markedForReplacement: false` to all existing test `row` objects so they compile with the updated interface.

- [ ] **Step 6: Update CatalogRowPresentationInput to include markedForReplacement**

The `CatalogRowPresentationInput` uses `CatalogRow` which now has `markedForReplacement`. No change needed to the interface — it references `CatalogRow` directly.

- [ ] **Step 7: Run tests to verify they pass**

Run: `cd apps/web && npx vitest run 2>&1 | tail -10`
Expected: All tests pass.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/app/pages/catalogPresentation.ts apps/web/src/app/pages/catalogViewModel.ts apps/web/src/app/__tests__/catalog-presentation.test.ts
git commit -m "feat(catalog): add Replacing state and Prepared \u00b7 Replace button"
```

---

### Task 6: Wire up Catalog page button to triage actions

**Files:**
- Modify: `apps/web/src/app/pages/CatalogPage.tsx`

- [ ] **Step 1: Import new context methods**

In `CatalogPage.tsx`, destructure from `useApp()`:

```typescript
const {
  // ... existing
  markPreparedForReplacement,
  unmarkPreparedForReplacement,
  isSpellMarkedForReplacement,
} = useApp();
```

- [ ] **Step 2: Update onQueueToggle to handle prepared spells**

The current `onQueueToggle` queues/unqueues any spell. For prepared spells, the button should now mark/unmark for replacement instead. Update the `onQueueToggle` function (around line 152):

```typescript
async function onQueueToggle(spellId: string) {
  setError(null);
  try {
    if (isSpellQueuedForNextPreparation(spellId)) {
      await unqueueSpellForNextPreparation(spellId);
    } else if (isSpellMarkedForReplacement(spellId)) {
      await unmarkPreparedForReplacement(spellId);
    } else {
      // Check if this is a prepared spell — if so, mark for replacement
      const preparedEntry = activeCharacter?.preparedSpells.find((entry) => entry.spellId === spellId);
      if (preparedEntry) {
        await markPreparedForReplacement(spellId, preparedEntry.assignedList);
      } else {
        await queueSpellForNextPreparation(spellId);
      }
    }
  } catch (nextError) {
    setError(nextError instanceof Error ? nextError.message : 'Unable to update the next preparation queue.');
  }
}
```

- [ ] **Step 3: Update button styling for 'Replacing' state**

In the button styling conditional (around line 386), add a case for `'Replacing'`:

```typescript
presentation.stateLabel === 'Replacing'
  ? 'border-gold-soft bg-gold-soft/20 text-text hover:bg-gold-soft/30'
```

This goes between the `'Queued'` and `'Prepared'` checks.

- [ ] **Step 4: Run full test suite**

Run: `cd apps/web && npx vitest run 2>&1 | tail -10`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/pages/CatalogPage.tsx
git commit -m "feat(catalog): wire Replace button to mark/unmark prepared spells for replacement"
```

---

### Task 7: Update Character page — Replace instead of Remove

**Files:**
- Modify: `apps/web/src/app/pages/CharacterPage.tsx`

- [ ] **Step 1: Import new context methods**

In `CharacterPage.tsx`, destructure from `useApp()`:

```typescript
const {
  // ... existing
  markPreparedForReplacement,
  unmarkPreparedForReplacement,
  isSpellMarkedForReplacement,
} = useApp();
```

- [ ] **Step 2: Replace the Remove button with Replace/Undo**

In the prepared spell row (around lines 463-473), replace the Remove button with conditional Replace/Undo:

```typescript
{row.mode !== 'always' ? (
  isSpellMarkedForReplacement(row.entry.spellId) ? (
    <button
      type="button"
      className="text-[11px] uppercase tracking-[0.18em] text-gold-soft font-semibold transition-[color,opacity] hover:text-gold md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
      onClick={() => {
        void unmarkPreparedForReplacement(row.entry.spellId).catch((nextError) => {
          setError(nextError instanceof Error ? nextError.message : 'Unable to undo replacement mark.');
        });
      }}
    >
      Undo
    </button>
  ) : (
    <button
      type="button"
      className="text-[11px] uppercase tracking-[0.18em] text-text-dim transition-[color,opacity] hover:text-gold-soft md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
      onClick={() => {
        void markPreparedForReplacement(row.entry.spellId, row.entry.assignedList).catch((nextError) => {
          setError(nextError instanceof Error ? nextError.message : 'Unable to mark spell for replacement.');
        });
      }}
    >
      Replace
    </button>
  )
) : (
  <button
    type="button"
    className="text-[11px] uppercase tracking-[0.18em] text-text-dim transition-[color,opacity] hover:text-blood md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
    onClick={() => {
      void removePreparedSpell(row.entry.spellId, row.entry.assignedList, row.entry.mode, row.occurrenceIndex).catch((nextError) => {
        setError(nextError instanceof Error ? nextError.message : 'Unable to remove prepared spell.');
      });
    }}
  >
    Remove
  </button>
)}
```

Note: `'always'` prepared spells keep the old direct "Remove" behavior per spec ("removePreparedSpell() stays available for direct removal outside the queue flow — e.g., always-prepared spell management").

- [ ] **Step 3: Add strike-through styling for marked spells**

Update the spell name button (around line 402) to show strike-through when marked:

```typescript
<button
  type="button"
  className={`min-w-0 truncate text-left font-medium transition-colors hover:text-gold-soft ${
    isSpellMarkedForReplacement(row.entry.spellId)
      ? 'text-text-dim line-through'
      : 'text-text'
  }`}
  onClick={() => setSelectedPreparedKey(row.key)}
>
  {row.spell?.name || row.entry.spellId}
</button>
```

Also dim the row when marked — update the row container (around line 400):

```typescript
<div
  key={row.key}
  className={`group flex flex-col gap-2 py-1.5 md:flex-row md:items-baseline md:gap-3 ${
    isSpellMarkedForReplacement(row.entry.spellId) ? 'opacity-60' : ''
  }`}
>
```

- [ ] **Step 4: Run full test suite**

Run: `cd apps/web && npx vitest run 2>&1 | tail -10`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/pages/CharacterPage.tsx
git commit -m "feat(character): replace Remove with Replace/Undo for normal prepared spells"
```

---

### Task 8: Make PreparedDrawer interactive with Replace/Undo

**Files:**
- Modify: `apps/web/src/app/components/PreparedDrawer.tsx`
- Modify: `apps/web/src/app/pages/PreparePage.tsx` (pass new props)

- [ ] **Step 1: Add callback props to PreparedDrawer**

Update `PreparedDrawerProps` in `apps/web/src/app/components/PreparedDrawer.tsx`:

```typescript
interface PreparedDrawerProps {
  open: boolean;
  onClose: () => void;
  profile: Pick<CharacterProfile, 'preparedSpells'>;
  spellsById: Map<string, SpellRecord>;
  highlightedSpellIds?: Set<string>;
  markedForReplacementIds?: Set<string>;
  onMarkForReplacement?: (spellId: string, assignedList: string) => void;
  onUnmarkForReplacement?: (spellId: string) => void;
}
```

- [ ] **Step 2: Update PreparedDrawer to show Replace/Undo buttons**

Update the `PreparedDrawer` function signature to destructure new props, and update the `GroupedEntry` type's `spells` array items to include `assignedList`:

```typescript
interface GroupedEntry {
  list: string;
  spells: Array<{ spell: SpellRecord; mode: CharacterProfile['preparedSpells'][number]['mode']; assignedList: string }>;
}
```

Update `buildGroups` to include `assignedList`:

```typescript
listEntries.push({ spell, mode: entry.mode, assignedList: entry.assignedList });
```

In the spell card render (around line 68), add a Replace/Undo button:

```typescript
{group.spells.map(({ spell, mode, assignedList }) => {
  const isMarked = markedForReplacementIds.has(spell.id);
  return (
    <div
      key={`${group.list}:${spell.id}:${mode}`}
      className={`rounded-2xl border px-3 py-3 text-sm ${
        isMarked
          ? 'border-gold-soft bg-gold-soft/10 opacity-60'
          : highlightedSpellIds.has(spell.id)
            ? 'border-gold-soft bg-gold-soft/15'
            : 'border-moon-border bg-moon-paper-2'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <p className={`font-medium text-moon-ink ${isMarked ? 'line-through' : ''}`}>{spell.name}</p>
          {mode === 'always' ? (
            <span className="rounded-full border border-gold-soft bg-gold-soft/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-moon-ink-muted">
              Always Prepared
            </span>
          ) : null}
        </div>
        {mode !== 'always' && onMarkForReplacement && onUnmarkForReplacement ? (
          isMarked ? (
            <button
              type="button"
              className="text-[10px] uppercase tracking-wide text-gold-soft font-semibold hover:text-gold flex-shrink-0"
              onClick={() => onUnmarkForReplacement(spell.id)}
            >
              Undo
            </button>
          ) : (
            <button
              type="button"
              className="text-[10px] uppercase tracking-wide text-moon-ink-muted hover:text-moon-ink flex-shrink-0"
              onClick={() => onMarkForReplacement(spell.id, assignedList)}
            >
              Replace
            </button>
          )
        ) : null}
      </div>
      <p className="text-xs text-moon-ink-muted">Save: {spell.save || '-'} \u00b7 Action: {spell.castingTime || '-'}</p>
    </div>
  );
})}
```

- [ ] **Step 3: Pass new props from PreparePage**

In `apps/web/src/app/pages/PreparePage.tsx`, import and destructure the new context methods:

```typescript
const {
  // ... existing
  markPreparedForReplacement,
  unmarkPreparedForReplacement,
  isSpellMarkedForReplacement,
} = useApp();
```

Add a computed set for marked spell IDs (after `highlightedReplaceTargets`):

```typescript
const markedForReplacementIds = useMemo(() => new Set(queueEntries
  .filter((entry) => entry.intent === 'remove')
  .map((entry) => entry.spellId)), [queueEntries]);
```

Update the `<PreparedDrawer>` usage (around line 539):

```typescript
<PreparedDrawer
  open={preparedDrawerOpen}
  onClose={() => setPreparedDrawerOpen(false)}
  profile={activeCharacter}
  spellsById={spellsById}
  highlightedSpellIds={highlightedReplaceTargets}
  markedForReplacementIds={markedForReplacementIds}
  onMarkForReplacement={(spellId, assignedList) => {
    void markPreparedForReplacement(spellId, assignedList);
  }}
  onUnmarkForReplacement={(spellId) => {
    void unmarkPreparedForReplacement(spellId);
  }}
/>
```

- [ ] **Step 4: Update PreparedDrawer help text**

Change the description text (line 62) to reflect interactivity:

```typescript
<p className="mt-1 text-sm text-moon-ink-muted">Mark spells for replacement here, or use this as a reference while staging changes.</p>
```

- [ ] **Step 5: Run full test suite**

Run: `cd apps/web && npx vitest run 2>&1 | tail -10`
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/components/PreparedDrawer.tsx apps/web/src/app/pages/PreparePage.tsx
git commit -m "feat(preparedDrawer): make interactive with Replace/Undo actions"
```

---

### Task 9: Show unfilled replacement slots on Prepare page

**Files:**
- Modify: `apps/web/src/app/pages/PreparePage.tsx`

- [ ] **Step 1: Render 'remove' entries as unfilled replacement slots**

The `queuedRows` (line 44) already includes `'remove'` entries since they're in the queue. However, `'remove'` entries reference prepared spells (the `spellId` is the prepared spell being removed), so the spell lookup works. The UI needs to render them differently.

In the queue item render (around line 357), add a conditional branch for `entry.intent === 'remove'`:

Before the existing `<article>` element, add:

```typescript
if (entry.intent === 'remove') {
  return (
    <article key={spell.id} className="py-4 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-display text-2xl leading-tight text-text-dim line-through">
            {spell.name}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            {entry.assignedList || 'Unassigned'} \u00b7 Marked for replacement
          </p>
          <p className="mt-3 text-sm text-text-muted">
            Find a replacement from the search above or from the Catalog page.
          </p>
          <p className="mt-2 text-xs text-text-dim">
            No replacement needed? This spell will simply be unprepared when you apply.
          </p>
        </div>
        <button
          type="button"
          className="text-[11px] uppercase tracking-[0.18em] text-gold-soft font-semibold transition-colors hover:text-gold flex-shrink-0 pt-3"
          onClick={() => void unmarkPreparedForReplacement(spell.id)}
        >
          Undo
        </button>
      </div>
    </article>
  );
}
```

Also import `unmarkPreparedForReplacement` in the destructured `useApp()` call if not already done in Task 8.

- [ ] **Step 2: Filter 'remove' entries from the intent toggle section**

The `'remove'` entries should not show the Replace/Prepare/Save Later toggle buttons since they have their own UI. The conditional branch above handles this by returning early.

- [ ] **Step 3: Run full test suite**

Run: `cd apps/web && npx vitest run 2>&1 | tail -10`
Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/pages/PreparePage.tsx
git commit -m "feat(prepare): show unfilled replacement slots for 'remove' entries"
```

---

### Task 10: Verify full integration and final cleanup

**Files:**
- All modified files

- [ ] **Step 1: Run full test suite**

Run: `cd apps/web && npx vitest run 2>&1`
Expected: All tests pass with zero failures.

- [ ] **Step 2: Run build**

Run: `cd apps/web && npx vite build 2>&1 | tail -10`
Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 3: Manual smoke test checklist**

Start dev server: `cd apps/web && npx vite --open`

Verify these flows:
1. **Character page:** "Replace" button appears on normal prepared spells (not "always" ones). Clicking marks with strike-through + "Undo". Clicking Undo restores.
2. **Catalog page:** Prepared spells show "Prepared \u00b7 Replace". Clicking shows "Replacing \u2713" in gold. Clicking again undoes.
3. **Prepare page sidebar:** Open "View Current Prepared" — spells show "Replace" buttons. Marking shows strike-through + "Undo".
4. **Prepare page queue:** Marked spells appear as unfilled replacement slots with "Find a replacement" prompt and "or remove without replacing" link.
5. **Apply with pure removal:** Mark a spell, don't find replacement, click "Apply" — spell is removed.
6. **Apply with replacement:** Mark a spell, queue a new spell from catalog with intent "replace" targeting the marked spell, apply — swap works.

- [ ] **Step 4: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "chore: final cleanup for spell triage feature"
```
