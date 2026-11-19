# Tasks

## 1. Notes toolbar clicker switch

- [x] 1.1 Add the notes clicker switch (markup, CSS parallel to the timer toggle, change → `clicker` action) in `shell/template.html` after the speak-timer switch, using the home clicker icon, and wire `notesAction` + `setClickerMode` sync so the checkbox tracks deck state — verify by opening notes in a local deck that the switch appears and flipping it updates `Deck.clickerMode()` / home Settings
- [x] 1.2 Extend `src/assemble/__tests__/speakerNotes.test.ts` (or related suite) to cover notes→deck and deck→notes clicker sync and persistence, and verify with `npm test` (or the focused Vitest file)

## Workflow follow-up

- Archive the change after review (`/opsx-archive` or equivalent).
