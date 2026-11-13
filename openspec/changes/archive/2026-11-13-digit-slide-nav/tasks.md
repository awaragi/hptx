# Tasks

## 1. Shell digit buffer and navigation

- [x] 1.1 Add `DIGIT_NAV_COMMIT_MS` (2000) and digit-buffer state/helpers in `shell/template.html` (pad width, candidates, resolve display number → engine index via `visibleContentIndices`) and verify helpers resolve `0`→home and `1…N`→visible content
- [x] 1.2 Wire digit / Enter / Esc / cancel into `onDeckKeydown` with chrome guards (typing target, Settings, modal, nav drawer); consume digits before slide `onKey`; verify idle commit, multi-digit, `0`→home, leading-zero early commit, Enter, cancel, and out-of-range clear in a new Vitest file under `src/assemble/__tests__/`

## 2. Nav-dot preview and home hint

- [x] 2.1 Add CSS for digit-nav candidate / active nav-dot states using existing theme tokens and sync highlight classes while buffering; verify prefix highlight after `0` and narrowing on `05` in the Vitest suite
- [x] 2.2 Add a home keyboard-hint row for digit slide jump; verify the assembled home page includes the hint (assert in the same test file or `homePage.test.ts`)

## Workflow follow-up

- Archive the change after review with `/opsx-archive`.
