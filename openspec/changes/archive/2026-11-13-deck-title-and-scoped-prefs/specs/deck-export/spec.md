# Spec Delta

## MODIFIED Requirements

### Requirement: Explicit deck root and required output for export
`hptx export` MUST require `--cwd <dir>` and/or `--deck <file>` using the same working-root and deck-file resolution rules as build. It MUST require an effective `output` path (deck file and/or `--output`) so the HTML output path and export artifact parent directory are defined. When the root or output is missing, the command MUST exit non-zero with usage that names those requirements.

#### Scenario: Missing cwd and deck fails
- **WHEN** a developer runs `npx hptx export` with neither `--cwd` nor `--deck`
- **THEN** the command exits non-zero and prints usage that names those flags

#### Scenario: Missing output fails
- **WHEN** a developer runs `npx hptx export --cwd <dir>` for a deck that has no `output` and no `--output`
- **THEN** the command exits non-zero naming that output is required

## REMOVED Requirements

### Requirement: Presentation name matches HTML output stem
**Reason**: Presentation name is the title slug, not the HTML output stem.
**Migration**: None — not in production; export paths now use the resolved title slug.

## ADDED Requirements

### Requirement: Presentation name is the title slug
The presentation name MUST be the title slug of the resolved deck title (see deck-config). All export artifact paths for that run MUST use this slug as `<name>` (for example under `<dirname(output)>/<name>/png/`). The HTML `output` path remains the assembled file location and MUST NOT be renamed solely because the title differs from the output stem.

#### Scenario: Name derived from title slug
- **WHEN** the resolved title is `Q3 Review` (slug `q3-review`) and effective output ends with `dist/about.html`
- **THEN** export writes under paths that use the presentation name `q3-review` (not `about`)

#### Scenario: Title matches output stem
- **WHEN** neither file nor CLI sets `title` and effective output ends with `about.html`
- **THEN** the resolved title and presentation slug are `about` and export uses that name
