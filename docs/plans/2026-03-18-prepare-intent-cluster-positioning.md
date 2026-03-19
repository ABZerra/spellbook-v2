# Prepare Intent Cluster Positioning Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Shift the Prepare queue intent buttons slightly left on desktop without changing the rest of the row structure.

**Architecture:** Keep the current queue ledger unchanged except for the intent-button wrapper in `PreparePage.tsx`. The change should be limited to utility classes on the button-cluster container so mobile behavior and the rest of the desktop row remain stable.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, Tailwind utility classes

---

### Task 1: Adjust the intent-button wrapper

**Files:**
- Modify: `apps/web/src/app/pages/PreparePage.tsx`

**Step 1: Verify the current issue**

Confirm the button cluster still sits too far from the list column on desktop.

**Step 2: Write minimal implementation**

Update the button-cluster wrapper so that on desktop it is positioned more centrally within the first column and nudged slightly left.

**Step 3: Run verification**

Run:

```bash
npm run test --prefix apps/web
npm run build --prefix apps/web
```

Expected: PASS
