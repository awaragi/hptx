# Design

## Context

`estimatedMinutes` already feeds a static notes label. Theme preference uses `deckStore` (`hptx-theme`) and a home-only switch mirrored in the notes toolbar. Notes keys forward to the deck. See proposal.md for motivation and the explore thread for product decisions.

## Goals / Non-Goals

**Goals:**

- Persisted speak-timer mode (`hptx-timer`) with switch + `S` / `⇧S`.
- Per-slide clock tied to navigation; subtle canvas flashes; notes live readout.
- Dependency-free shell JS; reuse existing theme tokens (no new color tokens).

**Non-Goals:**

- No deck-total / agenda time budget.
- No persistence of mid-slide remaining time (only mode on/off).
- No audible alerts.
- No change to assemble / slide file format beyond existing `estimatedMinutes`.

## Decisions

### 1. State machine in the shell

```
modeOff --S/switch--> modeOn (+ start flash, startClock if content)
modeOn  --S/switch--> modeOff (clear clock + border + persist off)
modeOn  --Shift+S---> restartClock(current)  // mode stays on
modeOn  --goTo------> clear; startClock(new) // home: clear only
```

Clock kinds: `countdown` when valid `estimatedMinutes >= 1`; else `countup` (no border ever).

### 2. Timing source

`performance.now()` (fallback `Date.now()`) + `requestAnimationFrame` or 250ms `setInterval` while mode on and a content slide is active. Store `startedAt` and `durationMs` (countdown) or just `startedAt` (countup). Crossing 60s / 30s / 0 uses one-shot flags per slide visit so flashes do not repeat if the clock is scrubbed oddly.

### 3. Canvas border

Overlay or `outline`/`box-shadow` on `#deckCanvas` (or a dedicated `.deck-timer-border` sibling that is not scaled incorrectly — prefer a fixed overlay on the scaled canvas wrapper if scale would thicken the 1px line). Style: `1px solid rgba(var(--danger-rgb), .5)`.

Flash envelopes (CSS classes + short timeouts, or WAAPI):

| Name | Envelope |
| --- | --- |
| start | opacity 0 → fade in to peak → snap to 0 |
| end | snap to peak → fade out to 0 |

Locked overtime: keep border at peak opacity until clear.

### 4. Notes UI

- `#nwEst` static label unchanged.
- Add `#nwLive` (or similar) for `m:ss` / `+m:ss`; empty when mode off / home.
- Timer switch in notes bar next to theme; host syncs like theme checkbox via `renderNotes` / dedicated `syncNotesTimer`.
- Mode-active cue: switch on + optional small “Timer” label; live digits are the primary signal.

### 5. Storage

`LS_TIMER = 'hptx-timer'`; values `'1'` / absent (or `'0'`). Add to `DECK_LS_KEYS`. Settings Reset clears it.

### 6. Conflict with prior “no timer” wording

Delta updates `Estimated speaking time in the notes window` so the static label stays non-counting; live readout is a separate speak-timer concern.

## Risks / Trade-offs

- [Canvas scale makes 1px uneven] → Prefer border on a non-scaled chrome overlay aligned to the visible canvas bounds, or use `outline` on a wrapper that matches the scaled rect.
- [rAF vs interval drift] → Recompute remaining from `startedAt` each tick; never decrement a stored integer blindly.
- [Flash during navigation] → Cancel pending flash timeouts on `goTo` / mode off.
- [jsdom timing tests] → Drive clock with injectable `now` or advance by stubbing timestamps in unit tests; assert mode/persist/readout strings without waiting real minutes.

## Migration Plan

- Default off; existing decks unchanged.
- About deck already has estimates — timers work once mode is on.
- Rollback: remove chrome + keys; leftover `hptx-timer` in localStorage is harmless.
