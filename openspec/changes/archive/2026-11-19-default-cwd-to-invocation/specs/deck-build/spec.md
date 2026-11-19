# Spec Delta

## REMOVED Requirements

### Requirement: Explicit deck root for build
**Reason**: Replaced by optional deck root with invocation-directory default.
**Migration**: Omit `--cwd`/`--deck` to use `.`, or pass them as before.

## ADDED Requirements

### Requirement: Optional deck root for build
`npm run build` / `hptx build` MUST accept optional `--cwd <dir>` and/or `--deck <file>`. When both are omitted, the working root MUST default to `.` (the invocation directory). When only `--deck` is set, the working root MUST be that file’s parent directory. When `--cwd` is set, it MUST be the working root even if `--deck` points elsewhere. When `--deck` is omitted, the toolchain MUST load `<cwd>/deck.json` if that file exists; otherwise it MUST proceed with no deck file.

#### Scenario: Build defaults cwd to invocation directory
- **WHEN** a user runs `npm run build` with neither `--cwd` nor `--deck` from a directory that is a valid deck root with `output`
- **THEN** the command uses that invocation directory as the working root and proceeds (same as `--cwd .`)

#### Scenario: Build with explicit path
- **WHEN** a user runs `npm run build -- --cwd /path/to/deck` and `/path/to/deck/deck.json` exists
- **THEN** the command loads that file, merges CLI overrides, and writes the effective `output`
