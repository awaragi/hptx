# Proposal

## Why

`dev`, `build`, and `export` currently fail when both `--cwd` and `--deck` are omitted. Authors who already stand in a deck folder (or run from a deck’s directory in scripts) should be able to run `npx hptx dev|build|export` with no path flags; defaulting the working root to `.` (the invocation directory) matches that expectation.

## What Changes

- **BREAKING (behavior):** When neither `--cwd` nor `--deck` is passed, `dev`, `build`, and `export` treat the working root as `.` (resolved against the invocation directory) instead of exiting with an error.
- `--cwd` and `--deck` remain optional overrides; `--deck` alone still sets the working root to the deck file’s parent.
- Shared CLI help / usage strings and operator docs (README, CLAUDE.md, and any other “no default root” wording) document the default.
- `hptx new deck` / `new slide` keep requiring an explicit `--cwd` (out of scope).

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `deck-build`: Working-root requirement for build defaults to invocation `.` when flags are omitted.
- `deck-dev`: Same default for preview.
- `deck-export`: Same default for export (output still required).
- `deck-config`: Clarify that an omitted `--cwd`/`--deck` pair resolves the working root to the invocation directory (`.`).

## Impact

- Platform CLI / assemble resolution: `src/cli/args.ts`, `src/cli/exportArgs.ts`, `src/assemble/loadDeckConfig.ts` / `resolveDeckInvocation`, and related unit tests that assert “missing cwd/deck fails”.
- Docs: README.md, CLAUDE.md, Commander `--help` option descriptions / usage strings.
- No deck content or shell runtime changes. Existing invocations that already pass `--cwd` / `--deck` keep the same resolution rules.
