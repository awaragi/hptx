# Proposal

## Why

Browser prefs (theme, Settings override, hidden slides, clicker mode, remember-step, agenda visibility, speak-timer mode) are stored under flat origin-wide keys, so every deck on the same origin shares them and open tabs do not re-apply changes until reload. The platform also hard-defaults the document title to `Presentation` and names export artifacts from the HTML output stem, so title, console, HTML, and export disagree. We need one resolved deck title, slug-based identity for export and storage, and live cross-tab preference sync.

## What Changes

- **BREAKING**: Effective deck title is always resolved (CLI `--title` → `deck.json` `title` → output filename stem → working-root basename). The hard default `Presentation` is removed. Explicit `title` values are trimmed; empty-after-trim and titles that slugify to empty are rejected.
- **BREAKING**: Export presentation name / artifact folders use a filesystem slug of the resolved title, not the raw HTML output stem.
- **BREAKING**: Shell browser prefs use slug-scoped keys (`hptx/<slug>/…`). Flat legacy keys (`hptx-theme`, etc.) are ignored with no migration.
- Settings → Reset clears only this deck slug’s preference keys.
- Other same-origin tabs for the same slug re-apply preference changes via the `storage` event using the existing setters (full side effects).
- Effective configuration console output continues to show `title`, now always the resolved value.
- Assembled HTML `<title>` and top-bar deck title use the resolved title; the shell bakes the slug for runtime storage scoping.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `deck-config`: Replace the `Presentation` title default with the resolution cascade, trim/reject rules, and slug derivation used as the presentation id.
- `deck-export`: Presentation name and artifact paths use the title slug (export still requires `output` for the HTML path and artifact parent directory).
- `deck-shell`: Scope browser prefs by title slug; Reset is per-slug; cross-tab `storage` re-applies prefs with full setter behavior; bake slug into the assembled page.
- `speak-timer`: Persist speak-timer mode under the slug-scoped store key (same behavior, new key shape).

## Impact

- Platform change (config merge, assemble bake-in, export path helpers, `shell/template.html` `deckStore` / Settings / `storage` listener).
- Docs (`README.md`, `CLAUDE.md`, slide contract notes) that mention origin-wide localStorage or `Presentation` / output-stem naming.
- Vitest coverage for title resolution, slugify, export paths, scoped keys, Reset, and cross-tab apply.
- No production migration: legacy flat keys are left untouched and unused.
