# Spec Delta

## MODIFIED Requirements

### Requirement: Shell chrome behavior
The shell MUST provide this user-visible chrome behavior: keyboard navigation and shortcuts (arrows, Page Up/Down, `M`, `⇧M`, `H`, `F`, `T`, `C`, `N`, `⇧N`, `S`, `⇧S`), a light/dark theme toggle control on the home page (hidden on content slides; `T` still works when not theme-locked), a speak-timer toggle beside the theme control on the home page (same home-only visibility as the theme toggle; `S` / `⇧S` still work on every slide), print mode, hidden slides (Settings → Slides, stored per browser), clicker mode, remember-slide-step, the speaker notes window (`N` opens, focuses, or reconnects it; `⇧N` closes it), speak-timer mode (`S` toggles and persists; `⇧S` resets the current slide clock while mode stays on), and the Settings modal including Generate theme. The home page keyboard hints MUST list `N` and `S`.

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

## ADDED Requirements

### Requirement: Speak-timer switch beside theme on home
The deck home chrome MUST show a speak-timer switch immediately beside the theme toggle, visible under the same home-only rules as the theme toggle. The switch MUST reflect and change the persisted `hptx-timer` mode like `S`.

#### Scenario: Visible next to theme on home
- **WHEN** the presenter is on the home page and the theme toggle is shown
- **THEN** a speak-timer switch is shown beside it
