# Spec Delta

## MODIFIED Requirements

### Requirement: Deck project root
The deck working root MUST be the resolved `--cwd` directory when that flag is set; otherwise the parent directory of `--deck` when `--deck` is set; otherwise `.` resolved against the invocation directory. Relative filesystem paths in the deck file MUST resolve against that working root. The working root MUST NOT require a deck JSON file to exist.

#### Scenario: Resolve paths relative to deck.json
- **WHEN** the user runs with `--cwd /path/to/deck` (or `--deck /path/to/deck/deck.json`) and the effective config has `output` `./Deck.html` and `theme` `./theme.css`
- **THEN** those paths resolve under `/path/to/deck`

#### Scenario: Omitted cwd and deck use invocation directory
- **WHEN** the user runs build, preview, or export with neither `--cwd` nor `--deck`
- **THEN** the working root is the invocation directory (equivalent to `--cwd .`)
