# Spec Delta

## MODIFIED Requirements

### Requirement: Estimated speaking time in the notes window
A content slide MAY declare an estimated speaking time in whole minutes. When the notes window shows that slide and an estimate is present, the notes window MUST display it as a static minutes label (for example `3 min`). That static label MUST NOT itself count down. When the estimate is absent, or the current view is the home page, the notes window MUST omit the static label. Changing slide MUST update or clear the static label to match the new slide. A separate live speak-timer readout MAY appear only when speak-timer mode is on (see speak-timer).

#### Scenario: Minutes label shown
- **WHEN** the current slide declares an estimated speaking time of `3` minutes and the notes window is open
- **THEN** the notes window shows a static `3 min` label (or equivalent whole-minutes wording)

#### Scenario: No estimate omitted
- **WHEN** the current slide has no estimated speaking time and the notes window is open
- **THEN** the notes window shows no minutes label

#### Scenario: Home page omits estimate
- **WHEN** the deck is on the home page and the notes window is open
- **THEN** the notes window shows no minutes label

#### Scenario: Navigation updates the label
- **WHEN** the presenter moves from a slide with a `5` minute estimate to a slide with a `2` minute estimate
- **THEN** the notes window label changes from `5 min` to `2 min`

## ADDED Requirements

### Requirement: Speak-timer readout in the notes window
When speak-timer mode is on, the notes window MUST show that the mode is active and MUST show the live clock for the current content slide: countdown `m:ss` while remaining is positive, `+m:ss` overtime after zero on a timed slide, or `+m:ss` elapsed on an untimed content slide. When mode is off, or on the home page, the live clock MUST be omitted (the static `estimatedMinutes` label, when present, is unchanged). The notes toolbar MUST include a timer switch beside the theme switch that stays in sync with the deck’s speak-timer mode.

#### Scenario: Countdown shown
- **WHEN** speak-timer mode is on and the current slide has two minutes remaining
- **THEN** the notes window shows a mode-active indicator and a live `2:00` (or equivalent) remaining readout

#### Scenario: Overtime shown
- **WHEN** speak-timer mode is on and the current timed slide is fifteen seconds past zero
- **THEN** the notes window shows `+0:15` (or equivalent)

#### Scenario: Mode off hides live clock
- **WHEN** speak-timer mode is off
- **THEN** the notes window shows no live timer readout and the timer switch appears off
