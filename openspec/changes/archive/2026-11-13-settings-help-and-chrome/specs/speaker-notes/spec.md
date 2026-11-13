# Spec Delta

## MODIFIED Requirements

### Requirement: Keys in the notes window act on the deck
Every key pressed in the notes window MUST be handled exactly as if it were pressed in the deck window (navigation, steps, Enter, `Home`, `End`, `M`, `⇧M`, `C`, `?`, `T`, `N`, `⇧N`, clicker input, and slide `onKey` handlers). The notes window MUST have no shortcuts of its own. `F` pressed in the notes window is not required to make the deck full screen. The letter `H` MUST NOT navigate the deck to the home page from the notes window.

#### Scenario: Arrow in notes window navigates the deck
- **WHEN** the notes window has focus and the presenter presses `↓`
- **THEN** the deck window moves to the next visible slide and the notes window shows its notes

#### Scenario: H in notes window goes home
- **WHEN** the notes window has focus and the presenter presses `H` on a content slide
- **THEN** the deck window stays on the current content slide (`H` is not a home shortcut)

#### Scenario: Question mark in notes opens Help
- **WHEN** the notes window has focus and the presenter presses `?`
- **THEN** the deck window opens Settings on the Help tab
