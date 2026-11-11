# Spec Delta

## MODIFIED Requirements

### Requirement: Authoring rules document
`SLIDE-CONTRACT.md` MUST state the slide authoring rules: file layout, filename key, canvas size, CSS scoping and `:scope`, theme token use, script scope, slide-scoped `document` versus `window.document`, passing elements rather than selector strings to libraries, keyframe and ID-reference rules, CDN dependencies via `deck.json`, how to link the contract stylesheet, how to write the cover file, how to write speaker notes, and how to reference local images with paths relative to the slide or cover file (baked into the single-file output). It MUST describe `deck.json` `theme` as appending over the default token block (cascade), not replacing it.

#### Scenario: Rules cover the build checks
- **WHEN** an assemble check from `slide-scoping` or `html-slides` fails
- **THEN** the rule it enforces is described in `SLIDE-CONTRACT.md`

#### Scenario: Cover documented
- **WHEN** an author reads `SLIDE-CONTRACT.md` to write a cover
- **THEN** it explains the `deck.json` `cover` field, the title block placement, what the cover may contain (including the cover CSS classes from the contract), the no-registration rule, and how the cover's CSS and scripts are scoped

#### Scenario: Theme bake documented as cascade
- **WHEN** an author reads the theming section of `SLIDE-CONTRACT.md`
- **THEN** it states that `deck.json` `theme` appends over the default tokens rather than replacing them

#### Scenario: Speaker notes documented
- **WHEN** an author reads `SLIDE-CONTRACT.md` to add speaker notes
- **THEN** it explains the `<aside class="notes">` element, that it is hidden on the canvas, the allowed formatting (basic HTML and inline styles using theme tokens), that the shell styles the notes window, and the `N` / `⇧N` shortcuts

#### Scenario: Local images documented
- **WHEN** an author reads `SLIDE-CONTRACT.md` to add a photo or diagram
- **THEN** it explains that local image paths are relative to the slide or cover HTML file, that assemble bakes them into the single-file output via a shared registry, and that `https:` image URLs are left as network references
