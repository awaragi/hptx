# Design

## Context

Speaker notes already live in a shell-owned popup (`shell/template.html`). `renderNotes()` reads the active slide’s registered module for `title` and step metadata, and pulls note HTML from `aside.notes`. Slide head `<meta>` / `<title>` are stripped/ignored by assemble (`SLIDE-CONTRACT.md`). See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**

- One optional authoring field for whole-minute estimates, available wherever the notes window already reads slide metadata.
- Static display in the notes window chrome next to the slide title (or immediately under it), updating on navigation.
- Contract + blank template documentation so authors discover the field.

**Non-Goals:**

- No countdown, elapsed clock, or “time remaining” for the deck.
- No deck-level total or agenda time column in this change.
- No assemble validation that every slide has an estimate.
- No head `<meta>` authoring path (stays ignored).
- No per-step estimates.

## Decisions

### 1. Author via `registerSlide({ estimatedMinutes })`, not `<meta>`

**Choice:** Optional `estimatedMinutes: number` on `SlideModule` (whole minutes ≥ 1; treat non-finite / ≤ 0 / non-integer as absent at display time).

**Why:** Title, icon, and agenda fields already live on the module; notes chrome already reads `mod`. Assemble does not keep slide `<meta>`, so a meta path would need new extract-and-bake plumbing for little gain. Putting time on `aside.notes` would hide the cue when a slide has an estimate but no note body.

**Alternatives considered:**

| Approach | Pros | Cons |
| --- | --- | --- |
| `<meta name="estimated-minutes" content="3">` | Familiar HTML | Currently ignored; needs assemble extract + bake onto section |
| `data-estimated-minutes` on body/aside | Markup-only | Weakly typed; couples to notes aside or ephemeral body attrs |
| `deck.json` per-slide map | Central rundown | Splits authoring from the slide file; worse for templates/`new slide` |

### 2. Display placement

**Choice:** Static label in the notes main header area beside or under `#nwTitle` (e.g. `#nwEst` showing `3 min`), empty when absent. Not inside the note HTML body (authors should not have to duplicate the number in prose).

**Why:** Always visible with the title; independent of whether note asides exist; matches “shown in notes, minutes only, no timer.”

### 3. No assemble / Deck API surface beyond the module field

Runtime reads `slideModules[key].estimatedMinutes`. No new `Deck` methods. Theme tokens: reuse existing notes chrome colors (`--text-dim` / `--text-strong`); no new color tokens.

## Risks / Trade-offs

- [Invalid values silently omitted] → Document whole minutes; ignore bad values rather than failing the build (optional metadata).
- [Authors expect meta] → Call out in SLIDE-CONTRACT that head meta remains ignored and the field is on `registerSlide`.
- [Fractional minutes] → Out of scope; whole minutes only keeps the label simple (`N min`).

## Migration Plan

- Existing decks unchanged (field optional).
- Blank template gets a commented example; no requirement to backfill `templates/` or `decks/about`.
- Rollback: remove the field from docs/UI; slide modules with the property remain harmless if unread.
