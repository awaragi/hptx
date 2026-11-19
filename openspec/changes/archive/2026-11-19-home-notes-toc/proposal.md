# Proposal

## Why

The shell-owned home page has no authored `<aside class="notes">`, so the notes window shows only “No notes” there. Presenters opening notes on home get nothing useful, and they cannot add notes because home is generated—not a slide file.

## What Changes

- **Platform (shell):** When the notes window is on the home page (`agenda`), replace the “No notes” placeholder with a generated table of contents of **visible** content slides: agenda section groupings as headings, each slide as a bullet (agenda/display title), and each slide’s `estimatedMinutes` shown beside the title when present.
- Content slides without notes still show “No notes”; authored notes are unchanged.
- The home toolbar static minutes label remains omitted (estimates appear in the TOC body, not as a single home-level `N min` badge).
- Docs: note that home notes are shell-generated TOC.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `speaker-notes`: Change “Notes window content” so home shows a generated TOC instead of “No notes”; clarify estimate display on home TOC items vs the static toolbar label.

## Impact

- Primary code: `shell/template.html` (`notesFor` / `renderNotes` and any TOC HTML helper).
- Tests: `src/assemble/__tests__/speakerNotes.test.ts` (home placeholder assertion).
- Docs: README speaker-notes section.
- No `deck.json` / CLI / assemble schema changes; no authoring API change beyond existing `agendaSection` / `estimatedMinutes` / titles.
