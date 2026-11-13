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
For `--format png` and as the raster source for `--format png-pdf`, export MUST navigate every included slide in assembled order (home `agenda` first, then content slides). Each filename MUST begin with a zero-based slide index (agenda is `0`) zero-padded to the digit width of `slideCount - 1` so lexical sort matches deck order, then a hyphen. For content slides with `stepCount > 0`, export MUST capture every in-slide step index from `0` through `stepCount - 1` as `<paddedSlide>-<slideKey>-<paddedStep>.png`, with the step segment zero-padded to the digit width of `stepCount - 1`. When a content slide has no steps (`stepCount` is `0` or unset), export MUST capture exactly one frame named `<paddedSlide>-<slideKey>.png` (no step suffix). The shell-owned home page (`agenda`) MUST be captured as exactly one frame (`<paddedSlide>-agenda.png`, with index `0`) even when its tile highlight `stepCount` is greater than zero. Each frame MUST be a PNG of the design canvas at **1710×1107**, written under `<dirname(output)>/<name>/png/`.

#### Scenario: Multi-step slide writes multiple PNGs
- **WHEN** a three-slide deck’s third slide key `agent` has `stepCount` 3 and format is `png`
- **THEN** export writes `2-agent-0.png`, `2-agent-1.png`, and `2-agent-2.png` under `<name>/png/`

#### Scenario: Zero-step slide has no step suffix
- **WHEN** a three-slide deck’s second slide key `blank` has no steps and format is `png`
- **THEN** export writes `1-blank.png`

#### Scenario: Agenda home is a single frame with index 0
- **WHEN** the home page `agenda` has a tile `stepCount` greater than 1 and format is `png`
- **THEN** export writes only `0-agenda.png` for that slide (padded if the deck needs more digits)

#### Scenario: Slide index padding sorts past nine slides
- **WHEN** a deck has 11 slides (indices 0 through 10) and format is `png`
- **THEN** filenames use two-digit prefixes such as `00-agenda.png` and `10-<key>….png` so lexical order matches capture order

#### Scenario: Step index padding sorts past nine steps
- **WHEN** a slide has `stepCount` 11 and format is `png`
- **THEN** that slide’s frames use two-digit step suffixes such as `<paddedSlide>-<key>-00.png` and `<paddedSlide>-<key>-10.png`

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
`hptx export --help` MUST document `--cwd`, `--deck`, `--slide`, `--output`, `--format`, `--theme` (`light|dark`), `--progress`, and other shared deck field flags that export accepts. Before capturing, export MUST print an effective-configuration style summary including format, appearance theme, presentation name, and output artifact path(s).

#### Scenario: Help lists format and theme
- **WHEN** a developer runs `npx hptx export --help`
- **THEN** the help text names `--format`, `--theme light|dark`, and `--progress`

### Requirement: Capture settles without transition ghosts
For PNG capture (`png` / `png-pdf`), export MUST disable slide enter/leave transitions and in-slide reveal transitions/animations for the capture session, MUST wait until the target slide is the active slide before writing that slide’s frames, and MUST apply each `setStep` before screenshotting so frames are not mid-fade.

#### Scenario: First content slide has no agenda ghost
- **WHEN** export navigates from `agenda` to the first content slide and writes that slide’s first PNG
- **THEN** the frame shows only that content slide (no overlapping agenda content from a mid-transition)

#### Scenario: Stepped reveals match the requested step
- **WHEN** a content slide reveals items via CSS transitions on step change and export writes step index `k`
- **THEN** that PNG shows the fully applied step-`k` state (not the previous step or a faded-in intermediate)

### Requirement: Optional progress logging
When `--progress` is set and the format writes PNG frames (`png` or `png-pdf`), export MUST print one line per written frame. For a slide with export steps, the line MUST include `(s/S - n/N)` where `s`/`S` are the one-based current and total slide counts and `n`/`N` are the one-based current step and that slide’s `stepCount`, plus the frame filename. For a slide with no export steps (including `agenda`), the line MUST include `(s/S)` and the unsuffixed filename (no `- n/N` step counters). When `--progress` is omitted, export MUST NOT print those per-frame lines. For `--format pdf`, `--progress` MAY print a single line naming the print PDF path.

#### Scenario: Progress shows per-slide step counters
- **WHEN** export runs with `--progress --format png` and writes the second step of a 5-step slide that is the second of 3 slides
- **THEN** the log line contains `(2/3 - 2/5)` and that step’s filename

#### Scenario: Progress omits step counters for no-step slides
- **WHEN** export runs with `--progress` and captures a no-step slide or `agenda`
- **THEN** the log line is of the form `(s/S) <paddedIndex>-<key>.png` without a `- n/N` segment

#### Scenario: Progress off by default
- **WHEN** export runs without `--progress`
- **THEN** it does not print per-frame progress lines
