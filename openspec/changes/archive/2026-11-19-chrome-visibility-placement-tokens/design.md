# Design

## Context

See proposal.md — Why. Today progress, nav dots, counter, and arrows are always shown and positioned with physical `left`/`right`/`top` in `shell/template.html` `#deck-chrome`. Chrome show/hide already exists for gear, theme toggle, and agenda hints via `--deck-*` tokens in the theme region (`slide-contract.css`), delivered through the three-layer stack (defaults → bake → Settings override). Generate-theme enumerates `DECK_CHROME_TOKEN_NAMES` in the shell.

## Goals / Non-Goals

**Goals:**

- Extend the same `--deck-*` chrome token pattern for progress / navdots / counter / arrows (visibility + a few placement enums).
- Author API uses logical edge names only (`block-start`/`block-end`, `inline-start`/`inline-end`).
- One chrome token block in the theme defaults with defaults and allowed values in comments beside each property; themes may omit it (defaults are the recommended baseline).
- Shell chrome for these four widgets uses logical insets so `dir="rtl"` mirrors placement without authors changing tokens.
- Generate-theme and bake instructions list the expanded chrome block.

**Non-Goals:**

- New `deck.json` `settings` keys or Settings → Playback chrome toggles.
- Documented class locators (`.progress { … }`) as a supported theme API.
- Free-length inset tokens or arbitrary anchors.
- Full-shell RTL (nav drawer, header, home, notes window remain as today except where these four widgets change).
- Changing counter hide-on-home (`is-agenda-hidden`) semantics beyond respecting the display token.

## Decisions

### 1. Tokens in theme CSS only (not settings)

**Choice:** Visibility and placement are theme custom properties only.

**Why:** Matches existing gear/toggle chrome tokens; Settings → Theme bake/override already covers author and preview paths; avoids dual source of truth with Playback prefs.

**Alternatives:** `settings.chrome.*` bake + localStorage — rejected (presenter prefs vs deck identity; Settings UI bloat).

### 2. Token vocabulary

| Token | Default | Allowed |
| --- | --- | --- |
| `--deck-timer-toggle-display` | `flex` | `flex` \| `none` |
| `--deck-clicker-toggle-display` | `flex` | `flex` \| `none` |
| `--deck-progress-display` | `block` | `block` \| `none` |
| `--deck-progress-edge` | `block-start` | `block-start` \| `block-end` |
| `--deck-navdots-display` | `flex` | `flex` \| `none` |
| `--deck-navdots-edge` | `inline-end` | `inline-end` \| `inline-start` |
| `--deck-counter-display` | `block` | `block` \| `none` |
| `--deck-counter-inline` | `inline-start` | `inline-start` \| `inline-end` |
| `--deck-arrows-display` | `flex` | `flex` \| `none` |
| `--deck-arrows-inline` | `inline-end` | `inline-end` \| `inline-start` |

Plus existing chrome tokens (theme toggle, gear, agenda hints, C shortcut), clustered in one commented `:root` block. Timer/clicker locks mirror theme toggle: `none` hides home (and notes) controls, disables `S` for timer, and disables the matching Settings → Playback control. Counter/arrows stay on **block-end**; only inline edge is enumerable.

**Alternatives:** Length inset pairs (`--deck-navdots-inset-inline-end: 26px`) — more flexible, harder for Generate-theme; rejected for v1. Corner enums for counter/arrows — more states than needed.

### 3. Display via `var()`; placement via data attributes

**Choice:** `display: var(--deck-*-display)` like gear/toggle. Placement enums are read with `getComputedStyle` / existing `deckCssVar`, normalized, then applied as `data-edge` / `data-inline` on the widget (or a chrome root). CSS maps those attributes to logical insets. Invalid/unknown enum values fall back to the default for that token.

**Why:** Enum strings are not valid values for `inset-inline-end` alone; attribute mapping is explicit and testable. Same read-token pattern as theme-toggle lock.

**Alternatives:** Style queries on custom properties — weaker support story for file:// presenters. Pure length tokens without enums — rejected (author UX).

### 4. Logical geometry for the four widgets

**Choice:** Replace physical `left`/`right`/`top` on `.progress`, `.navdots`, `.counter`, `.arrows` with `inset-block-*` / `inset-inline-*`. Progress fill uses width from `inset-inline-start: 0` and gradient `to inline-end`. Fixed inset lengths (e.g. 26px, 34px) stay as today unless a later change adds size tokens.

**Why:** Defaults keep today’s LTR look; RTL mirrors without new author tokens. Scope limited to these widgets.

### 5. Sync when theme layers change

**Choice:** Re-read placement tokens whenever theme application refreshes (bake already in DOM; Settings apply/clear/load; same hooks that call `syncThemeSwitchControl`).

**Why:** Live override must move chrome without reload.

### 6. Docs surface

**Choice:** THEMING comments + defaults in `slide-contract.css`; `DECK_CHROME_TOKEN_NAMES` + `deckChromeTokenLine` + Generate-theme / bake copy in the shell; brief note in `SLIDE-CONTRACT.md` theming if it already lists chrome tokens. Templates that embed sample chrome tokens updated so demos stay accurate.

## Risks / Trade-offs

- **[Risk] Partial RTL:** Only these widgets flip under `dir="rtl"`; rest of shell stays LTR → **Mitigation:** Spec/docs state full-shell RTL is out of scope; tokens still use logical names so authors are ready later.
- **[Risk] Invalid enum in a hand-written theme** → **Mitigation:** Fall back to defaults; document allowed values next to each token.
- **[Risk] Counter/arrows collide when both `inline-start` or both `inline-end`** → **Mitigation:** Accept as author choice; no auto-collision layout in v1.
- **[Risk] Digit-nav highlight on hidden navdots** → **Mitigation:** Harmless if `display: none`; no JS change required beyond placement sync.
- **[Trade-off] No Settings UI for chrome** → Themes/bake only; intentional separation from playback settings.

## Migration Plan

1. Ship defaults matching current LTR geometry — no deck.json changes.
2. Authors opt in by setting tokens in `theme` CSS or Settings override.
3. Rollback: revert shell/contract; baked themes that set new tokens are ignored harmlessly by older shells (unknown custom properties).

## Open Questions

_(none — open product forks resolved in exploration: tokens not settings; show/hide + few logical placement enums; counter/arrows include inline enums.)_
