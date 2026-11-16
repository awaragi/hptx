# Design

## Context

The template library is a normal deck (`templates/`) with `catalog.json` describing each slide and any CDN `scripts` / `styles`. `d3Chart` already shows the pattern: declare CDN URLs in catalog + `deck.json`, call the global from `boot`, pass elements (not selector strings) to libraries. `new slide` merges catalog CDN entries into the target deck. Copy-safety tests ban hardcoded colors in template HTML; CDN theme CSS may use its own palette. See proposal.md for motivation; see the `slide-templates` delta for required behavior.

## Goals / Non-Goals

**Goals:**

- One new template (`codeTree.html`) that feels like a small IDE: tree + highlighted code.
- Demo content adapted from this repo (deck config, shell/contract snippets, assemble helpers) with generic placeholder branding only.
- Scrollable code pane sized for the 1920×1080 canvas; tree click (and optional ←/→ steps) switches files.
- Catalog + deck CDN wiring so `npx hptx new slide --from codeTree` pulls dependencies automatically.

**Non-Goals:**

- Real filesystem browsing or live editing.
- Shipping highlight.js inside the repo or npm dependencies.
- New shell APIs, color tokens, or assemble changes.
- Perfect light/dark parity for every syntax token (CDN theme may stay fixed or swap between two CDN themes).

## Decisions

1. **Library: highlight.js via jsDelivr**  
   Use a pinned `highlight.js` build script plus one or two theme stylesheets (e.g. github / github-dark). Alternative considered: Prism.js — similar, but highlight.js auto-language helpers and the existing jsDelivr habit match `d3Chart`. Shiki needs heavier ESM/WASM and is a poor fit for classic non-async CDN scripts before `boot`.

2. **Layout: tree rail + code pane**  
   Mirror `stepper` / `d3Chart` rail+detail: left column file tree (folders + files), right column header (path + language) and a `pre`/`code` area with `overflow: auto`. Chrome uses theme tokens (`--panel`, `--line`, `--text-*`, `--brand`); syntax colors come from the CDN theme CSS so the slide HTML stays copy-safe.

3. **Data: JSON block of files**  
   Embed a `application/json` block: `{ path, language, code }[]` plus optional folder grouping for the tree. Snippets are short excerpts from project sources (e.g. `deck.json` shape, a slide HTML fragment, a small JS `registerSlide` boot, TypeScript/JSON, CSS tokens) — not full files. Authors edit the JSON to reuse the template.

4. **Navigation**  
   Clicking a tree file paints that snippet. Optionally map files to shell steps (`stepCount = files.length`, `setStep` selects file) so ←/→ also walk the tree, consistent with `stepper` / `d3Chart`. Prefer both click and steps.

5. **Theme refresh**  
   If two CDN themes are linked, toggle which stylesheet is enabled (or swap `link` href) inside `D.onThemeRefresh` based on `html[data-theme]`. If only one theme is used, document that syntax colors stay fixed while chrome tokens still follow Settings. Prefer dual CDN themes when both URLs are easy to declare in catalog `styles`.

6. **Highlight call site**  
   After injecting text into the `code` element, call `hljs.highlightElement(el)` (or equivalent) on the element reference — never pass a selector string. Guard if `window.hljs` is missing so assemble/JSDOM tests without CDN still boot.

## Risks / Trade-offs

- **[Risk] CDN theme hex colors vs brand tokens** → Accept for syntax palette; keep panel chrome on tokens. Do not invent new `--*` color tokens.
- **[Risk] Long snippets overflow awkwardly** → Cap demo length; rely on `overflow: auto` on the code pane; size for Full HD.
- **[Risk] Offline / missing CDN** → Same as D3: template comments note the catalog dependency; guard `hljs` so boot does not throw.
- **[Risk] Spec list vs test list drift (`photoStrip`)** → Update starter list and `templates.test.ts` expected keys together.

## Migration Plan

No migration for existing decks. Template deck gains one slide; authors opt in with `npx hptx new slide --from codeTree`. Rollback = remove the slide file, catalog entry, deck slide list entry, and unused CDN URLs.
