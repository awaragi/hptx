# Spec Delta: deck-config

## MODIFIED Requirements

### Requirement: deck.json structure
When a deck file is loaded, its text MUST be parsed as JSON5 and the result MUST be a plain object. Strict JSON remains valid (JSON5 is a JSON superset). The platform MUST recognize exactly these top-level fields: `version` (required integer), and the optional `output`, `slides` (string array), `cover`, `theme`, `title`, `brand`, and `caption` (strings), `scripts` and `styles` (arrays of strings or `{ src, integrity?, crossorigin? }` objects), and `settings` (object). Each field's meaning is defined by its own requirement. Fields present in the file participate in the effective config cascade; omitted optional fields leave those keys unset at the file layer. Parse failures MUST fail load with an error that names the deck file.

#### Scenario: Minimal valid deck.json
- **WHEN** the file contains `"version": 1` and `"output": "./Deck.html"` and slide files exist via `slides` or discovery
- **THEN** the config loads successfully

#### Scenario: Example deck.json with CDN and theme
- **WHEN** `deck.json` is:
  ```json
  {
    "version": 1,
    "title": "Team update",
    "brand": "Acme.",
    "caption": "Demo",
    "cover": "cover.html",
    "slides": ["process.html", "processFlow.html"],
    "output": "./Q3-Review.html",
    "theme": "./theme.css",
    "settings": { "clicker": true, "appearance": "dark" },
    "scripts": [
      { "src": "https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js", "crossorigin": "anonymous" }
    ],
    "styles": []
  }
  ```
- **THEN** the toolchain treats those values as the deck’s schema version, title, brand, brand caption, cover, slides, output, theme source to bake in, settings defaults, and CDN script list

#### Scenario: Invalid JSON5 text rejected
- **WHEN** the deck file text cannot be parsed as JSON5
- **THEN** config load fails with an error naming the deck file

## ADDED Requirements

### Requirement: JSON5 authoring syntax in deck files
A deck file MAY use JSON5 syntax beyond strict JSON, including single-line and multi-line comments and trailing commas in objects and arrays. After parse, field validation MUST be unchanged from the structure and field requirements. Commented-out `slides` entries MUST NOT appear in the resolved slide set.

#### Scenario: Comment out a slide entry
- **WHEN** `deck.json` lists `"slides": ["overview.html", /* "metrics.html", */ "closing.html"]` (or equivalent line comments excluding `metrics.html`)
- **THEN** config load succeeds and the resolved full slide set is `overview.html` then `closing.html` only

#### Scenario: Trailing comma accepted
- **WHEN** `deck.json` contains a trailing comma after the last `slides` entry and is otherwise valid
- **THEN** config load succeeds

### Requirement: Platform deck file writes are strict JSON
When the platform writes a deck config file (scaffold or update), it MUST emit pretty-printed strict JSON. The write MUST NOT be required to preserve comments, trailing commas, or other JSON5-only source syntax from a prior file version.

#### Scenario: Rewrite drops comments
- **WHEN** a deck file containing comments is updated by a platform write
- **THEN** the written file is valid strict JSON and need not retain those comments
