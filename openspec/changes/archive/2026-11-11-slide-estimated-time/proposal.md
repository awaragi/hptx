# Proposal

## Why

Presenters pacing a talk need a quick per-slide time cue while reading speaker notes. Today notes show title, slide/step position, and note body only — there is no authored estimate, so speakers guess or keep a separate rundown.

## What Changes

- Slides MAY declare an optional estimated speaking time in minutes via `registerSlide`.
- The speaker notes window MUST show that estimate as a static minutes label (e.g. `3 min`) when present — display only, no countdown or running timer.
- Slides without an estimate behave as today; the home page never shows an estimate.
- Contract docs and the blank template document the field; existing decks need no migration (optional field).

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `speaker-notes`: Notes window chrome shows the current slide’s estimated minutes when authored.
- `slide-contract`: Contract API and authoring docs include the optional estimated-minutes field on `registerSlide`.

## Impact

- **Platform** (shell runtime + slide contract), not deck content.
- `shell/template.html` notes window rendering; `shell/contract/slide-contract.d.ts` and `SLIDE-CONTRACT.md`; blank template example; Vitest coverage for notes display.
- **Migration**: none required — omission means no label. No assemble/schema changes; head `<meta>` stays ignored (estimate lives with other slide module metadata).
