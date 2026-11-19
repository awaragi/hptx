# Tasks

## 1. CLI and assemble default

- [x] 1.1 Default missing `--cwd`/`--deck` to `.` in `parseDeckArgs` (dev/build) and update usage / `--cwd` help text; verify `args.test.ts` expects default invocation root instead of throw
- [x] 1.2 Same default in `parseExportArgs` and export usage/help; verify `exportArgs.test.ts` expects default instead of throw
- [x] 1.3 Same default in `resolveDeckInvocation` / assemble entry; verify `loadDeckConfig.test.ts` (and any assemble caller tests) for omitted cwd/deck

## 2. Documentation

- [x] 2.1 Update README.md so dev/build/export document default `.` (remove “Always pass `--cwd` and/or `--deck` (no default root)” for those commands); spot-check table and intro wording
- [x] 2.2 Update CLAUDE.md command notes the same way (no invocation-dir default → defaults to `.`)

## 3. Verification

- [x] 3.1 Run focused Vitest for CLI/assemble args (`args`, `exportArgs`, `loadDeckConfig`) and confirm green; optionally `npx hptx build --help` / `dev --help` / `export --help` mention default `.`

## Workflow follow-up

- Archive the change after implementation review (`/opsx-archive`).
