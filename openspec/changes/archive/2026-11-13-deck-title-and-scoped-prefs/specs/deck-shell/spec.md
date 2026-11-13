# Spec Delta

## MODIFIED Requirements

### Requirement: Speak-timer switch beside theme on home
The deck home chrome MUST show a speak-timer switch immediately beside the theme toggle, visible under the same home-only rules as the theme toggle. The switch MUST reflect and change the persisted speak-timer mode (slug-scoped store key) like `S`.

#### Scenario: Visible next to theme on home
- **WHEN** the presenter is on the home page and the theme toggle is shown
- **THEN** a speak-timer switch is shown beside it

## ADDED Requirements

### Requirement: Slug-scoped browser preferences
The shell MUST persist deck browser preferences under keys scoped by the baked presentation slug (`hptx/<slug>/…`), including theme, custom theme CSS, hidden slides, clicker mode, remember-slide-step, agenda visibility, and speak-timer mode.

#### Scenario: Prefs isolated by slug
- **WHEN** two assembled decks with different title slugs are opened on the same origin and the presenter sets dark theme on the first
- **THEN** the second deck keeps its own theme preference and does not read the first deck’s keys

### Requirement: Reset clears only this slug
Settings → Reset MUST clear only this slug’s preference keys and restore defaults for this deck. It MUST NOT remove preference keys for other presentation slugs on the same origin.

#### Scenario: Reset clears only this slug
- **WHEN** the presenter uses Settings → Reset on a deck whose slug is `demo`
- **THEN** only `hptx/demo/…` preference keys are removed and that deck’s prefs return to defaults

### Requirement: Legacy flat preference keys ignored
The shell MUST ignore legacy flat preference keys (`hptx-theme`, `hptx-timer`, and other unscoped `hptx-*` preference keys) with no migration into the slug-scoped store.

#### Scenario: Legacy flat keys ignored
- **WHEN** the browser still has a flat `hptx-theme` value and the deck loads with a slug-scoped store
- **THEN** the shell does not use that flat value for the presentation theme

### Requirement: Cross-tab preference sync
When `localStorage` is available, the shell MUST listen for `storage` events on this deck’s slug-scoped preference keys and re-apply each change with the same setters used for local UI (full side effects).

#### Scenario: Theme change in another tab applies here
- **WHEN** two tabs show the same slug deck and the presenter toggles light/dark theme in tab A
- **THEN** tab B applies the new theme without a reload

#### Scenario: Custom theme CSS syncs
- **WHEN** the presenter applies or clears a Settings custom theme in another tab of the same slug deck
- **THEN** this tab injects or clears the override and refreshes theme-dependent chrome

### Requirement: Session state does not cross-tab sync
Current slide and step (URL), notes window open state, and other non-persisted session state MUST NOT sync across tabs. When the store is the in-memory fallback, cross-tab preference sync MUST NOT be required.

#### Scenario: Session navigation does not sync
- **WHEN** the presenter navigates to another slide in tab A
- **THEN** tab B’s current slide is unchanged
