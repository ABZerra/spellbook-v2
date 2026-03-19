# Prepare Intent Cluster Positioning Design

**Date:** 2026-03-18

## Goal

Refine the Prepare queue one more time by adjusting only the intent-button cluster position within the first column.

This pass should:

- keep the spell name left-aligned
- keep the current queue column structure
- move the intent buttons slightly left on desktop so they do not feel stranded far from the list column
- avoid changing name wrapping or the width of other columns

## Problem

The queue row is structurally aligned now, but the intent-button cluster still leaves a noticeable pocket of empty space between itself and the list column.

That makes the buttons feel a little detached from the rest of the row even though the overall layout is working.

## Direction

Use a desktop-only `center-left cluster` treatment:

- the spell name stays anchored on the left
- the intent buttons remain on the second line
- the cluster is positioned more centrally within the first column, but nudged left so it still feels connected to the name

## Constraints

- do not change the list, replace, or remove columns
- do not reduce the spell-name width
- keep mobile behavior unchanged

## Validation

- run the web test suite
- run a production build
