# slide-templates Specification

## Purpose
Provides a library of working, contract-compliant slide templates inside the framework. Authors can preview them like any deck and copy them as starting points for new slides.

## Requirements

### Requirement: Template library is a normal deck
The framework MUST include a `templates/` folder that is a valid deck root (`deck.json` plus slide files). It MUST be previewable with `npm run dev -- templates` and buildable with `npm run build -- templates`, with the same rules as any deck.

#### Scenario: Preview templates
- **WHEN** a user runs `npm run dev -- templates`
- **THEN** the dev server serves a deck containing every template slide, and the browser console shows no registration or boot errors

#### Scenario: Templates pass assemble checks
- **WHEN** `npm run build -- templates` runs
- **THEN** it succeeds with no errors from the `html-slides` or `slide-scoping` checks

### Requirement: Starter templates
The library MUST contain these slide templates, each keyed by filename: `section` (section divider), `cardGrid` (icon cards with detail), `stepper` (content revealed by steps using the shell's step navigation), `d3Chart` (a themed D3 chart that redraws on theme change), and `blank` (a minimal skeleton showing every contract piece with comments).

#### Scenario: Stepper uses shell steps
- **WHEN** the `stepper` template is active and the presenter presses the right arrow
- **THEN** the next step is revealed through the shell's step navigation

#### Scenario: D3 chart follows the theme
- **WHEN** the `d3Chart` template is active and the presenter toggles dark theme
- **THEN** the chart redraws using the theme's token colors

### Requirement: Library cover
The library MUST contain `cover.html`, a cover with placeholder logo, headline, description, and date, used as the library deck's own `cover`. The cover is not a slide template.

#### Scenario: Library cover on the home page
- **WHEN** a user runs `npm run dev -- templates`
- **THEN** the home page title block shows the placeholder cover and the agenda lists the slide templates

### Requirement: Templates are copy-safe
Every template MUST work when copied verbatim more than once into the same deck. Templates MUST use only theme tokens for color, MUST NOT reference IDs from markup, MUST NOT set animation names from scripts, MUST NOT pass selector strings to libraries, and MUST link the contract stylesheet.

#### Scenario: Two copies in one deck
- **WHEN** a deck contains two slides generated from `cardGrid`
- **THEN** the deck assembles and both slides render and respond to interaction independently

### Requirement: Template catalog
`templates/` MUST contain a catalog file listing each slide template's key, a one-line description, and any CDN `scripts` / `styles` it needs. Every template slide MUST have a catalog entry and every entry MUST have a template slide. The library cover MUST NOT have a catalog entry.

#### Scenario: D3 dependency declared
- **WHEN** a user reads the catalog entry for `d3Chart`
- **THEN** it lists the D3 CDN script URL that `templates/deck.json` also declares

#### Scenario: Catalog out of sync
- **WHEN** a template file exists without a catalog entry
- **THEN** `npm test` fails and names the template
