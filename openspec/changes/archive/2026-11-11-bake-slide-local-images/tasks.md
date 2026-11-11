# Tasks

## 1. Bake module and unit tests

- [x] 1.1 Add `src/assemble/bakeLocalImages.ts` that discovers local relative `<img src>` / `<source src>` and CSS `url(...)`, resolves against the HTML file directory, content-hashes, builds a registry of `data:` URIs, rewrites markup/CSS, and returns absolute image paths; verify with Vitest for resolve, dedupe, rewrite, skip of `https:`/`data:`, and missing-file failure
- [x] 1.2 Wire the bake pass into `assembleFromPlan` (mutate parsed slides/cover before `assembleHtml`) and export types/paths needed by assemble and dev; verify an integration assemble test bakes a fixture image into output HTML

## 2. Shell injection and applicator

- [x] 2.1 Add a template placeholder for the assets registry + early sync applicator script; have `assembleHtml` emit the JSON registry and script that sets `--asset-*` and fills `[data-asset]` `src`; verify Vitest that one registry entry serves both a CSS `var(--asset-…)` and an `img[data-asset]`, and that empty registry omits or emits empty safely
- [x] 2.2 Ensure the applicator runs from `<head>` before slide markup (template order); verify the assembled HTML places the assets block before `<!-- DECK_SLIDES -->`

## 3. Dev watch and docs

- [x] 3.1 Extend `runDev` so discovered baked image absolute paths trigger full reload; verify with a focused test or a documented manual check that saving a watched image path is included in the watcher set after assemble
- [x] 3.2 Document slide/cover-relative local images and bake behavior in `SLIDE-CONTRACT.md` (and align `CLAUDE.md` if needed); verify the new scenario text from the slide-contract delta is covered

## Workflow follow-up

- Archive the change after review with `/opsx-archive`.
