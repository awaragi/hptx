# Tasks

## 1. Contract API and docs

- [x] 1.1 Add optional `estimatedMinutes?: number` to `SlideModule` in `shell/contract/slide-contract.d.ts` with a short description (whole minutes for the notes window) and verify `npm test` still passes the contract/Deck declaration checks
- [x] 1.2 Document `estimatedMinutes` in `shell/contract/SLIDE-CONTRACT.md` (speaker notes / registration section) and align any brief mention in `CLAUDE.md` / `README.md` speaker-notes notes; verify the docs state it is optional, whole minutes, shown as a static label in the notes window, and that head `<meta>` remains ignored
- [x] 1.3 Add a commented `estimatedMinutes` example on `registerSlide` in `templates/blank.html` and verify templates tests still pass

## 2. Notes window display

- [x] 2.1 In `shell/template.html`, add notes-window markup/CSS for a static minutes label near the title and wire `renderNotes()` to show `N min` from `mod.estimatedMinutes` (omit for home, missing, or invalid values); verify by extending `src/assemble/__tests__/speakerNotes.test.ts` for present, absent, home, and navigation update cases

## 3. About deck

- [x] 3.1 Set `estimatedMinutes` on each content slide in `decks/about` (`escape.html`, `agent.html`) with sensible whole-minute estimates and verify the values appear on `registerSlide`

## 4. Integration check

- [x] 4.1 Run `npm test` and confirm the speaker-notes and contract-related suites pass for this change
