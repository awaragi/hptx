# deck-config Specification

## Purpose

Defines the `deck.json` contract for a presentation deck project: required and optional fields, path vs `https` URL rules, slide discovery, and which files are never treated as slides.

## Requirements

### Requirement: Deck project root
The deck working root MUST be the resolved `--cwd` directory, or the parent directory of `--deck` when `--cwd` is omitted. Relative filesystem paths in the deck file MUST resolve against that working root. The working root MUST NOT require a deck JSON file to exist.

#### Scenario: Resolve paths relative to deck.json
- **WHEN** the user runs with `--cwd /path/to/deck` (or `--deck /path/to/deck/deck.json`) and the effective config has `output` `./Deck.html` and `theme` `./theme.css`
- **THEN** those paths resolve under `/path/to/deck`

### Requirement: deck.json structure
When a deck JSON file is loaded, it MUST be a JSON object. The platform MUST recognize exactly these top-level fields: `version` (required integer), and the optional `output`, `slides` (string array), `cover`, `theme`, `title`, `brand`, and `caption` (strings), and `scripts` and `styles` (arrays of strings or `{ src, integrity?, crossorigin? }` objects). Each field's meaning is defined by its own requirement. Fields present in the file participate in the effective config cascade; omitted optional fields leave those keys unset at the file layer.

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
    "scripts": [
      { "src": "https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js", "crossorigin": "anonymous" }
    ],
    "styles": []
  }
  ```
- **THEN** the toolchain treats those values as the deck’s schema version, title, brand, brand caption, cover, slides, output, theme source to bake in, and CDN script list

### Requirement: Unknown fields rejected
The platform MUST reject a `deck.json` that contains any top-level field not listed in the structure table, with an error naming the unknown field.

#### Scenario: Typo in field name
- **WHEN** `deck.json` contains `"script": ["https://cdn.example.com/x.js"]`
- **THEN** config load fails with an error naming `script` as an unknown field

### Requirement: title and brand fields
When an effective deck title is resolved (see Effective deck title resolution), the shell MUST use it as the document `<title>` and the presentation title. When `brand` is present, the shell MUST use that string exactly as the primary brand label (no parsing or splitting). When `caption` is present, the shell MUST show it as the secondary caption under the brand (top bar and loader). When `brand` is omitted, the primary brand label MUST be `Brand.`; when `caption` is omitted, there MUST be no caption. `title` (when present in the file or CLI), `brand`, and `caption` MUST NOT be empty or whitespace-only after trim.

#### Scenario: Title sets document title
- **WHEN** `deck.json` sets `"title": "Team Kickoff"`
- **THEN** the assembled document’s `<title>` is `Team Kickoff`

#### Scenario: Brand omitted keeps default
- **WHEN** `brand` is absent
- **THEN** the shell shows the primary brand label `Brand.`

#### Scenario: Title omitted keeps default
- **WHEN** `title` is absent from the file and CLI, and the effective `output` ends with `Demo.html`
- **THEN** the assembled document’s `<title>` is `Demo`

#### Scenario: Explicit brand and caption
- **WHEN** `deck.json` sets `"brand": "Acme."` and `"caption": "Demo"`
- **THEN** the top-bar brand is `Acme.` with caption `Demo`, and a period inside `brand` is not treated as a split marker for further parsing

#### Scenario: Brand alone is not split
- **WHEN** `deck.json` sets `"brand": "Acme. Demo"` and omits `caption`
- **THEN** the shell shows the single primary label `Acme. Demo` with no caption element

#### Scenario: Empty caption rejected
- **WHEN** `deck.json` sets `"caption": "  "`
- **THEN** config load fails with an error naming `caption`

#### Scenario: Empty title rejected
- **WHEN** `deck.json` sets `"title": "  "`
- **THEN** config load fails with an error naming `title`

### Requirement: Effective deck title resolution
The platform MUST resolve the effective deck title in this order, using the first applicable source: CLI `--title`, then `deck.json` `title`, then the filename stem of the effective `output` path (no extension), then the basename of the working root (`--cwd` / deck parent). The resolved title MUST be trimmed. Omitted sources MUST fall through; only an explicitly provided empty-after-trim `title` MUST fail. Effective configuration output MUST list this resolved title.

#### Scenario: CLI title wins over file and output
- **WHEN** the file sets `"title": "From file"`, effective output is `./Out.html`, and the CLI passes `--title "From CLI"`
- **THEN** the resolved title is `From CLI`

#### Scenario: Output stem when title omitted
- **WHEN** neither file nor CLI sets `title` and effective output is `./dist/Q3-Review.html`
- **THEN** the resolved title is `Q3-Review`

#### Scenario: Working-root basename when title and output omitted
- **WHEN** neither file nor CLI sets `title`, there is no effective `output`, and the working root ends with `decks/about`
- **THEN** the resolved title is `about`

#### Scenario: Console lists resolved title
- **WHEN** a developer runs build, dev, or export for a deck whose resolved title is `Demo`
- **THEN** the effective-configuration summary prints `title` as `Demo`

### Requirement: Title slug for presentation identity
The platform MUST derive a presentation slug from the resolved deck title for export artifact naming and browser preference scoping. The slug MUST be a non-empty filesystem-safe lowercase token derived from the title (letters, digits, and single hyphens between segments). If slug derivation would yield an empty string, config resolution MUST fail naming `title`.

#### Scenario: Spaced title becomes a slug
- **WHEN** the resolved title is `Q3 Review`
- **THEN** the presentation slug is a non-empty hyphenated form such as `q3-review`

#### Scenario: Title that cannot slugify fails
- **WHEN** the resolved title is only punctuation or symbols that produce no slug characters
- **THEN** config resolution fails with an error naming `title`

### Requirement: slides field
When `deck.json` includes a `slides` array, the platform MUST use that exact ordered list of slide filenames as the full deck slide set (before any CLI filter).

#### Scenario: Explicit slides list
- **WHEN** `deck.json` contains `"slides": ["overview.html", "metrics.html"]`
- **THEN** the resolved full slide set is those two files in that order

### Requirement: Default slide discovery
When `slides` is omitted from `deck.json`, the platform MUST discover slide inputs as `*.html` files in the deck root, sorted by filename, excluding the configured `output` path and the configured `cover` file. Every discovered file MUST be a valid slide document (see `html-slides`); a discovered file that is not MUST fail config resolution with an error naming the file and suggesting an explicit `slides` list.

#### Scenario: Filename fallback skips output
- **WHEN** `slides` is omitted and `output` is `./Deck.html`
- **THEN** `Deck.html` is not included in the discovered slide set

#### Scenario: Filename fallback skips cover
- **WHEN** `slides` is omitted and `cover` is `./cover.html`
- **THEN** `cover.html` is not included in the discovered slide set and is not checked as a slide

#### Scenario: Stray HTML file fails discovery
- **WHEN** `slides` is omitted and the deck root contains `notes.html` with no `registerSlide` call
- **THEN** resolution fails with an error naming `notes.html`

### Requirement: Slide keys unique and not reserved
Each slide’s key is its filename stem. The resolved slide set MUST NOT contain two files with the same stem, and MUST NOT contain a slide whose stem is the reserved shell key `agenda`.

#### Scenario: Duplicate stem fails
- **WHEN** `slides` lists `a/metrics.html` and `b/metrics.html`
- **THEN** resolution fails with an error naming both files

#### Scenario: Reserved key fails
- **WHEN** the slide set contains `agenda.html`
- **THEN** resolution fails with an error that `agenda` is reserved by the shell

### Requirement: output field
The effective config used for build MUST include an `output` path (from the deck file and/or CLI `--output`, with CLI winning). Preview MUST NOT require `output`. The platform MUST never treat the `output` file as a slide input. When neither the file nor CLI provides `output`, build MUST fail after merge.

#### Scenario: Output co-located with slides
- **WHEN** effective `output` is `./Deck.html` in the same folder as slide HTML files
- **THEN** build writes that path and slide discovery/listing ignores it

#### Scenario: Missing output fails config load
- **WHEN** neither the deck file nor `--output` provides `output` and the user runs build
- **THEN** the toolchain fails with an error stating that `output` is required

### Requirement: theme field
`deck.json` MAY include a `theme` field naming a CSS source to **bake in**. The value MUST be either a filesystem path (relative to the deck root unless absolute) or an `https://` URL; `http://` and other schemes MUST be rejected at config load. When present, assemble MUST read the CSS text and append it after the shell default tokens inside the deck theme markers so unspecified tokens keep their defaults. When omitted, only the shell’s default deck-theme block MUST remain between the markers.

#### Scenario: Theme omitted keeps shell default
- **WHEN** `theme` is absent from `deck.json`
- **THEN** assembled HTML retains the shell default tokens inside the deck theme markers

#### Scenario: Theme local path resolved
- **WHEN** `theme` is `./theme.css`
- **THEN** the toolchain reads that file from the deck root for theme bake-in

#### Scenario: Theme remote URL read
- **WHEN** `theme` is an `https://` URL to a CSS resource
- **THEN** the toolchain reads the response body and uses that text for theme bake-in, and the output embeds that CSS rather than a runtime `<link>` to the URL

#### Scenario: Insecure theme URL rejected
- **WHEN** `theme` is `http://example.com/theme.css`
- **THEN** config load fails with an error that remote themes must use `https://`

#### Scenario: Theme unreadable fails
- **WHEN** `theme` is set but the local file cannot be read or the remote URL cannot be fetched successfully within the timeout
- **THEN** assemble fails with an error identifying the theme source

#### Scenario: Partial theme keeps unspecified defaults
- **WHEN** `theme` CSS sets `--brand` and omits `--accent`
- **THEN** the assembled deck theme region still declares the shell default `--accent` before the baked rules

### Requirement: scripts and styles are https CDN URLs only
Each `scripts` and `styles` entry MUST be either an absolute `https://` URL string or an object with a required `https://` `src` and optional string `integrity` and `crossorigin`. Relative paths, `http:` URLs, `file:` URLs, other schemes, and unknown object keys MUST be rejected at config load. The platform MUST NOT download or inline these assets into the output HTML.

#### Scenario: Valid CDN script accepted
- **WHEN** `scripts` contains `https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js`
- **THEN** config load succeeds and assemble emits a matching `<script src="...">` tag

#### Scenario: SRI attributes emitted
- **WHEN** `scripts` contains `{ "src": "https://cdn.example.com/lib.js", "integrity": "sha384-abc", "crossorigin": "anonymous" }`
- **THEN** the emitted `<script>` tag carries those `integrity` and `crossorigin` attributes

#### Scenario: Relative script path rejected
- **WHEN** `scripts` contains `./vendor/d3.min.js`
- **THEN** config load fails with an error that scripts must be `https://` CDN URLs

#### Scenario: Insecure script URL rejected
- **WHEN** `scripts` contains `http://cdn.example.com/lib.js`
- **THEN** config load fails with an error that scripts must be `https://` CDN URLs

#### Scenario: Relative style path rejected
- **WHEN** `styles` contains `./extra.css`
- **THEN** config load fails with an error that styles must be `https://` CDN URLs

### Requirement: cover field
`deck.json` MAY include a `cover` field: a non-empty string naming an `.html` file, resolved against the deck root unless absolute. The file MUST exist and MUST be a valid cover document (see `html-slides`). The cover MUST NOT be the `output` file and MUST NOT be listed in `slides`; either case MUST fail with an error naming the cover. The cover is always assembled, including when `--slides` filters the deck.

#### Scenario: Cover listed as a slide fails
- **WHEN** `deck.json` sets `"cover": "cover.html"` and `"slides": ["cover.html", "metrics.html"]`
- **THEN** config resolution fails with an error that `cover.html` is the cover and must not be listed in `slides`

#### Scenario: Missing cover file fails
- **WHEN** `cover` is `./missing.html` and that file does not exist
- **THEN** the toolchain fails with an error naming `./missing.html`

#### Scenario: Non-HTML cover rejected
- **WHEN** `cover` is `./cover.md`
- **THEN** config load fails with an error that `cover` must be an `.html` file

#### Scenario: Cover kept in a filtered deck
- **WHEN** a deck with a `cover` is assembled with `--slides metrics`
- **THEN** the home page shows the cover content

### Requirement: Working root without a deck file
When `--cwd` is set and no deck file is loaded, the toolchain MUST still use that directory as the working root for slide discovery and relative deck-scoped paths.

#### Scenario: Root from --deck alone
- **WHEN** the user runs with `--deck /path/to/deck/deck.json` and no `--cwd`
- **THEN** the working root is `/path/to/deck`

#### Scenario: Pure CLI root without a deck file
- **WHEN** the user runs with `--cwd /path/to/deck` and that directory has no `deck.json`
- **THEN** the toolchain uses `/path/to/deck` as the working root and does not require a deck file

### Requirement: Deck file schema version
When a deck JSON file is specified via `--deck` or found as `<cwd>/deck.json`, it MUST include a top-level `version` integer. The current schema version is `1`. A missing `version`, a non-integer `version`, or an unsupported `version` MUST fail load. Pure-CLI runs with no deck file MUST NOT require a version.

#### Scenario: Version 1 loads
- **WHEN** the file contains `"version": 1` and otherwise valid fields
- **THEN** config load succeeds

#### Scenario: Missing version fails
- **WHEN** a deck file is loaded and omits `version`
- **THEN** load fails with an error that `version` is required

#### Scenario: Unsupported version fails
- **WHEN** a deck file sets `"version": 99`
- **THEN** load fails with an error that version 99 is not supported and that this toolchain supports 1

#### Scenario: No file needs no version
- **WHEN** assemble runs with `--cwd` only and no deck file is present
- **THEN** the run does not fail for a missing `version`

### Requirement: File output optional when CLI supplies it
A loaded deck file MAY omit `output` when CLI `--output` will supply it for build. File-layer validation MUST NOT require `output`.

#### Scenario: File without output allowed when CLI supplies it
- **WHEN** the deck file has `"version": 1` and no `output`, and the user passes `--output ./Out.html`
- **THEN** build uses that CLI output path and succeeds if other required inputs are present

### Requirement: Effective config cascade
The effective deck config MUST merge layers in order, with later layers winning per field: built-in defaults, then the loaded deck file (when present), then CLI flags. An absent key at a layer MUST NOT clear a lower layer. After merge, validate required inputs for the command and fail naming what is missing.

#### Scenario: CLI overrides file title
- **WHEN** the deck file sets `"title": "From file"` and the user passes `--title "From CLI"`
- **THEN** the assembled document title is `From CLI`

#### Scenario: File value used when CLI omits field
- **WHEN** the deck file sets `"brand": "Acme."` and the user does not pass `--brand`
- **THEN** the shell shows brand `Acme.`

#### Scenario: Default brand when unset
- **WHEN** neither the file nor CLI sets `brand`
- **THEN** the shell shows brand `Brand.`
