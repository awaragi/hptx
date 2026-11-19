# Tasks

## 1. Stage long code as scroll steps

- [x] 1.1 Update `templates/codeTree.html` so shell steps are `(file, page)` stages: measure code-pane pages after paint/highlight, map ←/→ across scroll pages then files, tree click → file page 0, functional `stepCount`, and refresh slide-sub/notes — verify a tall snippet advances scroll on → before changing files, and a short snippet stays one step
- [x] 1.2 Ensure at least one demo file in `ctData` is tall enough to overflow the pane on the 1920×1080 canvas so scroll staging is observable — verify in preview that → pages that file
- [x] 1.3 Run `npx hptx build --cwd templates` and a quick Playwright check (`Deck.goToKey('codeTree')`, step through overflow) — verify assemble succeeds and scroll-then-file behavior holds

## Workflow follow-up

- Archive after review: `/opsx-archive`
