# deck-build Specification

## Purpose

Defines assembling the presentation shell with selected slides into one HTML file at `output`, including theme bake-in (local path or `https://` URL read into markers), CDN `scripts`/`styles` tags, CLI slide filtering, an explicit deck-root argument, and atomic output.

## Requirements

### Requirement: Explicit deck root for build
`npm run build` MUST require `--cwd <dir>` and/or `--deck <file>`. When both are omitted, the command MUST exit non-zero with usage that names those flags. The toolchain MUST NOT default the working root to the invocation directory. When only `--deck` is set, the working root MUST be that file’s parent directory. When `--cwd` is set, it MUST be the working root even if `--deck` points elsewhere. When `--deck` is omitted, the toolchain MUST load `<cwd>/deck.json` if that file exists; otherwise it MUST proceed with no deck file.

#### Scenario: Build without deck path fails
- **WHEN** a user runs `npm run build` with neither `--cwd` nor `--deck`
- **THEN** the command exits non-zero with usage that names `--cwd` and `--deck`

#### Scenario: Build with explicit path
- **WHEN** a user runs `npm run build -- --cwd /path/to/deck` and `/path/to/deck/deck.json` exists
- **THEN** the command loads that file, merges CLI overrides, and writes the effective `output`

### Requirement: Single-file output
Build MUST produce one HTML file at the deck’s configured `output` path, combining the single-file shell (platform JS/CSS inlined), the agenda, selected slides, theme bake-in (if any), and CDN asset tags declared in `deck.json`. The file MUST work when opened directly via `file://` without a bundler or server. CDN assets remain network-loaded at runtime (not inlined).

#### Scenario: Build writes output beside deck.json
- **WHEN** a user builds a deck root with `output` set to `./Team-Deck.html`
- **THEN** that file exists afterward and contains shell chrome, the agenda, and the selected slides

#### Scenario: Output opens from file://
- **WHEN** the built `output` is opened via a `file://` URL
- **THEN** the deck renders, `Deck.goToKey` navigates between slides, and the console shows no registration or boot errors

### Requirement: Shell template built automatically
Build MUST produce the single-file shell template before assembling, and MAY skip rebuilding it when shell sources are unchanged.

#### Scenario: Fresh checkout build
- **WHEN** a user runs build on a fresh checkout with no prior shell build
- **THEN** the shell template is built and the deck `output` is written in the same command

### Requirement: Shared assemble semantics
Build MUST use the same slide resolution, harvesting, CSS scoping, and registration binding as preview: `deck.json` `slides` or filename fallback, never including `output`.

#### Scenario: Same inputs as full preview
- **WHEN** build runs without a slide filter on a deck
- **THEN** the included slides match the full set that preview would load without a filter

### Requirement: Theme bake-in
When `deck.json` specifies `theme`, build MUST read the CSS text from that source (local file or `https://` URL) and **append** it after the shell default tokens inside the `DECK THEME — START` and `DECK THEME — END` markers, keeping both markers and the default token block, so CSS cascade applies baked declarations over defaults. Deck `styles` CDN entries stay as `<link>` tags and are not a substitute for `theme`.

#### Scenario: Local theme appends after defaults
- **WHEN** `theme` points at a valid local CSS file that sets `--brand` only
- **THEN** the output’s deck theme region still contains the shell default tokens, then the theme CSS, both markers remain, and the baked `--brand` appears after the default `--brand`

#### Scenario: Remote theme appends after defaults
- **WHEN** `theme` is an `https://` URL whose response body is valid theme CSS
- **THEN** the output’s deck theme region contains that response body after the shell default tokens

#### Scenario: Unreadable theme fails build
- **WHEN** `theme` is set but the local file cannot be read or the remote fetch fails or times out
- **THEN** build fails with an error identifying the theme source

#### Scenario: Theme cannot break out of the style element
- **WHEN** the theme CSS contains `</style`
- **THEN** build fails with an error identifying the theme source

### Requirement: Theme token contract warnings
Build MUST warn (without failing) when a baked theme’s `:root` declares a `--*` token that the shell’s default theme block does not. Build MUST NOT warn solely because a baked theme’s `:root` omits a default token (defaults remain via cascade).

#### Scenario: Missing token not warned
- **WHEN** the baked theme omits `--accent`, which the shell default declares
- **THEN** build succeeds without a missing-token warning for `--accent`

#### Scenario: Extra token warned
- **WHEN** the baked theme’s `:root` declares `--custom-extra`, which the shell default does not
- **THEN** build succeeds and prints a warning naming `--custom-extra`

### Requirement: CDN scripts and styles tags
When `scripts` or `styles` are present, assemble MUST emit `<script src>` (classic, no `async`/`defer`) and `<link rel="stylesheet" href>` tags in `<head>` using those URLs unchanged, including any `integrity` / `crossorigin` attributes. Build MUST NOT fetch, vendor, or inline those URL bodies into the output.

#### Scenario: D3 script tag emitted
- **WHEN** `scripts` includes the jsDelivr D3 URL
- **THEN** the output HTML contains `<script src="https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js"></script>` in `<head>`

#### Scenario: Output size not inflated by CDN bodies
- **WHEN** build completes with CDN scripts declared
- **THEN** the output does not contain the downloaded library source inlined as a substitute for the `src` URL

### Requirement: CLI slides filter
Build MUST accept repeatable `--slide <key-or-file>` (Commander collect). When provided, only those slides are included, **in the order given on the command line**, after the agenda. Unknown or repeated entries MUST fail the build. Effective `scripts`/`styles` (file and/or CLI) still apply to a subset build; effective theme still applies.

#### Scenario: Subset build in CLI order
- **WHEN** the full set is `overview.html`, `metrics.html`, `closing.html` and the user passes `--slide closing --slide overview.html`
- **THEN** the output contains the agenda, then `closing`, then `overview`

#### Scenario: Unknown slide name fails
- **WHEN** `--slide` includes a name not in the resolved full set
- **THEN** build exits non-zero with an error identifying the unknown name

### Requirement: CLI output path override
Build MUST accept long-only `--output <path>` (no `-o`) to set the write destination for this run, overriding a deck-file `output` when both are present. When the flag is omitted, build MUST use the file’s `output` if present; when neither provides `output`, build MUST fail. Relative `--output` MUST resolve against the working root; absolute paths MUST be kept. Atomic write rules still apply.

#### Scenario: Build writes to -o path
- **WHEN** the user runs `npm run build -- --cwd /path/to/deck --output /tmp/Out.html`
- **THEN** the assembled HTML is written to `/tmp/Out.html` and not to any file-only `output` path

#### Scenario: Build without -o uses deck.json
- **WHEN** the user runs `npm run build -- --cwd /path/to/deck` with no `--output` and the deck file sets `output`
- **THEN** the file is written at that configured path (resolved against the working root)

### Requirement: CLI theme override
Build MUST accept `--theme <path-or-https-url>` to choose the theme CSS for this run, overriding a deck-file `theme`. Local relative paths MUST resolve against the working root; absolute paths MUST be kept; `https://` URLs MUST be fetched like a file theme; `http://` and other schemes MUST be rejected. When omitted, build MUST use the file’s theme (or shell defaults only if none).

#### Scenario: Build with --theme local file
- **WHEN** the user runs `npm run build -- --cwd /path/to/deck --theme ./client.css`
- **THEN** the assembled deck bakes `/path/to/deck/client.css` (appended over defaults) instead of any deck-file theme

#### Scenario: Build rejects http theme override
- **WHEN** the user passes `--theme http://example.com/t.css`
- **THEN** the command exits non-zero with an error that remote themes must use `https://`

### Requirement: Deck CLI uses Commander
`npm run build` MUST parse its arguments with the Commander library (devDependency). All deck flags MUST be long-only (no short aliases). Unknown options MUST fail. `--help` MUST print the full Commander help screen documenting `--cwd`, `--deck`, `--slide`, `--output`, `--theme`, `--cover`, `--title`, `--brand`, `--caption`, `--script`, and `--style`.

#### Scenario: Unknown build option fails
- **WHEN** the user runs `npm run build -- --cwd /path/to/deck --bogus`
- **THEN** the command exits non-zero without writing output

### Requirement: Atomic output
Build MUST write the output to a temporary file and move it to `output` only on success. A failed build MUST leave any previously existing `output` unchanged.

#### Scenario: Failed build keeps prior output
- **WHEN** `output` exists from an earlier build and a new build fails on an unreadable theme
- **THEN** the earlier `output` file is unchanged and no partial file remains at `output`

### Requirement: Build prints effective configuration
Before writing output, `npm run build` MUST print the effective configuration (working root, deck file path or none, version, title, brand, caption, output, cover, theme, slides or `--slide` filter, scripts, styles) so the operator can see the merged values for this run.

#### Scenario: Config summary before write
- **WHEN** the user runs `npm run build -- --cwd /path/to/deck`
- **THEN** the command prints an effective-configuration summary that includes the working root and output path before writing the HTML file

### Requirement: Build root from --deck or pure CLI
Build MUST support `--deck` alone (working root = file parent) and `--cwd` with no deck file when CLI supplies required fields.

#### Scenario: Build with --deck alone
- **WHEN** a user runs `npm run build -- --deck /path/to/deck/deck.json`
- **THEN** the working root is `/path/to/deck` and that file is loaded

#### Scenario: Build without a deck file
- **WHEN** a user runs `npm run build -- --cwd /path/to/deck --output ./Out.html --slide overview` and no deck.json exists there
- **THEN** the command assembles from CLI + defaults and writes `/path/to/deck/Out.html`

### Requirement: Build help screen
`npm run build -- --help` MUST print the full Commander help (usage and option descriptions) and exit zero.

#### Scenario: Help shows full screen
- **WHEN** the user runs `npm run build -- --help`
- **THEN** the command prints usage and option descriptions for the deck flags and exits zero

### Requirement: CLI field parity for build
Build MUST accept long-only `--cover`, `--title`, `--brand`, `--caption`, and repeatable `--script <https-url>` / `--style <https-url>` that override or supply the corresponding effective-config fields. When any `--script` or `--style` is present, that field’s effective value MUST be exactly the CLI list in order (replacing the file list). Values MUST obey the same validation rules as the deck-file fields.

#### Scenario: Title from CLI
- **WHEN** the user builds with `--title "Q3 Review"`
- **THEN** the output document title is `Q3 Review`

#### Scenario: Repeatable scripts replace file list
- **WHEN** the deck file lists one script and the user passes `--script https://cdn.example.com/a.js --script https://cdn.example.com/b.js`
- **THEN** the output emits those two script tags in that order and not the file’s script entry
