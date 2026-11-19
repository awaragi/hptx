# Spec Delta

## MODIFIED Requirements

### Requirement: Shared assemble semantics for export
Export MUST assemble with the same slide resolution, harvesting, CSS scoping, registration binding, theme bake, settings bake, and CDN tags as build (including `--slide` filter order and `--settings.*`). Export MUST NOT minify inline CSS or JavaScript for the capture HTML. Export MAY serve the assembled HTML over a local HTTP URL for capture so CDN assets load. Export MUST NOT be required to leave the HTML `output` file written, but MUST still require the effective output path for naming. Export MUST NOT accept `--debug` as a minify control (minify is not applied on this path).

#### Scenario: Slide filter applies
- **WHEN** export is invoked with `--slide overview --slide detail`
- **THEN** only the home page plus those slides (in CLI order) are captured

#### Scenario: Export assemble skips minify
- **WHEN** export assembles HTML for capture
- **THEN** that HTML is not CSS/JS-minified (same packaging as build with minify disabled)
