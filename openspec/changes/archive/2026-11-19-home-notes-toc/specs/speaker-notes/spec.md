# Spec Delta

## MODIFIED Requirements

### Requirement: Notes window content
The notes window MUST show the current slide's title, its position among the visible content slides, its step position when the slide has steps, and the content of all of the slide's `aside.notes` elements in document order. When a content slide has no notes, it MUST show a "No notes" placeholder. When the current view is the home page (`agenda`), the notes window MUST NOT show "No notes"; instead it MUST show a shell-generated table of contents of the visible content slides (hidden slides omitted), grouped by each slide’s `agendaSection` when present (same grouping rules as the home agenda), with each slide listed as a bullet using its agenda/display title. When a listed slide declares a valid `estimatedMinutes`, that estimate MUST appear with the bullet (for example `3 min`). The home toolbar static minutes label remains omitted. The content MUST be computed from the slide key and the current step.

#### Scenario: Notes shown in order
- **WHEN** the current slide has two notes asides, `A` then `B`
- **THEN** the notes window shows `A` followed by `B`

#### Scenario: Home page placeholder
- **WHEN** the deck is on the home page and the notes window is open
- **THEN** the notes window shows the title `Home` and a generated TOC of visible content slides (not the "No notes" placeholder)

#### Scenario: TOC groups and estimates
- **GIVEN** visible slides include a section `Why` with `Process` (`estimatedMinutes` 3) and `Metrics` (no estimate), then section `Wrap` with `Closing`
- **WHEN** the notes window is on the home page
- **THEN** the TOC shows those section groupings and lists `Process` with a `3 min` (or equivalent) estimate, `Metrics` without an estimate, and `Closing` under `Wrap`

#### Scenario: Hidden slides omitted from home TOC
- **GIVEN** a content slide is hidden in Settings → Slides
- **WHEN** the notes window is on the home page
- **THEN** that slide does not appear in the home TOC

#### Scenario: Content slide without notes still placeholder
- **WHEN** the current view is a content slide with no `aside.notes`
- **THEN** the notes window shows the "No notes" placeholder

#### Scenario: Step position
- **WHEN** the current slide has five steps and is on step index `1`
- **THEN** the notes window shows step `2 / 5`
