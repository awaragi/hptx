# slide-contract Specification

## Purpose
Gives slide authors, human or AI, a standalone reference for writing slides: the CSS that slides can rely on, the registration and `Deck` API, and the authoring rules. These files are also what the shell actually uses, so they cannot drift from it.

## Requirements

### Requirement: Contract reference files
The framework MUST ship `shell/contract/slide-contract.css`, `shell/contract/slide-contract.d.ts`, and `shell/contract/SLIDE-CONTRACT.md`. Together they MUST document everything a slide may rely on from the shell: theme tokens, slide-facing shared classes, `registerSlide`, the slide module hooks, and the `Deck` API.

#### Scenario: Files present
- **WHEN** a user lists `shell/contract/`
- **THEN** it contains `slide-contract.css`, `slide-contract.d.ts`, and `SLIDE-CONTRACT.md`

### Requirement: Contract stylesheet is the shell's source
`slide-contract.css` MUST contain the default theme tokens between the `DECK THEME — START` and `END` markers, followed by the shared classes slides and covers may use. The shell MUST get those tokens and classes from this file at assemble time. Shell chrome styles (navigation drawer, Settings, loader, home page layout, agenda tiles, keyboard hints) MUST NOT be in it. THEMING comments in the stylesheet MUST describe bake as appending over those defaults (CSS cascade), not replacing them.

#### Scenario: Edit reaches the deck
- **WHEN** a shared class in `slide-contract.css` is changed and a deck is rebuilt
- **THEN** the built deck uses the changed rule

#### Scenario: Theme markers preserved
- **WHEN** a deck with no `theme` in `deck.json` is built
- **THEN** the output's `<style id="deck-theme">` contains both markers with the default tokens from `slide-contract.css` between them

#### Scenario: Deck theme appended over defaults
- **WHEN** a deck sets `theme` in `deck.json`
- **THEN** the output’s marker region still contains the contract default tokens and the baked theme CSS after them

#### Scenario: Home layout is chrome
- **WHEN** a reader searches `slide-contract.css` for `.agenda-col` or `.toc-item`
- **THEN** neither is defined there, and both are defined in the shell template's chrome styles

### Requirement: API declarations match the shell
`slide-contract.d.ts` MUST declare `registerSlide`, the slide module object (`title`, `icon`, agenda fields, optional `estimatedMinutes`, `boot` and the other hooks), the slide-scoped `document`, and every member of `Deck`, each with a description. The test suite MUST fail if the shell's `Deck` object has a member that the declarations lack, or the declarations list a member the shell does not have.

#### Scenario: Undeclared Deck member
- **WHEN** a developer adds `Deck.flash` to the shell without declaring it in `slide-contract.d.ts`
- **THEN** `npm test` fails and names `flash`

#### Scenario: Stale declaration
- **WHEN** `slide-contract.d.ts` declares a `Deck` member the shell no longer exposes
- **THEN** `npm test` fails and names that member

#### Scenario: Estimated minutes declared
- **WHEN** an author reads `SlideModule` in `slide-contract.d.ts`
- **THEN** it declares optional `estimatedMinutes` as a whole number of minutes for the speaker notes window

### Requirement: Authoring rules document
`SLIDE-CONTRACT.md` MUST state the slide authoring rules: file layout, filename key, canvas size (**1920×1080**, Full HD, 16:9), CSS scoping and `:scope`, theme token use, script scope, slide-scoped `document` versus `window.document`, passing elements rather than selector strings to libraries, keyframe and ID-reference rules, CDN dependencies via `deck.json`, how to link the contract stylesheet, how to write the cover file, how to write speaker notes (including optional estimated speaking time on `registerSlide`), and how to reference local images with paths relative to the slide or cover file (baked into the single-file output). It MUST describe `deck.json` `theme` as appending over the default token block (cascade), not replacing it.

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
- **THEN** it explains the `<aside class="notes">` element, that it is hidden on the canvas, the allowed formatting (basic HTML and inline styles using theme tokens), that the shell styles the notes window, the `N` / `⇧N` shortcuts, and optional `estimatedMinutes` on `registerSlide` shown as a static minutes label in the notes window

#### Scenario: Local images documented
- **WHEN** an author reads `SLIDE-CONTRACT.md` to add a photo or diagram
- **THEN** it explains that local image paths are relative to the slide or cover HTML file, that assemble bakes them into the single-file output via a shared registry, and that `https:` image URLs are left as network references

#### Scenario: Canvas is Full HD 16:9
- **WHEN** an author reads the canvas size in `SLIDE-CONTRACT.md`
- **THEN** it states **1920×1080** (Full HD, 16:9)

### Requirement: Project docs point to the contract
The project's agent and author notes (`CLAUDE.md`) MUST point to `shell/contract/` as the slide authoring reference and MUST NOT contradict it.

#### Scenario: Keyframe prefix rule removed
- **WHEN** a reader checks `CLAUDE.md` slide authoring notes
- **THEN** they reference `SLIDE-CONTRACT.md` and no longer require prefixing `@keyframes` with the slide key

### Requirement: Layout tokens outside the theme region
`slide-contract.css` MUST declare the layout tokens `--radius`, `--shadow`, and `--ease` (with a dark-mode `--shadow`) before the `DECK THEME — START` marker, not inside the theme region. A theme baked with `deck.json` `theme` or loaded in Settings MAY override them; a theme that omits them MUST keep the contract values.

#### Scenario: Colors-only theme keeps layout tokens
- **WHEN** a deck bakes a theme that declares only color tokens
- **THEN** the built deck still defines `--radius`, `--shadow`, and `--ease`

#### Scenario: Theme overrides a layout token
- **WHEN** a baked theme declares `--radius: 4px`
- **THEN** that declaration comes after the contract's `--radius` in the built stylesheet, so slides use `4px`
