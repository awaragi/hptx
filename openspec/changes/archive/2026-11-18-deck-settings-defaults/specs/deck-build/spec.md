# Spec Delta: deck-build

## ADDED Requirements

### Requirement: CLI settings overrides for build
Build MUST accept long-only `--settings.clicker`, `--settings.rememberStep`, `--settings.timer` with values `true` or `false`, and `--settings.appearance` with values `light` or `dark`. Each flag overrides that settings key for the run. Invalid values MUST fail. CSS `--theme` MUST remain the theme-file override (path or https URL), not appearance.

#### Scenario: Enable clicker from CLI
- **WHEN** the user builds with `--settings.clicker true`
- **THEN** the assembled HTML’s baked settings have `clicker` true

#### Scenario: Appearance from CLI
- **WHEN** the user builds with `--settings.appearance dark`
- **THEN** the assembled HTML’s baked settings have `appearance` `dark`

#### Scenario: Invalid settings boolean fails
- **WHEN** the user builds with `--settings.clicker yes`
- **THEN** the command exits non-zero without writing output

#### Scenario: CSS theme flag unchanged
- **WHEN** the user builds with `--theme ./brand.css`
- **THEN** that path is used as the CSS theme bake source (not as appearance)

## MODIFIED Requirements

### Requirement: Shared assemble semantics
Build MUST use the same slide resolution, harvesting, CSS scoping, and registration binding as preview: `deck.json` `slides` or filename fallback, never including `output`. Assemble MUST bake effective settings into the HTML the same way as preview and export.

#### Scenario: Same inputs as full preview
- **WHEN** build runs without a slide filter on a deck
- **THEN** the included slides match the full set that preview would load without a filter

#### Scenario: Settings bake matches preview
- **WHEN** build and preview use the same effective settings
- **THEN** both assembled HTML documents expose the same baked settings values to the shell

### Requirement: Deck CLI uses Commander
`npm run build` MUST parse its arguments with the Commander library (devDependency). All deck flags MUST be long-only (no short aliases). Unknown options MUST fail. `--help` MUST print the full Commander help screen documenting `--cwd`, `--deck`, `--slide`, `--output`, `--theme`, `--cover`, `--title`, `--brand`, `--caption`, `--script`, `--style`, and the `--settings.*` flags.

#### Scenario: Unknown build option fails
- **WHEN** the user runs `npm run build -- --cwd /path/to/deck --bogus`
- **THEN** the command exits non-zero without writing output

#### Scenario: Help lists settings flags
- **WHEN** the user runs `npm run build -- --help`
- **THEN** the help text names `--settings.clicker`, `--settings.rememberStep`, `--settings.timer`, and `--settings.appearance`

### Requirement: Build prints effective configuration
Before writing output, `npm run build` MUST print the effective configuration (working root, deck file path or none, version, title, brand, caption, output, cover, theme, settings, slides or `--slide` filter, scripts, styles) so the operator can see the merged values for this run. Filesystem paths in that summary and in the success line that names the written `output` MUST follow the CLI console path display rules (shorter of invocation-relative vs `<cwd>/…`, absolute when more than `../../` is required).

#### Scenario: Config summary before write
- **WHEN** the user runs `npm run build -- --cwd /path/to/deck`
- **THEN** the command prints an effective-configuration summary that includes the working root and output path before writing the HTML file

#### Scenario: Summary paths use compact display
- **WHEN** the user runs build with `--cwd templates` from a parent invocation directory
- **THEN** filesystem paths in the summary use the shorter of invocation-relative and `<cwd>/…` forms (or absolute when both need more than `../../`)

#### Scenario: Summary includes settings
- **WHEN** the user builds with `--settings.clicker true`
- **THEN** the effective-configuration summary shows clicker true among settings

### Requirement: CLI field parity for build
Build MUST accept long-only `--cover`, `--title`, `--brand`, `--caption`, repeatable `--script <https-url>` / `--style <https-url>`, and `--settings.*` flags that override or supply the corresponding effective-config fields. When any `--script` or `--style` is present, that field’s effective value MUST be exactly the CLI list in order (replacing the file list). Settings flags MUST merge per key. Values MUST obey the same validation rules as the deck-file fields.

#### Scenario: Title from CLI
- **WHEN** the user builds with `--title "Q3 Review"`
- **THEN** the output document title is `Q3 Review`

#### Scenario: Repeatable scripts replace file list
- **WHEN** the deck file lists one script and the user passes `--script https://cdn.example.com/a.js --script https://cdn.example.com/b.js`
- **THEN** the output emits those two script tags in that order and not the file’s script entry

#### Scenario: Settings flag merges over file
- **WHEN** the deck file sets `"settings": { "timer": true }` and the user passes `--settings.appearance dark`
- **THEN** effective settings keep timer true and set appearance dark
