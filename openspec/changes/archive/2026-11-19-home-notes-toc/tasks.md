# Tasks

## 1. Shell-generated home notes TOC

- [x] 1.1 In `shell/template.html`, implement home TOC HTML from visible content slides (section headings via `agendaSection`, bullets with agenda/display titles, optional `estimatedMinutes` labels using existing estimate wording; escape titles). Wire it so home notes render that TOC instead of “No notes” when there is at least one visible content slide. Verify by opening notes on home in the speaker-notes jsdom harness and asserting TOC structure/text (not “No notes”).
- [x] 1.2 Update `src/assemble/__tests__/speakerNotes.test.ts` for the new home behavior and add coverage for groupings, per-slide estimates, and omitting a hidden slide. Keep content-slide “No notes” coverage. Verify with `npx vitest run src/assemble/__tests__/speakerNotes.test.ts`.

## 2. Docs

- [x] 2.1 Update the README speaker-notes section to state that the home page notes window shows a generated TOC (with estimates when set). Verify the wording matches the implemented behavior.
