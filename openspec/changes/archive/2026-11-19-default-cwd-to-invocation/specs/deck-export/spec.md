# Spec Delta

## REMOVED Requirements

### Requirement: Explicit deck root and required output for export
**Reason**: Replaced by optional deck root (default `.`) while keeping required `output`.
**Migration**: Omit `--cwd`/`--deck` to use `.`; still provide `output` via deck file or `--output`.

## ADDED Requirements

### Requirement: Optional deck root and required output for export
`hptx export` MUST accept optional `--cwd <dir>` and/or `--deck <file>` using the same working-root and deck-file resolution rules as build (including defaulting the working root to `.` when both are omitted). It MUST require an effective `output` path (deck file and/or `--output`) so the HTML output path and export artifact parent directory are defined. When output is missing, the command MUST exit non-zero with usage that names that requirement.

#### Scenario: Export defaults cwd to invocation directory
- **WHEN** a developer runs `npx hptx export` with neither `--cwd` nor `--deck` from a directory that is a valid deck root with `output`
- **THEN** the command uses that invocation directory as the working root and proceeds (same as `--cwd .`)

#### Scenario: Missing output fails
- **WHEN** a developer runs `npx hptx export --cwd <dir>` for a deck that has no `output` and no `--output`
- **THEN** the command exits non-zero naming that output is required
