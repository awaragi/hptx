# slide-scoping Specification

## Purpose
Keeps each slide's scripts and runtime lookups isolated to that slide, so that slides copied from one template, or written independently, can coexist in one deck. Names that must stay global are checked at build time instead of being rewritten.

## Requirements

### Requirement: One script scope per slide
All inline classic scripts of one slide MUST run in a single scope shared by that slide only. Top-level declarations (`var`, `let`, `const`, `function`, `class`) in one script of a slide MUST be visible to the slide's later scripts, and MUST NOT be visible to other slides or create globals.

#### Scenario: Helper shared between a slide's scripts
- **WHEN** `metrics.html` declares `function fmt(n){…}` in a head script and calls `fmt(3)` in a body script
- **THEN** the call succeeds when the deck loads

#### Scenario: Same top-level name in two slides
- **WHEN** `metrics.html` and `process.html` each declare `const data = […]` at the top level of a script
- **THEN** the deck loads without a redeclaration error, and each slide sees its own `data`

#### Scenario: No global leak
- **WHEN** `metrics.html` declares `var total = 5` at the top level
- **THEN** `window.total` is `undefined` in the assembled deck

### Requirement: Slide-scoped document lookups
Inside slide scripts, including code that runs later from `boot`, event handlers, and timers, the name `document` MUST refer to a slide-scoped document. Its `getElementById`, `querySelector`, and `querySelectorAll` MUST return only the slide's section and elements inside it, with the section first when it matches. `:scope` in those selectors MUST match the section.

#### Scenario: Same ID in two slides
- **WHEN** slides `riskA` and `riskB` each contain `<div id="rail">` and each `boot` calls `document.getElementById('rail')`
- **THEN** each slide receives the `rail` element inside its own section

#### Scenario: Lookup from a late event handler
- **WHEN** a click handler registered in `boot` calls `document.getElementById('detail')` after the user clicks
- **THEN** it returns the `detail` element in the handler's own slide

#### Scenario: :scope selector
- **WHEN** a slide script calls `document.querySelectorAll(':scope .card')`
- **THEN** it returns the `.card` elements inside that slide's section only

#### Scenario: Selector matching the section
- **WHEN** a script in `alpha.html` calls `document.querySelector('[data-slide="alpha"]')`
- **THEN** it returns the slide's own section, and the same call for another slide's key returns `null`

### Requirement: Slide root and page document
The slide-scoped document MUST expose `slideRoot`, the slide's section element. All members other than the scoped lookups MUST behave as on the page document (for example `createElement`, `createElementNS`, `body`, `documentElement`, `addEventListener`). `window.document` MUST remain the real page document inside slide scripts.

#### Scenario: Slide root
- **WHEN** a script in `metrics.html` reads `document.slideRoot`
- **THEN** it is the `<section class="slide" data-slide="metrics">` element

#### Scenario: Page-level members unchanged
- **WHEN** a slide script calls `document.body.appendChild(probe)` and `document.createElementNS(svgNs, 'svg')`
- **THEN** the probe is appended to the page body and an SVG element is created, as on the page document

#### Scenario: Page document available
- **WHEN** a slide script calls `window.document.getElementById('navDrawer')`
- **THEN** it returns the shell's navigation drawer element

### Requirement: Animation names are kept as authored
Assemble MUST NOT rename `@keyframes` or references to them. A deck MUST fail assemble if two slides define the same `@keyframes` name with different definitions. Identical definitions in several slides MUST be accepted.

#### Scenario: Identical keyframes in two slides
- **WHEN** `cardsA.html` and `cardsB.html` both define `@keyframes cardGridRise` with the same body
- **THEN** assemble succeeds and the output keeps the name `cardGridRise`

#### Scenario: Conflicting keyframes
- **WHEN** `alpha.html` and `beta.html` both define `@keyframes demoPulse` with different bodies
- **THEN** assemble fails with an error naming `demoPulse` and both slides

### Requirement: Slides define the animations they use
Every animation name used by a slide's CSS (`animation` or `animation-name`) MUST be defined by a `@keyframes` rule in that slide or in the slide contract stylesheet. Otherwise assemble MUST fail with an error naming the slide and the animation name.

#### Scenario: Borrowed animation rejected
- **WHEN** `beta.html` uses `animation: demoPulse 1.8s` but only `alpha.html` defines `@keyframes demoPulse`
- **THEN** assemble fails with an error naming `beta` and `demoPulse`, also when `--slides` includes both slides

#### Scenario: Shell-provided animation accepted
- **WHEN** a slide uses an animation whose `@keyframes` are defined in the slide contract stylesheet
- **THEN** assemble succeeds

### Requirement: HTML ID references are unique across slides
When a slide's markup references an ID through `for`, `href="#…"`, `aria-labelledby`, `aria-describedby`, `aria-controls`, `aria-owns`, or `aria-activedescendant`, that ID MUST be defined in only one slide of the assembled deck. Otherwise assemble MUST fail with an error naming the ID and the slides that define it.

#### Scenario: Shared label target rejected
- **WHEN** `riskA.html` and `riskB.html` both contain `<input id="q">` and `riskA.html` contains `<label for="q">`
- **THEN** assemble fails with an error naming `q`, `riskA`, and `riskB`

#### Scenario: Duplicate IDs without markup references accepted
- **WHEN** two slides both contain `<div id="rail">` and no markup references `rail`
- **THEN** assemble succeeds
