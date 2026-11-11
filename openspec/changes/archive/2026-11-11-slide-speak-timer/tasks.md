# Tasks

## 1. Chrome, persistence, and keys

- [x] 1.1 Add home speak-timer switch beside the theme toggle, wire `hptx-timer` through `deckStore` (include in `DECK_LS_KEYS` / Reset), and implement `S` toggle + `⇧S` reset per design; verify with Vitest that mode persists, `S` off clears visuals, and Reset clears the key
- [x] 1.2 Add home keyboard hint for `S` and document speak-timer in `SLIDE-CONTRACT.md`, `README.md`, and `CLAUDE.md`; verify docs mention switch, `S` / `⇧S`, storage key, and flash behavior

## 2. Clock, canvas, and notes

- [x] 2.1 Implement per-slide countdown/count-up on navigation while mode is on (home clears), start-envelope enable flash, end-envelope flashes at 60s/30s, locked border + `+` overtime, and no border for untimed slides; verify threshold and overtime behavior in Vitest with a stubbed clock
- [x] 2.2 Add notes toolbar timer switch + live readout / mode indicator synced from the deck; verify notes show remaining, `+` overtime, elapsed for untimed, and hide when mode off or on home

## 3. Integration

- [x] 3.1 Run `npm test` and confirm speaker-notes / shell-related suites pass
