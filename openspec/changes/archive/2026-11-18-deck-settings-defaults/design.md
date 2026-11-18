# Design

## Context

See proposal.md for motivation. Today: CSS `theme` bakes into `#deck-theme`; playback prefs live only in slug-scoped localStorage with `'1'`/`removeItem` semantics and hardcoded off/light defaults on Reset. Export uses `--theme light|dark` for appearance while build/dev use `--theme` for CSS files. Shell already scopes prefs via `data-deck-slug`.

## Goals / Non-Goals

**Goals:**
- Single `settings` object in config + matching `--settings.<key>` CLI on dev/build/export
- Bake effective settings into HTML; runtime = bake ← localStorage; Reset → bake
- Unify value literals (`true`/`false`/`light`/`dark`) across JSON, CLI, and localStorage
- Keep CSS theme bake and `data-theme` DOM hook separate from `appearance`

**Non-Goals:**
- Agenda visibility, hidden slides, or custom theme CSS inside `settings`
- Migrating legacy LS keys/values
- Adding CSS `--theme` to export in this change
- Changing theme CSS file format or token names

## Decisions

### 1. Settings shape and keys
Known keys only: `clicker`, `rememberStep`, `timer` (boolean), `appearance` (`light`|`dark`). Reject unknown keys (same typo-catching as top-level deck.json).

**Alternative considered:** Open object ignoring unknowns — weaker authoring feedback.

### 2. Cascade and bake
```
platform defaults → deck.json settings (per key) → CLI --settings.* (per key)
 → bake into HTML → runtime localStorage override
```
Bake as `data-deck-settings` on `<html>` with a JSON object of all four keys (always complete after cascade). Shell parses once at boot. Avoids a second script global and matches `data-deck-slug`.

**Alternative considered:** Inline `var DECK_SETTINGS=…` — fine, but an attribute keeps assembleHtml’s existing html-attr pattern.

### 3. CLI flag form
Literal option names: `--settings.clicker <true|false>`, etc. (dot namespace, explicit values). Shared helper used by `args.ts` and `exportArgs.ts`. Reject anything other than exact `true`/`false`/`light`/`dark`.

**Alternative considered:** `--settings-clicker` or boolean presence/`--no-*` — rejected per product preference.

Commander: register four `.option('--settings.clicker <value>', …)` (and siblings). Dot is part of the option name.

### 4. localStorage
Suffixes = key names (`clicker`, `rememberStep`, `timer`, `appearance`). Values = same literals. On toggle, always write the explicit value (including `false`). Read: if stored is a valid literal for that key, use it; else baked default. Ignore legacy `clicker-mode` / `remember-slide-step` / `theme` (appearance) and `'1'`/`'0'`.

Reset: remove slug keys (including custom theme CSS / hidden slides / agenda as today), then apply baked settings via setters with `persist:false`.

### 5. Export appearance
Remove export `--theme light|dark`. Capture uses effective baked `appearance` (CLI/file/platform). Playwright starts with empty LS, so bake drives the session; capture code may still set `data-theme` from effective appearance for determinism.

### 6. Types / merge
Extend `DeckConfig` with optional `settings?: DeckSettings`. `ResolvedDeck` carries fully resolved `settings: Required<DeckSettings>` (all four keys). `DeckOverrides.settings` is a partial per-key overlay from CLI.

### 7. Docs / printConfig
Effective-config printer includes `settings`. README/CLAUDE: document `settings`, `--settings.*`, appearance vs theme; update export flag docs.

## Risks / Trade-offs

- **[Risk] Commander + dotted option names** → Verify parse/help in unit tests; use exact option strings.
- **[Risk] Export scripts still pass `--theme dark`** → Hard break; help + README migration note; tests assert failure.
- **[Risk] Authors expect omit-when-default deletes LS** → Prefer always-write on toggle for clarity; Reset still clears.
- **[Trade-off] Export lacks CSS `--theme`** → Unchanged from “appearance-only `--theme`” confusion removal; CSS bake remains file-only on export.

## Migration Plan

1. Ship platform change; no required deck.json edits.
2. Authors optionally add `settings`; CI/scripts replace export `--theme light|dark` with `--settings.appearance`.
3. Presenters re-toggle prefs (old LS ignored) or use Reset.

## Open Questions

None deferred; product decisions locked in explore.
