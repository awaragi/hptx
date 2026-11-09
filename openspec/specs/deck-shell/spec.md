# deck-shell Specification

## Purpose

Defines the presentation shell that hosts assembled slides: the shell-owned home page, the public registration and `Deck` API, theme markers, script ordering, chrome behavior, and in-browser theme loading.

## Requirements

### Requirement: Shell-owned agenda slide
The shell MUST render a home page (reserved key `agenda`) as the first slide of every assembled deck, regardless of `--slides`. The home page MUST hold a title block, the keyboard hints, and the agenda. The agenda MUST list the included slides in their assembled order using each slide’s registered title, icon, and agenda metadata. The home page MUST NOT be hideable; `H` and `Home` MUST always return to it.

#### Scenario: Agenda present in a filtered deck
- **WHEN** a deck is assembled with `--slides metrics`
- **THEN** the deck contains the home page followed by `metrics`, and the agenda lists only `metrics`

#### Scenario: Agenda uses registered metadata
- **WHEN** `process.html` registers `{ title: 'Process overview', icon: 'trend' }`
- **THEN** the agenda shows a `Process overview` entry with the `trend` icon that navigates to `process`

#### Scenario: Home page without a slide-provided agenda
- **WHEN** a deck has no slide with an agenda container (no `#tocGrid`)
- **THEN** the home page still shows the agenda tiles and keyboard hints

### Requirement: Navigation driven by the included slides
Navigation dots, slide counter, the agenda menu, and Settings → Slides MUST reflect exactly the home page plus the included slides in assembled order. The slide counter total MUST count the visible content slides, not the home page.

#### Scenario: Counter matches subset
- **WHEN** a deck is assembled with `--slides metrics,closing`
- **THEN** the deck has three sections (home page, `metrics`, `closing`) and the slide counter total shows `02`

### Requirement: Public Deck API preserved
The shell MUST expose `window.registerSlide` before any slide script runs, and MUST expose `window.Deck` with at least the members `manifest`, `currentKey`, `cssVar`, `cssVarList`, `icon`, `iconBadge`, `inlineIcon`, `iconPaths`, `openModal`, `closeModal`, `clickerMode`, `rememberSlideStep`, `moveStep`, `stepIndex`, `setStep`, `onThemeRefresh`, `get`, `keyAt`, `goTo`, and `goToKey`. The engine MUST call each registered module’s `boot(Deck)` once after the document is parsed.

#### Scenario: goToKey navigates
- **WHEN** a script calls `Deck.goToKey('metrics')` in a deck that includes `metrics`
- **THEN** the `metrics` slide becomes active

#### Scenario: Boot called once per slide
- **WHEN** the assembled deck loads with three slides
- **THEN** each slide’s `boot` hook runs exactly once

### Requirement: CDN scripts available before boot
CDN `scripts` from `deck.json` MUST be loaded as classic, non-`async`, non-`defer` scripts so that their globals exist before the engine calls any slide’s `boot`. Their position relative to slide `<script>` blocks is not constrained.

#### Scenario: D3 ready at boot
- **WHEN** `deck.json` declares the D3 CDN URL and `metrics` calls `d3.line()` inside `boot`
- **THEN** `boot` runs without a `d3 is not defined` error

### Requirement: Theme markers in an inline style
The shell template MUST contain a dedicated inline `<style id="deck-theme">` holding `DECK THEME — START` and `DECK THEME — END` comment markers around the default tokens (and any appended bake). Those markers MUST survive into dev and build output so runtime Settings and Generate-theme can read the delivery theme from that element. When the region contains multiple `:root` blocks, Generate-theme’s current-baseline map MUST use later `--*` declarations over earlier ones for the same name.

#### Scenario: Markers survive the build
- **WHEN** a deck is built
- **THEN** the output contains `<style id="deck-theme">` with both markers and the theme body between them

#### Scenario: Generate-theme baseline prefers later :root decls
- **WHEN** the deck theme region has the default `:root` with `--brand: #0d6efd` and a later baked `:root` with `--brand: #16a34a`
- **THEN** Generate-theme’s current `:root` baseline reports `--brand` as `#16a34a`

### Requirement: Three-layer theme stack
Theme application MUST follow this order: (1) shell default tokens in `#deck-theme`, (2) baked `deck.json` theme CSS appended in the same marker region when present, (3) Settings override in `#hptxCustomThemeStyle` when applied. Later layers MUST override earlier ones for the same custom properties via CSS cascade.

#### Scenario: Override sits above bake
- **WHEN** a deck has a baked `--brand` and the presenter applies a Settings theme that sets a different `--brand`
- **THEN** the visible brand color is the Settings value until Clear theme restores the baked-over-default look

#### Scenario: Bake sits above defaults
- **WHEN** a deck bakes a theme that sets `--brand` and omits `--text`
- **THEN** `--brand` comes from the bake and `--text` remains the shell default

### Requirement: Cover content in the home page title block
When `deck.json` names a `cover`, the shell MUST render that file’s content in the home page title block (top left, above the keyboard hints). The cover MUST NOT appear as a navigation dot, counter position, agenda tile, nav drawer entry, or Settings → Slides row. When no `cover` is configured, the title block MUST be empty and the rest of the home page MUST render normally.

#### Scenario: Cover shown on the home page
- **WHEN** `deck.json` sets `"cover": "cover.html"` and that file’s body contains `<h1 class="title-main">Q3<br><span>review.</span></h1>`
- **THEN** the home page title block shows that headline and the agenda lists no `cover` entry

#### Scenario: No cover configured
- **WHEN** `deck.json` has no `cover` field
- **THEN** the home page title block is empty, and the keyboard hints and agenda are shown

### Requirement: Agenda toggle
Settings → Slides MUST show an **Agenda** checkbox above all slide groups. Unchecking it MUST hide the agenda tiles on the home page and center the title block and keyboard hints on the canvas; the home page MUST remain index 0 and reachable with `H`. The choice MUST be stored per browser like hidden slides, and **Show all** MUST turn the agenda back on. The agenda menu (`M` / `⇧M`) MUST keep working when the agenda is off.

#### Scenario: Turn the agenda off
- **WHEN** a presenter unchecks **Agenda** in Settings → Slides
- **THEN** the home page shows only the title block and keyboard hints, centered, and `←`/`→` on the home page highlight nothing

#### Scenario: Setting persists
- **WHEN** the agenda was turned off and the page is reloaded in the same browser
- **THEN** the home page still shows no agenda tiles

#### Scenario: Show all restores the agenda
- **WHEN** the agenda is off and the presenter clicks **Show all** in Settings → Slides
- **THEN** the agenda tiles are shown again on the home page

#### Scenario: Drawer still available
- **WHEN** the agenda is off and the presenter presses `M` on a content slide
- **THEN** the agenda drawer opens with the visible slides

### Requirement: Shell chrome behavior
The shell MUST provide this user-visible chrome behavior: keyboard navigation and shortcuts (arrows, Page Up/Down, `M`, `⇧M`, `H`, `F`, `T`, `C`), a light/dark theme toggle control on the home page (hidden on content slides; `T` still works when not theme-locked), print mode, hidden slides (Settings → Slides, stored per browser), clicker mode, remember-slide-step, and the Settings modal including Generate theme.

#### Scenario: Home shortcut
- **WHEN** the presenter presses `H` on any content slide
- **THEN** the home page becomes active

#### Scenario: Hidden slide skipped
- **WHEN** a slide is hidden in Settings → Slides
- **THEN** forward navigation skips it and the agenda omits it

### Requirement: Theme toggle visible on home only
The shell’s light/dark theme toggle control MUST be visible only while the home page (`agenda`) is the current slide, and only when `--deck-theme-toggle-display` is not `none`. On content slides the control MUST be hidden. Keyboard `T` MUST still toggle the theme on every slide when the token is not `none`. When the token is `none`, the control MUST stay hidden (including on home) and `T` MUST be disabled.

#### Scenario: Hidden on a content slide
- **WHEN** the presenter navigates from the home page to a content slide and the theme allows the toggle
- **THEN** the theme toggle control is not visible and pressing `T` still switches light/dark

#### Scenario: Visible on home
- **WHEN** the presenter is on the home page and `--deck-theme-toggle-display` is not `none`
- **THEN** the theme toggle control is visible

#### Scenario: Theme lock still disables T
- **WHEN** the active theme sets `--deck-theme-toggle-display: none`
- **THEN** the toggle is hidden on the home page and `T` does not change the theme

### Requirement: Neutral default palette
The shell's default theme tokens MUST be a neutral palette that names no client: Bootstrap 5.3's default light and dark body, surface, border, and text colors, Bootstrap primary blue for `--brand`, and Bootstrap's standard colors for the accent roles. Settings text (Generate theme prompt and Instructions) MUST NOT name a specific client or product.

#### Scenario: Default look without a theme
- **WHEN** a deck with no `theme` is built
- **THEN** the deck theme region sets `--brand` to Bootstrap primary (`#0d6efd`)

#### Scenario: Neutral Settings text
- **WHEN** a presenter opens Settings → Generate theme or Instructions
- **THEN** the text names no specific client, company, or product

### Requirement: Runtime theme loading
Settings MUST let a presenter load (file picker) or paste any theme CSS file and apply it in the browser for preview as the third theme layer (on top of defaults and any bake). Loaded, pasted, and stored themes MUST be applied as written, without renaming tokens. Settings → Instructions MUST describe delivering a theme through the `deck.json` `theme` field and a build, and MUST note that bake appends over defaults while Settings overrides both.

#### Scenario: Load a theme file in Settings
- **WHEN** a presenter opens Settings during preview and loads a theme CSS file that sets `--brand`
- **THEN** the deck re-renders with those theme tokens without rebuilding

#### Scenario: Other token names are not renamed
- **WHEN** a presenter pastes a theme that sets `--primary` but not `--brand`
- **THEN** Settings rejects it because `--brand` is missing

#### Scenario: Instructions describe the deck.json flow
- **WHEN** a presenter opens Settings → Instructions
- **THEN** the text explains setting `theme` in `deck.json` and building the deck

### Requirement: URL deep link for slide and step
The shell MUST keep the browser URL query in sync with the current slide and that slide’s in-slide step using `history.replaceState` (not `pushState`). The slide is encoded as `slide=<data-slide key>` (existing numeric shorthand for the Nth visible content slide MAY still be accepted on read). The current step is encoded as `step=<zero-based index>`. The shell MUST omit `slide` on the home page (`agenda`) and MUST omit `step` when the index is `0` or the active slide has no steps. On load, when `slide` and/or `step` are present and valid, the shell MUST restore that slide and step. Invalid or out-of-range `step` MUST be clamped to a valid index for that slide’s `stepCount`. Navigating to another slide MUST continue to use landing vs remembered in-session step as already defined by remember-slide-step; the URL MUST then reflect only the newly current slide’s step.

#### Scenario: Step updates while scrubbing
- **WHEN** the presenter is on a multi-step slide and advances to step index `2`
- **THEN** the URL query includes `slide` for that slide’s key and `step=2`

#### Scenario: Step omitted at zero
- **WHEN** the presenter is on a multi-step slide at step index `0`
- **THEN** the URL has no `step` query parameter

#### Scenario: Reload restores step
- **WHEN** the page loads with `?slide=process&step=2` and `process` has at least three steps
- **THEN** `process` is active and its step index is `2`

#### Scenario: Cross-slide navigation ignores prior URL step
- **WHEN** the URL shows `?slide=process&step=2` and the presenter navigates to another multi-step slide
- **THEN** the destination lands on its landing step or remembered in-session step per remember-slide-step, and the URL’s `step` matches that destination’s current step (omitted when `0`)
