# Proposal

## Why

CLI summaries (`build`, `dev`, `export`) print every filesystem path as a long absolute string. For a typical deck run that repeats the same working-root prefix on `cwd`, `deck`, `cover`, each slide, `output`, and export artifacts — making the console hard to scan. Operators already think in terms of `--cwd` and the invocation directory; console output should match that.

## What Changes

- **Platform (tooling):** Console path display for effective-configuration summaries, export artifact summaries, and “Wrote …” success lines.
- For each filesystem path, the CLI compares an invocation-relative form and a `<cwd>/…` form and prints the **shorter** one (ties prefer `<cwd>/…`).
- If the chosen relative form needs **more than `../../`** (more than two leading `..` segments), print the absolute path instead.
- The `cwd` line uses the same depth/absolute rule vs the invocation directory (no `<cwd>` token on that line).
- Non-path values (titles, CDN URLs, `(none)`) are unchanged.
- No change to path resolution, assemble, or on-disk write locations — display only.
- No migration impact on existing decks.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `platform-cli`: Add a shared requirement for how the CLI formats filesystem paths in operator-facing console output.
- `deck-build`: Effective-configuration (and write confirmation) paths follow the shared display rules. (`deck-dev` already requires the same effective-configuration style as build, so it inherits without a separate delta.)
- `deck-export`: Export summary artifact paths and post-capture “Wrote …” lines follow the same rules.

## Impact

- Code: `src/cli/printConfig.ts`, export/build success log lines, shared path-display helper (likely under `src/cli/`), unit tests for formatting and printConfig.
- Specs: `platform-cli`, `deck-build`, `deck-export`.
- No API, deck.json, or runtime shell changes.
