# slide-local-images Specification

## Purpose

Bakes slide- and cover-relative local image files into the single-file assemble output once, so the same bytes are shared across CSS and markup without breaking `file://` delivery.

## Requirements

### Requirement: Paths resolve relative to the HTML file
Local image references in a slide or cover MUST resolve against that file’s directory. They MUST NOT resolve against the deck root, `deck.json`, the working root, or the framework unless the relative path itself navigates there.

#### Scenario: Sibling assets folder
- **WHEN** `slides/overview.html` contains `<img src="assets/logo.png">` and `slides/assets/logo.png` exists
- **THEN** assemble reads that file for baking

#### Scenario: Cover-relative path
- **WHEN** `cover.html` contains `url(mark.png)` in its CSS and `mark.png` sits beside `cover.html`
- **THEN** assemble reads that sibling file for baking

### Requirement: Discover local image references
Assemble MUST discover local relative references from slide and cover body markup on `<img src>` and `<source src>`, and from harvested CSS `url(...)` values. Absolute path refs, `https:`, `http:`, `data:`, `file:`, and protocol-relative URLs MUST NOT be treated as local bake candidates.

#### Scenario: Img and CSS url
- **WHEN** a slide has `<img src="pic.jpg">` and `.hero { background-image: url(hero.png); }` with both files beside the slide
- **THEN** both files are candidates for the shared registry

#### Scenario: Remote url left alone
- **WHEN** a slide has `<img src="https://cdn.example.com/a.png">` or `url(https://cdn.example.com/a.png)`
- **THEN** assemble leaves that reference unchanged and does not fetch it

### Requirement: Shared content-hashed registry
Each distinct local image file (by content) MUST appear once in a JSON registry of `data:` URIs embedded in the assembled HTML. Identical bytes referenced from multiple slides or as both markup and CSS MUST share one registry entry.

#### Scenario: Dedupe across slides
- **WHEN** two slides reference the same image bytes via different relative paths
- **THEN** the assembled output contains one registry entry for those bytes

### Requirement: Rewrite markup and CSS to registry ids
For each baked local reference, assemble MUST rewrite `<img>` / `<source>` by setting `data-asset="<id>"` and removing the local `src`, and MUST rewrite CSS `url(...)` to `var(--asset-<id>)`. Other attributes (including `alt`) MUST be preserved.

#### Scenario: Img rewrite
- **WHEN** `<img src="logo.png" alt="Logo">` is baked as id `a1b2c3`
- **THEN** the output contains `<img data-asset="a1b2c3" alt="Logo">` without that local `src`

#### Scenario: CSS rewrite
- **WHEN** `url(hero.jpg)` is baked as id `d4e5f6`
- **THEN** the scoped CSS uses `var(--asset-d4e5f6)` in place of that `url(...)`

### Requirement: Early applicator from one registry
The assembled document MUST include a synchronous early script that reads the registry once, sets each `--asset-<id>` custom property on the document element to `url("<data-uri>")`, and assigns `src` on every `img[data-asset]` and `source[data-asset]` from the same registry. The base64 payload MUST NOT be duplicated into a separate static CSS copy of the same data URIs.

#### Scenario: CSS and img share one payload
- **WHEN** the same asset id is used by a CSS `var(--asset-…)` and an `<img data-asset>`
- **THEN** the assembled HTML stores that data URI once in the registry and both surfaces receive it via the early script

#### Scenario: Runs before first paint of slides
- **WHEN** the assembled document is opened
- **THEN** the applicator script runs synchronously from `<head>` before slide bodies depend on the custom properties

### Requirement: Missing local image fails assemble
If a discovered local relative reference cannot be read as a file, assemble MUST fail with an error that names the slide or cover file and the reference.

#### Scenario: Broken relative path
- **WHEN** a slide references `assets/missing.png` and that file does not exist
- **THEN** assemble exits with a non-zero failure naming the slide and `assets/missing.png`
