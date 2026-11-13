# Tasks

## 1. Console path helper

- [x] 1.1 Add `src/cli/consolePaths.ts` with `formatConsoleCwd` and `formatConsolePath` per design (shorter of inv-relative vs `<cwd>/…`; discard candidates needing more than two leading `..`; else absolute) and verify unit tests in `src/cli/__tests__/consolePaths.test.ts` cover shorter-cwd-token, shorter-inv, deep absolute fallback, cwd line, and root `<cwd>`
- [x] 1.2 Wire `printEffectiveConfig` to format filesystem fields (`cwd`, `deck`, `output`, `cover`, local `theme`, slide paths) using the helper and `invocationDir`, and verify `printConfig.test.ts` expects compact forms instead of absolute paths

## 2. Build and export success lines

- [x] 2.1 Format build’s `Wrote …` output path with the same helper and verify a unit test or focused assertion shows the compact form
- [x] 2.2 Format export artifact summary paths and post-capture `Wrote …` lines with the same helper and verify tests expect compact forms

## 3. Smoke check

- [x] 3.1 Run `node bin/hptx.js build --cwd templates` from the repo root and verify the console uses compact paths (relative and/or `<cwd>/…`) without long absolute prefixes for typical fields
