# Design

## Context

Settings lives entirely in `shell/template.html`: six `.tc-tab` buttons, six `.tc-panel`s, and `tcSwitchTab` keyed by `data-tc-tab` (`preview`, `prompt`, `delivery`, `slides`, `navigation`, `storage`). Theme load/apply/generate/instructions JS binds to element ids (`tcPasteIn`, `tcPromptOut`, `tcThemeInstructions`, …), not to tab keys. See proposal.md for motivation; theme CSS still loads only via Settings override or `deck.json` bake — unchanged.

## Goals / Non-Goals

**Goals:**
- Four top-level tabs: Theme, Slides, Playback, Reset.
- One Theme panel with three stacked sections (Apply, Generate, Bake) sharing the existing scrollable `.tc-panel` pattern.
- Preserve all control ids and handlers; only markup structure, tab labels/keys, and copy paths change.
- Update README paths that say Settings → Navigation / Generate theme.

**Non-Goals:**
- Nested sub-tabs inside Theme.
- Merging Slides + Playback.
- Changing theme validation, storage, or bake pipeline.
- Redesigning modal chrome beyond section stacking and tab count.

## Decisions

1. **Merge panels in markup, keep ids**  
   Move the Generate and Instructions field blocks into the Theme panel as sibling `.tc-field` sections under short headings. Drop the Generate/Instructions tab buttons and their empty panels. Keep `tcPromptOut`, `tcCopyPromptBtn`, `tcThemeInstructions`, etc., so bootstrapping code stays put.

2. **Tab keys: `theme` | `slides` | `playback` | `reset`**  
   Rename `preview` → `theme`, `navigation` → `playback`, `storage` → `reset` for clarity. Update `tcPanels` and default `tcSwitchTab('theme')`. Alternatives considered: keep opaque keys (`preview`/`storage`) — rejected; labels and keys should match.

3. **Theme panel scroll, not taller modal**  
   Three sections make Theme taller than one textarea. Rely on existing `.tc-panel` `overflow-y:auto` and slightly taller textareas only if needed; do not grow the card past current `max-height:92vh`. Section order: Apply → Generate → Bake (everyday path first). No in-panel TOC (tried and dropped).

4. **Header blurb**  
   Shorten the Settings intro so it does not tell users to hop tabs for Generate/Instructions; point at sections on Theme instead.

5. **Docs**  
   README “Settings → Navigation” → “Settings → Playback”; Generate theme / Instructions paths → under Theme.

## Risks / Trade-offs

- [Theme panel feels long] → Mitigation: clear section labels; Apply stays first; body already scrolls.
- [Assembled fixtures still show six tabs] → Mitigation: rebuild or treat fixture HTML as generated; prefer editing `shell/template.html` as source of truth.
- [Tests assert old copy] → Mitigation: only `Settings → Slides` appears in Vitest today; grep and update if any assert tab labels.

## Migration Plan

No deck.json or preference migration. Presenters see the new chrome on next `hptx dev` / `hptx build` from the updated shell. Rollback = revert the shell template change.
