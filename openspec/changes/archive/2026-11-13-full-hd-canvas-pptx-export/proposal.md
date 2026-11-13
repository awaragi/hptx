# Proposal

## Why

The design canvas is a laptop-ish **1710×1107** box, which does not match standard 16:9 handoff (projectors, PowerPoint). Authors also still need a manual screenshot-to-PPTX escape hatch. Moving the platform to Full HD 16:9 and adding a PNG-stitch PPTX export closes both gaps.

## What Changes

- **BREAKING**: Change the platform design canvas from **1710×1107** to **1920×1080** (Full HD, 16:9) in the shell, print layout, export capture/stitch sizes, slide contract, and operator docs. No dual-aspect CLI or `deck.json` option in this change. Existing decks may need visual reflow (accepted; authors fix their own content).
- Add export `--format pptx`: capture the same PNG frame set as `png`, then write a PowerPoint at `<dirname(output)>/<name>/png/<name>.pptx` with one full-bleed image slide per PNG (standard 16:9 slide size matching the canvas).
- Final export `--format` set: `png` | `pdf` | `print` | `pptx` (default still `png`).
- Document Full HD / 16:9 as the supported authoring and export canvas.
- Platform (engine/tooling) change. Example/about deck copy that hardcodes the old size should be updated so docs and the about story stay accurate; layout polish of third-party decks is out of scope.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `deck-export`: Canvas/frame size becomes **1920×1080**; `--format` gains `pptx` (PNG frames + full-bleed PPTX under the png directory); progress/help cover the new format.
- `slide-contract`: Contract docs MUST state the canvas is **1920×1080** (Full HD, 16:9).

## Impact

- Shell: `shell/template.html` canvas CSS, `DECK_REF_*`, print `@page` / print-mode sizes; `shell/contract/SLIDE-CONTRACT.md` and `slide-contract.css` comments
- Export: `exportArgs.ts`, `exportPaths.ts`, `exportCapture.ts`, `exportPdf.ts` (shared size constants), new PPTX stitch module, dependency for PPTX generation, Vitest
- Docs: `README.md`, `CLAUDE.md`, `openspec/config.yaml` context canvas size
- Specs: deltas for `deck-export` and `slide-contract`
- Decks/templates that mention or tightly fit 1710×1107 (e.g. about escape copy, blank template blurb) updated for accuracy
