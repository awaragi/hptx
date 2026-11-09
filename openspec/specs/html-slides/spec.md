# html-slides Specification

## Purpose

Defines the per-slide file format authors use: one standalone HTML document per slide, keyed by filename, whose styles and body are harvested into the shell, auto-scoped, and registered without repeating the key.

## Requirements

### Requirement: Slide file is a standalone HTML document
Each slide input MUST be a full HTML document with a `<head>` and a non-empty `<body>`. Assemble MUST harvest, in document order, the `<style>` blocks and inline `<script>` blocks from `<head>`, and the entire `<body>` contents (markup and `<script>` blocks). `<title>`, `<meta>`, and `<link>` elements other than stylesheets MUST be ignored. Stylesheet links and external scripts are governed by the requirement on external references.

#### Scenario: Harvestable slide
- **WHEN** the assembler reads `metrics.html` containing `<head><style>…</style><script>…</script></head><body><div>…</div><script>…</script></body>`
- **THEN** it extracts the style text, the head script, the body markup, and the body script for injection into the shell

#### Scenario: Multiple styles and scripts
- **WHEN** a slide has two `<style>` blocks and two inline scripts in `<head>`, plus two inline scripts in `<body>`
- **THEN** all styles are harvested, and all four scripts are harvested in document order (head scripts first, then body scripts)

#### Scenario: Empty body rejected
- **WHEN** a slide file has no `<body>` or an empty `<body>`
- **THEN** the toolchain fails with an error identifying the file

### Requirement: Filename stem is the slide key
The slide key MUST be the filename without the `.html` extension. Authors MUST NOT be required to write the key in markup, scripts, or CSS.

#### Scenario: Key from filename
- **WHEN** the slide file is `processFlow.html`
- **THEN** the slide’s key is `processFlow`

### Requirement: Assemble wraps the slide section
Assemble MUST wrap each slide’s harvested body in `<section class="slide" data-slide="<key>">`. Authors MUST NOT write that wrapper. The shell, not the slide, MUST set which section is initially active.

#### Scenario: Section generated
- **WHEN** `metrics.html` is assembled
- **THEN** the output contains `<section class="slide" data-slide="metrics">` enclosing that file’s body contents

### Requirement: Slide CSS is auto-scoped
Assemble MUST scope every rule in a slide’s harvested styles to that slide’s section:
- A selector without an anchor MUST be prefixed with `[data-slide="<key>"]` as an ancestor.
- `:scope` (or a top-level `&`) MUST refer to the slide section itself.
- A selector anchored at `html`, `body`, or `:root` (including compound forms) MUST keep the anchor first and receive the scope after it.
- Rules nested in at-rules MUST follow the at-rule scenarios below.

#### Scenario: Plain selector scoped
- **WHEN** `metrics.html` contains `.rail { gap: 12px; }`
- **THEN** the assembled CSS contains `[data-slide="metrics"] .rail { gap: 12px; }`

#### Scenario: Container rule via :scope
- **WHEN** `overview.html` contains `:scope { align-items: stretch; }`
- **THEN** the assembled CSS contains `[data-slide="overview"] { align-items: stretch; }`

#### Scenario: Print-mode anchor preserved
- **WHEN** `overview.html` contains `html.deck-print-mode .slide-title { font-size: 92px; }`
- **THEN** the assembled CSS contains `html.deck-print-mode [data-slide="overview"] .slide-title { font-size: 92px; }`

#### Scenario: Conditional at-rules scoped
- **WHEN** `metrics.html` contains `.rail { gap: 12px; }` inside an `@media` or `@supports` block
- **THEN** the rule inside the block becomes `[data-slide="metrics"] .rail { gap: 12px; }` and the at-rule itself is kept

#### Scenario: Keyframes and font faces untouched
- **WHEN** `metrics.html` contains an `@keyframes` or `@font-face` block
- **THEN** the block appears in the assembled CSS unchanged

### Requirement: Keyless registration
Each slide MUST call the shell’s registration API exactly once as `window.registerSlide({ … })` without a key argument. The call MAY be in a head script or a body script. The shell MUST bind that registration to the slide’s key. A slide with no registration call, or more than one across all of its scripts, MUST fail assemble with an error identifying the file.

#### Scenario: Registration bound to filename
- **WHEN** `metrics.html` calls `window.registerSlide({ title: 'Metrics', icon: 'gauge', boot: fn })`
- **THEN** the shell registers module `metrics` with that title, icon, and boot hook

#### Scenario: Registration in the head
- **WHEN** `metrics.html` calls `window.registerSlide({ … })` in a `<head>` script and its `<body>` contains only markup
- **THEN** assemble succeeds and the shell registers module `metrics`

#### Scenario: Missing registration rejected
- **WHEN** none of a slide file’s scripts contain a `registerSlide` call
- **THEN** assemble fails with an error identifying the file

#### Scenario: Registration split across head and body rejected
- **WHEN** a slide calls `registerSlide` once in a head script and once in a body script
- **THEN** assemble fails with an error identifying the file and the number of calls found

### Requirement: Slide independence
A slide MUST NOT rely on CSS or script defined only in another slide. Styles that apply to a slide’s UI MUST live in that slide’s own `<style>` blocks. Shared utilities MAY be provided by the shell only.

#### Scenario: Duplicate local styles preferred over cross-slide imports
- **WHEN** two slides need the same visual rule
- **THEN** each slide carries its own copy of that rule rather than depending on the other slide’s styles

#### Scenario: Slide renders alone
- **WHEN** a deck is assembled with `--slides` naming only one slide
- **THEN** that slide renders the same as it does in the full deck

### Requirement: Public shell surface only
Slide scripts MUST use only the documented public shell surface (`window.registerSlide` and the `Deck` object passed to `boot`, equivalent to today’s `window.Deck`) for shared behavior.

#### Scenario: Module boots via shell
- **WHEN** the assembled deck loads
- **THEN** each included slide’s boot hook is invoked with the public deck API

### Requirement: Slide scripts are inline classic scripts
Executable slide scripts MUST be inline classic scripts (no `type`, or a JavaScript MIME type). A `<script type="module">` MUST fail assemble with an error identifying the file. Scripts with a non-executable `type` (for example `application/json`) MUST be kept in place as data blocks and MUST NOT be executed or counted as slide scripts.

#### Scenario: Module script rejected
- **WHEN** a slide contains `<script type="module">…</script>`
- **THEN** assemble fails with an error identifying the file and stating that slide scripts must be classic

#### Scenario: JSON data block kept as data
- **WHEN** a slide body contains `<script type="application/json" id="rows">[…]</script>`
- **THEN** the assembled slide section contains that element unchanged and a slide script can read it with `document.getElementById('rows').textContent`

### Requirement: External references rejected except the contract stylesheet
A slide MUST NOT load external resources. A `<link rel="stylesheet">` whose `href` file name is `slide-contract.css` MUST be accepted and removed from the output. Any other stylesheet `<link>`, and any `<script src>`, MUST fail assemble with an error naming the file and the reference, and pointing to `deck.json` `scripts` / `styles`.

#### Scenario: Contract stylesheet link stripped
- **WHEN** a slide head contains `<link rel="stylesheet" href="../shell/contract/slide-contract.css">`
- **THEN** assemble succeeds and the output contains no link to `slide-contract.css`

#### Scenario: External script rejected
- **WHEN** a slide contains `<script src="https://cdn.example.com/chart.js"></script>`
- **THEN** assemble fails with an error naming the slide, the URL, and `deck.json` `scripts`

#### Scenario: Other stylesheet rejected
- **WHEN** a slide head contains `<link rel="stylesheet" href="extra.css">`
- **THEN** assemble fails with an error naming the slide, `extra.css`, and `deck.json` `styles`

### Requirement: Cover file format
A cover file MUST be a standalone HTML document harvested like a slide (head styles and scripts, body markup and scripts, data blocks, contract link stripped, external references rejected, classic scripts only). A cover MUST NOT call `registerSlide`; a cover that does MUST fail assemble with an error naming the file.

#### Scenario: Cover harvested
- **WHEN** `cover.html` (the cover) has a head `<style>` and a body with a logo, headline, and description
- **THEN** assemble places that markup in the home page title block

#### Scenario: Registration in a cover rejected
- **WHEN** the cover file calls `window.registerSlide({ … })`
- **THEN** assemble fails with an error naming the cover file and stating that a cover is not a slide

### Requirement: Cover CSS and scripts are scoped to the title block
Assemble MUST scope the cover’s CSS to the home page title block using the same rules as slide CSS, with `:scope` meaning the title block. The cover’s inline scripts MUST run in one private scope whose `document` lookups (`getElementById`, `querySelector`, `querySelectorAll`, `slideRoot`) search only the title block. The `@keyframes` and markup ID-reference checks MUST include the cover.

#### Scenario: Cover selector scoped
- **WHEN** the cover contains `.title-main { font-size: 92px; }`
- **THEN** the rule applies only inside the home page title block

#### Scenario: Cover script writes into its own markup
- **WHEN** the cover body contains `<span id="today"></span>` and a script sets `document.getElementById('today').textContent`
- **THEN** that span in the title block shows the text, and no element outside the title block is changed
