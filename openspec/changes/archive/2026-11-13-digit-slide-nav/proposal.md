# Proposal

## Why

Presenters often need to jump to a known slide number mid-talk without opening the agenda drawer. Digit-buffer navigation (type a number, pause or confirm) is a familiar presentation pattern and matches the slide counter / `?slide=N` numbering the shell already exposes.

## What Changes

- Add shell-owned digit shortcuts: type digits to jump to a slide by its **visible counter number** (`0` = home, `1…N` = visible content slides; hidden slides skipped).
- Buffer digits with idle commit (`DIGIT_NAV_COMMIT_MS`, 2000ms), Enter to confirm early, Esc/non-digit to cancel; early commit when the buffer is complete (pad width) or only one candidate remains.
- While buffering, highlight matching nav-dot circles (prefix match on display number and zero-padded form); clear highlight on jump or cancel.
- Leading zeros allowed for faster entry when fewer than 100 content slides (pad width 2; 100+ uses three digits).
- Document the shortcut on the home keyboard hints.
- Digits are shell chrome only (same guardrails as other shortcuts: ignore typing targets, Settings, modal, nav drawer). Slide `onKey` does not own digit jump.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `deck-shell`: Add digit-buffer slide navigation, nav-dot prefix preview, commit/cancel rules, and a home keyboard hint for the feature.

## Impact

- Platform (shell runtime): `shell/template.html` keydown handling, nav-dot styling/classes, home hints.
- Tests under `src/assemble/__tests__/` for keyboard digit jump behavior (assembled HTML).
- No deck.json / API / migration impact on existing decks; no new color tokens.
