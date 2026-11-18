# Spec Delta: deck-shell

## ADDED Requirements

### Requirement: Baked settings defaults in assembled HTML
Assemble MUST bake the effective settings object into the HTML so the shell can read `clicker`, `rememberStep`, `timer`, and `appearance` without network access (including `file://`).

#### Scenario: Baked clicker default on
- **WHEN** effective settings have `clicker` true and the browser has no override for that slug
- **THEN** the shell starts with clicker mode on

#### Scenario: Baked appearance dark
- **WHEN** effective settings have `appearance` `dark` and the browser has no appearance override
- **THEN** the shell starts with `data-theme="dark"`

### Requirement: Settings preference storage literals
For settings-backed prefs, the shell MUST store localStorage values as the literals `true` / `false` (booleans) or `light` / `dark` (`appearance`), under slug-scoped keys whose suffixes are exactly `clicker`, `rememberStep`, `timer`, and `appearance`. Legacy `'1'`/`'0'` and old suffixes such as `clicker-mode`, `remember-slide-step`, and `theme` (for light/dark) MUST be ignored with no migration.

#### Scenario: Toggle clicker persists true
- **WHEN** the presenter turns clicker mode on
- **THEN** `hptx/<slug>/clicker` is the string `true`

#### Scenario: Toggle clicker off persists false
- **WHEN** baked `clicker` is true and the presenter turns clicker mode off
- **THEN** `hptx/<slug>/clicker` is the string `false` (not deleted solely to mean off)

#### Scenario: Appearance persists as light or dark
- **WHEN** the presenter sets dark appearance
- **THEN** `hptx/<slug>/appearance` is the string `dark`

#### Scenario: Legacy clicker-mode ignored
- **WHEN** localStorage still has `hptx/<slug>/clicker-mode` = `1` and no `clicker` key
- **THEN** the shell uses the baked clicker default, not the legacy key

### Requirement: Runtime settings cascade
For each settings key, the shell MUST use a valid localStorage override when present; otherwise it MUST use the baked default. Custom theme CSS, hidden slides, and agenda visibility remain separate prefs (not part of `settings`).

#### Scenario: Override wins over bake
- **WHEN** baked `clicker` is true and localStorage has `clicker` = `false`
- **THEN** clicker mode is off

#### Scenario: Missing store uses bake
- **WHEN** baked `timer` is true and localStorage has no `timer` key
- **THEN** speak-timer mode is on

## MODIFIED Requirements

### Requirement: Slug-scoped browser preferences
The shell MUST persist deck browser preferences under keys scoped by the baked presentation slug (`hptx/<slug>/…`), including appearance (light/dark), custom theme CSS, hidden slides, clicker, rememberStep, agenda visibility, and speak-timer (`timer`).

#### Scenario: Prefs isolated by slug
- **WHEN** two assembled decks with different title slugs are opened on the same origin and the presenter sets dark appearance on the first
- **THEN** the second deck keeps its own appearance preference and does not read the first deck’s keys

### Requirement: Reset clears only this slug
Settings → Reset MUST clear only this slug’s preference keys and restore the **baked** settings defaults (and other shell defaults for non-settings prefs) for this deck. It MUST NOT remove preference keys for other presentation slugs on the same origin.

#### Scenario: Reset clears only this slug
- **WHEN** the presenter uses Settings → Reset on a deck whose slug is `demo`
- **THEN** only `hptx/demo/…` preference keys are removed and that deck’s prefs return to defaults

#### Scenario: Reset restores baked clicker on
- **WHEN** effective baked settings have `clicker` true, the presenter turned clicker off (stored `false`), then uses Settings → Reset
- **THEN** clicker mode is on again

### Requirement: Legacy flat preference keys ignored
The shell MUST ignore legacy flat preference keys (`hptx-theme`, `hptx-timer`, and other unscoped `hptx-*` preference keys) with no migration into the slug-scoped store.

#### Scenario: Legacy flat keys ignored
- **WHEN** the browser still has a flat `hptx-theme` value and the deck loads with a slug-scoped store
- **THEN** the shell does not use that flat value for presentation appearance

### Requirement: Playback appearance and timer
Settings → Playback MUST include a light/dark appearance control that mirrors the home theme toggle and `T` (honoring theme lock), and a speak-timer control that mirrors the home timer switch and `S`. Appearance MUST persist under the `appearance` settings key, not under a `theme` preference key.

#### Scenario: Appearance in Playback
- **WHEN** the presenter changes light/dark in Settings → Playback and the theme is not locked
- **THEN** the deck appearance updates and the home theme toggle reflects the new mode

#### Scenario: Timer in Playback
- **WHEN** the presenter toggles speak-timer in Settings → Playback
- **THEN** speak-timer mode changes like `S` and the home timer switch updates
