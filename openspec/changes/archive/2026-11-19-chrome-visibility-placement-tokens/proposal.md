# Proposal

## Why

Deck authors want distinct presentation chrome (progress bar, nav dots, slide counter, prev/next arrows) without new Settings knobs. Those widgets already exist but are always on and physically `left`/`right` positioned, so themes cannot hide or relocate them through the existing `--deck-*` chrome token pattern.

## What Changes

- Add **show/hide** CSS tokens for progress, nav dots, slide counter, and arrows (same delivery path as existing gear/theme-toggle chrome tokens: theme bake + Settings override).
- Add **`--deck-timer-toggle-display`** and **`--deck-clicker-toggle-display`** with the same semantics as `--deck-theme-toggle-display` (home-only when allowed; `none` hides the control and locks the matching shortcut / Settings Playback control).
- Add a **small set of placement enums** using logical directions (`block-start` / `block-end`, `inline-start` / `inline-end`) so chrome can flip for RTL without `left`/`right` in the author API.
- Cluster all `--deck-*` chrome tokens (existing + new) in one commented defaults block so authors can copy and adjust the whole set (optional in theme.css).
- Wire shell chrome CSS to those tokens (logical insets; progress fill along inline axis). No new `deck.json` `settings` keys; no class-locator theme API.
- Update Generate-theme prompt and bake instructions to include the expanded chrome block.
- **Not in scope:** full-shell RTL (drawer, header, home layout); free-length positioning; new Settings → Playback toggles for chrome.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `deck-shell`: Chrome personalization tokens for progress / nav dots / counter / arrows (visibility + logical placement); shell layout uses those tokens; theme docs/prompts list them.
- `slide-contract`: Default theme region documents and ships the clustered `--deck-*` chrome token block (visibility + placement enums with defaults and allowed values).

## Impact

- **Platform** (shell runtime + contract stylesheet + Settings theme copy), not deck content.
- Files likely touched: `shell/contract/slide-contract.css`, `shell/template.html` (chrome CSS + token lists + Generate-theme/bake text), possibly `shell/contract/SLIDE-CONTRACT.md` / templates that sample chrome tokens, and tests that assert theme/chrome token presence.
- **Migration:** Existing decks keep current look (defaults match today’s LTR layout). Themes that only set colors are unchanged. No breaking schema or settings changes.
