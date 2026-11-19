# Spec Delta

## ADDED Requirements

### Requirement: Stable home keyboard-hint order
The home page keyboard-hint rows MUST appear in a fixed order that does not change when clicker mode is toggled. The order MUST be `↑`/`↓`, then `←`/`→`, then `?`. Clicker mode MAY change the description text on the arrow rows; it MUST NOT reorder those rows.

#### Scenario: Order unchanged when enabling clicker mode
- **WHEN** the presenter is on the home page and turns clicker mode on
- **THEN** the keyboard-hint rows remain `↑`/`↓`, then `←`/`→`, then `?` (same order as with clicker mode off)

#### Scenario: Order unchanged when disabling clicker mode
- **WHEN** the presenter is on the home page with clicker mode on and turns clicker mode off
- **THEN** the keyboard-hint rows remain `↑`/`↓`, then `←`/`→`, then `?`
