# Design

## Context

See proposal.md for motivation. Home hints live in `shell/template.html` under `.title-kbd-hints`. Today CSS flex `order` puts `↑`/`↓` above `←`/`→` in normal mode and swaps them in clicker mode (`.deck-clicker-mode`). `syncTitleKbdHintsForClicker()` already rewrites both arrow descriptions when clicker mode is on. Vitest `homePage.test.ts` currently asserts DOM order `←/→`, `↑/↓`, `?` (document order, not computed visual order).

## Goals / Non-Goals

**Goals:**
- One visual and document order for home hint rows in both modes: `↑`/`↓`, `←`/`→`, `?`.
- Keep clicker description sync as-is.
- Make order assertable from DOM query order (no reliance on CSS `order`).

**Non-Goals:**
- Changing clicker key behavior, drawer hint strip, Help catalog layout, or Settings → Playback.
- Theme / branding work.

## Decisions

1. **Markup order is the source of truth**  
   Reorder the two `data-kbd-nav` hint `<p>` elements so `↑`/`↓` comes before `←`/`→` in the template. Drop the clicker/normal flex `order` rules on those two ids (and the comment that documents the swap). Keep `order:10` on non-nav hint rows only if still needed so `?` stays last; if markup already ends with `?`, that rule can stay as a safety net or be removed if unused elsewhere.

2. **Prefer DOM order over permanent CSS order**  
   Alternative considered: keep markup as-is and pin both modes to the same flex `order`. Rejected because tests and mental model are simpler when source order matches what the presenter sees (and matches Help’s arrow precedence).

3. **Stable order matches current normal-mode visuals and Help**  
   Help lists `↑`/`↓` before `←`/`→`. Normal mode already presented that visually via CSS. Clicker mode loses the swap rather than changing normal mode to match clicker’s previous order.

## Risks / Trade-offs

- [Assembled fixture HTML drifts] → Rebuild fixtures that bake the shell if CI or local checks compare them; otherwise next `build`/`dev` picks up the template.
- [Test expects old DOM order] → Update `homePage.test.ts` (and any similar assertions) to `↑/↓`, `←/→`, `?`; add a focused toggle assertion for order stability.

## Migration Plan

No author migration. Platform-only shell change; rebuild decks to refresh single-file output.
