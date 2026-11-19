# Design

## Context

See proposal.md — Why. `notesFor('agenda', …)` returns `''` today (`idx <= 0`), so `renderNotes` writes the “No notes” placeholder. Agenda metadata already lives in `slideTitles` / `slideModules` (`agendaTitle`, `agendaSection`, `estimatedMinutes`) and is used by `fillCuratedAgenda` and `slideVisibilityGroups`.

## Goals / Non-Goals

**Goals:**

- Generate semantic HTML TOC for home notes from visible content slides.
- Reuse the same section-joining rules as the home agenda (slides without `agendaSection` continue the prior group; leading unsectioned slides are a flat list / default group as today).
- Show per-slide estimates with the same wording as `estimatedMinutesLabel` when present.
- Keep content-slide notes and empty-content placeholder behavior.

**Non-Goals:**

- Authorable home notes file or `aside.notes` on a fake `agenda.html`.
- Making TOC items clickable / navigating from notes (notes keys already drive the deck; mouse jump is out of scope unless trivial).
- A single summed total-minutes badge in the home toolbar (toolbar `nwEst` stays blank on home).
- Changing speak-timer home behavior.

## Decisions

### 1. Build TOC HTML in the shell when rendering home notes

Add a helper (e.g. `homeNotesTocHtml()`) used from `notesFor` or `renderNotes` when `current === 0` / key is `agenda`. Walk visible content indices, emit section headings when `agendaSection` changes (mirroring `fillCuratedAgenda` / `slideVisibilityGroups`), and emit `<ul><li>…</li></ul>` bullets with optional estimate text.

**Why:** Home is shell-owned; generating notes beside existing registry data avoids inventing a slide file.

**Alternatives considered:** Inject a hidden `aside.notes` into the home DOM at boot — harder to keep in sync when visibility / registrations change; notes window already re-renders on `update`.

### 2. Structure and styling

Use plain headings + lists inside `#nwNotes` (e.g. `.nw-toc` wrapper), styled with existing notes theme tokens only—no new color tokens. Escape titles as text (textContent / entity escape), not raw HTML from slide titles.

### 3. Zero visible content slides

If there are no visible content slides, keep the “No notes” placeholder (nothing useful to list).

### 4. Tests and docs

Update the home assertion in `speakerNotes.test.ts`; add a case with sections + estimates + a hidden slide. Mention generated home TOC in README speaker-notes.

## Risks / Trade-offs

- [Long decks make a long TOC] → Acceptable for notes; same information as the agenda.
- [Canvas “Agenda off” vs notes TOC] → Notes still show TOC; presenters often want the outline even when tiles are hidden on canvas.

## Migration Plan

Ship with the shell update. No deck author migration. Rollback reverts `notesFor`/`renderNotes` and the spec/test.
