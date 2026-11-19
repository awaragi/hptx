# Spec Delta

## ADDED Requirements

### Requirement: Clicker mode skips home agenda steps
When clicker mode is on and the current slide is the shell-owned home page (`agenda`), clicker navigation keys (`←` / `→` / `↑` / `↓` / Page Up / Page Down) MUST change slides only and MUST NOT advance or retreat through agenda-tile highlight steps. Forward MUST go to the next visible content slide when one exists. On content slides, clicker mode MUST keep step-then-page behavior. When clicker mode is off, home ←/→ tile scrub and Enter activate MUST remain unchanged.

#### Scenario: Forward from home leaves immediately
- **GIVEN** clicker mode is on, the home page is current, and at least one visible content slide exists
- **WHEN** the presenter presses a forward clicker key (`→`, `↓`, or Page Down)
- **THEN** the deck activates the next visible content slide without visiting intermediate agenda-tile highlight steps

#### Scenario: Multiple home tiles do not require multiple clicks
- **GIVEN** clicker mode is on, the home page shows several agenda tiles as its step count, and the presenter is on home
- **WHEN** the presenter presses a forward clicker key once
- **THEN** the deck is no longer on home (it is on the first visible content slide)

#### Scenario: Content slides still step in clicker mode
- **GIVEN** clicker mode is on and a content slide with `stepCount` greater than 1 is current at its first step
- **WHEN** the presenter presses a forward clicker key
- **THEN** the slide advances to the next in-slide step and does not change slides yet

#### Scenario: Non-clicker home scrub unchanged
- **GIVEN** clicker mode is off and the home page is current with multiple agenda tiles
- **WHEN** the presenter presses `→`
- **THEN** the home page advances the agenda-tile highlight within the home page (does not leave home solely from that key)

#### Scenario: Back from first content slide lands on home
- **GIVEN** clicker mode is on and the first visible content slide is current at its first step (or has no steps)
- **WHEN** the presenter presses a back clicker key (`←`, `↑`, or Page Up)
- **THEN** the home page becomes current
