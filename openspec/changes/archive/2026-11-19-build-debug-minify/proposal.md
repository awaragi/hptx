# Proposal

## Why

Built single-file decks ship readable CSS and JavaScript today, so deliverable HTML is larger than it needs to be. Authors who inspect or debug a built file still need an escape hatch to keep sources readable. Default minify on build, with an explicit opt-out, closes that gap without changing preview or export.

## What Changes

- Default `hptx build` minifies inline CSS and JavaScript in the assembled HTML before writing `output` (shell styles/scripts, slide `<style>` / `<script>`, baked theme and contract CSS).
- Add long-only `--debug` to `hptx build` to skip that minify pass and write readable HTML (today’s behavior).
- Effective-configuration summary for build prints whether minify is on or off for the run.
- `hptx export` continues to assemble in memory for capture and MUST NOT minify (HTML is not the export deliverable).
- `hptx dev` unchanged (preview; no assemble write).
- HTML whitespace collapsing / markup minify is explicitly out of scope.
- No separate obfuscation step (minify of CSS/JS is sufficient).
- No **BREAKING** CLI removals; default output becomes smaller/harder to read, which is an intentional packaging change for written build artifacts.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `deck-build`: Default CSS/JS minify on assemble-for-write; `--debug` disables minify; effective-config and help surfaces document the flag.
- `platform-cli`: Document that `build` accepts `--debug` alongside other long-only build flags where help/usage lists them.
- `deck-export`: Clarify that export’s in-memory assemble does not minify CSS/JS.

## Impact

- Platform (CLI / assemble tooling) only; no deck content or shell runtime source changes required.
- Touches `src/cli/args.ts`, `src/cli/build.ts`, assemble pipeline (`assembleHtml` / plan options), effective-config printing, tests; may add a minify helper and a lightweight CSS/JS minify dependency (or reuse tooling already present via the stack).
- Existing decks need no migration; authors who want readable built HTML pass `--debug`.
- Export and dev paths stay unminified.
