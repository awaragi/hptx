# Tasks

## 1. Hints and remove H

- [x] 1.1 Shrink home `.title-kbd-hints` to arrow rows (`data-kbd-nav`) plus a `?` help row; remove M/⇧M/H/digits/F/N/S/T/C hint rows — verify assembled home hints match that set in a Vitest
- [x] 1.2 Shrink `.nav-drawer-hint` to arrows + `?` only — verify drawer hint text in the same or adjacent test
- [x] 1.3 Remove the letter-`H` keydown handler; keep digit `0` and physical `Home` — verify `H` does not go home and `0` still does (`digitSlideNav` / keyboard test)

## 2. Settings Help tab and `?`

- [x] 2.1 Add Help tab + scrollable shortcut catalog panel (all deck chrome shortcuts; omit `Home`/`End`); update tab order to Theme · Slides · Playback · Help · Reset — verify Settings tab list and Help content in Vitest
- [x] 2.2 Wire `?` to open Settings on Help (or switch to Help if already open); extend `openThemeCustomizer` for optional tab — verify `?` lands on Help and `C` still defaults to Theme
- [x] 2.3 Forward `?` from the notes window like other chrome keys; assert notes `H` no longer homes — update `speakerNotes` tests

## 3. Playback and home chrome toggles

- [x] 3.1 Add light/dark and speak-timer controls to Settings → Playback, synced with existing theme/timer setters — verify Playback toggles mirror `T`/`S` and home switches
- [x] 3.2 Add home chrome clicker-mode toggle beside theme/timer (home-only), synced with Playback clicker — verify toggle persistence and visibility on home vs content slide

## 4. Integration

- [x] 4.1 Run the affected Vitest files (`homePage`, `digitSlideNav`, `speakerNotes`, `speakTimer`, plus new/updated settings tests) and fix regressions — verify `npm test` passes for those suites
