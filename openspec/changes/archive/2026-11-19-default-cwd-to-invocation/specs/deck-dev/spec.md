# Spec Delta

## REMOVED Requirements

### Requirement: Explicit deck root for preview
**Reason**: Replaced by optional deck root with invocation-directory default (same rules as build).
**Migration**: Omit `--cwd`/`--deck` to use `.`, or pass them as before.

## ADDED Requirements

### Requirement: Optional deck root for preview
`npm run dev` / `hptx dev` MUST accept optional `--cwd <dir>` and/or `--deck <file>` using the same working-root and deck-file resolution rules as build. When both are omitted, the working root MUST default to `.` (the invocation directory).

#### Scenario: Dev defaults cwd to invocation directory
- **WHEN** a user runs `npm run dev` with neither `--cwd` nor `--deck` from a directory that is a valid deck root
- **THEN** the command uses that invocation directory as the working root, serves the assembled preview, and prints the preview URL (same as `--cwd .`)

#### Scenario: Dev with explicit path
- **WHEN** a user runs `npm run dev -- --cwd /path/to/deck`
- **THEN** the command resolves that working root, loads `<cwd>/deck.json` when present, serves the assembled preview, and prints the preview URL
