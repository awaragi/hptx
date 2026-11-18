# Spec Delta: slide-generator

## MODIFIED Requirements

### Requirement: Deck config updated
When a deck JSON file is resolved for `new slide` (`--deck` if given, otherwise `<cwd>/deck.json` when that file exists) and it has a `slides` list, the generator MUST add the new file to it: after `--after <key>` when given, otherwise at the end. When the resolved file has no `slides` list, the generator MUST leave slide order unchanged and MUST reject `--after`. CDN `scripts` / `styles` that the template's catalog entry needs MUST be added to that file if missing. When no deck file is resolved, the generator MUST write only the slide HTML and MUST reject `--after`. Loading the resolved deck file MUST accept the same JSON5 syntax as config load. When the generator writes the deck file, the write MUST follow the platform deck-file write rules (strict JSON; comments need not be preserved).

#### Scenario: Insert after a slide
- **WHEN** the deck file lists `["overview.html", "process.html", "closing.html"]` and the user runs `npm run new -- slide --cwd deck --key detail --from blank --after process`
- **THEN** `slides` becomes `["overview.html", "process.html", "detail.html", "closing.html"]`

#### Scenario: CDN dependency added
- **WHEN** a user creates a slide from `d3Chart` in a deck whose deck file has no D3 script
- **THEN** the D3 CDN URL from the catalog is added to that file’s `scripts`

#### Scenario: --after without a slides list
- **WHEN** the deck file has no `slides` field and the command includes `--after process`
- **THEN** the command fails without writing any file and explains that `--after` needs a `slides` list

#### Scenario: JSON5 deck file can be updated
- **WHEN** the resolved deck file uses JSON5 comments in `slides` and the user runs `new slide` that updates `slides`
- **THEN** the command succeeds and the written deck file is valid strict JSON including the new slide entry

### Requirement: Create a new deck
`npm run new -- deck --cwd <dir>` MUST require `--cwd` and MUST create that directory containing a valid `deck.json` with `"version": 1`, `"cover": "cover.html"`, a `cover.html` copied from the library cover, and a starter slide `overview.html` (from `blank`) listed in `slides`. It MUST accept the same long-only field flags as build. Omitted optional field flags MUST NOT be written into `deck.json` (scaffold still writes `version`, `cover`, and `slides` for the starter files it creates). When `--title` is provided it MUST also drive the cover headline and document title; when omitted, the cover and overview MUST use their template defaults. The command MUST fail without writing when `<dir>` exists and is not empty. The written `deck.json` MUST be pretty-printed strict JSON via the same platform deck-file write path used for other deck config writes.

#### Scenario: New deck previews
- **WHEN** a user runs `npm run new -- deck --cwd decks/demo --title "Demo deck" --output ./Demo.html` and then `npm run dev -- --cwd decks/demo`
- **THEN** the deck shows the home page with a `Demo deck` cover and the agenda, then the `overview` slide, and its document title is `Demo deck`

#### Scenario: Non-empty folder protected
- **WHEN** `decks/demo` already contains files
- **THEN** `npm run new -- deck --cwd decks/demo` fails and writes nothing

#### Scenario: Scaffolded deck.json is strict JSON
- **WHEN** `new deck` succeeds
- **THEN** the written `deck.json` parses as strict JSON and as JSON5
