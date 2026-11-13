# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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
