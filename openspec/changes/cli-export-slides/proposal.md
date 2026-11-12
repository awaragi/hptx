# Proposal

## Why

Authors and agents need a repeatable CLI way to capture every slide (and each in-slide step) as design-canvas PNGs—and optionally package those frames or the print layout as PDF—for automated visual evaluation. Manual Playwright MCP shots do not scale to a full deck.

## What Changes

- Add `npx hptx export` that assembles a deck (same rules as build, including required `output`), drives system Chrome via `playwright-core`, and writes artifacts under `dist/` named after the HTML output stem.
- Support exactly one `--format` per run: `png` (per slide/step PNGs), `png-pdf` (those PNGs plus a concatenated raster PDF), or `pdf` (print-mode PDF).
- Capture every visible slide and each content-slide step as zero-padded-index-prefixed PNGs (`<ii>-<slideKey>-<stepId>.png`, or `<ii>-<slideKey>.png` with no steps; agenda is index `0`). Appearance via `--theme light|dark` (default `light`).
- Use installed Google Chrome only (no bundled Chromium); fail with a clear message when Chrome or Playwright cannot launch.
- Extend the `hptx` root CLI surface to list `export` alongside `build` / `dev` / `new`.

## Capabilities

### New Capabilities

- `deck-export`: CLI export of assembled decks to PNG frames, PNG-concat PDF, and print PDF using system Chrome.

### Modified Capabilities

- `platform-cli`: Add the `export` subcommand to the `hptx` binary and keep `npm run` wrappers equivalent where applicable.

## Impact

- Platform tooling only (no deck content migration). Existing decks work if they already have `output` (required for build today).
- New optional dependency: `playwright-core` (no browser download). PDF stitching may need a small library for `png-pdf`.
- New CLI module(s) under `src/cli/`; docs (`README`, `CLAUDE.md`) describe export and the Chrome prerequisite.
- Agent visual QA via Playwright MCP remains separate; this change authorizes a project-local `playwright-core` for CLI export only.
