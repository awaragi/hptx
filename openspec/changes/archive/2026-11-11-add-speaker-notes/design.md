# Design

## Context

The shell (`shell/template.html`) is one IIFE that owns navigation (`goTo`, `stepVisible`, `moveStep`, `applySlideStep`), the keyboard handler (an anonymous `window` `keydown` listener), and theme state (`setPresentationTheme`, `#deck-theme`, `#hptxCustomThemeStyle`, `deckNotifyCustomThemeApplied`). `syncSlideToUrl()` already runs after every slide and step change. Assemble passes slide body markup through unchanged apart from executable scripts, so an `aside.notes` reaches the built deck without any build change. Decks are often opened from `file://`.

## Goals / Non-Goals

**Goals:**
- A notes window that is fully driven by the deck window, with no second copy of the deck.
- One code path for keys, whichever window they come from.
- Keep the shell runtime dependency-free and avoid any new `Deck` API member.

**Non-Goals:**
- Step notes, next-slide preview, timers, print with notes, author-styled notes.
- Making `F` in the notes window fullscreen the deck (browsers require the user gesture in the window being made fullscreen).

## Decisions

### Notes stay in place, hidden by shell chrome CSS
`.slide aside.notes { display: none !important; }` in the shell's chrome styles. Assemble is untouched. Converting to `<template>` was considered: cleaner (inert) but more build code for no user-visible gain.

### Blank popup written by the deck
`window.open('', 'hptx-notes', 'popup,width=…,height=…')`. A blank popup inherits the opener's origin, so the deck can write its DOM directly, including from `file://`. The deck writes a small fixed document (toolbar, title, position, notes container, disconnected banner) once per connection, then updates parts of it on each render. Reopening the deck file with a query mode was rejected by the user.

### Notes window calls back through `window.opener`
The written document includes one small inline script that forwards `keydown` events and toolbar clicks to `window.opener.__hptxNotesHost` (`key(e)`, `action(name)`), and polls once a second for the opener. Because `window.opener` is a WindowProxy, it reaches the reloaded deck page too, so listeners never belong to a dead page. If the opener is closed, missing the host, or cross-origin, the notes window shows the disconnected banner. The deck sets `window.__hptxNotesHost`; this is internal and not part of `Deck`.

Alternative considered: the deck attaching its own listeners to the popup's document. Rejected because after a deck reload those listeners belong to the unloaded page, and `document.open()` handling of old listeners varies.

### Reconnect on `N`
`N` calls `window.open('', 'hptx-notes', …)`, which returns the existing named window instead of opening a new one. If its document is not yet written by this page (no marker element, or written by an earlier page load), the deck rewrites it; then it renders and focuses. If accessing the popup's document throws (for example a `file://` deck in a browser that gives each load a new opaque origin), the deck closes that window and opens a fresh one under the same name; `N` is a user gesture, so the popup is allowed. Verified in Chromium: over `http://` the same window is reused after a reload; over `file://` it is replaced by one new window (its position and size are not kept).

### One named key handler
The anonymous `window` `keydown` listener becomes `function onDeckKeydown(e)`, registered on the deck window and called by the notes host for forwarded keys. `N` / `⇧N` are handled near the top (after the Settings and fullscreen-prompt guards, before drawer and modal handling) so they work while the drawer is open. Typing-target checks keep using the deck document's active element, which is correct because the notes window has no inputs.

### Render from key and step
`renderNotes()` reads `keyAt(current)` and the current step, then calls a pure helper `notesFor(key, step)` that returns the HTML of the slide's asides (`step` unused for now; step notes extend this helper). It is called from `syncSlideToUrl()` so every slide and step change redraws, plus after connecting. Title comes from the registered module (`Home` for `agenda`); slide position uses `visibleContentIndices()`; step position uses `moduleStepCount` and `slideStepIndex`.

### Theme sync by copying style text
On each render and on theme changes (`setPresentationTheme`, `deckNotifyCustomThemeApplied`, and custom theme clear), the notes window gets the current `#deck-theme` and `#hptxCustomThemeStyle` text plus the `data-theme` attribute. Notes chrome CSS is a shell-owned string using only theme tokens. This is cheap (a few KB) and keeps the notes window theme exact.

### Toolbar semantics
Previous / next slide call `stepVisible(∓1)`. Previous / next step call `moveStep(±1, false)` (no wrap) and are disabled when there is no step in that direction. Buttons use inline SVG media icons rather than Unicode glyphs, which some platforms render as emoji. The theme control copies the deck's `.theme-toggle` / `.switch` markup and CSS: its checkbox `change` calls `togglePresentationTheme()`, and the deck sets `checked` / `disabled` from its own mode and `isThemeSwitchDisabled()` on every theme sync. `--deck-theme-toggle-display` hides it just as it hides the deck toggle. Full screen runs inside the notes window's own script (`document.documentElement.requestFullscreen()`), since the click happened there.

## Risks / Trade-offs

- [Popup blockers] → `N` is a keyboard gesture, which browsers accept; when `window.open` returns `null`, log a warning and do nothing.
- [Browser `file://` origin rules differ] → close-and-reopen fallback on `N`; disconnected banner otherwise. Verified with Playwright on a built file.
- [Notes window fullscreen from forwarded `F`] → accepted as not supported.
- [Settings opened with `C` from the notes window shows in the deck window, out of the presenter's sight] → intended: all shortcuts act on the deck.
- [jsdom cannot open real popups] → tests stub `window.open` with a second JSDOM window sharing the opener, which exercises the same DOM writes and forwarded calls.
