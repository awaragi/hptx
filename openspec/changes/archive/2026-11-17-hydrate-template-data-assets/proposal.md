# Proposal

## Why

Baked local images rewritten to `data-asset` never get `src` when they live inside `<template>` (or are inserted after the one-shot applicator). Browsers keep template content inert, so `querySelectorAll` on the live document misses them; cloning that markup later shows broken images. CSS `var(--asset-*)` still works. This is a platform bug; one deck slide already hits it, and any future panel-swap from templates will too.

## What Changes

- Early applicator in `emitAssetsHtml` hydrates `img[data-asset]` / `source[data-asset]` inside every `<template>` (including nested templates) at boot, so `cloneNode` / `innerHTML` copies already carry `src`.
- Expose `window.__deckApplyAssets(root?)` on the real page document for post-boot inserts (`createElement`, string-built markup); optional for template clones after hydration.
- Document the helper and template hydration behavior in `README.md`.
- Extend Vitest coverage for the template case; keep one shared registry (no base64 duplication into static CSS).

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `slide-local-images`: Extend the early-applicator requirement to cover inert `<template>` content and a public re-apply helper for nodes inserted after boot.

## Impact

- **Platform** (assemble / shell runtime), not deck content.
- Primary code: `src/assemble/bakeLocalImages.ts` (`emitAssetsHtml`); tests under `src/assemble/__tests__/`.
- Docs: `README.md` (author-facing note).
- Migration: none required for existing static `<img data-asset>` decks; behavior for live nodes stays the same. Slides that clone templates with baked imgs start working without author changes. Optional helper for dynamic markup.
