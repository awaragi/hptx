# Proposal

## Why

Presenters have no place to keep talking points next to their slides; they rely on separate documents or memory. Decks are often shown on an extended second screen, so a presenter-only window with the current slide's notes, kept in sync with the deck, is the missing piece.

## What Changes

This is a **platform** change (slide contract and shell runtime). No deck content changes are required; decks without notes behave exactly as before.

- Slide authors write speaker notes in the slide body as one or more `<aside class="notes">` elements (basic HTML formatting and inline `style` attributes). The shell hides them on the canvas; assemble keeps them as written.
- `N` opens a separate notes window (a blank popup the deck writes into, not a second copy of the deck), brings it to the front when open, or reconnects to it after the deck window reloads. `⇧N` closes it.
- The notes window shows the current slide's title, its position, the step position, and its notes (or a "No notes" placeholder, including on the home page). It redraws on every slide and step change and follows the deck's theme and light/dark mode. Notes styling is owned by the shell.
- Every keyboard shortcut pressed in the notes window acts on the deck window (navigation, `H`, `M`, `C`, `T`, …); the notes window has no shortcuts of its own. `F` from the notes window is not required to work.
- The notes window has a toolbar: previous / next slide, previous / next step, light/dark theme, and full screen for the notes window itself, plus the slide and step position.
- The home page keyboard hints list `N`.
- Out of scope: notes for individual steps (the notes are drawn from the slide key and current step so step notes can be added later), next-slide preview, timers, and printing notes.

## Capabilities

### New Capabilities
- `speaker-notes`: Authoring notes in slides and the synced presenter notes window (opening, closing, reconnecting, content, theme, toolbar, and key forwarding).

### Modified Capabilities
- `deck-shell`: Shell chrome behavior lists the `N` / `⇧N` shortcuts and the home page hints mention notes.
- `slide-contract`: The authoring rules document describes how to write speaker notes.

## Impact

- `shell/template.html`: notes window controller, named keydown handler shared with the notes window, notes refresh on navigation and theme changes, CSS hiding `aside.notes` on the canvas, home page hint.
- `shell/contract/SLIDE-CONTRACT.md`, `CLAUDE.md`, `README.md`: document notes authoring and the `N` shortcut.
- `templates/blank.html`: example notes aside so new slides show the pattern.
- Tests: jsdom tests for notes rendering, sync, and key forwarding.
- Migration: none. Existing decks are unaffected; an `<aside class="notes">` already present in a slide becomes hidden on the canvas.
