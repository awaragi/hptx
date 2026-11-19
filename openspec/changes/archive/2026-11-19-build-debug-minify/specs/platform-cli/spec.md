# Spec Delta

## ADDED Requirements

### Requirement: Build subcommand accepts --debug
Via `npx hptx build` (and equivalent `npm run build`), the CLI MUST accept long-only `--debug` with the same semantics as deck-build (skip CSS/JS minify when writing `output`). Authors MUST NOT need an extra `--` between `hptx` and those flags when invoking via `npx hptx`.

#### Scenario: Debug via bin
- **WHEN** a developer runs `npx hptx build --cwd <dir> --debug` for a valid deck with `output`
- **THEN** build writes unminified HTML without requiring a `--` token between `build` and `--debug`
