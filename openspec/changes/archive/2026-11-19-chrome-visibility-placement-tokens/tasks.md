# Tasks

## 1. Contract chrome token block

- [x] 1.1 Cluster existing and new `--deck-*` chrome tokens in one commented block in `slide-contract.css` theme region (visibility + placement defaults and allowed-value comments; logical enum names only) and verify the file declares all eight new tokens with design defaults
- [x] 1.2 Document chrome visibility/placement tokens in `SLIDE-CONTRACT.md` theming (not `settings`) and verify the section mentions the contract defaults block

## 2. Shell chrome CSS and placement sync

- [x] 2.1 Wire `.progress`, `.navdots`, `.counter`, and `.arrows` to display tokens and logical inset/attribute placement (progress fill `to inline-end`; invalid enums fall back) and verify default LTR geometry matches today’s layout
- [x] 2.2 Add placement-token sync on theme refresh hooks (alongside theme-toggle sync) and verify a Settings override that sets `--deck-navdots-edge: inline-start` moves the rail without reload
- [x] 2.3 Expand `DECK_CHROME_TOKEN_NAMES`, `deckChromeTokenLine`, Generate-theme prompt, and bake instructions for the new tokens and verify the prompt text includes all eight new names

## 3. Samples and verification

- [x] 3.1 Update template/sample theme snippets that list chrome tokens (e.g. `templates/codeTree.html`) so they include the new chrome block defaults and verify the sample still builds
- [x] 3.2 Add or extend automated coverage for chrome token defaults / bake presence (and placement fallback if practical in Vitest) and verify `npm test` passes
- [x] 3.3 Smoke-check with `npx hptx dev` (or Playwright): hide progress via token, move navdots to `inline-start`, confirm keys still navigate; verify screenshots or DOM reflect the tokens

## 4. Timer and clicker toggle tokens

- [x] 4.1 Add `--deck-timer-toggle-display` and `--deck-clicker-toggle-display` to the contract chrome block (defaults `flex`, allowed `flex|none`) and wire home + notes CSS like the theme toggle; verify both hide when set to `none`
- [x] 4.2 Lock `S` and disable Settings → Playback timer/clicker controls when the matching token is `none` (mirror theme lock); verify `S` is a no-op when timer display is `none`
- [x] 4.3 Update Generate-theme / bake single-theme lock guidance and tests for the two tokens; verify `npm test` passes

## Workflow follow-up

- Archive the change after review with `/opsx-archive`.
