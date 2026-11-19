# Spec Delta

## ADDED Requirements

### Requirement: Default CSS and JavaScript minify on build
When writing `output`, build MUST minify inline CSS and classic inline JavaScript in the assembled HTML: shell styles and classic scripts, slide `<style>` and classic `<script>` bodies, and baked theme and contract CSS. Minify MUST NOT alter CDN `<script src>` / `<link>` URLs or their network-loaded bodies. Minify MUST NOT minify non-JavaScript data blocks (for example `<script type="application/json">`). Minify MUST NOT collapse HTML markup whitespace. Minify MUST preserve runtime behavior of the deck when opened via `file://`.

#### Scenario: Default build minifies inline CSS and JS
- **WHEN** a user runs a successful `npx hptx build` without `--debug`
- **THEN** the written `output` contains minified inline CSS and classic JavaScript relative to the same assemble with minify disabled

#### Scenario: CDN tags stay as URLs
- **WHEN** the deck declares a CDN script or style and build runs without `--debug`
- **THEN** the output still emits those assets as `<script src>` / `<link href>` tags with the original URLs (bodies not inlined or minified by build)

#### Scenario: JSON data blocks are not minified as JavaScript
- **WHEN** the assembled HTML includes `<script type="application/json" id="rows">…</script>` and build runs without `--debug`
- **THEN** that data block’s body is left unchanged (not passed through JavaScript minify)

#### Scenario: Markup whitespace not required to collapse
- **WHEN** build runs without `--debug`
- **THEN** the toolchain is not required to collapse whitespace outside `<style>` and classic `<script>` bodies

### Requirement: Build --debug disables minify
Build MUST accept long-only `--debug`. When `--debug` is set, build MUST write assembled HTML without the CSS/JS minify pass (readable sources). When `--debug` is omitted, minify MUST apply as in the default-minify requirement. `--debug` MUST NOT change slide selection, theme bake, settings bake, CDN tags, or atomic write behavior.

#### Scenario: Debug write is readable
- **WHEN** a user runs `npx hptx build --cwd <dir> --debug` (valid deck with `output`)
- **THEN** the written `output` is assembled without CSS/JS minify

#### Scenario: Debug does not change slide set
- **WHEN** the same deck is built once with `--debug` and once without, with the same other flags
- **THEN** both outputs include the same slides and baked settings; only packaging (minify) differs

#### Scenario: Help lists --debug
- **WHEN** the user runs `npx hptx build --help`
- **THEN** the help text names `--debug`

## MODIFIED Requirements

### Requirement: Deck CLI uses Commander
`npm run build` MUST parse its arguments with the Commander library (devDependency). All deck flags MUST be long-only (no short aliases). Unknown options MUST fail. `--help` MUST print the full Commander help screen documenting `--cwd`, `--deck`, `--slide`, `--output`, `--theme`, `--cover`, `--title`, `--brand`, `--caption`, `--script`, `--style`, `--debug`, and the `--settings.*` flags.

#### Scenario: Unknown build option fails
- **WHEN** the user runs `npm run build -- --cwd /path/to/deck --bogus`
- **THEN** the command exits non-zero without writing output

#### Scenario: Help lists settings flags
- **WHEN** the user runs `npm run build -- --help`
- **THEN** the help text names `--settings.clicker`, `--settings.rememberStep`, `--settings.timer`, and `--settings.appearance`

#### Scenario: Help lists --debug
- **WHEN** the user runs `npm run build -- --help`
- **THEN** the help text names `--debug`

### Requirement: Build prints effective configuration
Before writing output, `npm run build` MUST print the effective configuration (working root, deck file path or none, version, title, brand, caption, output, cover, theme, settings, slides or `--slide` filter, scripts, styles, and whether CSS/JS minify is enabled for this run) so the operator can see the merged values for this run. Filesystem paths in that summary and in the success line that names the written `output` MUST follow the CLI console path display rules (shorter of invocation-relative vs `<cwd>/…`, absolute when more than `../../` is required).

#### Scenario: Config summary before write
- **WHEN** the user runs `npm run build -- --cwd /path/to/deck`
- **THEN** the command prints an effective-configuration summary that includes the working root and output path before writing the HTML file

#### Scenario: Summary paths use compact display
- **WHEN** the user runs build with `--cwd templates` from a parent invocation directory
- **THEN** filesystem paths in the summary use the shorter of invocation-relative and `<cwd>/…` forms (or absolute when both need more than `../../`)

#### Scenario: Summary includes settings
- **WHEN** the user builds with `--settings.clicker true`
- **THEN** the effective-configuration summary shows clicker true among settings

#### Scenario: Summary shows minify on by default
- **WHEN** the user runs build without `--debug`
- **THEN** the effective-configuration summary indicates CSS/JS minify is enabled

#### Scenario: Summary shows minify off with --debug
- **WHEN** the user runs build with `--debug`
- **THEN** the effective-configuration summary indicates CSS/JS minify is disabled
