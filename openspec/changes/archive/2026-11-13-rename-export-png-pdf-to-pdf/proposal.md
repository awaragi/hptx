# Proposal

## Why

`--format pdf` currently means print-layout PDF while the PNG-concat path is awkwardly named `png-pdf`. Renaming so `pdf` means the raster/PNG-concat PDF and `print` means the shell print-layout PDF makes the CLI match what authors expect.

## What Changes

- **BREAKING**: Rename export format `png-pdf` → `pdf` (same behavior: PNG frames + concatenated PDF under `<name>/png/<name>.pdf`). No `png-pdf` alias.
- **BREAKING**: Rename export format `pdf` (print layout) → `print` (same behavior: shell print mode → `dist/<name>.pdf`). No old-`pdf` alias for print layout.
- Final `--format` set: `png` | `pdf` | `print` (default still `png`).
- Update README, CLAUDE.md, and export `--help` for the new names. Mention that interactive print-layout PDF also works via the browser/HTML print function (Cmd/Ctrl+P) on preview or built HTML.
- Platform (engine/tooling) only — no deck content migration. Callers of `--format png-pdf` or print `--format pdf` must update flags.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `deck-export`: Format enum becomes `png` | `pdf` | `print`; `pdf` is the former `png-pdf` path; `print` is the former print-layout `pdf` path; docs/help updated accordingly.

## Impact

- CLI: `src/cli/exportArgs.ts`, `export.ts`, `exportCapture.ts`, `exportPaths.ts` (naming only as needed), related Vitest tests
- Docs: `README.md`, `CLAUDE.md`, and other export format mentions
- Specs: delta against `deck-export` from change `cli-export-slides` (complete, not yet archived — archive/sync order should land this after that capability exists in main specs)
- Shell print mode unchanged; only the CLI format name for that path changes
