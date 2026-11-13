# Spec Delta

## MODIFIED Requirements

### Requirement: Toggle with S and the timer switch
Pressing `S` (no modifier) MUST toggle speak-timer mode. Turning mode on MUST play a single start-envelope canvas flash (fade in, then sudden hide) and start the current content slide’s clock when applicable. Turning mode off MUST reset the active clock and hide all timer visuals (border and live readout). A timer switch beside the theme toggle on the deck home chrome, a speak-timer control in Settings → Playback, and the notes toolbar timer switch MUST mirror the same on/off behavior and stay in sync with `S`.

#### Scenario: S turns mode on
- **WHEN** speak-timer mode is off and the presenter presses `S`
- **THEN** mode turns on, the preference is persisted, a single start-envelope flash runs on the deck canvas, and the current content slide’s clock starts when that slide has an applicable timer

#### Scenario: S turns mode off mid-run
- **WHEN** speak-timer mode is on with an active clock or visible border and the presenter presses `S`
- **THEN** mode turns off, the preference is persisted, the clock resets, and all timer visuals are hidden

#### Scenario: Switch matches S
- **WHEN** the presenter flips the timer switch in the notes window
- **THEN** speak-timer mode toggles the same way as `S` and the deck home switch reflects the new state

#### Scenario: Playback matches S
- **WHEN** the presenter toggles speak-timer in Settings → Playback
- **THEN** speak-timer mode toggles the same way as `S` and the deck home switch reflects the new state
