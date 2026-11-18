# Tasks

## 1. Dependency and shared I/O module

- [x] 1.1 Add `json5` to `package.json` dependencies and verify `npm install` succeeds
- [x] 1.2 Create `src/assemble/deckJson.ts` with `parseDeckJson`, `readDeckJson`, `formatDeckJson`, and `writeDeckJson` (JSON5 parse; strict JSON stringify + atomic write) and verify a focused unit test covers comment parse, trailing comma, invalid text error, and round-trip write

## 2. Wire load and generate call sites

- [x] 2.1 Switch `loadDeckFile` to `readDeckJson` / `parseDeckJson` and verify `loadDeckConfig` tests pass including new JSON5 comment / trailing-comma cases
- [x] 2.2 Route `createSlide` and `createDeck` deck-file read/write through `deckJson` helpers and verify generate tests pass, including updating a commented `deck.json` and asserting the written file is strict JSON
- [x] 2.3 Confirm no remaining direct `JSON.parse` / `JSON.stringify` of deck config files outside `deckJson.ts` (catalog and other JSON stay as-is)

## 3. Docs

- [x] 3.1 Note in `CLAUDE.md` (and README if it documents `deck.json`) that deck files may use JSON5 syntax and that platform rewrites emit strict JSON without preserving comments

## Workflow follow-up

- Archive the change after review with `/opsx-archive`.
