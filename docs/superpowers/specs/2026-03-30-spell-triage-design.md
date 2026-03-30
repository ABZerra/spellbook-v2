# Spell Triage: Mark Prepared Spells for Replacement

**Date:** 2026-03-30
**Status:** Draft

## Problem

The current preparation flow is catalog-first: browse spells, queue them, set intents, apply. But during a long rest, the natural mental flow often starts from the opposite direction — reviewing currently prepared spells and deciding which ones to swap out. The app lacks this "triage" entry point.

## JTBD

> When I'm preparing spells for a long rest, I want to start by reviewing my currently prepared spells and marking the ones I want to replace, so that I can work from what I have toward what I need — rather than browsing the full catalog first.

## Design

### Two Equal Entry Points, One Queue

The existing catalog-first flow and the new triage flow are peers — neither is primary. Both feed into the same `nextPreparationQueue` on the character profile. The Prepare page is the convergence point where all pending changes are staged, reviewed, and applied.

### Data Model: New `'remove'` Intent

The `NextPreparationQueueEntry` gains a new intent value:

```typescript
interface NextPreparationQueueEntry {
  spellId: string;
  intent: 'add' | 'replace' | 'queue_only' | 'remove';
  assignedList?: string;
  replaceTarget?: string;
  createdAt?: string;
}
```

**`intent: 'remove'`:**
- `spellId` is the **currently prepared** spell being marked for replacement.
- `assignedList` is the list it's currently prepared on (known at mark-time).
- `replaceTarget` is not used — this entry IS the target.

### Lifecycle of a `'remove'` Entry

1. **Created** when the user marks a prepared spell for replacement (from any page).
2. **Shown on the Prepare page** as an unfilled replacement slot — the outgoing spell is known, but the incoming spell is not yet chosen.
3. **Fulfilled** when the user picks a replacement spell. A new queue entry is created with `intent: 'replace'` and `replaceTarget` pointing at the `'remove'` entry's `spellId`. The `'remove'` entry is then removed from the queue.
4. **Applied as pure removal** if the user chooses not to fill the slot. On apply, the spell is unprepared without a replacement.
5. **Undone** if the user clicks "Undo" — the `'remove'` entry is removed from the queue and the prepared spell returns to normal state.

### Entry Points

The triage action is available on all three pages, using consistent "Replace" copy:

#### 1. Character Page — Prepared Spells List

The existing prepared spell rows gain a **"Replace"** action (replacing the current "Remove" button copy). Clicking it:
- Creates a `'remove'` queue entry for that spell.
- The spell row shows struck-through and dimmed.
- The action changes to **"Undo"** (gold text) to reverse the marking.

**Behavioral change:** "Replace" on the Character page no longer immediately unprepares the spell. Instead, it stages the removal in the queue, making it reversible and part of the unified preparation plan.

#### 2. Prepare Page — Prepared Sidebar/Drawer

The `PreparedDrawer` becomes interactive (currently read-only). Each prepared spell gets a **"Replace"** action with the same strike-through/Undo pattern as the Character page.

#### 3. Catalog Page — Action Button

For spells that are currently prepared, the action button changes:

| State | Label | Style | Click Action |
|-------|-------|-------|--------------|
| Current | `Prepared` (disabled) | Moon/blue, dimmed | None |
| **New: actionable** | `Prepared · Replace` | Moon/blue | Creates `'remove'` queue entry |
| **New: marked** | `Replacing ✓` | Gold | Undoes the `'remove'` entry |

### Prepare Page — Unfilled Replacement Slots

`'remove'` entries appear in the Prepare page queue, visually distinct from incoming spell entries:

- **Outgoing spell name** shown struck-through with its assigned list.
- **"Choose replacement"** prompt — the user can search inline or browse the catalog.
- **"or remove without replacing"** — small text link to downgrade to pure removal (the user accepts having one fewer prepared spell).
- Once a replacement is picked, the `'remove'` entry is consumed and a normal `'replace'` entry takes over.

**Interaction with catalog-first flow:** If the user queues a spell from the catalog with `intent: 'replace'` and there's an existing `'remove'` entry on the same list, the Prepare page may suggest auto-linking them but does not force it.

### Apply Logic

**`'remove'` entry with linked replacement:**
- Already handled by existing replace logic. The `'remove'` entry was consumed when the link was made, so at apply time only the `'replace'` entry exists.

**`'remove'` entry with no replacement (pure removal):**
- The spell is unprepared, freeing a preparation slot on that list.
- Equivalent to the existing `removePreparedSpell()` call, but batched into the apply action.

**Validation:**
- A `'remove'` entry without a replacement shows a soft warning ("No replacement chosen — this slot will be empty after applying") but does NOT block apply.
- Preparation limit checks account for removals — removing 2 and adding 1 is net -1, which is always valid.

**Post-apply cleanup:**
- `'remove'` entries are cleared like all other applied entries.
- `'queue_only'` entries survive as before.

### Context Methods

New methods on `AppContext`:

- `markPreparedForReplacement(spellId: string, assignedList: string)` — creates a `'remove'` queue entry.
- `unmarkPreparedForReplacement(spellId: string)` — removes the `'remove'` queue entry (undo).
- `fulfillRemoval(removeSpellId: string, replacementSpellId: string)` — consumes a `'remove'` entry by creating a linked `'replace'` entry.

Existing methods remain unchanged. `removePreparedSpell()` stays available for direct removal outside the queue flow (e.g., always-prepared spell management on the Character page).

## Out of Scope

- Suggesting replacements based on the outgoing spell's properties.
- Tracking usage history or session-based spell analytics.
- Long rest lifecycle tracking (rest counters, time-based triggers).
- Changes to the `'always'` prepared spell management flow.
