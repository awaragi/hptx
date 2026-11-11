# Spec Delta

## MODIFIED Requirements

### Requirement: Single-file output
Build MUST produce one HTML file at the deck’s configured `output` path, combining the single-file shell (platform JS/CSS inlined), the agenda, selected slides, theme bake-in (if any), CDN asset tags declared in `deck.json`, and any baked local slide/cover images (shared registry and applicator). The file MUST work when opened directly via `file://` without a bundler or server. CDN assets remain network-loaded at runtime (not inlined). Baked local images MUST render under `file://` without separate asset files beside the output.

#### Scenario: Build writes output beside deck.json
- **WHEN** a user builds a deck root with `output` set to `./Team-Deck.html`
- **THEN** that file exists afterward and contains shell chrome, the agenda, and the selected slides

#### Scenario: Output opens from file://
- **WHEN** the built `output` is opened via a `file://` URL
- **THEN** the deck renders, `Deck.goToKey` navigates between slides, and the console shows no registration or boot errors

#### Scenario: Baked images work on file://
- **WHEN** a built deck includes a slide that referenced a local relative image and the output is opened via `file://`
- **THEN** that image is visible without a sibling assets folder next to the output file
