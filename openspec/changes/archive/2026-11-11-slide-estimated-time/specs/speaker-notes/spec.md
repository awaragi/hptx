# Spec Delta

## ADDED Requirements

### Requirement: Estimated speaking time in the notes window
A content slide MAY declare an estimated speaking time in whole minutes. When the notes window shows that slide and an estimate is present, the notes window MUST display it as a static minutes label (for example `3 min`) with no countdown or running timer. When the estimate is absent, or the current view is the home page, the notes window MUST omit the label. Changing slide MUST update or clear the label to match the new slide.

#### Scenario: Minutes label shown
- **WHEN** the current slide declares an estimated speaking time of `3` minutes and the notes window is open
- **THEN** the notes window shows a static `3 min` label (or equivalent whole-minutes wording) and does not run a timer

#### Scenario: No estimate omitted
- **WHEN** the current slide has no estimated speaking time and the notes window is open
- **THEN** the notes window shows no minutes label

#### Scenario: Home page omits estimate
- **WHEN** the deck is on the home page and the notes window is open
- **THEN** the notes window shows no minutes label

#### Scenario: Navigation updates the label
- **WHEN** the presenter moves from a slide with a `5` minute estimate to a slide with a `2` minute estimate
- **THEN** the notes window label changes from `5 min` to `2 min`
