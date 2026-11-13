# Design

## Context

See proposal.md for motivation. The shell hardcodes `DECK_REF_W/H = 1710/1107` in `shell/template.html` (CSS + JS scale/print). Export mirrors those constants in `exportCapture.ts` / `exportPdf.ts`. Formats today: `png` | `pdf` | `print`. Raster PDF stitching (`pdf-lib`) is the pattern for packaging PNG frames into a document.

## Goals / Non-Goals

**Goals:**

- Single platform canvas: **1920×1080** everywhere (shell, print, export, docs, contract).
- `--format pptx` as a sibling of `--format pdf`: same PNG capture, then stitch to PPTX under the png directory.
- Full-bleed PPTX slides at standard 16:9 (PowerPoint widescreen).

**Non-Goals:**

- Dual canvas / aspect via CLI or `deck.json`.
- Editable PowerPoint shapes/text, speaker notes, or animations in PPTX.
- Automatic reflow of existing deck layouts (authors fix content).
- Changing theme token inventing rules.

## Decisions

1. **Canvas = 1920×1080** — Full HD 16:9. Rationale: matches PPTX widescreen and common projector expectation; clear docs story. Alternative considered: keep width 1710 and use 1710×962 — rejected for a rounder, widely recognized size.

2. **One shared size constant path** — Update shell `DECK_REF_*` and export `DECK_REF_*` / PDF page size to 1920×1080. Keep them duplicated as today (shell vanilla JS vs CLI TypeScript) rather than introducing a shared runtime package. Alternative: generate shell constants from TS — out of scope.

3. **PPTX stitch mirrors PDF** — After PNG capture, build `<name>.pptx` beside `<name>.pdf` under `<dir(output)>/<name>/png/`. Use a small Node library (e.g. PptxGenJS) to create a presentation with `defineLayout` / widescreen 16:9 (or exact 1920×1080 inch mapping) and one full-bleed image per frame. Alternative: hand-roll OOXML zip — rejected for maintenance cost.

4. **No aspect flags** — Export and shell always use the platform canvas. PPTX slide size matches canvas aspect (standard 16:9), image covers the slide.

5. **Docs + contract** — README, CLAUDE.md, `openspec/config.yaml` context, `SLIDE-CONTRACT.md`, and obvious hardcoded mentions in templates/about copy update to 1920×1080 / Full HD 16:9. Deep visual redesign of about/templates is author follow-up beyond string/size constant updates needed for consistency.

## Risks / Trade-offs

- [Existing decks look wrong until reflowed] → Accepted; called out as BREAKING; no compatibility shim.
- [PPTX library weight] → Prefer a focused dependency; document in package.json; unit-test stitch with a tiny fixture PNG set (no Chrome required for stitch tests).
- [Main specs vs stale mentions of 1710 in prose decks] → Update contract/docs in this change; content slides that demo the old size get string updates where they assert the number.

## Migration Plan

Replace 1710×1107 constants and docs in one change. Authors re-export and adjust layouts. Rollback: revert the change; old PNGs under `dist/` are harmless artifacts.
