# deck-dev Specification

## Purpose

Defines Vite-backed development preview for an explicitly chosen deck folder so authors can load one slide or a subset quickly before producing the single-file build.

## Requirements

### Requirement: Explicit deck root for preview
`npm run dev` MUST require `--cwd <dir>` and/or `--deck <file>` using the same working-root and deck-file resolution rules as build. When both are omitted, the command MUST exit non-zero with usage that names those flags. The toolchain MUST NOT default the working root to the invocation directory.

#### Scenario: Dev without deck path fails
- **WHEN** a user runs `npm run dev` with neither `--cwd` nor `--deck`
- **THEN** the command exits non-zero with usage that names `--cwd` and `--deck`

#### Scenario: Dev with explicit path
- **WHEN** a user runs `npm run dev -- --cwd /path/to/deck`
- **THEN** the command resolves that working root, loads `<cwd>/deck.json` when present, serves the assembled preview, and prints the preview URL

### Requirement: Dev preview of a deck root
Given an explicit deck root, the toolchain MUST assemble the shell with the agenda and selected slides as an HTML string in memory and serve an interactive preview without writing `output`.

#### Scenario: Preview without writing output
- **WHEN** a user starts preview against a deck root
- **THEN** they can navigate the assembled deck in the browser and `output` is not created or modified

### Requirement: Same assemble rules as build
Preview MUST resolve slides, harvest and scope slide files, bind registrations, bake in the effective theme, and emit effective CDN `scripts`/`styles` tags using the same cascade and validation rules as build (except `output` is not required and MUST NOT be written).

#### Scenario: Theme visible in preview
- **WHEN** the deck file sets `theme` to a local path or `https://` CSS URL and preview starts without `--theme`
- **THEN** the preview shows that theme's tokens in the deck theme region

#### Scenario: CDN script available in preview
- **WHEN** the effective config declares a CDN entry under `scripts` and preview starts
- **THEN** the preview document includes that `<script src>` so slides that depend on it can boot

### Requirement: CLI theme override for preview
Preview MUST accept the same `--theme <path-or-https-url>` override as build, applying that theme for the assembled preview instead of a deck-file `theme`. Local theme files MUST be watched for reload like a file local theme.

#### Scenario: Preview with --theme
- **WHEN** the user starts `npm run dev -- --cwd /path/to/deck --theme ./client.css`
- **THEN** the preview shows that theme’s tokens in the deck theme region

### Requirement: Preview CLI uses Commander
`npm run dev` MUST parse its arguments with Commander, sharing the deck option set with build (long-only `--cwd`, `--deck`, `--slide`, `--output`, `--theme`, `--cover`, `--title`, `--brand`, `--caption`, `--script`, `--style`). Preview MUST NOT write `output` even when `--output` is passed. Unknown options MUST fail. `--help` MUST print the full Commander help screen documenting those options.

#### Scenario: Dev unknown option fails
- **WHEN** the user runs `npm run dev -- --cwd /path/to/deck --bogus`
- **THEN** the command exits non-zero without starting the server

#### Scenario: Dev --output does not write
- **WHEN** the user starts preview with `--output /tmp/Out.html`
- **THEN** preview serves in memory and does not create or modify `/tmp/Out.html` or any configured `output`

### Requirement: CLI slides filter for authoring
Preview MUST accept the same `--slides` semantics as build (key or filename, CLI order, unknown entries fail). Authors MUST be able to load a single slide for faster preview. Preview MUST NOT use a URL query parameter as the filter mechanism.

#### Scenario: Single-slide authoring
- **WHEN** the user starts preview with `--slides overview`
- **THEN** only the agenda and the `overview` slide are assembled, and other slide files are not read or harvested

#### Scenario: No query-param filter requirement
- **WHEN** an author wants a subset preview
- **THEN** they achieve it via `--slides` without setting a URL query string

### Requirement: Reload on edits
While preview is running, saving a selected slide file, the resolved deck JSON file (when one is loaded), a local theme file, or a local image file previously discovered for baking from the current assemble set MUST trigger a full page reload with the re-assembled deck.

#### Scenario: Edit slide HTML refreshes preview
- **WHEN** preview is running for `--slide metrics` and the author saves `metrics.html`
- **THEN** the preview reloads and reflects the saved content

#### Scenario: Edit baked image refreshes preview
- **WHEN** preview is running for a slide that baked `assets/logo.png` and the author saves that image file
- **THEN** the preview reloads with the updated baked asset

### Requirement: Remote theme cached during preview
When the effective `theme` is an `https://` URL, preview MUST fetch it once at startup (with a timeout) and reuse the cached CSS for subsequent reloads. Preview MUST refetch it when the resolved deck file changes. A failed or timed-out fetch MUST stop startup with an error identifying the theme URL.

#### Scenario: Remote theme fetched once
- **WHEN** preview runs with a remote `theme` and the author saves `metrics.html` twice
- **THEN** the theme URL is fetched only once

#### Scenario: Remote theme refetched on config change
- **WHEN** the author saves the resolved deck file during preview
- **THEN** the remote theme is fetched again before the reload

### Requirement: Dev prints effective configuration
Before starting the preview server, `npm run dev` MUST print the same style of effective-configuration summary as build (working root, deck file, merged fields, slide filter when set).

#### Scenario: Config summary before preview
- **WHEN** the user runs `npm run dev -- --cwd /path/to/deck`
- **THEN** the command prints an effective-configuration summary before the preview URL

### Requirement: Dev help screen
`npm run dev -- --help` MUST print the full Commander help and exit zero.

#### Scenario: Help shows full screen
- **WHEN** the user runs `npm run dev -- --help`
- **THEN** the command prints usage and option descriptions and exits zero

### Requirement: Watch resolved deck file
When preview was started with an explicit `--deck` path, saving that file MUST reload preview even if it is outside `--cwd`.

#### Scenario: Edit resolved deck file refreshes preview
- **WHEN** preview was started with `--deck /tmp/shared.json --cwd /path/to/deck` and the author saves `/tmp/shared.json`
- **THEN** the preview reloads with the re-merged config
