# Spec Delta: deck-export

## REMOVED Requirements

### Requirement: Appearance theme flag
**Reason**: Light/dark capture is now the shared `--settings.appearance` flag (same as build/dev), not a separate export-only `--theme light|dark` that collided with CSS `--theme` on build/dev.
**Migration**: Use `--settings.appearance light|dark` instead of `--theme light|dark` on export. CSS theme bake continues to come from the effective deck `theme` as in build (export does not add a CSS `--theme` flag in this change).

## ADDED Requirements

### Requirement: Shared settings CLI on export
Export MUST accept the same `--settings.*` flags as build/dev (same keys, values, validation, and per-key merge). Effective settings MUST bake into the capture HTML. Capture `data-theme` MUST follow effective `appearance`. Export MUST NOT accept `--theme` as light/dark appearance.

#### Scenario: Default appearance is light
- **WHEN** export runs with no settings appearance from file or CLI
- **THEN** captures use the light presentation appearance

#### Scenario: Dark appearance from CLI
- **WHEN** export runs with `--settings.appearance dark`
- **THEN** captures use the dark presentation appearance

#### Scenario: Appearance from deck.json settings
- **WHEN** the deck file sets `"settings": { "appearance": "dark" }` and export omits `--settings.appearance`
- **THEN** captures use the dark presentation appearance

#### Scenario: Former appearance --theme is not accepted
- **WHEN** a user runs export with `--theme dark`
- **THEN** the command exits non-zero (unknown option; appearance is `--settings.appearance` only)

#### Scenario: Settings clicker bakes for export assemble
- **WHEN** export runs with `--settings.clicker true`
- **THEN** the assembled HTML used for capture has baked clicker true

## MODIFIED Requirements

### Requirement: Shared assemble semantics for export
Export MUST assemble with the same slide resolution, harvesting, CSS scoping, registration binding, theme bake, settings bake, and CDN tags as build (including `--slide` filter order and `--settings.*`). Export MAY serve the assembled HTML over a local HTTP URL for capture so CDN assets load. Export MUST NOT be required to leave the HTML `output` file written, but MUST still require the effective output path for naming.

#### Scenario: Slide filter applies
- **WHEN** export is invoked with `--slide overview --slide detail`
- **THEN** only the home page plus those slides (in CLI order) are captured

### Requirement: Export help and effective configuration
`hptx export --help` MUST document `--cwd`, `--deck`, `--slide`, `--output`, `--format`, `--settings.*`, `--progress`, and other shared deck field flags that export accepts. It MUST NOT document `--theme` as light/dark appearance. Before capturing, export MUST print an effective-configuration style summary including format, settings (including appearance), presentation name, and output artifact path(s). Filesystem paths in the shared effective-configuration block, the export artifact summary, and post-capture “Wrote …” lines MUST follow the CLI console path display rules (shorter of invocation-relative vs `<cwd>/…`, absolute when more than `../../` is required).

#### Scenario: Help lists format and theme
- **WHEN** a developer runs `npx hptx export --help`
- **THEN** the help text names `--format`, `--settings.appearance`, and `--progress`, and does not describe `--theme` as light|dark appearance

#### Scenario: Artifact paths use compact display
- **WHEN** export prints its artifact summary and a “Wrote …” line for filesystem paths
- **THEN** those paths use the shorter of invocation-relative and `<cwd>/…` forms (or absolute when both need more than `../../`)
