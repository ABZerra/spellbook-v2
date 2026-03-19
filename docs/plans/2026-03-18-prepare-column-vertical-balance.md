# Prepare Queue Column Vertical Balance Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Lower the supporting queue columns slightly on desktop so the spell name remains the dominant top anchor.

**Architecture:** Keep the current queue ledger structure in `PreparePage.tsx` and change only the desktop spacing utilities on the `List`, `Replace`, and `Remove` wrappers. This is a presentation-only refinement and should not affect logic or the mobile layout.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, Tailwind utility classes

---

### Task 1: Apply the desktop vertical rebalance

**Files:**
- Modify: `apps/web/src/app/pages/PreparePage.tsx`

**Step 1: Verify the current issue**

Confirm the `List`, `Replace`, and `Remove` areas still start too high relative to the spell name.

**Step 2: Write minimal implementation**

Add a small desktop-only top offset to the `List` and `Replace` column wrappers and adjust the `Remove` wrapper so it stays aligned with that same control band.

**Step 3: Run verification**

Run:

```bash
npm run test --prefix apps/web
npm run build --prefix apps/web
```

Expected: PASS
