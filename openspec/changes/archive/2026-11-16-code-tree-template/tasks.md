# Tasks

## 1. Template + catalog wiring

- [x] 1.1 Add `templates/codeTree.html` with tree rail, scrollable code pane, JSON file list (HTML, JS, and at least two other languages from project excerpts), highlight.js `highlightElement` on the code element, tree click + shell steps, and `hljs` / theme-refresh guards — verify copy-safety rules (no hardcoded colors, contract link, SLIDE-CONTRACT comment) and that the slide registers without throwing when `hljs` is absent
- [x] 1.2 Register `codeTree` in `templates/catalog.json` (description + highlight.js CDN `scripts` / `styles`) and add the slide + matching CDN URLs to `templates/deck.json` — verify catalog keys match template HTML files and every catalog CDN URL appears in `deck.json`
- [x] 1.3 Update `src/assemble/__tests__/templates.test.ts` expected template keys (include `codeTree`) and any highlight.js CDN assertion needed — verify `npx vitest run src/assemble/__tests__/templates.test.ts` passes

## 2. Build and visual check

- [x] 2.1 Run `npx hptx build --cwd templates` and confirm assemble succeeds with no html-slides / slide-scoping errors
- [x] 2.2 Preview with `npx hptx dev --cwd templates`, open `codeTree` via `Deck.goToKey('codeTree')`, switch files / steps, confirm syntax colors and code-pane scroll; optionally screenshot `#deckCanvas` via Playwright MCP
