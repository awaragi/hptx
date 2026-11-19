# Proposal

## Why

In clicker mode, the home page treats each agenda tile as an in-slide step, so forward/back (←/→/↑/↓/Page Up/Down) walks every tile before leaving home. Presenters with two-button clickers rarely use Enter to jump from a highlighted tile, so a long agenda becomes a tedious click-through before the first content slide.

## What Changes

- **Platform (shell runtime):** When clicker mode is on and the current slide is the shell-owned home page (`agenda`), clicker navigation keys MUST advance or retreat by **slide**, not by agenda-tile step. Forward goes to the next visible content slide; back from home stays on home (or follows existing end-of-deck boundary rules).
- Content slides keep today’s clicker behavior: step through the slide, then change page at the ends.
- Non-clicker mode is unchanged: home still uses ←/→ (and Enter) to highlight and activate agenda tiles; ↑/↓ still change page.
- Document the home-page exception in clicker-mode docs (README / Help copy if it describes step-then-page without this caveat).
- Not a breaking API change for slides or `deck.json`; existing decks pick up the behavior from the shell. Presenters who relied on clicker scrubbing of home tiles lose that path (they can still use non-clicker ←/→ or click tiles).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `deck-shell`: Add / tighten clicker navigation requirements so the home page skips agenda-tile steps in clicker mode while content slides continue step-then-page.

## Impact

- Primary code: `shell/template.html` (`clickerNavStep` / home step binding).
- Docs: `README.md` clicker section; Settings Help text only if it claims every slide steps in clicker without exception.
- Tests: shell/assemble behavior coverage for clicker on home vs content slides.
- No CLI, config schema, export frame list, or slide-contract changes (export already captures `agenda` as a single frame).
