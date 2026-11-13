# Spec Delta

## ADDED Requirements

### Requirement: Settings modal four tabs
The Settings modal MUST expose exactly four top-level tabs, in order: **Theme**, **Slides**, **Playback**, and **Reset**. The **Theme** tab MUST include the apply/load/clear theme controls, the Generate theme prompt (with copy), and the bake-into-build instructions as sections in that one panel (not separate top-level tabs). The **Playback** tab MUST hold clicker mode and remember-last-step. Feature behavior of each control MUST match the prior Settings modal.

#### Scenario: Four top-level tabs
- **WHEN** a presenter opens Settings (`C`)
- **THEN** the tab list shows Theme, Slides, Playback, and Reset and no separate Generate theme or Instructions tabs

#### Scenario: Theme sections on one tab
- **WHEN** the presenter selects the Theme tab
- **THEN** that panel shows apply theme controls, the Generate theme prompt, and bake instructions without changing tabs

#### Scenario: Playback holds former Navigation prefs
- **WHEN** the presenter selects the Playback tab
- **THEN** clicker mode and remember-last-step controls are available there

## MODIFIED Requirements

### Requirement: Shell chrome behavior
The shell MUST provide this user-visible chrome behavior: keyboard navigation and shortcuts (arrows, Page Up/Down, `M`, `⇧M`, `H`, `F`, `T`, `C`, `N`, `⇧N`, `S`, `⇧S`), a light/dark theme toggle control on the home page (hidden on content slides; `T` still works when not theme-locked), a speak-timer toggle beside the theme control on the home page (same home-only visibility as the theme toggle; `S` / `⇧S` still work on every slide), print mode, hidden slides (Settings → Slides, stored per browser), clicker mode, remember-slide-step, the speaker notes window (`N` opens, focuses, or reconnects it; `⇧N` closes it), speak-timer mode (`S` toggles and persists; `⇧S` resets the current slide clock while mode stays on), and the Settings modal including Generate theme (under Settings → Theme). The home page keyboard hints MUST list `N` and `S`.

#### Scenario: Home shortcut
- **WHEN** the presenter presses `H` on any content slide
- **THEN** the home page becomes active

#### Scenario: Hidden slide skipped
- **WHEN** a slide is hidden in Settings → Slides
- **THEN** forward navigation skips it and the agenda omits it

#### Scenario: Notes hint on home
- **WHEN** the presenter is on the home page
- **THEN** the keyboard hints include `N` for the speaker notes window

#### Scenario: Timer hint on home
- **WHEN** the presenter is on the home page
- **THEN** the keyboard hints include `S` for speak-timer mode

### Requirement: Neutral default palette
The shell's default theme tokens MUST be a neutral palette that names no client: Bootstrap 5.3's default light and dark body, surface, border, and text colors, Bootstrap primary blue for `--brand`, and Bootstrap's standard colors for the accent roles. Settings text (Generate theme prompt and bake instructions under Settings → Theme) MUST NOT name a specific client or product.

#### Scenario: Default look without a theme
- **WHEN** a deck with no `theme` is built
- **THEN** the deck theme region sets `--brand` to Bootstrap primary (`#0d6efd`)

#### Scenario: Neutral Settings text
- **WHEN** a presenter opens Settings → Theme and views the Generate theme prompt or bake instructions
- **THEN** the text names no specific client, company, or product

### Requirement: Runtime theme loading
Settings MUST let a presenter load (file picker) or paste any theme CSS file and apply it in the browser for preview as the third theme layer (on top of defaults and any bake). Loaded, pasted, and stored themes MUST be applied as written, without renaming tokens. Settings → Theme MUST include bake instructions that describe delivering a theme through the `deck.json` `theme` field and a build, and MUST note that bake appends over defaults while Settings overrides both.

#### Scenario: Load a theme file in Settings
- **WHEN** a presenter opens Settings during preview and loads a theme CSS file that sets `--brand`
- **THEN** the deck re-renders with those theme tokens without rebuilding

#### Scenario: Other token names are not renamed
- **WHEN** a presenter pastes a theme that sets `--primary` but not `--brand`
- **THEN** Settings rejects it because `--brand` is missing

#### Scenario: Instructions describe the deck.json flow
- **WHEN** a presenter opens Settings → Theme and views the bake instructions
- **THEN** the text explains setting `theme` in `deck.json` and building the deck
