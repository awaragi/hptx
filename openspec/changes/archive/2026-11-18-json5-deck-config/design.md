# Design

## Context

See proposal.md — Why. Today `loadDeckFile` uses `JSON.parse`, and `hptx new slide` / `new deck` also call `JSON.parse` / `JSON.stringify` directly on the deck file. There is no shared I/O helper. Validation after parse (`validateDeckConfig`) is already separate and stays unchanged.

## Goals / Non-Goals

**Goals:**

- Single module owns deck-file text ↔ data: parse (JSON5) and write (strict JSON).
- All platform reads/writes of deck config go through that module.
- Existing strict-JSON decks keep working without migration.

**Non-Goals:**

- Preserving comments or JSON5-only syntax across rewrite.
- Renaming `deck.json` to `.json5`.
- Parsing other JSON files (e.g. `catalog.json`) as JSON5.
- Teaching editors; optional docs note only.

## Decisions

1. **Dependency: `json5` package**  
   Use the reference `JSON5.parse` API. Alternative: hand-rolled comment stripper — rejected (incomplete vs JSON5, more maintenance). Alternative: `jsonc-parser` — rejected (comments/trailing commas only; user accepted full JSON5).

2. **Module placement: `src/assemble/deckJson.ts`**  
   Lives next to `loadDeckConfig.ts`. Exports roughly:
   - `parseDeckJson(text, label?)` → `unknown` via `JSON5.parse`, errors name the file/label
   - `readDeckJson(path)` → read UTF-8 + parse
   - `formatDeckJson(data)` → `JSON.stringify(data, null, 2) + '\n'`
   - `writeDeckJson(path, data)` → atomic write of formatted text  
   Alternative: put helpers only inside `loadDeckConfig.ts` — rejected so generate does not import the full config resolver for a stringify. Alternative: `src/shared/` — unnecessary for two call sites.

3. **Writes stay `JSON.stringify`**  
   Pretty-print with 2-space indent and trailing newline (match current generator output). Do not use `JSON5.stringify`. Authors who need comments re-add them after a tool rewrite.

4. **Call-site wiring**  
   - `loadDeckFile` uses `readDeckJson` / `parseDeckJson` instead of `JSON.parse`.  
   - `createSlide` / `createDeck` use `readDeckJson` + `writeDeckJson` instead of raw `fs` + `JSON.parse`/`JSON.stringify` for the deck file.  
   - Keep `writeAtomic` behavior; either move a small atomic helper into the module or have `writeDeckJson` call the existing local helper / shared util without changing atomic semantics.

5. **Error wording**  
   Prefer “Invalid deck JSON” / “Cannot parse deck file” naming the path; mention JSON5 only in docs if needed so operators are not surprised by “JSON5” jargon in every error.

## Risks / Trade-offs

- [Comments lost on `new slide`] → Accepted; document in CLAUDE.md / README briefly.  
- [Editors mark `deck.json` invalid for comments] → Mitigate with a one-line docs note (associate as JSONC/JSON5). Out of scope to ship editor config.  
- [json5 adds a runtime dep to the CLI] → Small, mature package; acceptable for Node tooling (shell stays dependency-free).

## Migration Plan

- No deck migration. Deploy with normal package install (`json5` in dependencies).  
- Rollback: revert to `JSON.parse` (decks that added comments would fail until comments removed).

## Open Questions

None.
