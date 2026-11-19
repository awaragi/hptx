# Design

## Context

See proposal.md — Why. Today shared deck-arg parsers (`parseDeckArgs` / `parseExportArgs`) and `resolveDeckInvocation` throw when both `--cwd` and `--deck` are missing. Help/usage strings and docs restate that requirement. `new deck` / `new slide` already require `--cwd` via Commander and stay unchanged.

## Goals / Non-Goals

**Goals:**

- Single resolution rule: omit both flags → working root = invocation dir (`.`).
- Keep `--deck`-only and explicit `--cwd` behavior unchanged.
- Align help text and docs with the new default.

**Non-Goals:**

- Defaulting `hptx new` to `.`.
- Changing how relative paths resolve once a root is chosen.
- Changing `INIT_CWD` / invocation-dir detection used for resolving `--cwd` / `--deck` themselves.

## Decisions

1. **Default at parse / resolve time, not as a Commander defaultOption string alone**  
   When both flags are absent, set effective `cwd` to `resolveAgainst(invocationDir(), '.')` (or equivalent in `resolveDeckInvocation`). That keeps absolute `result.cwd` populated for assemble and print-config, matching an explicit `--cwd .`.  
   *Alternative considered:* only document “run from deck folder” without setting `cwd` and relying on `baseDir` — rejected because build/dev/export already prefer an absolute working root via `cwd`.

2. **Apply in all three call paths that currently reject missing flags**  
   CLI deck args, export args, and assemble `resolveDeckInvocation` (library callers). Same error message removal / default so programmatic assemble matches the CLI.

3. **Help copy**  
   Update `--cwd` descriptions / usage to say default is `.` when `--deck` is also omitted; drop “Provide --cwd and/or --deck” errors for these commands.

4. **Docs**  
   README, CLAUDE.md, and any “Require `--cwd` and/or `--deck` (no invocation-dir default)” lines for dev/build/export become “defaults to `.`”. Keep explicit `--cwd` in examples where a subdirectory is the deck (e.g. `templates`).

## Risks / Trade-offs

- **[Risk]** Running `hptx build` from the repo root without flags may discover unexpected `*.html` or fail for missing `output` instead of a clear “pass --cwd” error.  
  → **Mitigation:** Effective-config summary still prints `cwd`; docs show subdirectory examples; failures remain about missing `output` / slides, which is correct for “this directory is the deck.”

- **[Risk]** Tests assert the old hard failure.  
  → **Mitigation:** Flip those unit tests to expect default `.` and keep coverage for `--deck`-only / explicit `--cwd`.

## Migration Plan

No deck-file migration. Operators who relied on a hard fail when forgetting `--cwd` will instead operate on the invocation directory; update scripts/docs accordingly. Rollback is reverting the default and restoring the require-flags check.
