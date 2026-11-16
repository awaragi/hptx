# Spec Delta

## MODIFIED Requirements

### Requirement: Starter templates
The library MUST contain these slide templates, each keyed by filename: `section` (section divider), `cardGrid` (icon cards with detail), `stepper` (content revealed by steps using the shell's step navigation), `d3Chart` (a themed D3 chart that redraws on theme change), `photoStrip` (local slide-relative photos baked into the single-file output), `codeTree` (file tree with scrollable, CDN syntax-highlighted snippets across multiple languages), and `blank` (a minimal skeleton showing every contract piece with comments).

#### Scenario: Stepper uses shell steps
- **WHEN** the `stepper` template is active and the presenter presses the right arrow
- **THEN** the next step is revealed through the shell's step navigation

#### Scenario: D3 chart follows the theme
- **WHEN** the `d3Chart` template is active and the presenter toggles dark theme
- **THEN** the chart redraws using the theme's token colors

#### Scenario: Code tree shows highlighted files
- **WHEN** the `codeTree` template is active and the presenter selects a file in the tree
- **THEN** the code pane shows that file's snippet with syntax highlighting and the pane scrolls when the snippet is taller than the viewport

#### Scenario: Code tree CDN declared
- **WHEN** a user reads the catalog entry for `codeTree`
- **THEN** it lists the public CDN script and stylesheet URLs needed for syntax highlighting that `templates/deck.json` also declares
