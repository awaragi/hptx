# Tasks

## 1. Minify helper

- [x] 1.1 Add an assemble minify helper that minifies inline `<style>` and classic inline `<script>` bodies (skip `src` scripts) via `esbuild.transform`, escapes `</script` on re-embed, and leaves markup/CDN URLs alone; verify with Vitest on a small HTML fixture (CSS+JS shrink; `src` unchanged; `</script` in a string stays safe)
- [x] 1.2 Ensure `esbuild` is a resolvable dependency for the CLI (add a direct dependency if needed) and verify `npm test` / import of the helper succeeds

## 2. Assemble + CLI wiring

- [x] 2.1 Thread a `minify` flag through `AssembleDeckOptions` / `AssemblePlan` / `assembleFromPlan` so minify runs only when enabled; verify assemble with `minify: false` matches today’s output shape and `minify: true` produces smaller CSS/JS bodies (Vitest)
- [x] 2.2 Add build-only `--debug` to `parseBuildArgs` / help; set `minify: !debug` in `runBuild`; leave `dev` and `export` with minify off; verify args tests and that export assemble path does not minify
- [x] 2.3 Print minify on/off in build effective-configuration summary; verify `printConfig` tests cover default vs `--debug`

## 3. Docs + integration

- [x] 3.1 Document `--debug` in CLAUDE.md (and README if it lists build flags) and verify help text from `npx hptx build --help` names `--debug`
- [x] 3.2 Run a focused Vitest slice for minify/args/assemble/export and a smoke `npx hptx build` with and without `--debug` on a small fixture deck; verify default output is smaller / less readable than `--debug` and both succeed
