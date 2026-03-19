# Prepare Queue Column Vertical Balance Design

**Date:** 2026-03-18

## Goal

Refine the Prepare queue one more time so the spell name clearly leads the row and the other columns sit slightly lower in support of it.

This pass should:

- keep the spell name as the top visual anchor
- move the `List` and `Replace` columns slightly downward on desktop
- move `Remove` with them so the control area reads as one band
- preserve the existing mobile layout and the current column rhythm

## Problem

The queue row is aligned, but the supporting columns still start too close to the top of the spell name.

That makes the row feel flatter than it should and slightly weakens the spell name as the main visual entry point.

## Direction

Use a desktop-only `name-led row` treatment:

- spell name stays where it is
- intent buttons remain the second line under the name
- `List`, `Replace`, and `Remove` shift slightly downward
- the supporting controls visually align more with the action line than with the top of the spell name

## Constraints

- do not change the spell-name width
- do not change the queue logic or copy
- keep the nudge subtle

## Validation

- run the web test suite
- run a production build
