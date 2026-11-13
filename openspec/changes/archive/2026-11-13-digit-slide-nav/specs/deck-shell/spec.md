# Spec Delta

## ADDED Requirements

### Requirement: Digit-buffer slide navigation
The shell MUST accept digit keys (`0`–`9`, including numpad) as a slide jump buffer when chrome shortcuts are active (not while typing in a field, and not while Settings, a modal, or the agenda drawer is open). Numbers MUST use the same mapping as the slide counter and bare `?slide=N`: `0` is the home page; `1…N` are visible content slides in order (hidden slides skipped). The shell MUST own digit jump; slide `onKey` MUST NOT receive those digit keys for navigation.

#### Scenario: Single digit after idle
- **WHEN** the presenter presses `1` and no further digit arrives before the idle commit interval
- **THEN** the deck navigates to the first visible content slide

#### Scenario: Multi-digit after idle
- **WHEN** the presenter presses `1` then `2` quickly and then waits for the idle commit interval
- **THEN** the deck navigates to the twelfth visible content slide when that slide exists

#### Scenario: Zero goes home
- **WHEN** the presenter presses `0` and waits for the idle commit interval (or confirms with Enter)
- **THEN** the home page becomes active

#### Scenario: Leading-zero pad commit
- **WHEN** the deck has fewer than 100 visible content slides and the presenter types `0` then `5`
- **THEN** the deck navigates to the fifth visible content slide without waiting for the idle interval

#### Scenario: Enter confirms buffer
- **WHEN** the digit buffer holds a valid slide number and the presenter presses Enter
- **THEN** the deck navigates to that slide immediately

#### Scenario: Cancel clears buffer
- **WHEN** a digit buffer is active and the presenter presses Escape or a non-digit key that is not Enter
- **THEN** the buffer clears and no navigation occurs from that buffer

#### Scenario: Out of range
- **WHEN** the buffer resolves to a number with no matching home or visible content slide
- **THEN** the buffer clears and the current slide stays unchanged

#### Scenario: Idle interval is a named constant
- **WHEN** the idle commit interval is configured in the shell
- **THEN** it is a single named constant of 2000 ms

### Requirement: Digit-nav candidate highlight on nav dots
While a digit buffer is active, the shell MUST highlight the right-hand nav-dot circles for every display number that still matches the buffer as a prefix of either the unpadded decimal form or the zero-padded form at the current pad width, and MUST clear that highlight when the buffer commits or cancels.

#### Scenario: Prefix after zero
- **WHEN** the presenter presses `0` while digit navigation is active
- **THEN** nav dots for home and for visible content slides 1–9 that exist are highlighted as candidates

#### Scenario: Narrow then jump
- **WHEN** the presenter then presses `5` so the buffer is `05` and slide 5 exists
- **THEN** only the nav dot for slide 5 remains highlighted and the deck navigates to that slide

#### Scenario: Highlight cleared after jump
- **WHEN** digit navigation commits or cancels
- **THEN** candidate highlighting on the nav dots is removed

### Requirement: Digit-nav hint on home
The home page keyboard hints MUST include an entry for digit keys that describes jumping to a slide by number.

#### Scenario: Hint listed
- **WHEN** the presenter is on the home page
- **THEN** the keyboard hints include a digit-key entry for slide-number jump

## MODIFIED Requirements

### Requirement: Shell chrome behavior
The shell MUST provide this user-visible chrome behavior: keyboard navigation and shortcuts (arrows, Page Up/Down, `M`, `⇧M`, `H`, `F`, `T`, `C`, `N`, `⇧N`, `S`, `⇧S`, digit-buffer slide jump `0`–`9`), a light/dark theme toggle control on the home page (hidden on content slides; `T` still works when not theme-locked), a speak-timer toggle beside the theme control on the home page (same home-only visibility as the theme toggle; `S` / `⇧S` still work on every slide), print mode, hidden slides (Settings → Slides, stored per browser), clicker mode, remember-slide-step, the speaker notes window (`N` opens, focuses, or reconnects it; `⇧N` closes it), speak-timer mode (`S` toggles and persists; `⇧S` resets the current slide clock while mode stays on), and the Settings modal including Generate theme (under Settings → Theme). The home page keyboard hints MUST list `N`, `S`, and digit slide jump.

#### Scenario: Home shortcut
- **WHEN** the presenter presses `H` on any content slide
- **THEN** the home page becomes active

#### Scenario: Hidden slide skipped
- **WHEN** a slide is hidden in Settings → Slides
- **THEN** forward navigation skips it and the agenda omits it

#### Scenario: Notes hint on home
- **WHEN** the presenter is on the home page
- **THEN** the keyboard hints include `N` for the speaker notes window

#### Scenario: Timer hint on home
- **WHEN** the presenter is on the home page
- **THEN** the keyboard hints include `S` for speak-timer mode

#### Scenario: Digit-nav hint on home
- **WHEN** the presenter is on the home page
- **THEN** the keyboard hints include digit keys for jumping to a slide by number
