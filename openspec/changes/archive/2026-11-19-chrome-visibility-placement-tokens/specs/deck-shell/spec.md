# Spec Delta

## ADDED Requirements

### Requirement: Home timer and clicker toggle display tokens
The shell MUST honor `--deck-timer-toggle-display` and `--deck-clicker-toggle-display` (`flex` or `none`, default `flex`) with the same rules as `--deck-theme-toggle-display`: each control is visible only on the home page when its token is not `none`; when the token is `none`, that control stays hidden (including on home). When `--deck-timer-toggle-display` is `none`, `S` MUST NOT toggle speak-timer mode and the Settings → Playback speak-timer control MUST be disabled. When `--deck-clicker-toggle-display` is `none`, the Settings → Playback clicker control MUST be disabled. Baked or already-persisted mode values MUST remain in effect while locked. Speaker-notes toolbar copies of these toggles MUST honor the same display tokens.

#### Scenario: Hide clicker and timer for chrome-minimal home
- **WHEN** the active theme sets `--deck-theme-toggle-display: none`, `--deck-timer-toggle-display: none`, `--deck-clicker-toggle-display: none`, and `--deck-settings-gear-display: none`
- **THEN** the home page shows no theme, timer, clicker, or gear controls in the top chrome tools

#### Scenario: Timer lock disables S
- **WHEN** `--deck-timer-toggle-display` is `none` and the presenter presses `S`
- **THEN** speak-timer mode does not change

#### Scenario: Clicker lock disables Playback control
- **WHEN** `--deck-clicker-toggle-display` is `none` and the presenter opens Settings → Playback
- **THEN** the clicker control is disabled

### Requirement: Chrome widget visibility tokens
The shell MUST honor these theme custom properties for chrome widget visibility: `--deck-progress-display` (`block` or `none`, default `block`), `--deck-navdots-display` (`flex` or `none`, default `flex`), `--deck-counter-display` (`block` or `none`, default `block`), and `--deck-arrows-display` (`flex` or `none`, default `flex`). When a display token is `none`, that widget MUST NOT be visible. Print mode MUST continue to hide these widgets regardless of the tokens. Keyboard navigation and digit jump MUST keep working when widgets are hidden.

#### Scenario: Hide progress via theme
- **WHEN** the active theme sets `--deck-progress-display: none`
- **THEN** the progress bar is not visible on content slides

#### Scenario: Hide nav dots via theme
- **WHEN** the active theme sets `--deck-navdots-display: none`
- **THEN** the right-rail nav-dot control is not visible

#### Scenario: Defaults keep current chrome
- **WHEN** a deck uses shell theme defaults with no chrome overrides
- **THEN** progress, nav dots, slide counter, and prev/next arrows are visible on content slides (counter still hidden on the home page per existing home rules)

#### Scenario: Hidden chrome does not block keys
- **WHEN** progress, nav dots, counter, and arrows are all set to `none` and the presenter presses ↓
- **THEN** the deck advances as usual

### Requirement: Chrome widget placement enums
The shell MUST honor logical placement tokens: `--deck-progress-edge` (`block-start` or `block-end`, default `block-start`), `--deck-navdots-edge` (`inline-end` or `inline-start`, default `inline-end`), `--deck-counter-inline` (`inline-start` or `inline-end`, default `inline-start`), and `--deck-arrows-inline` (`inline-end` or `inline-start`, default `inline-end`). Counter and arrows MUST remain on the block-end edge. Unrecognized placement values MUST fall back to that token’s default. Author-facing token names and values MUST NOT use physical `left`/`right`.

#### Scenario: Progress on block-end
- **WHEN** the active theme sets `--deck-progress-edge: block-end`
- **THEN** the progress bar is along the block-end edge of the canvas

#### Scenario: Nav dots on inline-start
- **WHEN** the active theme sets `--deck-navdots-edge: inline-start`
- **THEN** the nav-dot rail is on the inline-start side of the canvas

#### Scenario: Counter and arrows swap inline ends
- **WHEN** the active theme sets `--deck-counter-inline: inline-end` and `--deck-arrows-inline: inline-start`
- **THEN** the slide counter is on the inline-end side at block-end and the arrow controls are on the inline-start side at block-end

#### Scenario: Invalid placement falls back
- **WHEN** the active theme sets `--deck-navdots-edge: left`
- **THEN** the nav-dot rail uses the default `inline-end` placement

#### Scenario: RTL mirrors inline defaults
- **WHEN** the document direction is `rtl` and chrome placement tokens use their defaults
- **THEN** nav dots sit on the physical left (inline-end) and the counter sits on the physical right (inline-start) without the theme changing those tokens

### Requirement: Chrome placement follows theme layer changes
When Settings applies, clears, or loads a theme override (or otherwise refreshes theme-dependent chrome), the shell MUST re-apply progress, navdots, counter, and arrows placement from the effective CSS custom properties so live overrides take effect without a full page reload.

#### Scenario: Live override moves nav dots
- **WHEN** a presenter applies a Settings theme override that sets `--deck-navdots-edge: inline-start`
- **THEN** the nav-dot rail moves to the inline-start side without reloading the page

### Requirement: Generate-theme and bake docs list chrome layout tokens
Settings → Theme Generate-theme prompt and bake instructions MUST document the progress, navdots, counter, and arrows visibility and placement tokens together with the existing `--deck-*` chrome tokens, state that the Deck chrome block is optional in `theme.css` (shell defaults are suitable for most decks), and list allowed values for tokens authors choose to override. Single-theme lock guidance MUST still set the existing lock tokens; it MUST NOT require authors to set progress/dots/counter/arrows tokens for a valid theme.

#### Scenario: Prompt lists new chrome tokens
- **WHEN** a presenter opens Settings → Theme and views the Generate theme prompt
- **THEN** the prompt text includes `--deck-timer-toggle-display`, `--deck-clicker-toggle-display`, `--deck-progress-display`, `--deck-progress-edge`, `--deck-navdots-display`, `--deck-navdots-edge`, `--deck-counter-display`, `--deck-counter-inline`, `--deck-arrows-display`, and `--deck-arrows-inline`, and states that Deck chrome tokens are optional

#### Scenario: Bake instructions say chrome is optional
- **WHEN** a presenter opens Settings → Theme and views the bake instructions
- **THEN** the text states that the Deck chrome block is optional in theme.css and that shell defaults are suitable for most decks
