# Tasks

## 1. Config types and load/merge

- [x] 1.1 Add `DeckSettings` / platform defaults and optional `settings` on `DeckConfig`; extend `KNOWN_FIELDS`, parse/validate settings keys and values in `loadDeckConfig.ts` — verify with Vitest: valid partial settings, unknown key fails, bad appearance/boolean fails
- [x] 1.2 Merge settings per key (platform → file → CLI overrides); expose complete effective `settings` on `ResolvedDeck` — verify Vitest: CLI overrides one key, omitted key keeps file, no settings → platform defaults
- [x] 1.3 Include effective `settings` in printConfig / effective-configuration output — verify unit or snapshot that settings appear when set via CLI

## 2. CLI (`--settings.*`) on build / dev / export

- [x] 2.1 Add shared `--settings.clicker|rememberStep|timer|appearance` parsing (exact `true`/`false`/`light`/`dark`) on build/dev via `args.ts` and wire into overrides — verify `args` Vitest parse + reject invalid values; help lists the flags
- [x] 2.2 Update export: remove appearance `--theme`; add the same `--settings.*` flags; capture appearance from effective settings — verify `exportArgs` Vitest (`--settings.appearance dark`, default light, `--theme dark` fails as unknown); help text updated

## 3. Assemble bake

- [x] 3.1 Bake complete effective settings onto assembled HTML as `data-deck-settings` (JSON) in `assembleHtml` — verify Vitest: attribute present with expected JSON for defaults and for CLI/file overrides

## 4. Shell runtime prefs

- [x] 4.1 Read baked settings; switch LS keys to `clicker` / `rememberStep` / `timer` / `appearance` with `true`/`false`/`light`/`dark`; ignore legacy keys/values; always write explicit literals on toggle — verify jsdom Vitest: bake used when LS empty; override wins; off writes `false`; legacy `clicker-mode` ignored
- [x] 4.2 Reset restores baked settings (not hardcoded platform-only) and still clears only this slug — verify Vitest: bake clicker true → user off → Reset → clicker on again
- [x] 4.3 Update cross-tab storage handlers and Settings/Reset copy for appearance naming and new keys — verify existing homePage / speakTimer preference tests updated and passing

## 5. Docs

- [x] 5.1 Update README and CLAUDE.md for `settings`, `--settings.*`, appearance vs CSS `theme`, export flag migration — verify docs mention the new flags and do not document export `--theme light|dark`

## Workflow follow-up

- Archive with `/opsx-archive` after review.
