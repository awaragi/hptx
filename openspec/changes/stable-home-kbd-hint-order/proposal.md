# Proposal

## Why

Toggling clicker mode currently swaps the two arrow rows on the home minimal shortcut list via CSS `order`, so the list jumps visually even though the keys stay the same. Presenters expect clicker mode to update the descriptions only, not reshuffle the list.

## What Changes

- Keep the home page minimal keyboard-hint rows in one fixed order in both normal and clicker mode.
- Continue rewriting `←`/`→` and `↑`/`↓` descriptions when clicker mode is on (behavior unchanged aside from order).
- No change to nav-drawer hint strip, Settings → Help catalog, or clicker key handling.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `deck-shell`: Home keyboard hints MUST keep a stable row order when clicker mode is toggled; only the row copy may change.

## Impact

- Platform (shell chrome in `shell/template.html`); no deck-author API or `deck.json` migration.
- Existing assembled decks pick this up on next build/dev; no content migration.
- Likely a small Vitest assertion update for home hint order if markup is reordered.
