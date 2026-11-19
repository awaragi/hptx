# Proposal

## Why

The speaker notes window already mirrors the deck’s light/dark and speak-timer switches, but not clicker mode. Presenters who drive the deck from notes still have to switch to the main window (or Settings) to flip clicker — the one playback toggle still missing from notes.

## What Changes

- Add a clicker-mode switch to the notes window toolbar beside the existing theme and speak-timer switches.
- Keep it in sync with the home clicker toggle, Settings → Playback, and the persisted clicker preference (same as today’s clicker behavior).
- No change to clicker navigation semantics, keyboard shortcuts, or deck authoring.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `speaker-notes`: Notes toolbar gains a clicker-mode switch that mirrors the deck’s clicker preference.

## Impact

- **Platform** (shell runtime): `shell/template.html` notes document HTML/CSS and host sync (`setClickerMode` / notes actions).
- Tests: extend speaker-notes (or related) Vitest coverage for the notes clicker control and sync.
- No migration for existing decks; no `deck.json` / CLI / assemble API changes.
