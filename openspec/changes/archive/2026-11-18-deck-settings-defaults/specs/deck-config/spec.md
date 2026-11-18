# Spec Delta: deck-config

## MODIFIED Requirements

### Requirement: deck.json structure
When a deck JSON file is loaded, it MUST be a JSON object. The platform MUST recognize exactly these top-level fields: `version` (required integer), and the optional `output`, `slides` (string array), `cover`, `theme`, `title`, `brand`, and `caption` (strings), `scripts` and `styles` (arrays of strings or `{ src, integrity?, crossorigin? }` objects), and `settings` (object). Each field's meaning is defined by its own requirement. Fields present in the file participate in the effective config cascade; omitted optional fields leave those keys unset at the file layer.

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

### Requirement: Effective config cascade
The effective deck config MUST merge layers in order, with later layers winning per field: built-in defaults, then the loaded deck file (when present), then CLI flags. An absent key at a layer MUST NOT clear a lower layer. For `settings`, merge MUST be per known settings key (later layers override only keys they set). After merge, validate required inputs for the command and fail naming what is missing.

#### Scenario: CLI overrides file title
- **WHEN** the deck file sets `"title": "From file"` and the user passes `--title "From CLI"`
- **THEN** the assembled document title is `From CLI`

#### Scenario: File value used when CLI omits field
- **WHEN** the deck file sets `"brand": "Acme."` and the user does not pass `--brand`
- **THEN** the shell shows brand `Acme.`

#### Scenario: Default brand when unset
- **WHEN** neither the file nor CLI sets `brand`
- **THEN** the shell shows brand `Brand.`

#### Scenario: Settings key from CLI overrides file
- **WHEN** the deck file sets `"settings": { "clicker": false, "appearance": "dark" }` and the user passes `--settings.clicker true`
- **THEN** effective settings have `clicker` true and `appearance` `dark`

#### Scenario: Omitted settings key keeps lower layer
- **WHEN** the deck file sets `"settings": { "clicker": true }` and the user does not pass `--settings.clicker`
- **THEN** effective `clicker` remains true

## ADDED Requirements

### Requirement: settings field
`deck.json` MAY include a `settings` object for playback defaults. Known keys are only `clicker`, `rememberStep`, and `timer` (booleans) and `appearance` (`light` or `dark`). Unknown keys, wrong types, or invalid `appearance` MUST fail load naming the key. Omitted keys leave that setting unset at the file layer.

#### Scenario: Valid partial settings
- **WHEN** `deck.json` sets `"settings": { "clicker": true }`
- **THEN** config load succeeds and effective `clicker` is true after merge with platform defaults for unset keys

#### Scenario: Unknown settings key rejected
- **WHEN** `deck.json` sets `"settings": { "foo": true }`
- **THEN** config load fails with an error naming `foo`

#### Scenario: Invalid appearance rejected
- **WHEN** `deck.json` sets `"settings": { "appearance": "blue" }`
- **THEN** config load fails with an error naming `appearance`

#### Scenario: Non-boolean clicker rejected
- **WHEN** `deck.json` sets `"settings": { "clicker": 1 }`
- **THEN** config load fails with an error naming `clicker`

### Requirement: Platform settings defaults
When a settings key is unset after file and CLI merge, the platform MUST use these defaults: `clicker` false, `rememberStep` false, `timer` false, `appearance` `light`. Effective settings MUST always include all four keys after cascade.

#### Scenario: No settings anywhere
- **WHEN** neither the deck file nor CLI provides any settings keys
- **THEN** effective settings are clicker false, rememberStep false, timer false, appearance light

### Requirement: Settings distinct from theme CSS
The `theme` field and `--theme` CSS path/URL MUST remain the CSS bake source. Light/dark presentation mode MUST be the `appearance` settings key only, not `theme`.

#### Scenario: Theme CSS and appearance coexist
- **WHEN** the deck sets `"theme": "./brand.css"` and `"settings": { "appearance": "dark" }`
- **THEN** assemble bakes the CSS theme and effective appearance is dark
