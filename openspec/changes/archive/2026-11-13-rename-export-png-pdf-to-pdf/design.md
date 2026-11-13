# Design

## Context

See proposal.md for motivation. Change `cli-export-slides` already implements three formats (`png`, `png-pdf`, `pdf`) with paths and capture logic in `src/cli/exportArgs.ts`, `exportPaths.ts`, `exportCapture.ts`, and `export.ts`. This change is a rename-only CLI surface update: same capture and artifact paths, new format tokens.

## Goals / Non-Goals

**Goals:**

- Expose `--format png|pdf|print` with behavior: `pdf` = former `png-pdf`, `print` = former print-layout `pdf`.
- Keep artifact paths unchanged (`…/png/<name>.pdf` for concat; `<dir>/<name>.pdf` for print layout).
- Update help and operator docs; note Cmd/Ctrl+P as an interactive print-layout option.

**Non-Goals:**

- Changing PNG capture, stitcher, or print-layout capture implementation beyond format string branches.
- Keeping aliases for `png-pdf` or old print-as-`pdf`.
- Changing shell print CSS / `deck-print-mode`.

## Decisions

1. **No aliases** — Reject `png-pdf` and treat bare legacy print-as-`pdf` as the new concat format (breaking for anyone who meant print layout). Rationale: short-lived CLI; clearer failure than silent wrong output. Alternative considered: temporary aliases — rejected to avoid two names forever.

2. **Type and path field names** — Prefer updating `ExportFormat` and call sites to `'png' | 'pdf' | 'print'`. Internal path helpers may keep names like `pngPdfPath` / `printPdfPath` if that reduces churn; rename only if it clarifies. Theme bake / appearance (`--theme light|dark`) unchanged.

3. **Docs** — README export table, CLAUDE.md command blurb, and Commander `--format` / usage strings all say `png|pdf|print`. One short note that HTML print still works for interactive print layout.

## Risks / Trade-offs

- [Breaking rename] → Callers of `png-pdf` or print `pdf` must switch; mitigate with clear help/error listing valid formats.
- [Semantic flip of `pdf`] → Someone who used `--format pdf` for print layout now gets PNG-concat PDF; mitigate by documenting `print` prominently and in the breaking notes of the change.

## Migration Plan

1. Land code + docs in the same change.
2. Archive after `cli-export-slides` (or sync so `deck-export` exists in main specs before/with this delta).
3. No rollback aliases; revert the commit if needed.
