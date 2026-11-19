# Design

## Context

See proposal.md — Why. Assemble today (`assembleHtml` / `assembleFromPlan`) emits readable inline CSS/JS from `shell/template.html`, scoped slide styles, wrapped slide scripts, and baked theme/contract CSS. Export reuses assemble but serves HTML in memory (`serveAssembledHtml`) without writing `output`. Build already has a build-only long flag pattern (`parseBuildArgs` vs `parseDeckArgs`).

`esbuild.transform` is available in this install and can minify both JS and CSS loaders without a new package. Shell runtime stays dependency-free; minify is tooling-only.

## Goals / Non-Goals

**Goals:**

- Default build write path minifies inline CSS/JS before atomic write.
- `--debug` skips minify and prints that state in effective config.
- Export (and preview assemble) never minify.
- Fail the build clearly if a minify transform errors (leave prior `output` untouched via existing atomic write).

**Non-Goals:**

- HTML markup whitespace collapsing.
- Separate obfuscation beyond what minify/mangle already does.
- Minifying CDN remote bodies.
- Source maps for minified inline scripts.
- Changing `dev` CLI or preview serving.

## Decisions

1. **Minify as a post-assemble pass on the final HTML string**  
   Walk classic inline `<style>` and `<script>` bodies (skip `<script src>` / external). Minify each body, re-embed. Keeps `assembleHtml` structure intact and makes `--debug` a boolean on the plan.  
   *Alternative considered:* minify each chunk while rendering slides — more call sites, harder to guarantee shell template styles/scripts are covered. Rejected.

2. **Use `esbuild.transform` with `minify: true` and `loader: 'css' | 'js'`**  
   One tool for both languages; already reachable from the workspace. Prefer keeping it a normal dependency if the package graph does not already guarantee it for production CLI installs; otherwise document that Vite’s transitive esbuild is the provider and add an explicit dependency if needed for stability.  
   *Alternative:* `terser` + `clean-css` / `lightningcss` — extra deps for little gain here.

3. **CLI: build-only `--debug` boolean (default false → minify on)**  
   Mirror `--watch` placement on `parseBuildArgs` / `BuildArgs`. Do not add `--debug` to `dev` or `export`.  
   *Alternative:* `--no-minify` — clearer literally, less memorable; user preferred `--debug`.

4. **Wire minify on `AssemblePlan` / `AssembleDeckOptions`**  
   `minify: boolean` (or equivalent). `runBuild` sets `minify: !args.debug`. `runExport` and `dev` omit or set `false`. Effective-config print reads the plan flag (e.g. `minify on` / `minify off`).

5. **Script re-embed safety**  
   After JS minify, ensure any `</script` sequence in the body is escaped for HTML embedding (e.g. `<\/script`), matching existing caution around script bodies in HTML. Preserve `type` / `data-*` attributes on tags unchanged.

6. **Docs**  
   Mention `--debug` in CLAUDE.md / README build examples alongside other build flags when updating operator docs in tasks.

## Risks / Trade-offs

- **[Risk] Minify breaks edge-case slide JS (dynamic eval, unusual unicode, `Function`/`toString` assumptions)** → Mitigation: keep `--debug` path identical to today’s assemble; add Vitest that minified build still contains expected registration hooks / `Deck` API strings that must remain literal; fail build on transform errors rather than shipping broken JS.
- **[Risk] Naive HTML `<style>` regex matches string builders inside shell `<script>` (e.g. notes `NOTES_WINDOW_CSS` concat) and corrupts speaker-notes HTML** → Mitigation: skip style matches that fall inside real script element ranges; regression test covers the notes string-builder pattern.
- **[Risk] esbuild not declared as a direct dependency** → Mitigation: during implement, check whether CLI consumers resolve `esbuild`; add a direct dependency if needed.
- **[Risk] Operators surprised by unreadable default output** → Mitigation: document `--debug` in help and effective-config summary; proposal already accepts the packaging change.
- **[Trade-off] Smaller files vs inspectability** → Default favors deliverable size; debug restores inspectability.

## Migration Plan

- No deck.json or slide authoring changes.
- Authors who rely on reading built HTML switch to `hptx build … --debug`.
- Rollback: omit minify call / ship `--debug` as default only if needed (not planned).

## Open Questions

- None that block specs or tasks; dependency pinning for esbuild is an implement-time check.
