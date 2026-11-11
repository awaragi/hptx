# Spec Delta

## MODIFIED Requirements

### Requirement: Shell chrome behavior
The shell MUST provide this user-visible chrome behavior: keyboard navigation and shortcuts (arrows, Page Up/Down, `M`, `⇧M`, `H`, `F`, `T`, `C`, `N`, `⇧N`), a light/dark theme toggle control on the home page (hidden on content slides; `T` still works when not theme-locked), print mode, hidden slides (Settings → Slides, stored per browser), clicker mode, remember-slide-step, the speaker notes window (`N` opens, focuses, or reconnects it; `⇧N` closes it), and the Settings modal including Generate theme. The home page keyboard hints MUST list `N`.

#### Scenario: Home shortcut
- **WHEN** the presenter presses `H` on any content slide
- **THEN** the home page becomes active

#### Scenario: Hidden slide skipped
- **WHEN** a slide is hidden in Settings → Slides
- **THEN** forward navigation skips it and the agenda omits it

#### Scenario: Notes hint on home
- **WHEN** the presenter is on the home page
- **THEN** the keyboard hints include `N` for the speaker notes window
