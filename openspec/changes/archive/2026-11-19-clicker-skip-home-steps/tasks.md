# Tasks

## 1. Shell clicker navigation

- [x] 1.1 In `shell/template.html`, update `clickerNavStep` so that when the current slide is `agenda`, it skips `moveStep` and calls `stepVisible(delta)` immediately (still close an open modal if needed). Verify by enabling clicker in the existing jsdom home harness and pressing one forward clicker key from home with multiple tiles — `Deck.currentKey()` MUST be the first content slide.
- [x] 1.2 Extend `src/assemble/__tests__/homePage.test.ts` with cases that match the delta scenarios: clicker forward from home skips tiles; content-slide clicker still steps; non-clicker `→` on home still highlights tiles. Verify with `npx vitest run src/assemble/__tests__/homePage.test.ts`.

## 2. Presenter-facing copy

- [x] 2.1 Update README clicker-mode section and home/Help hint strings in `shell/template.html` (`syncTitleKbdHintsForClicker` and Settings Help rows as needed) so clicker on home is described as page change, not step-through of agenda tiles. Verify the README exception reads clearly and home clicker hints no longer claim “step on the slide” while on agenda.
