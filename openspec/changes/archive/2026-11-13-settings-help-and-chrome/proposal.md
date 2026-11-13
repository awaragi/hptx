# Proposal

## Why

The home keyboard-hint list and nav-drawer footer have grown into long catalogs that crowd the overview. Presenters need a bare navigation surface plus one place for the full shortcut reference, and the home chrome should expose clicker mode the same way it already exposes theme and speak-timer.

## What Changes

- **BREAKING**: Remove the letter-`H` shortcut that returned to the home page. Home remains reachable with digit jump `0` (and the physical `Home` key as an undocumented browser-style shortcut). Do not document `Home` / `End` in Help.
- Shrink home keyboard hints and the nav-drawer hint strip to arrows plus `?` (open help).
- Add a **Help** tab to Settings with a full, scrollable catalog of deck chrome shortcuts. Pressing `?` opens Settings on that tab; `C` / the gear still open Settings (default Theme).
- Extend **Playback** with light/dark appearance and speak-timer toggles that stay in sync with `T` / `S` and the home chrome switches.
- Add a **clicker mode** toggle on the home chrome next to theme, timer, and gear (home-only visibility like theme/timer), in sync with Playback and the existing preference.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `deck-shell`: Bare home/drawer hints; `?` → Settings → Help; remove `H`; Settings tabs include Help; Playback gains light/dark and speak-timer; home chrome gains clicker toggle; chrome behavior and digit-nav hint requirements update.
- `speak-timer`: Speak-timer mode also controllable from Settings → Playback (same preference as `S` / home timer switch).
- `speaker-notes`: Notes-window key forwarding no longer includes `H` (include `?` for Help instead).

## Impact

- Platform (shell runtime): `shell/template.html` markup, CSS, keydown handling, Settings tabs/panels, home chrome.
- Specs: `deck-shell`, `speak-timer`, `speaker-notes`.
- Tests under `src/assemble/__tests__/` for hints, `?` → Help, removal of `H`, Playback/chrome toggles.
- No deck.json schema change; existing decks pick up behavior on next assemble/dev. Presenters who relied on `H` for home must use `0` (or `Home`).
