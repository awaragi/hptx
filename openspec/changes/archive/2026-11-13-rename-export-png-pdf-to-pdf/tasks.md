# Tasks

## 1. CLI format rename

- [x] 1.1 Update `ExportFormat` and arg parsing to accept `png` | `pdf` | `print` (reject `png-pdf`); update help/usage strings; verify `exportArgs` Vitest covers defaults, `pdf`, `print`, and rejection of `png-pdf` / unknown formats
- [x] 1.2 Wire `export.ts` / `exportCapture.ts` so `pdf` runs PNG+stitch and `print` runs print-layout capture; verify related unit tests (paths/stitch/args) name the new formats and still expect the same artifact paths

## 2. Docs

- [x] 2.1 Update README and CLAUDE.md export docs to `png|pdf|print`, describe each format, and mention Cmd/Ctrl+P as an interactive print-layout option; verify the documented example commands match the new names

## Workflow follow-up

- Archive `cli-export-slides` (or sync `deck-export` into main specs) before or with archiving this change so the delta applies cleanly.
- Archive this change after implementation and review.
