# Spec Delta

## MODIFIED Requirements

### Requirement: Persisted speak-timer mode
The shell MUST support a speak-timer mode stored in the deck browser store under the slug-scoped timer key (on or off), defaulting to off. Turning the mode on or off MUST persist like the light/dark theme preference. Clearing browser deck data for this slug MUST remove the timer key with the other deck preference keys.

#### Scenario: Mode persists across reload
- **WHEN** the presenter turns speak-timer mode on and reloads the deck in the same browser
- **THEN** speak-timer mode is still on

#### Scenario: Reset clears timer preference
- **WHEN** the presenter uses Reset browser data in Settings
- **THEN** the slug-scoped timer key is cleared and speak-timer mode is off
