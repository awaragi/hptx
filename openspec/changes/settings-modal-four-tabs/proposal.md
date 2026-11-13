# Proposal

## Why

Settings spreads one theming workflow across three tabs (Theme, Generate theme, Instructions) and labels clicker prefs as Navigation, which makes the modal harder to scan. We want the same capabilities with clearer information architecture.

## What Changes

- Collapse Apply theme, Generate theme, and bake Instructions into a single **Theme** tab (stacked sections; no nested tabs).
- Keep **Slides** and **Reset** as their own tabs.
- Rename **Navigation** to **Playback** (same clicker-mode and remember-step controls).
- Retarget `deck-shell` (and README) path language from `Settings → Generate theme` / `Instructions` / `Navigation` to the new tab/section paths.
- No new prefs, APIs, or theme-layer behavior; no change to what each control does.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `deck-shell`: Settings modal tab IA — four tabs (Theme, Slides, Playback, Reset); theme helpers are sections under Theme; Navigation renamed to Playback; scenario paths updated accordingly.

## Impact

- Platform (shell): `shell/template.html` markup, styles, and tab-switch JS; assembled fixtures rebuild with the shell.
- Specs/docs: `openspec/specs/deck-shell/spec.md` paths; README Settings references.
- Existing decks: no migration; rebuilt or re-served decks pick up the new Settings chrome automatically.
