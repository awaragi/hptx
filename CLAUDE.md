# Presentation platform — agent notes

**Direction:** reusable HTML presentation platform (TypeScript + Vite + Vitest
tooling; vanilla HTML/JS shell runtime). Decks are folders with `deck.json` + standalone slide HTML files.
Platform shell template: `shell/template.html`. Public navigation API:
`window.Deck.goToKey('<slideKey>')`.

Design canvas: **1710×1107** (size type and screenshots for this, not the
scaled laptop viewport).

**No commercial branding in the framework:** specs, docs, tests, templates,
examples, and OpenSpec artifacts MUST use only generic placeholders (e.g.
`Acme.`, `Demo`, `Brand.`). Do not use real company, product, or client names
(or their distinctive brand colors) in this repository.

## OpenSpec (required for features)

All features and non-trivial changes go through OpenSpec. See
`.cursor/rules/openspec-required.mdc` and `openspec/`. Slash commands:
`/opsx-propose`, `/opsx-apply`, `/opsx-explore`, `/opsx-archive`.

## Commands

Prefer `npx hptx …` after `npm install` (no `--` before flags). `npm run … --` still works.

```bash
npm install
npx hptx dev --cwd <dir> | --deck <file> [--slide key]... [--output path] [--theme src] ...
npx hptx build --cwd <dir> | --deck <file> [--slide key]... [--output path] [--theme src] ...
npx hptx new deck --cwd <dir> [--title <text>] [--output <path>] ...
npx hptx new slide --cwd <dir> --key <stem> --from <template> [--title <text>] [--after <key>]
npx hptx new --list          # slide templates (browse: npx hptx dev --cwd templates)
npm test
```

Examples: `npx hptx dev --cwd templates`, `npx hptx build --cwd templates --slide cardGrid --slide stepper`,
`npx hptx new deck --cwd decks/demo --title "Demo deck" --output ./Demo.html`,
`npx hptx new slide --cwd decks/demo --key detail --from cardGrid --after overview`.
Require `--cwd` and/or `--deck` (no invocation-dir default). Long option names only.
Relative paths (except `--cwd` / `--deck`) resolve against the working root; absolute paths work everywhere.
Dev prints the Local URL (typically `http://localhost:5173/`).

### `deck.json` (optional; cascade with CLI)

| Field | Required | Meaning |
| --- | --- | --- |
| `version` | yes (in file) | Schema version; current is `1` |
| `output` | for build | Single-file HTML path (file and/or `--output`) |
| `slides` | no | Ordered `*.html` filenames; else discover `*.html` (skipping `output` and `cover`) |
| `cover` | no | HTML file shown as the home page title block (top left, above the keyboard hints); not a slide, not in `slides` |
| `theme` | no | Local CSS path or `https://` URL — appended after shell defaults in theme markers (cascade) |
| `scripts` / `styles` | no | `https://` CDN URLs (string or `{ src, integrity?, crossorigin? }`) |
| `title` | no | Document and top-bar title (default `Presentation`) |
| `brand` | no | Primary shell brand label, exact text (default `Brand.`) |
| `caption` | no | Optional secondary line under `brand` in the top bar / loader |

Unknown top-level fields are rejected. `http://` URLs are rejected.
Effective config: defaults < deck file < CLI flags. `--cwd` sets the working root;
`--deck` names the JSON (else `<cwd>/deck.json` when present).

The shell owns the **home page** (key `agenda`, always first): the cover's
title block, keyboard hints, and agenda tiles built from slide registrations.
Settings → Slides has a pinned **Agenda** toggle (browser setting) that hides
the tiles and centers the title block. `npx hptx new deck --cwd <dir>` writes
`cover.html` + `overview.html`.

---

## Local preview (serve)

### Agent trigger phrases

| User says (examples) | Agent does |
| --- | --- |
| “start serving”, “serve the deck” | `npx hptx dev --cwd <dir>` for the deck they name (ask if unclear; `templates` is the built-in deck). Confirm URL. |
| “stop serving”, “stop the server” | Kill the Vite / node process for that deck. |

### Dev

```bash
npx hptx dev --cwd templates
```

- URL: printed by Vite (e.g. **http://localhost:5173/**)
- Reloads on slide / deck JSON / local theme edits
- Does **not** write `output`

### Build

```bash
npx hptx build --cwd templates
```

Writes the deck’s `output` (atomic). Open via that file path or a static server.

---

## Visual QA with Playwright MCP

Prefer the **Playwright** Cursor plugin / MCP (`@playwright/mcp`) for visual
checks. Do **not** add a project-local Playwright install unless OpenSpec adds one.

### Prerequisites

1. `npx hptx dev --cwd <dir>` is running.
2. Playwright MCP is connected.

### Agent workflow

1. **Resize** to **1710×1107**.
2. **Navigate** to the Vite Local URL.
3. **Go to a slide**: `Deck.goToKey('<key>')`.
4. For explorer slides, interact, then screenshot.
5. **Screenshot** under OS temp (`$TMPDIR` / `%TEMP%`) — never into this
   project folder. Prefer clipping `#deckCanvas` when comparing scaled viewports.
6. Review overflow, clipping, contrast, spacing, theme tokens.

---

## Theme colors (required)

Colors live as CSS custom properties in `DECK THEME` (`:root` /
`html[data-theme="dark"]`) in `shell/contract/slide-contract.css` (default:
Bootstrap 5.3 palette). Names describe
**role**, not hue (e.g. `--brand`, `--accent`, `--bg`, `--text-strong`).

- **Always** use named tokens: `var(--brand)`, `rgba(var(--brand-rgb), .2)`,
  `D.cssVar('--accent')` — never hardcode hex, `rgb()`, or named CSS colors
  in slide CSS/JS (except `transparent` / `currentColor` when needed).
- **Do not** invent new `--*` color tokens without asking first.
- Bake themes via `deck.json` `theme` (appended after defaults in `#deck-theme`);
  Settings (`C`) overrides both. Layers: defaults → bake → override.

## Slide authoring (platform)

The slide contract lives in `shell/contract/`: **`SLIDE-CONTRACT.md`** (rules
the build enforces), `slide-contract.css` (tokens and shared classes),
`slide-contract.d.ts` (`registerSlide`, hooks, `Deck` API). Read it before
writing a slide; start from a template (`npx hptx new`), not from scratch.

- One **standalone HTML document** per slide; filename stem = slide key.
- `<head>`: `<style>` blocks and inline `<script>` blocks (helpers, data,
  `registerSlide({ title, icon, boot })`). `<body>`: markup, plus optional
  inline scripts and JSON data blocks. No key argument; no `<section>` wrapper.
  No `<script src>` / stylesheet links (CDN goes in `deck.json`), except the
  reference link to `slide-contract.css`.
- All of a slide's scripts share one private scope. Inside it `document` is
  slide-scoped: `getElementById` / `querySelector(All)` only see this slide,
  `document.slideRoot` is the section. `window.document` is the page. Pass
  elements, not selector strings, to libraries (`d3.select(document.getElementById('chart'))`).
- Use `:scope` for the slide container; assemble auto-scopes other selectors.
- `@keyframes` names are global and kept as written: same name must mean the
  same definition across slides, and a slide must define every animation it
  uses. IDs referenced from markup (`for`, `href="#…"`, `aria-*`) must be
  unique across slides. The build fails otherwise.
- Speaker notes: `<aside class="notes">` in the slide body (basic HTML, inline
 styles with theme tokens). Hidden on the canvas; `N` opens the shell-styled
 notes window, `⇧N` closes it. One set of notes per slide (no step notes yet).
- Size type for the **1710×1107 canvas**. Prefer rail + detail explorers for
  dense process content (start from `stepper` or `cardGrid`).
- After visual edits: `npx hptx dev --cwd <deck>` → Playwright screenshot.
