# Tasks

## 1. Full HD canvas (1920×1080)

- [x] 1.1 Update shell canvas/print sizes and `DECK_REF_W/H` in `shell/template.html` (and related comments in `slide-contract.css`) from 1710×1107 to **1920×1080**; verify a quick grep of `shell/` shows no remaining `1710`/`1107` size constants
- [x] 1.2 Update export size constants in `exportCapture.ts` / `exportPdf.ts` (and any tests asserting 1710×1107) to **1920×1080**; verify related Vitest passes
- [x] 1.3 Update `SLIDE-CONTRACT.md`, README, CLAUDE.md, `openspec/config.yaml` context, and template/about copy that states the old canvas size to **1920×1080** (Full HD, 16:9); verify docs mention Full HD / 16:9 and no operator doc still claims 1710×1107

## 2. PPTX export format

- [x] 2.1 Add a PPTX stitch dependency and `stitchPngsToPptx` (or equivalent) that builds a 16:9 full-bleed deck from PNG paths; verify a unit test writes a `.pptx` from fixture PNGs without Chrome
- [x] 2.2 Extend `ExportFormat` / paths / capture wiring for `--format pptx` (same PNG capture as `pdf`, artifact `<pngDir>/<name>.pptx`, progress line optional); verify `exportArgs` and path/capture unit tests cover `pptx` and reject unknown formats
- [x] 2.3 Update export help, README, and CLAUDE.md for `--format png|pdf|print|pptx` including the pptx artifact path; verify `npx hptx export --help` lists `pptx`

## Workflow follow-up

- Archive this change after review so `deck-export` and `slide-contract` main specs pick up the deltas.
