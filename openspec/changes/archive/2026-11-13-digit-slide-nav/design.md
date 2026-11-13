# Design

## Context

See proposal.md for motivation. Digit jump lives entirely in the shell runtime (`shell/template.html`): `onDeckKeydown` already owns chrome shortcuts and receives keys forwarded from the speaker notes window. Slide numbering for the counter and bare `?slide=N` already maps `0` → home and `1…N` → `visibleContentIndices()[N-1]`. Nav dots (`#navDots`) are one button per engine index (including home); hidden slides’ dots are `hidden`.

## Goals / Non-Goals

**Goals:**

- Digit buffer + commit/cancel in shell keydown, reusing visible-content numbering.
- Nav-dot candidate preview while buffering.
- Named idle constant `DIGIT_NAV_COMMIT_MS` (2000 ms).
- Home hint for the shortcut.
- Vitest coverage via assembled HTML (same pattern as other shell keyboard tests).

**Non-Goals:**

- New Deck API members or deck.json fields.
- New CSS color tokens (use existing `--brand` / `--text-dim` / `--line`).
- Slide-authored digit handling for this feature.
- Changing export filename indices or URL key-based `?slide=<key>` behavior.

## Decisions

### 1. Numbering = counter / URL numeric form

Reuse `visibleContentIndices()` for `1…N` and `0` for home. Do not use raw engine indices for presenter-facing digits.

**Alternative:** Engine index including agenda as 0 with content shifted — rejected; conflicts with the visible counter.

### 2. Pad width for early commit

`padWidth = visibleContentCount < 100 ? 2 : String(visibleContentCount).length` (minimum 1 if only home). Buffer length reaching `padWidth` commits when the parsed number is in range. Leading zeros (`01`, `05`) enable immediate jump without waiting.

**Alternative:** Always wait for idle — slower for two-digit entry.

### 3. Prefix candidates for highlight and early unique commit

Display numbers in `{0} ∪ {1…visibleCount}`. A number `n` matches buffer `b` if `String(n).startsWith(b)` **or** zero-padded `n` (width `padWidth`) starts with `b`. Highlight matching nav dots (map display `n` → engine index: `0` or `vis[n-1]`).

Early commit when exactly one candidate remains **or** buffer length equals `padWidth` (then commit `parseInt(buffer, 10)` if valid).

Timeout / Enter always commit the **literal** `parseInt(buffer, 10)` when in range — even if longer numbers still match the prefix (e.g. buffer `"1"` with slides 1, 10, 11 → jump to 1).

**Alternative:** Timeout picks among candidates — rejected; mismatches the user’s “wait jumps to slide 1” intent.

### 4. Key handling placement

Handle digits near other chrome shortcuts in `onDeckKeydown`, before slide `onKey`, with the same guards (`isKeyboardTypingTarget`, Settings open, modal open, nav drawer open). Consume digit / Enter-while-buffering / Esc-while-buffering with `preventDefault`. Numpad: `e.key` is `'0'`…`'9'`.

Cancel: Escape or any non-digit that is not Enter clears the buffer without navigating; other shortcuts may still run after clear if appropriate — prefer clear-first then let the same event continue only when it is a normal shortcut (simplest: on cancel via non-digit, clear highlight/timer and do **not** re-dispatch; letter shortcuts typed mid-buffer cancel only). Spec: “Escape or a non-digit key that is not Enter” clears without navigation — so `H` mid-buffer cancels digit nav and does not also go home on that same keypress (clear only). Document that in tasks/tests.

### 5. Visual feedback

Add a class on `#navDots` while buffering (e.g. `digit-nav-active`) and `digit-nav-candidate` on matching buttons. Dim non-candidates via existing tokens (`opacity` / border), emphasize candidates with `--brand` (no new color tokens). Clear classes on commit/cancel. `update()` must not wipe candidate classes incorrectly — re-apply highlight after `update()` if buffer still active, or drive highlight from a small `syncDigitNavDots()` called after `update` / on buffer change.

### 6. Constant

```js
var DIGIT_NAV_COMMIT_MS = 2000;
```

Single place to tune.

## Risks / Trade-offs

- **[Risk] Slide content that expected digit `onKey`** → Mitigation: shell owns digits by design; rare today; document in contract only if needed later.
- **[Risk] `update()` redraw fights highlight classes** → Mitigation: dedicated sync after buffer changes and after `update()`.
- **[Risk] Fake timers in tests** → Mitigation: use Vitest fake timers around idle commit scenarios.

## Migration Plan

No migration. Existing decks pick up behavior on next assemble/dev. Rollback = revert shell + tests.

## Open Questions

None — timeout-vs-unique split confirmed with the user.
