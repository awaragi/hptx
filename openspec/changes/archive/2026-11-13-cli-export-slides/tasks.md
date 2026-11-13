# Tasks

## 1. Dependencies and CLI wiring

- [x] 1.1 Add `playwright-core` and a small PDF stitcher (e.g. `pdf-lib`) to package dependencies; verify `npm install` succeeds without downloading a browser
- [x] 1.2 Wire `export` into `src/cli/main.ts`, `package.json` scripts, and root help; verify `npx hptx --help` lists `export` and `npx hptx export --help` documents `--format` and `--theme light|dark`

## 2. Export args, paths, and assemble

- [x] 2.1 Implement export arg parsing (`--format png|png-pdf|pdf`, `--theme light|dark` default light, shared deck root/output/slide flags) with Vitest coverage for defaults, invalid format/theme, and one-format-per-run
- [x] 2.2 Implement presentation-name and artifact path helpers from effective `output`; verify Vitest covers `dist/about.html` → PNG dir, png-pdf path, and print PDF path
- [x] 2.3 Assemble via `planAssemble`/`assembleFromPlan` with `requireOutput: true` and a temporary HTTP serve of the HTML; verify unit/integration that missing output fails like build

## 3. Capture formats

- [x] 3.1 Implement Chrome launch via `playwright-core` `channel: 'chrome'` with a clear non-zero error when Chrome is missing; verify the error message in a unit test (mocked launch failure)
- [x] 3.2 Implement PNG capture loop (viewport 1710×1107, appearance theme, hide chrome, each slide × step → `<key>-<step>.png`); verify path naming and step iteration with mocked page/Deck where possible
- [x] 3.3 Implement `--format png-pdf` (PNGs + concat PDF via stitcher) and `--format pdf` (print-mode `page.pdf` to `<name>.pdf`); verify helpers/unit tests for stitch ordering and print output path
- [x] 3.4 Document `hptx export` in README and CLAUDE.md (formats, paths, Chrome prerequisite, `--theme` meaning vs build CSS theme); verify the documented example flags match `--help`

## Workflow follow-up

- Archive the change after review (`/opsx-archive`).
