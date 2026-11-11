# Proposal

## Why

Authors need real images (photos, diagrams, logos) next to their slides, but the platform only ships a single HTML file that must open via `file://`. Relative image links do not survive that model today: nothing copies or rewrites them, and the same file used on several slides would be duplicated if naively inlined.

## What Changes

This is a **platform** change (assemble + shell injection). No existing deck content is required to change; decks without local images behave as before.

- Assemble scans each slide and the cover for local relative image references in markup (`<img src>`, `<source src>`) and in harvested CSS (`url(...)`).
- Paths resolve **relative to that HTML file** (not `deck.json`, cwd, or the framework).
- Matching files are read, content-hashed, and stored once in a shared JSON registry of `data:` URIs in the assembled output.
- Markup is rewritten to `data-asset="<id>"` (local `src` removed); CSS `url(...)` becomes `var(--asset-<id>)`.
- A synchronous early `<head>` script applies CSS custom properties from the registry and fills `img`/`source` `src` from the same map — one base64 copy for both CSS and JS.
- Missing or unreadable local files fail assemble with the slide/cover path and reference.
- `https:`, `data:`, and other non-relative references are left unchanged. CDN `scripts`/`styles` stay network-loaded.
- Out of scope: folder/zip/MHTML packages, deck-root asset bases, baking remote images, author-facing embed/fill switches, scanning inline `style=""` attributes or SVG `<image href>` (unless added later).

## Capabilities

### New Capabilities
- `slide-local-images`: Discover, dedupe, bake, and apply slide/cover-relative local images into the single-file assemble output via a shared registry.

### Modified Capabilities
- `html-slides`: Local relative image references in slide/cover markup and CSS are rewritten during assemble (not left as filesystem paths in the output).
- `deck-build`: Single-file output includes the baked image registry and applicator; `file://` still works for those images.
- `deck-dev`: Preview uses the same bake pipeline; discovered image files participate in reload watching.
- `slide-contract`: Authoring rules document slide-relative local images and the bake behavior.

## Impact

- `src/assemble/`: new bake/registry pass wired from `assembleFromPlan` / `assembleHtml`; Vitest coverage for resolve, dedupe, rewrite, failures.
- Shell output injection: `#deck-assets` JSON + early sync script (template marker or assemble insert).
- `shell/contract/SLIDE-CONTRACT.md`, `CLAUDE.md`, and README notes as needed for authoring.
- Dev watcher may watch discovered image paths under the deck.
- Migration: none for decks without local images. Decks that already used relative `<img src>` / `url(...)` expecting a static server will start getting baked assets instead (behavior becomes correct for single-file / `file://`).
