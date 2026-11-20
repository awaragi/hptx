# Spec Delta

## ADDED Requirements

### Requirement: Clustered deck chrome layout tokens
Between the `DECK THEME — START` and `END` markers, `slide-contract.css` MUST declare a single contiguous `--deck-*` chrome token block that includes the existing chrome controls plus timer/clicker toggle display, progress, nav dots, slide counter, and arrows visibility and placement tokens. Each property MUST show its default value in the stylesheet, and comments next to the declarations MUST list the allowed values. Placement token values MUST use logical names only (`block-start`, `block-end`, `inline-start`, `inline-end`), not physical `left`/`right`. THEMING comments MUST describe these tokens as optional theme-bake/override chrome personalization (not `deck.json` settings): themes MAY omit the chrome block to keep shell defaults.

#### Scenario: Defaults present in contract
- **WHEN** a reader opens `slide-contract.css` inside the theme markers
- **THEN** the file declares `--deck-timer-toggle-display`, `--deck-clicker-toggle-display`, `--deck-progress-display`, `--deck-progress-edge`, `--deck-navdots-display`, `--deck-navdots-edge`, `--deck-counter-display`, `--deck-counter-inline`, `--deck-arrows-display`, and `--deck-arrows-inline` with the shell defaults

#### Scenario: Allowed values documented beside tokens
- **WHEN** a reader inspects the chrome token block comments
- **THEN** each new visibility and placement token lists its allowed values next to the declaration

#### Scenario: No physical side names in placement API
- **WHEN** a reader searches the chrome placement token comments and values for author-facing `left` or `right` as enum options
- **THEN** those physical names are not listed as allowed placement values

### Requirement: Authoring rules mention chrome layout tokens
`SLIDE-CONTRACT.md` MUST document that `--deck-*` chrome visibility and logical placement tokens are optional in a theme file (shell defaults are suitable for most decks), that themes may override them via bake or Settings, that defaults live in the clustered chrome block in `slide-contract.css`, and that these are not `deck.json` `settings` keys.

#### Scenario: Theming section covers chrome layout tokens
- **WHEN** an author reads the theming section of `SLIDE-CONTRACT.md`
- **THEN** it mentions the chrome visibility and placement tokens, that the block is optional with good defaults, and points at the contract stylesheet defaults block
