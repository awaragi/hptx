# about-deck Specification

## Purpose

Defines the repository’s about-hptx example deck: a short presentation that introduces the framework to mixed audiences and is previewable and buildable like any other deck.

## Requirements

### Requirement: About deck folder and config
The repository MUST include an example deck at `decks/about/` with a valid `deck.json` that names a cover, an ordered list of content slides, a document title, a brand label, and a single-file `output` path.

#### Scenario: Preview the about deck
- **WHEN** a user runs `npx hptx dev --cwd decks/about`
- **THEN** the toolchain serves that deck without config errors and the home page shows the cover title block plus agenda entries for the content slides

#### Scenario: Build the about deck
- **WHEN** a user runs `npx hptx build --cwd decks/about`
- **THEN** the toolchain writes the configured single-file HTML output successfully

### Requirement: Cover positions the product for PPTX-weary audiences
The about deck cover MUST present hptx as an alternative to static PowerPoint-style slides, emphasize agent-authored HTML presentations, and address a mixed audience (engineers, business, students, technical and non-technical).

#### Scenario: Cover copy is on the home page
- **WHEN** the about deck home page loads
- **THEN** the cover title block communicates leaving static slides behind and agent-authored interactive HTML decks

### Requirement: Escape slide contrasts PPTX with hptx capabilities
The about deck MUST include a content slide (key `escape`) that contrasts leaving static PPTX with what hptx provides, and MUST show a static capability strip covering at least: graphs/charts, animation, clicker support, viewport scaling, modern themed look, fully custom slides, and baked local images. Capability detail MUST be explorable via shell steps.

#### Scenario: Escape slide is navigable from the agenda
- **WHEN** the presenter opens the about deck and selects the Escape slide from the agenda or navigation
- **THEN** that slide is shown and its capability chips are visible for exploration with shell step navigation

### Requirement: Agent slide walks AI authoring through ship
The about deck MUST include a content slide (key `agent`) that presents an ordered authoring workflow with the coding agent as the primary author: brief → ASCII wireframe sketch → authoring/files → theme (bake or override) → ship (preview, build, print-compatible output, and screenshot-to-PPTX escape hatch). The slide MUST use shell step navigation so each stage can be revealed in order.

#### Scenario: Agent workflow advances by step
- **WHEN** the presenter is on the Agent slide and advances steps with the shell’s next-step control
- **THEN** the visible focus moves through brief, sketch, authoring, theme, and ship stages in that order

#### Scenario: Theme stage mentions bake and override
- **WHEN** the Agent slide’s theme stage is current
- **THEN** the slide content describes both baking a theme into the presentation and applying a different theme at show time, and mentions generating theme CSS via the built-in Settings prompt for an AI assistant

#### Scenario: Ship stage covers preview build and escape hatch
- **WHEN** the Agent slide’s ship stage is current
- **THEN** the slide content covers starting a preview via the agent, building a single HTML file, print/PDF-compatible delivery, and screenshot-into-PPTX as an optional escape hatch

### Requirement: About deck content order
The about deck’s ordered content slides MUST be `escape`, then `agent` (no separate ship slide).

#### Scenario: Two content slides in deck.json
- **WHEN** the about deck’s slide list is read from `deck.json`
- **THEN** the ordered content slides are `escape`, then `agent`
