# Design

## Context

See proposal.md for motivation. The notes window is a blank popup the deck writes into (`notesDocumentHtml` / `NOTES_WINDOW_CSS` in `shell/template.html`). Toolbar switches already exist for theme (`nwThemeCheckbox` → `notesAction('theme')`) and speak-timer (`nwTimerCheckbox` → `notesAction('timer')`). Deck clicker state is owned by `setClickerMode`, which syncs home chrome and Settings but not the notes window today.

## Goals / Non-Goals

**Goals:**
- Mirror the existing timer-switch pattern for clicker in the notes toolbar.
- Keep one source of truth: notes flips call `setClickerMode` / toggle; `setClickerMode` updates the notes checkbox when the window is attached.

**Non-Goals:**
- Changing clicker navigation semantics or keyboard bindings.
- Adding remember-step or other Settings controls to notes.
- New theme tokens or deck-config fields.

## Decisions

1. **Reuse the timer UI pattern** — Same sticky toolbar row: label + icon + checkbox, CSS class parallel to `.nw-timer-toggle` (e.g. `.nw-clicker-toggle`), ids like `nwClickerCheckbox`.  
   *Alternative:* Button that only toggles — rejected; switches match theme/timer and home chrome.

2. **Placement** — After the speak-timer switch, before Full screen (home order: theme → timer → clicker).  
   *Alternative:* Before timer — rejected to keep notes aligned with home.

3. **Host wiring** — Notes `change` handler forwards `clicker` like `theme`/`timer`; `notesAction('clicker')` toggles via existing clicker APIs; `setClickerMode` calls a small sync helper (checkbox + `is-on` class) when `notesWinReady()`.  
   *Alternative:* Separate postMessage protocol — rejected; opener host is already the sync path.

4. **Icon** — Reuse the home clicker remote SVG path so the control is recognizable across windows.

## Risks / Trade-offs

- **[Risk] Notes checkbox desync if `setClickerMode` gains callers that skip sync** → Mitigation: sync only inside `setClickerMode` (and on notes open/`renderNotes` or theme sync path), same as timer.
- **[Trade-off] Toolbar gets denser on narrow notes windows** → Acceptable; existing flex-wrap on `.nw-bar` already wraps.

## Migration Plan

No deck or build migration. Ship with shell template; existing assembled HTML updates on next build/dev assemble. Rollback is revert of the shell + test changes.
