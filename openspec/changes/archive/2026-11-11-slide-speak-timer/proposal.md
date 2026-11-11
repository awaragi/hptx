# Proposal

## Why

Presenters already author per-slide `estimatedMinutes`, but notes only show a static label. During a live talk they need an optional, session-friendly countdown with subtle audience cues and a clear presenter readout — without a noisy always-on clock.

## What Changes

- Add a persisted speak-timer mode (`deckStore` key `hptx-timer`), toggled by a switch next to the theme control (deck home + notes toolbar) and by `S`.
- When mode is on, entering a content slide starts/restarts that slide’s clock: countdown from `estimatedMinutes` when present; otherwise count up as `+m:ss` with no canvas border.
- Notes window shows mode indicator and live remaining / elapsed / `+` overtime.
- Canvas cues: 1px ~50% transparent border. Enable flash uses fade-in → snap-off. At 60s left: one end-envelope flash; at 30s: two; at 0: lock border on and show `+` overtime. No border for untimed slides.
- `S` while mode is on turns mode off (reset + hide visuals). `⇧S` mid-run resets the current slide’s timer without turning mode off.
- Home page: no active clock; clear border. Reset browser data clears `hptx-timer` with other deck prefs.
- Document keys/controls in contract and home hints.

## Capabilities

### New Capabilities

- `speak-timer`: Persisted speak-timer mode, per-slide countdown/count-up, keyboard/switch controls, canvas flash envelopes, and overtime behavior.

### Modified Capabilities

- `speaker-notes`: Notes window shows timer mode indicator and live remaining/elapsed/`+` overtime when mode is on; mirrors the timer switch beside theme.
- `deck-shell`: Chrome switch beside theme, `S` / `⇧S` shortcuts, home hint, and `hptx-timer` in browser reset.

## Impact

- **Platform** (shell runtime + docs/tests). Builds on existing `estimatedMinutes`.
- `shell/template.html` (timer engine, chrome, notes), contract/docs/README/CLAUDE, Vitest (notes/jsdom).
- Migration: none required; mode defaults off. No new color tokens (use existing `--danger-rgb` / theme tokens at ~50% alpha).
