# Design

## Context

See proposal.md — Why. Today `printEffectiveConfig` and export/build success lines print absolute paths from the assemble plan. `invocationDir()` (`INIT_CWD` ?? `process.cwd()`) is already the CLI’s notion of “where the user ran from” for resolving `--cwd` / `--deck`.

## Goals / Non-Goals

**Goals:**

- One shared formatter used by effective-config printing and by build/export “Wrote …” / export artifact summary lines.
- Prefer the shorter of invocation-relative vs `<cwd>/…`; fall back to absolute when a candidate needs more than two leading `..` segments.

**Non-Goals:**

- Changing path resolution, assemble, Vite, or on-disk layout.
- Rewriting error messages that already embed absolute paths for debugging (optional later; out of scope unless they share the helper cheaply).
- Changing `new` subcommand output beyond these shared surfaces.

## Decisions

1. **Two candidates, pick shorter** — For path `P` with working root `cwd` and invocation dir `inv`:
   - `invForm` = `path.relative(inv, P)` with display separators `/`; empty → `.`
   - `cwdForm` = `<cwd>` when `P` is `cwd`, else `<cwd>/` + `path.relative(cwd, P)` (posix `/`)
   - Discard a candidate if it is absolute (cross-drive) or if `leadingDotDotCount(rel) > 2` (more than `../../`)
   - Among remaining candidates, pick the shorter string; on equal length prefer `cwdForm`
   - If none remain, print absolute `P`

2. **Leading `..` depth** — Count only the leading run of `..` path segments after normalizing. `../x` and `../../x` are allowed; `../../../x` and deeper force that candidate out (and absolute if both fail).

3. **`cwd` line** — `formatConsoleCwd(cwd, inv)`: only the invocation-relative candidate (or `.`); same depth discard → absolute. No `<cwd>` token.

4. **Shared helper** — `src/cli/consolePaths.ts`: `formatConsolePath(abs, { cwd, invocationDir })`, `formatConsoleCwd(cwd, invocationDir)`. `printEffectiveConfig` and build/export success lines call these. Normalize display with forward slashes.

5. **Theme URLs** — `https://…` themes left as-is; only local theme paths go through the formatter.

## Risks / Trade-offs

- **[Risk] Copy-paste of absolute paths from console for scripts** → Mitigation: compact forms resolve against printed `cwd` / invocation dir; deep trees still get absolute.
- **[Risk] Tests asserting absolute strings break** → Mitigation: focused formatter unit tests; update printConfig expectations.
- **[Trade-off] Error messages may still show absolutes** → Acceptable for this change.

## Migration Plan

Display-only; no deck or config migration.

## Open Questions

None.
