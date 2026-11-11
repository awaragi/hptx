# Tasks

## 1. Notes on the canvas

- [x] 1.1 Hide `.slide aside.notes` in the shell chrome styles and verify with a jsdom test that a built slide keeps its aside in markup and the shell stylesheet hides it

## 2. Notes window controller

- [x] 2.1 Convert the anonymous deck `keydown` listener to a named `onDeckKeydown(e)` and verify existing keyboard tests still pass (`npm test`)
- [x] 2.2 Add the notes host: open / focus / reconnect on `N`, close on `⇧N`, write the notes document (toolbar, title, position, notes, disconnected banner, forwarding script), and verify with jsdom tests (stubbed `window.open`) that `N` opens one window, a second `N` reuses it, and `⇧N` closes it
- [x] 2.3 Render notes from slide key and step (`notesFor(key, step)`), call it from `syncSlideToUrl()`, show title, slide position, step position, and the "No notes" placeholder; verify with jsdom tests for ordered asides, the home placeholder, step position, and updates on navigation
- [x] 2.4 Forward keys and toolbar actions from the notes window to the deck host; verify with jsdom tests that `ArrowDown` and `h` in the notes window navigate the deck and that step buttons are disabled on a slide without steps
- [x] 2.5 Sync theme into the notes window (`#deck-theme`, Settings theme, `data-theme`) on render and theme changes; verify with a jsdom test that `T` switches `data-theme` in both windows
- [x] 2.6 Show the disconnected banner when the opener is gone or unreachable, and verify with a jsdom test that closing the deck window shows it

## 3. Chrome and docs

- [x] 3.1 Add the `N` hint to the home page keyboard hints and verify with a jsdom test that the hints include `N`
- [x] 3.2 Document speaker notes in `shell/contract/SLIDE-CONTRACT.md`, `CLAUDE.md`, and `README.md`, and verify the text covers the aside element, hidden canvas, allowed formatting, shell-owned styling, and `N` / `⇧N`
- [x] 3.3 Add an example `<aside class="notes">` to `templates/blank.html` and verify the templates tests and `npx hptx build --cwd templates` pass

## 4. Integration

- [x] 4.1 Run `npm test` and `npm run typecheck` and confirm both pass
- [x] 4.2 Visual QA with Playwright MCP at 1710×1107 on `npx hptx dev --cwd templates`: open the notes window with `N`, navigate from both windows, toggle theme and full screen from the toolbar, close with `⇧N`; screenshot both windows to the OS temp folder
- [x] 4.3 Check reconnect on a built `file://` deck with Playwright: reload the deck window, press `N`, and confirm the notes window follows navigation again

## 5. Toolbar refinements

- [x] 5.1 Replace the toolbar navigation labels with media icon buttons (`|<`, `<<`, `>>`, `>|`) with accessible names, and put the `Slide n / N` progress (plus step) between previous step and next step; verify with jsdom tests for order, labels, and progress text
- [x] 5.2 Replace the theme button with the deck's Light / Dark switch, kept in sync with the deck mode and the theme lock; verify with a jsdom test that flipping it switches both windows and that `T` updates it
- [x] 5.3 Visual QA with Playwright MCP: screenshot the notes toolbar in light and dark and compare the switch with the deck's toggle

## Workflow follow-up

- Archive the change with `/opsx-archive` after review.
