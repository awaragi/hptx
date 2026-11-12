# Design

## Context

See proposal.md for motivation. Build already requires `output` and assembles one HTML document with every slide as `<section class="slide" data-slide="…">` inside `#deckCanvas` (1710×1107). The shell exposes `Deck.goToKey`, `Deck.setStep`, and print mode (`deck-print-mode` / `beforeprint`). There is no project Playwright dependency today; agent QA uses the Cursor Playwright MCP against `hptx dev`.

CLI today: `build` | `dev` | `new` via Commander in `src/cli/`. Shared deck flags live in `args.ts`; `--theme` there means **CSS theme source**, which conflicts with export’s appearance flag name.

## Goals / Non-Goals

**Goals:**

- One `hptx export` command producing `png`, `png-pdf`, or `pdf` (one format per run).
- Faithful present-mode PNGs at design size for each slide × step; print PDF via existing print layout.
- Light Playwright footprint: `playwright-core` + system Chrome only.

**Non-Goals:**

- Bundled Chromium / `npx playwright install` as part of `npm install`.
- Capturing every explorer interaction beyond shell steps.
- Diff / golden-image CI framework (export only produces artifacts).
- Changing shell print CSS or slide contract beyond what export needs to drive.

## Decisions

### 1. Assemble then serve over localhost

Reuse `planAssemble` / `assembleFromPlan` with `requireOutput: true`. Serve the HTML string from a short-lived Node HTTP server (or Vite middleware equivalent) so CDN `scripts`/`styles` load. Do not rely on `file://`.

**Alternatives:** Write `output` then open the file — works offline for baked assets but CDN slides break. Rejected as default.

### 2. Presentation name = HTML stem

`path.parse(outputPath).name` (e.g. `dist/about.html` → `about`). Artifact roots:

| Format | Path |
|--------|------|
| png | `<dir(output)>/<name>/png/<key>-<step>.png` |
| png-pdf | same PNGs + `<dir(output)>/<name>/png/<name>.pdf` |
| pdf | `<dir(output)>/<name>.pdf` |

### 3. Capture loop (png / png-pdf)

```
viewport 1710x1107 (device scale 1)
set data-theme from --theme (light|dark)
hide shell chrome for clean frames (header, dots, arrows, counter, progress) via evaluate/CSS — slides only
for key in Deck.manifest / DOM order:
  Deck.goToKey(key)
  n = max(stepCount, 1)  // 0 steps → one frame at 0
  for step in 0..n-1:
    Deck.setStep(key, step)
    wait for paint / fonts
    screenshot #deckCanvas → <key>-<step>.png
```

Prefer clipping `#deckCanvas` with viewport locked to 1710×1107 so CSS `scale()` is 1.

**Chrome UI:** Hide presentation chrome for PNG export so evaluation targets slide content. Print PDF already hides chrome via print mode.

### 4. Print PDF (`--format pdf`)

Enter the shell’s print path (trigger `beforeprint` / `deck-print-mode` or call the same layout hooks), then `page.pdf` with page size matching 1710×1107 (or CSS pixels mapped to inches). Do not stitch PNGs for this format.

### 5. `png-pdf` stitching

After PNGs exist, build a PDF with one image page per PNG (e.g. `pdf-lib`). Keep dependency small and TypeScript-friendly.

### 6. Playwright: `playwright-core` + `channel: 'chrome'`

Add `playwright-core` as a dependency (or optionalDependency with hard fail if missing). Launch:

```ts
chromium.launch({ channel: 'chrome', headless: true })
```

On failure, exit with a message like: `export requires Google Chrome installed (playwright-core channel "chrome"); this package does not download a browser.`

Do not add full `playwright` or browser download scripts to `prepare`.

### 7. Export CLI `--theme` vs build `--theme`

Export’s `--theme` MUST mean `light|dark` only. CSS theme bake continues from deck.json / a separate future flag if needed. Implementation: export uses its own Commander program (or overrides) and MUST NOT pass appearance `light|dark` into `resolveThemeSource`. Document the difference in help text: `--theme <light|dark>  presentation appearance (default: light)`.

### 8. Tests

- Unit: arg parsing (format, theme, name derivation, paths), help/root command registration — no Chrome required.
- Optional integration marked/skip when Chrome missing; unit tests never require Chrome.

## Risks / Trade-offs

- [Chrome channel differs by OS/install] → Clear error; document Google Chrome requirement (not Chromium-only installs unless channel resolves).
- [`--theme` name collision with build CSS theme] → Separate parsers; help text disambiguates; bake unchanged.
- [Animations / CDN race] → Wait for `networkidle` or fonts + short settle; document flaky CDN as operator environment issue.
- [Hidden slides / Settings localStorage] → Fresh profile / ignore persisted hide state so export matches assembled set.
- [pdf-lib vs print PDF size] → Accept two different PDF products by design.

## Migration Plan

No deck file changes. Authors run `npx hptx export --cwd <deck> --format png` after `npm install` with Chrome present. Rollback: remove the subcommand and dependency; leftover `dist/<name>/png` artifacts are harmless.

## Open Questions

None deferred — appearance flag name, paths, formats, and Chrome policy are fixed by product decisions above.
