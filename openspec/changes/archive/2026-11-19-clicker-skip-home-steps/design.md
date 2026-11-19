# Design

## Context

See proposal.md — Why. Today the shell binds agenda tiles as the home module’s `stepCount` / `setStep` / `activateStep` (`shell/template.html`). Clicker keys all route through `clickerNavStep` → `moveStep(..., false)` then `stepVisible` at boundaries, so a long tile list becomes N clicker presses before the first content slide. Export already captures `agenda` as a single frame; no export change is required.

## Goals / Non-Goals

**Goals:**

- In clicker mode only, treat home as a zero-step slide for navigation purposes.
- Keep content-slide clicker scrubbing and non-clicker home ←/→ + Enter behavior.
- Align home keyboard-hint / Help copy with the exception so presenters are not told home steps in clicker mode.

**Non-Goals:**

- Changing how tiles are built, highlighted for mouse/keyboard in non-clicker mode, or activated via Enter / click.
- Removing home `stepCount` entirely (still useful for non-clicker scrub and notes UI).
- New settings keys or CLI flags.
- Changing remember-last-step semantics beyond whatever naturally follows from not visiting intermediate home steps via clicker.

## Decisions

### 1. Gate in `clickerNavStep`, not by clearing `stepCount`

When clicker mode is on and `keyAt(current) === 'agenda'`, skip `moveStep` and call `stepVisible(delta)` immediately (same path as “no steps / at boundary”).

**Why:** Home still needs `stepCount` / `setStep` for non-clicker ←/→ and Enter. Clearing `stepCount` while clicker is on would also affect notes step buttons and any caller of `Deck.moveStep` on home.

**Alternatives considered:**

- Set `homeMod.stepCount = 0` while clicker is enabled — simpler nav, but breaks non-clicker-adjacent APIs and forces rebinding on every toggle.
- Special-case only in the keydown handler — duplicates modal-open clicker path; `clickerNavStep` is the single scrub entry point.

### 2. Docs / hint copy

Update README clicker section and home-page dynamic hint text (`syncTitleKbdHintsForClicker`) so clicker hints on home describe page change, not “step then page”. Adjust Settings Help rows only if they imply every slide (including home) always steps in clicker mode.

### 3. Verification

Prefer a focused Vitest/jsdom (or existing assemble/home harness) that enables clicker, starts on `agenda` with multiple tiles, synthesizes one forward clicker key, and asserts the current key is the first content slide. Optional Playwright MCP smoke after `npx hptx dev` if automated shell keyboard coverage is awkward.

## Risks / Trade-offs

- [Presenters who used clicker to scrub home tiles] → Mitigation: non-clicker ←/→ and clicking tiles still work; document the clicker exception.
- [Notes “next step” on home still walks tiles] → Acceptable: explicit step controls are not the clicker two-button path; leave as-is unless product asks otherwise.

## Migration Plan

Ship with the next shell/template change. No deck author migration. Rollback is reverting the `clickerNavStep` gate and docs.
