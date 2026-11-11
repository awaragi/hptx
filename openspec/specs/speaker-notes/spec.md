# speaker-notes Specification

## Purpose

Lets presenters keep speaker notes inside each slide file and read them in a separate notes window that stays in sync with the deck.

## Requirements

### Requirement: Notes authored as aside elements
A slide MAY contain one or more `<aside class="notes">` elements anywhere in its body. Assemble MUST keep them in the slide markup as written. The shell MUST NOT show them on the slide canvas. Notes content MAY use basic HTML formatting and inline `style` attributes.

#### Scenario: Notes hidden on the canvas
- **WHEN** `overview.html` contains `<aside class="notes"><p>Open with the goal.</p></aside>` and the deck is built
- **THEN** the built deck contains the aside inside the `overview` slide and it is not displayed on the canvas

#### Scenario: Slide without notes
- **WHEN** a slide has no `aside.notes`
- **THEN** the deck builds and displays the slide exactly as before

### Requirement: Open, focus, or reconnect the notes window
Pressing `N` (no modifier) MUST open the notes window when none is open, bring it to the front when it is open, and reconnect to it when it is open but no longer linked to the deck (for example after the deck window reloaded). The notes window MUST be a blank window that the deck writes into, not a second load of the deck file. Only one notes window MUST exist per deck window.

#### Scenario: First press opens
- **WHEN** no notes window is open and the presenter presses `N`
- **THEN** a notes window opens showing the current slide's notes

#### Scenario: Second press focuses
- **WHEN** the notes window is open and the presenter presses `N` in the deck window
- **THEN** no new window opens and the existing notes window is brought forward

#### Scenario: Reconnect after reload
- **WHEN** the deck window is reloaded while the notes window stays open, and the presenter then presses `N`
- **THEN** the notes window shows the current slide's notes again and follows navigation

### Requirement: Close the notes window
Pressing `⇧N` in the deck window or the notes window MUST close the notes window. When no notes window is open, `⇧N` MUST do nothing.

#### Scenario: Shift+N closes
- **WHEN** the notes window is open and the presenter presses `⇧N`
- **THEN** the notes window closes

### Requirement: Notes window content
The notes window MUST show the current slide's title, its position among the visible content slides, its step position when the slide has steps, and the content of all of the slide's `aside.notes` elements in document order. When the slide has no notes, and on the home page, it MUST show a "No notes" placeholder. The content MUST be computed from the slide key and the current step.

#### Scenario: Notes shown in order
- **WHEN** the current slide has two notes asides, `A` then `B`
- **THEN** the notes window shows `A` followed by `B`

#### Scenario: Home page placeholder
- **WHEN** the deck is on the home page
- **THEN** the notes window shows the title `Home` and the "No notes" placeholder

#### Scenario: Step position
- **WHEN** the current slide has five steps and is on step index `1`
- **THEN** the notes window shows step `2 / 5`

### Requirement: Notes follow navigation
The notes window MUST update whenever the deck's current slide or step changes, whichever window or input caused the change.

#### Scenario: Deck navigation updates notes
- **WHEN** the presenter moves from `overview` to `detail` in the deck window
- **THEN** the notes window shows the `detail` notes

#### Scenario: Step change updates position
- **WHEN** the presenter advances a step on a multi-step slide
- **THEN** the notes window's step position updates

### Requirement: Keys in the notes window act on the deck
Every key pressed in the notes window MUST be handled exactly as if it were pressed in the deck window (navigation, steps, Enter, `H`, `Home`, `End`, `M`, `⇧M`, `C`, `T`, `N`, `⇧N`, clicker input, and slide `onKey` handlers). The notes window MUST have no shortcuts of its own. `F` pressed in the notes window is not required to make the deck full screen.

#### Scenario: Arrow in notes window navigates the deck
- **WHEN** the notes window has focus and the presenter presses `↓`
- **THEN** the deck window moves to the next visible slide and the notes window shows its notes

#### Scenario: H in notes window goes home
- **WHEN** the notes window has focus and the presenter presses `H` on a content slide
- **THEN** the deck window shows the home page

### Requirement: Notes window follows the theme
The notes window MUST be styled by the shell only, using the deck's current theme tokens (defaults, baked theme, and any Settings theme) and the deck's light/dark mode. It MUST update when the light/dark mode changes or a Settings theme is applied or cleared.

#### Scenario: Dark mode follows
- **WHEN** the notes window is open and the presenter presses `T`
- **THEN** both the deck window and the notes window switch light/dark mode

### Requirement: Notes window toolbar navigation
The notes window toolbar MUST show media-style icon buttons in this order: previous slide (`|<`), previous step (`<<`), the progress (`Slide n / N`, plus the step position when the slide has steps, or `Home`), next step (`>>`), next slide (`>|`). Slide buttons MUST move the deck to the previous or next visible slide. Step buttons MUST move the current slide's step without changing slide and MUST be disabled when there is no step in that direction. Each button MUST have an accessible name.

#### Scenario: Progress between the controls
- **WHEN** the deck is on the second of five visible slides
- **THEN** the toolbar shows `Slide 2 / 5` between the previous step and next step buttons

#### Scenario: Next slide button
- **WHEN** the presenter clicks next slide in the notes window toolbar
- **THEN** the deck moves to the next visible slide

#### Scenario: Step buttons disabled without steps
- **WHEN** the current slide has no steps
- **THEN** the previous step and next step buttons are disabled

### Requirement: Notes window toolbar theme and full screen
The toolbar MUST include the same Light / Dark switch as the deck's theme toggle, reflecting and changing the deck's mode like `T`, and hidden or disabled under the same theme lock. It MUST also include a full screen button that toggles full screen for the notes window only.

#### Scenario: Theme switch
- **WHEN** the presenter flips the Light / Dark switch in the notes window
- **THEN** both windows switch light/dark mode and the switch shows the new mode

#### Scenario: Switch follows T
- **WHEN** the presenter presses `T` in the deck window
- **THEN** the notes window switch shows the new mode

#### Scenario: Full screen notes
- **WHEN** the presenter clicks the full screen button in the notes window
- **THEN** the notes window enters full screen and the deck window does not change

### Requirement: Disconnected notes window
When the deck window closes or can no longer be reached, the notes window MUST show that it is disconnected and that pressing `N` in the deck window reconnects it.

#### Scenario: Deck window closed
- **WHEN** the deck window is closed while the notes window is open
- **THEN** the notes window shows a disconnected message

### Requirement: Estimated speaking time in the notes window
A content slide MAY declare an estimated speaking time in whole minutes. When the notes window shows that slide and an estimate is present, the notes window MUST display it as a static minutes label (for example `3 min`). That static label MUST NOT itself count down. When the estimate is absent, or the current view is the home page, the notes window MUST omit the static label. Changing slide MUST update or clear the static label to match the new slide. A separate live speak-timer readout MAY appear only when speak-timer mode is on (see speak-timer).

#### Scenario: Minutes label shown
- **WHEN** the current slide declares an estimated speaking time of `3` minutes and the notes window is open
- **THEN** the notes window shows a static `3 min` label (or equivalent whole-minutes wording)

#### Scenario: No estimate omitted
- **WHEN** the current slide has no estimated speaking time and the notes window is open
- **THEN** the notes window shows no minutes label

#### Scenario: Home page omits estimate
- **WHEN** the deck is on the home page and the notes window is open
- **THEN** the notes window shows no minutes label

#### Scenario: Navigation updates the label
- **WHEN** the presenter moves from a slide with a `5` minute estimate to a slide with a `2` minute estimate
- **THEN** the notes window label changes from `5 min` to `2 min`

### Requirement: Speak-timer readout in the notes window
When speak-timer mode is on, the notes window MUST show that the mode is active and MUST show the live clock for the current content slide: countdown `m:ss` while remaining is positive, `+m:ss` overtime after zero on a timed slide, or `+m:ss` elapsed on an untimed content slide. When mode is off, or on the home page, the live clock MUST be omitted (the static `estimatedMinutes` label, when present, is unchanged). The notes toolbar MUST include a timer switch beside the theme switch that stays in sync with the deck’s speak-timer mode.

#### Scenario: Countdown shown
- **WHEN** speak-timer mode is on and the current slide has two minutes remaining
- **THEN** the notes window shows a mode-active indicator and a live `2:00` (or equivalent) remaining readout

#### Scenario: Overtime shown
- **WHEN** speak-timer mode is on and the current timed slide is fifteen seconds past zero
- **THEN** the notes window shows `+0:15` (or equivalent)

#### Scenario: Mode off hides live clock
- **WHEN** speak-timer mode is off
- **THEN** the notes window shows no live timer readout and the timer switch appears off
