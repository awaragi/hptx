# speak-timer Specification

## Purpose

Gives presenters an optional speak-timer mode that paces each content slide from its estimated minutes (or counts up when none), with subtle canvas flashes and a live notes readout.

## Requirements

### Requirement: Persisted speak-timer mode
The shell MUST support a speak-timer mode stored in the deck browser store under the slug-scoped timer key (on or off), defaulting to off. Turning the mode on or off MUST persist like the light/dark theme preference. Clearing browser deck data for this slug MUST remove the timer key with the other deck preference keys.

#### Scenario: Mode persists across reload
- **WHEN** the presenter turns speak-timer mode on and reloads the deck in the same browser
- **THEN** speak-timer mode is still on

#### Scenario: Reset clears timer preference
- **WHEN** the presenter uses Reset browser data in Settings
- **THEN** the slug-scoped timer key is cleared and speak-timer mode is off

### Requirement: Toggle with S and the timer switch
Pressing `S` (no modifier) MUST toggle speak-timer mode. Turning mode on MUST play a single start-envelope canvas flash (fade in, then sudden hide) and start the current content slide’s clock when applicable. Turning mode off MUST reset the active clock and hide all timer visuals (border and live readout). A timer switch beside the theme toggle on the deck home chrome and in the notes toolbar MUST mirror the same on/off behavior and stay in sync with `S`.

#### Scenario: S turns mode on
- **WHEN** speak-timer mode is off and the presenter presses `S`
- **THEN** mode turns on, the preference is persisted, a single start-envelope flash runs on the deck canvas, and the current content slide’s clock starts when that slide has an applicable timer

#### Scenario: S turns mode off mid-run
- **WHEN** speak-timer mode is on with an active clock or visible border and the presenter presses `S`
- **THEN** mode turns off, the preference is persisted, the clock resets, and all timer visuals are hidden

#### Scenario: Switch matches S
- **WHEN** the presenter flips the timer switch in the notes window
- **THEN** speak-timer mode toggles the same way as `S` and the deck home switch reflects the new state

### Requirement: Shift+S resets without stopping mode
Pressing `⇧S` while speak-timer mode is on MUST restart the current content slide’s clock from the beginning without turning mode off, and MUST clear any locked or flashing border for that restart. When mode is off, `⇧S` MUST do nothing.

#### Scenario: Mid-run reset
- **WHEN** mode is on, the current slide is mid-countdown, and the presenter presses `⇧S`
- **THEN** the countdown restarts from the slide’s full estimate, mode stays on, and the border is cleared until warning thresholds are crossed again

### Requirement: Per-slide clock while mode is on
While speak-timer mode is on, navigating to a content slide MUST start or restart that slide’s clock. When the slide declares a valid whole-minute `estimatedMinutes`, the clock MUST count down from that duration. When it does not, the clock MUST count up from zero and the notes readout MUST use a `+` elapsed form. Leaving a slide MUST clear that slide’s clock and border. The home page MUST not run a clock and MUST clear any border.

#### Scenario: Timed slide countdown
- **WHEN** mode is on and the presenter enters a slide with `estimatedMinutes` of `3`
- **THEN** the clock starts at three minutes remaining and counts down

#### Scenario: Untimed slide counts up
- **WHEN** mode is on and the presenter enters a content slide with no estimate
- **THEN** the notes readout shows elapsed time as `+m:ss` and the canvas never shows a timer border for that slide

#### Scenario: Home clears clock
- **WHEN** mode is on with a locked overtime border on a content slide and the presenter presses `H`
- **THEN** the border is cleared and no clock runs on the home page

### Requirement: Warning flashes and overtime lock
For a countdown slide only, when remaining time first reaches 60 seconds the deck canvas MUST play one end-envelope flash (sudden show, then fade out) using a very subtle 1px border at about 50% transparency. When remaining first reaches 30 seconds it MUST play that end-envelope flash twice. When remaining reaches 0 the border MUST lock on at that subtle style and the notes readout MUST show overtime as `+m:ss` while counting up. Warning and lock borders MUST NOT apply to count-up (no estimate) slides.

#### Scenario: Sixty-second warning
- **WHEN** a countdown crosses 60 seconds remaining
- **THEN** the canvas plays one end-envelope flash

#### Scenario: Thirty-second warning
- **WHEN** a countdown crosses 30 seconds remaining
- **THEN** the canvas plays two end-envelope flashes

#### Scenario: Overtime lock
- **WHEN** a countdown reaches 0
- **THEN** the subtle border stays locked on and the notes readout shows `+` overtime
