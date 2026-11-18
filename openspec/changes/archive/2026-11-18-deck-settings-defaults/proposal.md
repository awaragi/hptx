# Proposal

## Why

Decks can bake a CSS `theme` but cannot ship playback defaults (clicker mode, remember-step, speak-timer, light/dark appearance). Authors want those defaults in `deck.json` and on the CLI, with the same cascade pattern as other deck fields, while presenters can still override in the browser.

## What Changes

- Add an optional `settings` object to `deck.json` for playback defaults: `clicker`, `rememberStep`, `timer`, `appearance` (`light` | `dark`).
- Merge settings as **platform defaults → deck.json → CLI**; bake the effective object into the assembled HTML.
- Add the same CLI flags on **dev, build, and export**: `--settings.<key> <value>` with literals `true`/`false` or `light`/`dark` (same key names and values as JSON).
- **BREAKING:** Rename light/dark preference away from overloaded “theme”: localStorage key becomes `appearance` (values `light`/`dark`); export drops `--theme light|dark` in favor of `--settings.appearance`. CSS bake stays `deck.json` `theme` / `--theme` (path or https URL) on build/dev.
- **BREAKING:** Boolean prefs in localStorage use `'true'` / `'false'` (not `'1'` / `'0'`); LS key suffixes align with settings keys (`clicker`, `rememberStep`, `timer`). Legacy `'1'`/`'0'` and old key names are ignored (no migration).
- Runtime cascade: **baked settings → localStorage override**. Reset clears this slug’s prefs and restores baked defaults (not hardcoded platform-only defaults).
- Keep `data-theme` on `<html>` for CSS; keep CSS theme file bake separate from `appearance`.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `deck-config`: Recognize and validate `settings`; cascade with CLI; reject unknown settings keys / bad values.
- `deck-shell`: Bake/read defaults; localStorage literals and keys; Reset restores baked defaults; appearance naming.
- `deck-build`: Shared `--settings.*` CLI; bake effective settings; print them in effective config.
- `deck-dev`: Same settings CLI and bake as build (preview).
- `deck-export`: Replace `--theme light|dark` with `--settings.appearance`; accept the same `--settings.*` set; capture uses effective appearance.

## Impact

- Platform (engine/tooling): `loadDeckConfig`, assemble HTML bake, `shell/template.html` prefs, `args` / `exportArgs`, docs/README, Vitest for config + home/prefs + export args.
- Existing decks: optional `settings`; no required deck.json edits. Presenters lose old LS keys/values (Reset or re-toggle). Export scripts using `--theme light|dark` must switch to `--settings.appearance`.
- CSS theme files and `html[data-theme="dark"]` selectors unchanged.
