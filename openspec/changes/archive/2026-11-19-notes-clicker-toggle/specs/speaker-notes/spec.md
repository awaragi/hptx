# Spec Delta

## ADDED Requirements

### Requirement: Clicker-mode switch in the notes window
The notes window toolbar MUST include a clicker-mode switch beside the theme and speak-timer switches. The switch MUST reflect and change the deck’s clicker-mode preference and stay in sync with the home clicker toggle and Settings → Playback (same persisted preference).

#### Scenario: Toggle from notes
- **WHEN** the presenter flips the clicker switch in the notes window
- **THEN** clicker mode changes on the deck, the preference persists, and the home clicker toggle and Settings → Playback show the same state

#### Scenario: Switch follows deck
- **WHEN** the presenter flips clicker mode on the deck home or in Settings → Playback while the notes window is open
- **THEN** the notes window clicker switch shows the same on/off state
