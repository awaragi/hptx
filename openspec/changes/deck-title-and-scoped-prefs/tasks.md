# Tasks

## 1. Title resolution and slug

- [x] 1.1 Add shared `slugifyTitle` (and unit tests for spaced titles, empty/reject cases) under assemble/CLI helpers
- [x] 1.2 Resolve effective title in config merge: CLI → file → output stem → cwd basename; trim; reject empty-after-trim and empty slug; expose resolved `title` + `slug` on the resolved deck/plan; verify with Vitest (including console `printEffectiveConfig` showing resolved title)
- [x] 1.3 Bake resolved title into HTML as today and bake the slug for the shell (e.g. `data-deck-slug`); update assemble tests that expected default `Presentation` to the cascade

## 2. Export presentation name

- [x] 2.1 Change export artifact naming to use the title slug; keep `dirname(output)` as parent; update `exportPaths` tests and any docs that say presentation name is the HTML stem

## 3. Slug-scoped shell prefs and cross-tab sync

- [x] 3.1 Prefix `deckStore` preference keys with `hptx/<slug>/…`; ignore flat legacy keys; Reset clears only this slug’s known suffixes; update assemble shell tests (home page, speak-timer, custom theme) to seed/assert scoped keys
- [x] 3.2 Add a `storage` listener that maps this slug’s key changes to existing setters with full side effects (`persist: false` on remote apply); verify with a Vitest `StorageEvent` (or equivalent) that theme/timer/prefs re-apply in another context
- [x] 3.3 Update README / CLAUDE.md / Settings hint copy that claim origin-wide shared prefs or flat `hptx-timer` / `Presentation` defaults so they match slug-scoped prefs and title cascade

## Workflow follow-up

- Archive the change after review (`/opsx-archive`).
