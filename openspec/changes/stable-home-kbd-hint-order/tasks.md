# Tasks

## 1. Shell hint order

- [ ] 1.1 In `shell/template.html`, reorder `.title-kbd-hints` so `↑`/`↓` precedes `←`/`→` (then `?`), and remove the clicker/normal flex `order` rules that swap those two rows — verify the source markup lists keys in that order with no `.deck-clicker-mode` order overrides for those ids
- [ ] 1.2 Update/extend Vitest in `src/assemble/__tests__/homePage.test.ts` so home hint key order is `↑/↓`, `←/→`, `?` and stays the same after toggling clicker mode on and off — verify with `npx vitest run src/assemble/__tests__/homePage.test.ts`

## Workflow follow-up

- Archive the change after review (`/opsx-archive` or equivalent) so the `deck-shell` delta syncs into main specs.
