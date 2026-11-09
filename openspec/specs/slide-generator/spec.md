# slide-generator Specification

## Purpose
Lets authors create new slides and new decks from the framework's template library with one command, so that every new slide starts from a working, contract-compliant file.

## Requirements

### Requirement: Create a slide from a template
`npm run new -- slide --cwd <dir> --key <stem> --from <template>` MUST require `--cwd`, `--key`, and `--from`. It MUST write `<cwd>/<key>.html` as a copy of the named template. The only changes MUST be the document `<title>`, the `title` passed to `registerSlide`, and the contract stylesheet link path. Element IDs, classes, keyframe names, and scripts MUST be copied unchanged.

#### Scenario: Slide created
- **WHEN** a user runs `npm run new -- slide --cwd decks/demo --key detail --from cardGrid`
- **THEN** `decks/demo/detail.html` exists, its markup, styles, and scripts match `templates/cardGrid.html` apart from the title and contract link, and `npm run dev -- --cwd decks/demo` shows it

#### Scenario: Title option
- **WHEN** the command includes `--title "Detail view"`
- **THEN** the new slide's `<title>` and registered `title` are `Detail view`

#### Scenario: Default title
- **WHEN** no `--title` is given for key `detail`
- **THEN** the new slide's `<title>` and registered `title` are `Detail`

### Requirement: Contract link points to the framework
The generated slide's contract stylesheet link MUST be a relative path from the target deck folder to the framework's `shell/contract/slide-contract.css`.

#### Scenario: Deck outside the framework folder
- **WHEN** the framework is at `/work/hptx` and the user creates a slide in `/work/decks/demo`
- **THEN** the generated link `href` is `../../hptx/shell/contract/slide-contract.css`

### Requirement: Deck config updated
When a deck JSON file is resolved for `new slide` (`--deck` if given, otherwise `<cwd>/deck.json` when that file exists) and it has a `slides` list, the generator MUST add the new file to it: after `--after <key>` when given, otherwise at the end. When the resolved file has no `slides` list, the generator MUST leave slide order unchanged and MUST reject `--after`. CDN `scripts` / `styles` that the template's catalog entry needs MUST be added to that file if missing. When no deck file is resolved, the generator MUST write only the slide HTML and MUST reject `--after`.

#### Scenario: Insert after a slide
- **WHEN** the deck file lists `["overview.html", "process.html", "closing.html"]` and the user runs `npm run new -- slide --cwd deck --key detail --from blank --after process`
- **THEN** `slides` becomes `["overview.html", "process.html", "detail.html", "closing.html"]`

#### Scenario: CDN dependency added
- **WHEN** a user creates a slide from `d3Chart` in a deck whose deck file has no D3 script
- **THEN** the D3 CDN URL from the catalog is added to that file’s `scripts`

#### Scenario: --after without a slides list
- **WHEN** the deck file has no `slides` field and the command includes `--after process`
- **THEN** the command fails without writing any file and explains that `--after` needs a `slides` list

### Requirement: Safe slide creation
The generator MUST fail without writing any file when `--cwd` is missing, the key is not a valid filename stem, the key is `agenda`, `<key>.html` is the deck's `cover` (when a cover is configured), `<key>.html` already exists, the template is unknown, or the `--after` key is not in `slides`. When a deck file is resolved, it MUST be a valid versioned deck file before mutation. The error MUST say which condition failed; for an unknown template it MUST list the available templates.

#### Scenario: Existing file protected
- **WHEN** `decks/demo/detail.html` already exists and the user runs `npm run new -- slide --cwd decks/demo --key detail --from blank`
- **THEN** the command fails, the existing file is unchanged, and any deck file is unchanged

#### Scenario: Unknown template
- **WHEN** the user passes `--from timeline` and no such template exists
- **THEN** the command fails and lists the available template keys

#### Scenario: Cover key protected
- **WHEN** the deck file sets `"cover": "cover.html"` and the user runs `npm run new -- slide --cwd decks/demo --key cover --from blank`
- **THEN** the command fails, says `cover.html` is the deck's cover, and writes nothing

### Requirement: Create a new deck
`npm run new -- deck --cwd <dir>` MUST require `--cwd` and MUST create that directory containing a valid `deck.json` with `"version": 1`, `"cover": "cover.html"`, a `cover.html` copied from the library cover, and a starter slide `overview.html` (from `blank`) listed in `slides`. It MUST accept the same long-only field flags as build. Omitted optional field flags MUST NOT be written into `deck.json` (scaffold still writes `version`, `cover`, and `slides` for the starter files it creates). When `--title` is provided it MUST also drive the cover headline and document title; when omitted, the cover and overview MUST use their template defaults. The command MUST fail without writing when `<dir>` exists and is not empty.

#### Scenario: New deck previews
- **WHEN** a user runs `npm run new -- deck --cwd decks/demo --title "Demo deck" --output ./Demo.html` and then `npm run dev -- --cwd decks/demo`
- **THEN** the deck shows the home page with a `Demo deck` cover and the agenda, then the `overview` slide, and its document title is `Demo deck`

#### Scenario: Non-empty folder protected
- **WHEN** `decks/demo` already contains files
- **THEN** `npm run new -- deck --cwd decks/demo` fails and writes nothing

### Requirement: List templates
`npm run new -- --list` MUST print each template's key and description from the catalog.

#### Scenario: Listing
- **WHEN** a user runs `npm run new -- --list`
- **THEN** the output includes `cardGrid` with its catalog description

### Requirement: New CLI uses Commander
`npm run new` MUST parse its arguments with the Commander library using subcommands `deck` and `slide`, plus `--list` on the root command. Unknown options MUST fail. `--help` MUST print the full Commander help for the root command and each subcommand, documenting `--cwd` and the other long-only flags.

#### Scenario: New unknown option fails
- **WHEN** the user runs `npm run new -- slide --cwd decks/demo --key detail --from blank --bogus`
- **THEN** the command exits non-zero without writing a slide file

#### Scenario: List still works
- **WHEN** the user runs `npm run new -- --list`
- **THEN** each template key and description is printed

### Requirement: new slide requires cwd
`new slide` MUST fail when `--cwd` is omitted.

#### Scenario: Missing cwd fails
- **WHEN** a user runs `npm run new -- slide --key detail --from blank` without `--cwd`
- **THEN** the command exits non-zero without writing a file

### Requirement: new slide without a deck file
When no deck file is resolved under `--cwd` / `--deck`, `new slide` MUST write only the slide HTML.

#### Scenario: No deck file writes HTML only
- **WHEN** `--cwd` has no deck.json and the user runs `npm run new -- slide --cwd decks/demo --key detail --from blank`
- **THEN** `detail.html` is written and no deck.json is created

### Requirement: new deck field parity and omit policy
`new deck` MUST accept build’s long-only field flags and MUST omit unpassed optional keys from the written JSON while still writing scaffold `version`, `cover`, and `slides`.

#### Scenario: Omitted optional fields not written
- **WHEN** a user runs `npm run new -- deck --cwd decks/demo` with no `--brand` or `--caption`
- **THEN** the written `deck.json` has `"version": 1` and does not contain `brand` or `caption` keys

#### Scenario: Missing cwd fails for new deck
- **WHEN** a user runs `npm run new -- deck` without `--cwd`
- **THEN** the command exits non-zero without writing

### Requirement: new help screen
`npm run new -- --help` and `npm run new -- deck --help` MUST print full Commander help and exit zero.

#### Scenario: Help shows full screen
- **WHEN** the user runs `npm run new -- --help` or `npm run new -- deck --help`
- **THEN** the command prints usage and option descriptions and exits zero
