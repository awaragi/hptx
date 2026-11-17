# Design

## Context

See proposal.md — Why. Today `emitAssetsHtml` in `src/assemble/bakeLocalImages.ts` emits `#deck-assets` plus an IIFE that sets `--asset-*` and runs `applyImgs()` once via `document.querySelectorAll('img[data-asset], source[data-asset]')`. That misses inert `<template>` fragments. Bake rewrite already finds imgs inside template markup (string regex); only runtime hydration is wrong. Slide scripts use `__deckSlideDocument`, so `document.getElementById('deck-assets')` does not see the head registry.

## Goals / Non-Goals

**Goals:**

- Hydrate template (and nested template) `img`/`source[data-asset]` at the same boot pass as live nodes.
- Expose one page-level helper for post-boot inserts.
- Document the helper briefly in `README.md` under Writing slides.
- Keep a single registry payload (no static CSS duplication of base64).

**Non-Goals:**

- MutationObserver / automatic apply on every DOM mutation.
- Changing bake rewrite format or putting data URIs into markup `src` at assemble time.
- Requiring authors to use `window.document` to read `#deck-assets`.
- Wiring the helper onto `Deck` (early script runs before `Deck` exists; `__deck*` matches existing shell internals).

## Decisions

1. **Single `apply(root)` used for boot and the public helper**  
   Walk live `img`/`source[data-asset]` under `root`, then every `template` under `root`, applying the same walk to `template.content` (covers nesting). Boot calls `apply(document)` on `DOMContentLoaded` (or immediately if `body` exists). `window.__deckApplyAssets = apply`.  
   *Alternatives considered:* expose only the raw registry dict (more author boilerplate); MutationObserver (heavier, surprising).

2. **Keep `__deckApplyAssets` naming**  
   Matches `__deckSlideDocument` / `__deckSlideQueue`. Documented in README so it is a supported escape hatch, not an undocumented leak.

3. **Docs in README.md**  
   Short note under Writing slides: templates are hydrated at boot; call `__deckApplyAssets(root)` only for markup created after boot without going through a hydrated template. Optional cross-link in SLIDE-CONTRACT is out of this change unless tasks need it.

4. **Tests via JSDOM**  
   Existing assemble tests already use JSDOM elsewhere. Emit applicator HTML into a document with a template + registry, run scripts, assert `template.content` img `src` and that `__deckApplyAssets` fills a late-inserted node. String-contains checks on `emitAssetsHtml` remain as smoke.

## Risks / Trade-offs

- **[Risk]** Nested templates missed if only `document.querySelectorAll('template')` without recursing into `template.content` → Mitigation: recursive walk as in Decision 1.
- **[Risk]** Authors still forget the helper for pure `createElement` paths → Mitigation: documented; template path needs no call.
- **[Trade-off]** Helper is a third `window.__deck*` surface vs `Deck.applyAssets` → Acceptable; early head script cannot attach to `Deck` yet.

## Migration Plan

No deck migration. Rebuild to pick up the new applicator. Existing live `img[data-asset]` behavior unchanged. Template-based panels start working after rebuild.

## Open Questions

None.
