# Spec Delta

## MODIFIED Requirements

### Requirement: Shell-owned agenda slide
The shell MUST render a home page (reserved key `agenda`) as the first slide of every assembled deck, regardless of `--slides`. The home page MUST hold a title block, the keyboard hints, and the agenda. The agenda MUST list the included slides in their assembled order using each slide’s registered title, icon, and agenda metadata. The home page MUST NOT be hideable; digit jump `0` MUST always return to it. The letter key `H` MUST NOT navigate to the home page.

#### Scenario: Agenda present in a filtered deck
- **WHEN** a deck is assembled with `--slides metrics`
- **THEN** the deck contains the home page followed by `metrics`, and the agenda lists only `metrics`

#### Scenario: Agenda uses registered metadata
- **WHEN** `process.html` registers `{ title: 'Process overview', icon: 'trend' }`
- **THEN** the agenda shows a `Process overview` entry with the `trend` icon that navigates to `process`

#### Scenario: Home page without a slide-provided agenda
- **WHEN** a deck has no slide with an agenda container (no `#tocGrid`)
- **THEN** the home page still shows the agenda tiles and keyboard hints

#### Scenario: Digit zero goes home
- **WHEN** the presenter presses `0` and the digit jump commits
- **THEN** the home page becomes active

#### Scenario: Letter H does not go home
- **WHEN** the presenter presses `H` on a content slide
- **THEN** the current slide stays unchanged (no home navigation from `H`)

### Requirement: Agenda toggle
Settings → Slides MUST show an **Agenda** checkbox above all slide groups. Unchecking it MUST hide the agenda tiles on the home page and center the title block and keyboard hints on the canvas; the home page MUST remain index 0 and reachable with digit jump `0`. The choice MUST be stored per browser like hidden slides, and **Show all** MUST turn the agenda back on. The agenda menu (`M` / `⇧M`) MUST keep working when the agenda is off.

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

### Requirement: Settings modal five tabs
The Settings modal MUST expose exactly five top-level tabs, in order: **Theme**, **Slides**, **Playback**, **Help**, and **Reset**. The **Theme** tab MUST include the apply/load/clear theme controls, the Generate theme prompt (with copy), and the bake-into-build instructions as sections in that one panel (not separate top-level tabs). The **Playback** tab MUST hold clicker mode, remember-last-step, light/dark appearance, and speak-timer mode. The **Help** tab MUST show a scrollable full catalog of deck chrome shortcuts. Feature behavior of Theme, Slides, and Reset controls MUST match the prior Settings modal except where this change updates Playback and Help.

#### Scenario: Four top-level tabs
- **WHEN** a presenter opens Settings (`C`)
- **THEN** the tab list shows Theme, Slides, Playback, Help, and Reset and no separate Generate theme or Instructions tabs

#### Scenario: Theme sections on one tab
- **WHEN** the presenter selects the Theme tab
- **THEN** that panel shows apply theme controls, the Generate theme prompt, and bake instructions without changing tabs

#### Scenario: Playback holds former Navigation prefs
- **WHEN** the presenter selects the Playback tab
- **THEN** clicker mode, remember-last-step, light/dark appearance, and speak-timer controls are available there

#### Scenario: Help catalog
- **WHEN** the presenter selects the Help tab
- **THEN** a scrollable list of deck chrome shortcuts is shown

### Requirement: Shell chrome behavior
The shell MUST provide this user-visible chrome behavior: keyboard navigation and shortcuts (arrows, Page Up/Down, `M`, `⇧M`, `F`, `T`, `C`, `?`, `N`, `⇧N`, `S`, `⇧S`, digit-buffer slide jump `0`–`9`), a light/dark theme toggle on the home page (hidden on content slides; `T` still works when not theme-locked), a speak-timer toggle and a clicker-mode toggle beside the theme control on the home page (same home-only visibility as the theme toggle; `S` / `⇧S` still work on every slide; clicker mirrors Settings → Playback), print mode, hidden slides (Settings → Slides, stored per browser), clicker mode, remember-slide-step, the speaker notes window (`N` opens, focuses, or reconnects it; `⇧N` closes it), speak-timer mode (`S` toggles and persists; `⇧S` resets the current slide clock while mode stays on), and the Settings modal including Generate theme (under Settings → Theme) and Help. The home page keyboard hints and the nav-drawer hint strip MUST list only `←`/`→`, `↑`/`↓`, and `?` for help (not Page Up/Down). Pressing `?` MUST open Settings on the Help tab. The letter `H` MUST NOT be a shell shortcut.

#### Scenario: Home shortcut
- **WHEN** the presenter presses `H` on any content slide
- **THEN** the current slide stays unchanged (`H` is not a home shortcut)

#### Scenario: Hidden slide skipped
- **WHEN** a slide is hidden in Settings → Slides
- **THEN** forward navigation skips it and the agenda omits it

#### Scenario: Notes hint on home
- **WHEN** the presenter is on the home page
- **THEN** the keyboard hints do not list `N` as a separate hint row (notes are documented under Settings → Help)

#### Scenario: Timer hint on home
- **WHEN** the presenter is on the home page
- **THEN** the keyboard hints do not list `S` as a separate hint row (timer is documented under Settings → Help)

#### Scenario: Digit-nav hint on home
- **WHEN** the presenter is on the home page
- **THEN** the keyboard hints do not list digit keys as a separate hint row (digit jump is documented under Settings → Help)

#### Scenario: Question mark opens Help
- **WHEN** the presenter presses `?` while chrome shortcuts are active
- **THEN** Settings opens with the Help tab selected

#### Scenario: Bare home hints
- **WHEN** the presenter is on the home page
- **THEN** the keyboard hints include `←`/`→`, `↑`/`↓`, and `?` for help only (not Page Up/Down)

#### Scenario: Bare drawer hint strip
- **WHEN** the agenda drawer is open
- **THEN** the drawer hint strip shows arrow navigation and `?` for help only

#### Scenario: Clicker toggle on home chrome
- **WHEN** the presenter is on the home page
- **THEN** a clicker-mode toggle is shown with the theme and speak-timer toggles

### Requirement: Speak-timer switch beside theme on home
The deck home chrome MUST show a speak-timer switch immediately beside the theme toggle, visible under the same home-only rules as the theme toggle. The switch MUST reflect and change the persisted speak-timer mode (slug-scoped store key) like `S`. Settings → Playback MUST expose the same speak-timer control and stay in sync with the home switch and `S`.

#### Scenario: Visible next to theme on home
- **WHEN** the presenter is on the home page and the theme toggle is shown
- **THEN** a speak-timer switch is shown beside it

#### Scenario: Playback mirrors home
- **WHEN** the presenter toggles speak-timer in Settings → Playback
- **THEN** the home speak-timer switch and `S` reflect the same on/off state

## ADDED Requirements

### Requirement: Help shortcut opens Settings Help
Pressing `?` (no modifier other than Shift as needed to type `?`) MUST open the Settings modal on the Help tab when chrome shortcuts are active. If Settings is already open, `?` MUST switch to the Help tab. The Help panel MUST list all deck chrome shortcuts in a scrollable catalog and MUST NOT list physical `Home` / `End` keys.

#### Scenario: Opens Help from deck
- **WHEN** Settings is closed and the presenter presses `?`
- **THEN** Settings opens with Help selected and the shortcut catalog is visible

#### Scenario: Switches to Help when Settings open
- **WHEN** Settings is open on Theme and the presenter presses `?`
- **THEN** the Help tab becomes selected

#### Scenario: Catalog omits Home and End
- **WHEN** the presenter views Settings → Help
- **THEN** the catalog does not document the `Home` or `End` keys

### Requirement: Clicker toggle on home chrome
The deck home chrome MUST show a clicker-mode toggle beside the theme and speak-timer controls, visible under the same home-only rules as the theme toggle. The toggle MUST reflect and change the persisted clicker-mode preference like Settings → Playback.

#### Scenario: Toggle syncs with Playback
- **WHEN** the presenter flips the home clicker toggle
- **THEN** clicker mode changes, the preference persists, and Settings → Playback shows the same state

#### Scenario: Hidden on content slides
- **WHEN** the presenter navigates to a content slide
- **THEN** the home clicker toggle is not visible

### Requirement: Playback appearance and timer
Settings → Playback MUST include a light/dark appearance control that mirrors the home theme toggle and `T` (honoring theme lock), and a speak-timer control that mirrors the home timer switch and `S`.

#### Scenario: Appearance in Playback
- **WHEN** the presenter changes light/dark in Settings → Playback and the theme is not locked
- **THEN** the deck appearance updates and the home theme toggle reflects the new mode

#### Scenario: Timer in Playback
- **WHEN** the presenter toggles speak-timer in Settings → Playback
- **THEN** speak-timer mode changes like `S` and the home timer switch updates

## RENAMED Requirements

- FROM: `### Requirement: Settings modal four tabs`
- TO: `### Requirement: Settings modal five tabs`

## REMOVED Requirements

### Requirement: Digit-nav hint on home
**Reason**: Digit jump remains a chrome shortcut, but its documentation moves to Settings → Help; home hints are bare (arrows + `?` only).
**Migration**: Rely on Settings → Help for the digit-jump entry; home no longer lists `0–9`.
