# Spec Delta

## Purpose

Exports an assembled deck to design-canvas PNG frames and PDF artifacts for automated visual evaluation, using system Chrome without shipping a browser.

## ADDED Requirements

### Requirement: Explicit deck root and required output for export
`hptx export` MUST require `--cwd <dir>` and/or `--deck <file>` using the same working-root and deck-file resolution rules as build. It MUST require an effective `output` path (deck file and/or `--output`) so the presentation name is defined. When the root or output is missing, the command MUST exit non-zero with usage that names those requirements.

#### Scenario: Missing cwd and deck fails
- **WHEN** a developer runs `npx hptx export` with neither `--cwd` nor `--deck`
- **THEN** the command exits non-zero and prints usage that names those flags

#### Scenario: Missing output fails
- **WHEN** a developer runs `npx hptx export --cwd <dir>` for a deck that has no `output` and no `--output`
- **THEN** the command exits non-zero naming that output is required

### Requirement: Presentation name matches HTML output stem
The presentation name MUST be the filename stem of the effective HTML `output` path (for example `dist/about.html` → `about`). All export artifact paths for that run MUST use this name.

#### Scenario: Name derived from output
- **WHEN** the effective output path ends with `about.html`
- **THEN** export writes under paths that use the presentation name `about`

### Requirement: One format per run
`hptx export` MUST accept exactly one `--format` value among `png`, `png-pdf`, and `pdf`. Omitting `--format` MUST default to `png`. An unknown or repeated format MUST fail.

#### Scenario: Default format is png
- **WHEN** a developer runs a valid export without `--format`
- **THEN** the run behaves as `--format png`

#### Scenario: Unknown format fails
- **WHEN** a developer runs export with `--format webp`
- **THEN** the command exits non-zero without writing export artifacts

### Requirement: Appearance theme flag
`hptx export` MUST accept `--theme light|dark` controlling the shell presentation appearance (`data-theme`) for the capture session. The default MUST be `light`. This flag MUST NOT mean CSS theme-file bake (bake still comes from effective deck theme as in build). An invalid value MUST fail.

#### Scenario: Default appearance is light
- **WHEN** export runs without `--theme`
- **THEN** captures use the light presentation appearance

#### Scenario: Dark appearance
- **WHEN** export runs with `--theme dark`
- **THEN** captures use the dark presentation appearance

### Requirement: PNG frame capture for each slide and step
For `--format png` and as the raster source for `--format png-pdf`, export MUST navigate every included slide in assembled order (home `agenda` first, then content slides) and, for each slide, every in-slide step index from `0` through `stepCount - 1`. When `stepCount` is `0` or unset, export MUST capture exactly one frame at step `0`. Each frame MUST be a PNG of the design canvas at **1710×1107**, named `<slideKey>-<stepId>.png`, written to `dist/<name>/png/` relative to the working root’s usual `dist` layout beside the HTML output directory conventions (same directory as the HTML output’s parent): specifically `<dirname(output)>/<name>/png/<slideKey>-<stepId>.png` when output is `<dirname>/<name>.html`.

#### Scenario: Multi-step slide writes multiple PNGs
- **WHEN** a slide key `agent` has `stepCount` 3 and format is `png`
- **THEN** export writes `agent-0.png`, `agent-1.png`, and `agent-2.png` under `<name>/png/`

#### Scenario: Zero-step slide still writes step 0
- **WHEN** a slide key `blank` has no steps and format is `png`
- **THEN** export writes `blank-0.png`

### Requirement: png-pdf concatenates PNG frames
When `--format png-pdf`, export MUST write the same PNG set as `png`, then write a single PDF at `<dirname(output)>/<name>/png/<name>.pdf` whose pages are those PNGs in capture order (one page per PNG, 1710×1107).

#### Scenario: png-pdf writes PNGs and concat PDF
- **WHEN** export runs with `--format png-pdf` for presentation `about`
- **THEN** the PNG directory contains the frame files and `about.pdf` built from those frames in order

### Requirement: pdf format uses print layout
When `--format pdf`, export MUST produce a print-mode PDF at `<dirname(output)>/<name>.pdf` (sibling to the HTML output), using the shell’s print layout (chrome hidden, slides as 1710×1107 frames), not the PNG-concat path.

#### Scenario: Print PDF path
- **WHEN** export runs with `--format pdf` and output `dist/about.html`
- **THEN** the command writes `dist/about.pdf` via print layout

### Requirement: System Chrome via Playwright core
Export MUST launch browsing with Playwright’s library against an already-installed Google Chrome (`channel` chrome or equivalent). It MUST NOT download or vendor Chromium as part of the package install. If Chrome cannot be launched, export MUST exit non-zero with an error that states Chrome is required and that no bundled browser is provided.

#### Scenario: Missing Chrome fails clearly
- **WHEN** export cannot launch system Chrome
- **THEN** the process exits non-zero and the error message names missing Chrome (and does not silently skip)

### Requirement: Shared assemble semantics for export
Export MUST assemble with the same slide resolution, harvesting, CSS scoping, registration binding, theme bake, and CDN tags as build (including `--slide` filter order). Export MAY serve the assembled HTML over a local HTTP URL for capture so CDN assets load. Export MUST NOT be required to leave the HTML `output` file written, but MUST still require the effective output path for naming.

#### Scenario: Slide filter applies
- **WHEN** export is invoked with `--slide overview --slide detail`
- **THEN** only the home page plus those slides (in CLI order) are captured

### Requirement: Export help and effective configuration
`hptx export --help` MUST document `--cwd`, `--deck`, `--slide`, `--output`, `--format`, `--theme` (`light|dark`), and other shared deck field flags that export accepts. Before capturing, export MUST print an effective-configuration style summary including format, appearance theme, presentation name, and output artifact path(s).

#### Scenario: Help lists format and theme
- **WHEN** a developer runs `npx hptx export --help`
- **THEN** the help text names `--format` and `--theme light|dark`
