# Proposal

## Why

Presenters often need to walk through a small multi-file codebase on stage. The template library has charts, steppers, and grids, but nothing that shows a file tree beside scrollable, syntax-highlighted snippets. Adding that starter closes the gap without new engine work.

## What Changes

- Add a `codeTree` slide template: left file tree, right scrollable code pane, CDN syntax highlighting, sample snippets drawn from this project (HTML, JavaScript, and a few other languages).
- Register it in `templates/catalog.json` and `templates/deck.json` (including required CDN `scripts` / `styles`).
- Update the starter-templates requirement so the library list includes `codeTree` (and existing `photoStrip`, already shipped).
- Extend template-library tests / catalog sync expectations for the new key and CDN deps.

This is **deck content** (template library), not a platform engine change. No migration for existing author decks; they opt in via `npx hptx new slide --from codeTree`.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `slide-templates`: Expand the starter template set with `codeTree` (file tree + highlighted multi-language snippets) and document `photoStrip` which is already in the library.

## Impact

- Files: `templates/codeTree.html`, `templates/catalog.json`, `templates/deck.json`, `src/assemble/__tests__/templates.test.ts` (and any docs that list templates).
- Dependencies: public CDN only (highlight.js script + theme stylesheet), declared like `d3Chart`.
- No shell/assemble API changes; `new slide` already merges catalog CDN entries into a deck’s `deck.json`.
