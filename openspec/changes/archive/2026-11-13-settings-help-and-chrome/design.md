# Design

## Context

See proposal.md for motivation. All behavior lives in `shell/template.html`: home `.title-kbd-hints`, `.nav-drawer-hint`, Settings (`#themeCustomizer` + `tcSwitchTab`), home chrome (`.chrome-theme-tools`), and `onDeckKeydown` (also fed from the notes window). Digit jump already maps `0` → home. Physical `Home` / `End` already call `goTo(0)` / last visible slide; they stay as quiet keys and are omitted from Help.

## Goals / Non-Goals

**Goals:**
- One Settings modal owns Help; `?` selects that tab.
- Bare discoverability on home and drawer; full catalog only in Help.
- Playback and home chrome share appearance, timer, and clicker prefs.

**Non-Goals:**
- New preference keys or slug scheme changes.
- Redesigning Settings Theme/Slides/Reset panels beyond adding Playback controls and the Help tab.
- Documenting or removing physical `Home` / `End`.
- A separate help modal outside Settings.

## Decisions

1. **`?` opens Settings → Help; `C` / gear keep default Theme**  
   Extend `openThemeCustomizer` (or a thin wrapper) to accept an optional tab key. `?` calls it with `help`; existing entry points omit the arg and keep Theme. If Settings is already open, `?` only calls `tcSwitchTab('help')`.  
   *Alternatives*: standalone overlay (rejected — second modal family); `H` for help (rejected — user dropped letter `H`).

2. **Remove letter-`H` handler entirely**  
   Delete the `h`/`H` branch in `onDeckKeydown`. Home via digit `0` (and undocumented `Home` key). Update agenda-toggle / shell-owned-home wording accordingly.

3. **Bare hints = `←`/`→`, `↑`/`↓`, and `?` only**  
   Home: keep the two `data-kbd-nav` arrow rows (no Page Up/Down row) plus one `?` help row; remove M/⇧M/H/digits/F/N/S/T/C rows. Clicker mode still rewrites the ←/→ and ↑/↓ descriptions; Page stays documented only in Help. Drawer footer: arrows + `?`. Drawer-local keys still work without footer documentation.

4. **Help panel content**  
   Static HTML (or a small built-in list) grouped Navigate / Present / Chrome, scrollable inside the existing Settings body. Include every deck chrome shortcut (arrows, Page, space, M/⇧M, digits, F, N/⇧N, S/⇧S, T, C, ?, clicker semantics as needed). Exclude `Home` / `End`.

5. **Playback + home chrome sync**  
   Reuse existing setters for theme mode, speak-timer, and clicker. Add Playback checkboxes/switches wired to those setters; add home clicker toggle next to timer (same `#…ToggleWrap` / home-only CSS pattern as theme/timer).

6. **Tab order**  
   Theme · Slides · Playback · Help · Reset — Help before Reset keeps destructive Reset last; Help stays with “reference” after prefs.

## Risks / Trade-offs

- [Muscle memory for `H`→home] → Digit `0` is already specified; mention in Help under digit jump. No migration prompt.
- [Five tabs crowd the Settings header] → Acceptable; Help is a short label.
- [`?` while typing in Settings fields] → Same typing-target guard as other letter shortcuts; when focus is in an input, `?` types normally.
- [Drawer open + `?`] → Close or leave drawer under Settings overlay; prefer opening Settings (existing overlay stacking) without requiring drawer close first if current Settings/`C` behavior already works over the drawer — match `C`.

## Migration Plan

- No deck.json or bake-format change; next `dev`/`build` picks up the shell.
- Presenters: use `0` instead of `H`; use `?` for the shortcut list.
- Tests that assert home hint keys (`N`, `S`, digits, `H`) or notes `H`→home must be updated.

## Open Questions

None.
