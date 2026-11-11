# Design

## Context

Assemble already parses each slide/cover into styles + body markup, scopes CSS, and emits one HTML string for build and dev (`assembleFromPlan` → `assembleHtml`). Relative filesystem images are not processed. Dev serves a virtual index from the repo Vite root, so even preview would not reliably resolve slide-relative paths without baking. See proposal.md for motivation; specs under `slide-local-images` for behavior.

## Goals / Non-Goals

**Goals:**
- One assemble pass that discovers, hashes, rewrites, and injects a shared registry + early applicator.
- Dev and build share that pass; image file changes reload preview.
- Keep shell runtime dependency-free (vanilla sync script only).

**Non-Goals:**
- Package/folder/MHTML output modes.
- Scanning inline `style=""` or SVG `<image href>` in this change.
- Changing CDN script/style inlining rules.
- New `deck.json` asset fields or author toggles.

## Decisions

1. **Where the pass runs**  
   After `parseSlideDocument` / cover parse and before or inside `assembleHtml`, mutate the in-memory harvested `styles` and `body` (and track absolute image paths for the watcher). Prefer a dedicated module (e.g. `bakeLocalImages.ts`) called from `assembleFromPlan` so `assembleHtml` stays mostly presentation assembly.  
   *Alternative:* only inside `assembleHtml` — rejected because image I/O and hashing fit better next to file reads already in `assembleFromPlan`.

2. **Path resolution**  
   `path.resolve(path.dirname(htmlFileAbs), ref)` for every local candidate. No deck-root alias.

3. **What counts as local**  
   Relative URL path with no scheme (and not `//…`). Skip empty, `data:`, `https:`, `http:`, `file:`, absolute `/…`. CSS `url()` may be quoted; strip quotes and optional whitespace.

4. **Identity**  
   SHA-256 (or truncated hex) of file bytes → registry id. MIME from extension (png/jpeg/gif/webp/svg+xml); fail or treat as `application/octet-stream` only if needed — prefer fail on unknown extension to avoid bad `data:` types.

5. **Single payload**  
   Emit `<script type="application/json" id="deck-assets">` plus an immediate classic script that `JSON.parse`s it, sets `--asset-<id>` on `document.documentElement`, and fills `[data-asset]` on `img`/`source`. Insert via a shell template marker (same pattern as theme/CDN placeholders) so placement stays in `<head>` before body content.  
   *Alternative:* duplicate data URIs into static CSS — rejected (locked design).

6. **CSS custom property names**  
   `--asset-<id>` where `<id>` is hex-safe. Values are `url("data:…")` with quotes escaped as needed for CSS strings.

7. **Dev watching**  
   `runDev` already watches slide HTML, deck JSON, theme. Extend with absolute paths returned from the bake pass (recomputed each assemble/request or retained on last plan). Full reload on change matches existing behavior.

8. **Docs**  
   Update `SLIDE-CONTRACT.md` (required by spec); brief pointers in `CLAUDE.md` / README only if needed to avoid contradiction.

## Risks / Trade-offs

- **[Large decks / big photos]** → HTML size grows; mitigation: content hash dedupe; optional size warning later (not in this change).
- **[FOUC if script late]** → mitigation: sync script in `<head>` via template marker before slides.
- **[CSS url in strings / data URIs]** → careful `url()` parser; skip `data:` and non-relative.
- **[Svg as image vs inline SVG]** → only file references via `url()`/`src`; inline `<svg>` unchanged.

## Migration Plan

No migration. Decks without local images unchanged. Decks that previously relied on a static server for relative images get baked behavior automatically (desired for single-file).

## Open Questions

None deferrable; locked design answers path base, registry shape, and dual CSS/JS consumption.
