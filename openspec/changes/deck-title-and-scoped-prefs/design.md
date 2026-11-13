# Design

## Context

See proposal.md for motivation. Today `mergeEffective` hard-defaults `title` to `Presentation`, export names artifacts from `path.parse(output).name`, and `shell/template.html` uses flat `DECK_LS_KEYS` (`hptx-theme`, …) with no `storage` listener. Assemble already injects title into `<title>` / `.deck-title` and prints `title` via `printEffectiveConfig`.

## Goals / Non-Goals

**Goals:**
- One resolved title + slug shared by console, HTML, export paths, and runtime preference keys
- Slug-scoped `deckStore` + cross-tab `storage` re-apply via existing setters
- TypeScript helpers for resolve/slugify; shell stays dependency-free

**Non-Goals:**
- Migrating or deleting legacy flat `hptx-*` keys
- A separate `/name` reverse-lookup key (slug is the id)
- Syncing URL/slide/step, notes window, or in-memory store fallback across tabs
- Per-device or cross-origin sync
- Quiet remote apply (full setter side effects are intentional)

## Decisions

### 1. Title resolution lives in assemble/config merge
Resolve after effective `output` and `root` are known: CLI title → file title → output stem → `path.basename(root)`. Trim explicit titles; reject empty-after-trim. Expose `title` and `slug` on the resolved deck / assemble plan so CLI print, assemble bake-in, and export share one value.

**Alternatives:** Resolve only in the shell from DOM — rejected; export and console need it before HTML exists.

### 2. Shared slugify in TypeScript; bake slug into HTML
Implement `slugifyTitle(title)` once (lowercase, strip to `[a-z0-9]+` segments joined by `-`, collapse repeats). Reject empty slug at config time. Assemble embeds the slug in a small bootstrap binding the shell can read (e.g. `data-deck-slug` on `<html>` or a `var DECK_SLUG = "…"` next to existing boot). Shell prefixes keys as `hptx/` + slug + `/` + suffix (`theme`, `custom-theme-css`, `hidden-slides`, `clicker-mode`, `remember-slide-step`, `show-agenda`, `timer`).

**Alternatives:** Hash id — rejected (user chose slug). Duplicate slugify in shell JS — avoid drift; bake the final slug string.

### 3. Export uses slug as presentation name
`exportArtifactPaths` takes the resolved slug (or title then slugify) instead of `presentationNameFromOutput`. Parent directory remains `dirname(output)`.

### 4. Cross-tab sync = `window` `storage` + suffix map
Filter `event.key` by this deck’s prefix. Map suffix → existing setter with normal persist behavior for local writes; on remote events call setters with `{ persist: false }` where applicable so values are not rewritten. Full side effects (including speak-timer flash). Ignore unknown keys and legacy flat keys.

### 5. Reset = this slug only
`eraseAllDeckStoredData` removes only prefixed keys for the baked slug (enumerate known suffixes; do not wipe other `hptx/<other>/…` decks).

### 6. No migration
Do not read or copy flat keys. Tests that seeded `hptx-theme` etc. must use scoped keys.

## Risks / Trade-offs

- [Title collisions share prefs/export folders] → Accepted; document that identity is the title slug.
- [Rename title orphans old slug keys] → Accepted; Reset on the old build or ignore leftovers.
- [file:// / blocked `localStorage`] → In-memory fallback; sync not required.
- [Hiding the current slide mid-view] → Existing behavior (stay on slide); unchanged.
- [Slug algorithm churn] → Keep one shared helper; changing it later is a breaking id change (same as rename).

## Migration Plan

- Not in production: ship scoped keys only; leave legacy keys untouched.
- Rollback: revert change; leftover `hptx/<slug>/…` keys are harmless.

## Open Questions

None — decisions locked in explore (full side effects, ignore legacy, no `/name` key, one package).
