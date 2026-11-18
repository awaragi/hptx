# Spec Delta: deck-dev

## MODIFIED Requirements

### Requirement: Same assemble rules as build
Preview MUST resolve slides, harvest and scope slide files, bind registrations, bake in the effective theme, bake effective settings, and emit effective CDN `scripts`/`styles` tags using the same cascade and validation rules as build (except `output` is not required and MUST NOT be written).

#### Scenario: Theme visible in preview
- **WHEN** the deck file sets `theme` to a local path or `https://` CSS URL and preview starts without `--theme`
- **THEN** the preview shows that theme's tokens in the deck theme region

#### Scenario: CDN script available in preview
- **WHEN** the effective config declares a CDN entry under `scripts` and preview starts
- **THEN** the preview document includes that `<script src>` so slides that depend on it can boot

#### Scenario: Settings bake matches build
- **WHEN** the same deck root and settings are used for preview and for build
- **THEN** both assembled HTML documents expose the same baked settings values to the shell

### Requirement: Preview CLI uses Commander
`npm run dev` MUST parse its arguments with Commander, sharing the deck option set with build (long-only `--cwd`, `--deck`, `--slide`, `--output`, `--theme`, `--cover`, `--title`, `--brand`, `--caption`, `--script`, `--style`, and `--settings.*`). Preview MUST NOT write `output` even when `--output` is passed. Unknown options MUST fail. `--help` MUST print the full Commander help screen documenting those options.

#### Scenario: Dev unknown option fails
- **WHEN** the user runs `npm run dev -- --cwd /path/to/deck --bogus`
- **THEN** the command exits non-zero without starting the server

#### Scenario: Dev --output does not write
- **WHEN** the user starts preview with `--output /tmp/Out.html`
- **THEN** preview serves in memory and does not create or modify `/tmp/Out.html` or any configured `output`

#### Scenario: Dev accepts settings flag
- **WHEN** the user starts preview with `--settings.clicker true`
- **THEN** the preview assembles with baked clicker true

### Requirement: Dev prints effective configuration
Before starting the preview server, `npm run dev` MUST print the same style of effective-configuration summary as build (working root, deck file, merged fields including settings, slide filter when set).

#### Scenario: Config summary before preview
- **WHEN** the user runs `npm run dev -- --cwd /path/to/deck`
- **THEN** the command prints an effective-configuration summary before the preview URL
