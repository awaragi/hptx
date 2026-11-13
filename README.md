# HPTX - HTML Presentation Framework

An HTML presentation platform built for authoring slides with AI coding agents.

A deck is a folder containing a `deck.json` and a set of standalone slide HTML
files. hptx previews the deck with live reload and builds it into a single
self-contained HTML file you can open anywhere.

Because every slide is plain HTML, CSS, and JavaScript, an AI agent can write
any slide you can describe: interactive explorers, animated diagrams, data
visualizations, or custom layouts. The platform supplies a written contract,
theme tokens, and build-time checks, so generated slides stay consistent and
mistakes are caught early.

- **Built for AI authoring**: a precise slide contract, typed APIs, and strict build checks give agents clear rules and fast feedback.
- **Slides are plain HTML documents**: one file per slide, with its own styles and scripts.
- **Automatic scoping**: each slide's CSS and `document` lookups are scoped to that slide.
- **Single-file output**: the built deck has no local dependencies (CDN scripts are allowed).
- **Theming**: colors are CSS custom properties. Bake a theme into the build, or load an override theme into a finished presentation to reuse it for different audiences and brands.
- **Shell included**: home page with agenda tiles, keyboard navigation, step-through slides, and settings.

The design canvas is **1920×1080** (Full HD, 16:9). The shell scales it to fit the viewport.

## Contents

- [Requirements](#requirements)
- [Getting started](#getting-started)
- [Navigation](#navigation) ([speaker notes](#speaker-notes))
- [Commands](#commands)
- [Deck configuration](#deck-configuration)
- [Themes](#themes)
- [Authoring with AI](#authoring-with-ai)
- [Slide templates](#slide-templates)
- [Writing slides](#writing-slides)
- [Project layout](#project-layout)
- [License](#license)

## Requirements

- Node.js 24 or newer

## Getting started

```bash
npm install
npm link
```

`npm link` registers the local `hptx` binary globally so you can run it from
any folder without publishing to the npm registry. (`npm unlink -g hptx` to
remove the link.)

Inside this repo you can also use `npx hptx …` after `npm install`. From
other directories, use the linked `hptx` command.

Try the framework with either sample deck. Dev prints a Local URL (usually
http://localhost:5173/).

**Slide templates** — browse every built-in layout and see how the contract
looks in practice:

```bash
hptx dev --cwd templates
```

**About hptx** — a short narrative deck that shows what the platform is for
(escape static PPTX, agent authoring, ship a single HTML file):

```bash
hptx dev --cwd decks/about
```

Build a single-file copy of either deck the same way:

```bash
hptx build --cwd templates
hptx build --cwd decks/about
```

(`npx hptx …` inside this repo, and `npm run … --` forms, still work.)

## Navigation

Every deck comes with keyboard navigation built in. You don't write any
navigation code in your slides. The home page lists the main shortcuts, and
that list updates when you switch modes.

hptx moves through a deck on two levels:

- **Slides** are the pages of the deck.
- **Steps** are stages within a single slide, such as revealing the next item
in a process, highlighting the next card, or showing the next data series in
a chart. A slide declares how many steps it has. Slides without steps
ignore the step keys.

### Normal mode (default)

Up and down move between slides. Left and right move between steps.

| Key | Action |
| --- | --- |
| `↓` / `Page Down` / `Space` | Next slide |
| `↑` / `Page Up` | Previous slide |
| `→` | Next step on the current slide |
| `←` | Previous step on the current slide |
| `Enter` | Activate the current step (for example, open its detail modal) |
| `Home` / `End` | First slide (home page) / last slide |

Steps wrap around in normal mode: pressing `→` on the last step goes back to
the first step, and pressing `←` on the first step goes to the last one. Your
position stays on the same slide until you press up or down. This lets you
jump between slides freely and use the steps as a separate, focused control
within each slide.

If a step's detail modal is open, `←` and `→` move to the neighboring step and
update the modal to match. `Esc` closes the modal.

### Clicker mode

Presentation clickers usually have only two buttons, which send either the
arrow keys or `Page Up` / `Page Down`. Clicker mode makes all of these keys
behave as a single forward and back control:

| Key | Action |
| --- | --- |
| `→` / `↓` / `Page Down` | Next step. On the last step, go to the next slide |
| `←` / `↑` / `Page Up` | Previous step. On the first step, go to the previous slide |

With one button you can walk through every step of every slide in order.
Steps don't wrap in clicker mode. Reaching the end of a slide's steps moves to
the next slide instead. If a step's detail modal is open, it follows the
steps and closes when you move on to another slide.

Turn on clicker mode in Settings (`C`) under **Playback**. The setting is
saved in the browser, and all other shortcuts keep working.

### Remembering steps

By default, each visit to a slide starts at the slide's landing step. Turn on
**Remember last step on each slide** in Settings → Playback to return to the
step you left instead. Remembered steps are cleared when you refresh the page.
This setting works in both modes.

### Other shortcuts

| Key | Action |
| --- | --- |
| `M` | Open the agenda drawer from any content slide (`↑` / `↓` to move, `Enter` to go, `Esc` to close) |
| `⇧M` | Agenda drawer listing every slide, including hidden ones |
| `H` | Return to the home page |
| `F` | Toggle full screen |
| `T` | Toggle dark / light theme |
| `C` | Open settings (theme, slides, playback, reset) |
| `N` | Open the speaker notes window, bring it forward, or reconnect it after a reload |
| `⇧N` | Close the speaker notes window |
| `S` | Toggle speak timer (persisted per title slug; subtle canvas flash when enabling) |
| `⇧S` | Restart the current slide’s speak timer without turning mode off |

You can also swipe left or right on touch screens, or scroll the mouse wheel,
to change slides.

### Speaker notes

Write notes in a slide's body as `<aside class="notes">…</aside>`. They are
hidden on the slide and shown in a separate notes window: press `N`, then drag
that window to your own screen. It shows the current slide's notes. Optional
`estimatedMinutes` on `registerSlide` (whole minutes) appears as a static
`N min` label. Turn on speak timer with `S` or the Timer switch (home chrome
and notes toolbar; stored per title slug) for a live countdown — or `+`
elapsed when a slide has no estimate — plus subtle canvas border flashes at
enable / 60s / 30s and a locked border in overtime. `⇧S` restarts the current
slide’s clock. Its toolbar has media-style controls (`|<` previous slide,
`<<` previous step, `>>` next step, `>|` next slide) around the progress
(`Slide n / N` and the step), the Light / Dark and Timer switches, and a full
screen button for the notes window. Every shortcut pressed in the notes
window acts on the deck, so you can present from either window.

## Commands

Prefer the local `hptx` binary (`npx hptx …` after `npm install`). Equivalent `npm run … --` forms still work.

| Command | Purpose |
| --- | --- |
| `npx hptx dev --cwd <dir> \| --deck <file> [options]` | Live preview; reload on slide / deck JSON / theme edits. Long-only flags: `--slide` (repeatable), `--output` (ignored for write), `--theme` (CSS theme file/URL), `--cover`, `--title`, `--brand`, `--caption`, `--script`, `--style` |
| `npx hptx build --cwd <dir> \| --deck <file> [options]` | Write the single-file output (same flags; `--output` required unless set in the deck file) |
| `npx hptx export --cwd <dir> \| --deck <file> [options]` | Export design-canvas PNGs / PDFs / PPTX via **system Google Chrome** (`playwright-core`; no bundled browser). Requires `output` (same as build). `--format png\|pdf\|print\|pptx` (one per run; default `png`). `--theme light\|dark` is presentation appearance (default `light`), not a CSS theme file — CSS bake still comes from the deck. `--progress` logs `(slide/total - step/steps) filename` (no step counters when the slide has no steps). Print-layout PDF also works via Cmd/Ctrl+P on the previewed or built HTML. |
| `npx hptx new deck --cwd <dir> [field flags…]` | Scaffold a new deck (`deck.json` with `version: 1`, `cover.html`, `overview.html`) |
| `npx hptx new slide --cwd <dir> --key <stem> --from <template> […]` | Add a slide from a template |
| `npx hptx new --list` | List slide templates |
| `npm test` | Run the test suite |

Always pass `--cwd` and/or `--deck` (no default root). Effective config: defaults < deck file < CLI. Relative paths resolve against the working root (absolute paths allowed).

### Example

```bash
npx hptx new deck --cwd decks/demo --title "Demo deck" --output ./Demo.html
npx hptx new slide --cwd decks/demo --key detail --from cardGrid --after overview
npx hptx dev --cwd decks/demo
npx hptx build --cwd decks/demo
npx hptx export --cwd decks/demo --format png
```

### Export artifacts

Presentation name is the slug of the resolved deck title (CLI `--title` → `deck.json` `title` → output stem → cwd basename; e.g. title `Q3 Review` → `q3-review`). Artifact folders sit next to the HTML `output` path. One `--format` per run:

| Format | Writes |
| --- | --- |
| `png` (default) | `dist/<name>/png/<paddedSlide>-<slideKey>-<paddedStep>.png` for stepped slides; `<paddedSlide>-<slideKey>.png` with no steps (agenda is `0-agenda.png`; indices padded to sort) at 1920×1080 (Full HD, 16:9) |
| `pdf` | those PNGs plus `dist/<name>/png/<name>.pdf` (PNG pages concatenated) |
| `pptx` | those PNGs plus `dist/<name>/png/<name>.pptx` (one full-bleed image slide per PNG, 16:9) |
| `print` | `dist/<name>.pdf` via the shell print layout (not the PNG stack) |

Requires Google Chrome installed. Export uses `playwright-core` with channel `chrome` and does not download a browser; missing Chrome fails with a clear error. For an interactive print-layout PDF, use Cmd/Ctrl+P on the previewed or built deck HTML.

## Deck configuration

`deck.json` is optional but strict when present. hptx rejects unknown top-level fields and `http://` URLs. Missing `version` fails load.

| Field | Required | Meaning |
| --- | --- | --- |
| `version` | yes (in file) | Schema version; current is `1` |
| `output` | for build / export | Single-file HTML output path (file and/or `--output`); parent dir for export artifacts |
| `slides` | no | Ordered list of `*.html` files. If omitted, hptx discovers `*.html` files (skipping `output` and `cover`) |
| `cover` | no | HTML file used as the home page title block. It is not a slide |
| `theme` | no | Local CSS path or `https://` URL, baked into the output |
| `scripts` / `styles` | no | `https://` CDN URLs (a string or `{ src, integrity?, crossorigin? }`) |
| `title` | no | Document `<title>` and top-bar deck title; if omitted, output stem then cwd basename |
| `brand` | no | Primary shell brand label, shown exactly as written (default `Brand.`) |
| `caption` | no | Optional secondary line under `brand` in the top bar and loader |

```json
{
  "title": "Demo deck",
  "brand": "Acme.",
  "caption": "Demo",
  "output": "dist/demo.html",
  "cover": "cover.html",
  "slides": ["overview.html", "detail.html"]
}
```

## Themes

All colors are CSS custom properties named by role (`--brand`, `--accent`,
`--bg`, `--text-strong`, and so on), with light and dark variants. The default
theme uses the Bootstrap 5.3 palette. Slides only use these tokens, so changing
the theme restyles every slide without editing it.

There are two ways to apply a theme.

Theme layers use CSS cascade: **shell defaults** → **baked theme** → **Settings
override**. A partial theme file is fine; unspecified tokens keep earlier layers.

**Baked theme.** Set `theme` in `deck.json` to a local CSS file or an
`https://` URL. The build appends it after the shell defaults inside the deck
theme markers.

**Override theme.** A built presentation can load a different theme at
presentation time, with no rebuild. Open Settings (`C`), go to **Theme**,
then load a `.css` file, drag one onto the box, or paste the CSS, and click
**Apply theme**. The override sits above defaults and any bake, is saved in the
browser, and applies every time the presentation opens there. **Clear theme**
returns to the baked-over-default look.

This lets you build one reusable presentation and adapt it to each audience.
For example, you can keep a theme file per client, brand, or event and apply
the right one before you present. The slides and the built HTML file stay the
same.

An override theme can also adjust the shell. For example, it can hide the
dark/light toggle and the settings gear for a locked-down kiosk look. `C`
still opens Settings when the gear is hidden.

To create a theme, open Settings → **Theme**, copy the **Generate theme** prompt
into your AI assistant, then paste the result into **Apply theme**. The same tab’s
**Bake into build** section explains how to ship that theme via `deck.json`.

Overrides are stored in the browser under keys scoped by the presentation title
slug (`hptx/<slug>/…`). Same-slug tabs on the same origin stay in sync when
prefs change. Different titles do not share prefs. **Settings → Reset** clears
only this slug’s keys.

## Authoring with AI

hptx is designed for decks written with an AI coding agent such as Cursor or
Claude Code, with you directing the content and design. The repository
includes what an agent needs to work on its own:

- **Agent notes**: [`CLAUDE.md`](CLAUDE.md) covers commands, theming rules, slide authoring, and visual QA.
- **A slide contract**: the rules, tokens, and types listed under [Writing slides](#writing-slides) define exactly what a valid slide looks like.
- **Strict build checks**: the build fails on contract violations such as colliding IDs or undefined animations, so the agent can fix problems right away.
- **Visual QA**: with the dev server running, an agent can use Playwright MCP to jump to any slide with `Deck.goToKey('<key>')` and screenshot it on the 1920×1080 canvas.

A typical session:

1. Scaffold a deck with `npx hptx new deck --cwd decks/demo --title "Demo deck" --output ./Demo.html`.
2. Start the preview with `npx hptx dev --cwd decks/demo`.
3. Describe the slide you want. For example: "Add a slide after overview that explains our onboarding flow as a timeline you can click through."
4. Let the agent write the slide, build it, screenshot it, and refine it until it looks right.

## Slide templates

hptx ships with a few template slides. They are starting points and working
examples of the contract, not the limit of what a slide can be.

| Template | Description |
| --- | --- |
| `section` | Section divider with number, heading, and lead text |
| `cardGrid` | Grid of icon cards with a detail modal |
| `stepper` | Process steps revealed one at a time |
| `d3Chart` | Themed D3 bar chart that steps through data series |
| `blank` | Minimal skeleton showing every contract piece |

Since slides are just HTML, you are encouraged to go beyond the templates.
Build new, creative slides with any layout, animation, or library you like,
and use the CSS and TypeScript contracts to keep them consistent with the
shell and theme.

## Writing slides

Each slide is a standalone HTML document whose filename stem is its slide key.
Put styles and inline scripts in `<head>` and call
`registerSlide({ title, icon, boot })`. Use theme tokens such as `var(--brand)`
instead of hardcoded colors. CDN libraries go in `deck.json`, not in `<script src>` tags.

To add steps to a slide, pass `stepCount` and `setStep(i)` to `registerSlide`.
You can also pass `landingStep` (the step shown when the slide opens) and
`activateStep()` (what `Enter` does). The shell handles the keys, wrapping,
and clicker mode. Your slide only draws the view for each step. To handle
other keys, use `onKey(e)` and return `true` to consume the key.

Whether you write slides yourself or with an agent, the contract files are the
reference:

- [`shell/contract/SLIDE-CONTRACT.md`](shell/contract/SLIDE-CONTRACT.md): rules the build enforces
- [`shell/contract/slide-contract.css`](shell/contract/slide-contract.css): theme tokens and shared classes
- [`shell/contract/slide-contract.d.ts`](shell/contract/slide-contract.d.ts): `registerSlide`, hooks, and the `Deck` API

To jump to a slide from script, call `window.Deck.goToKey('<slideKey>')`.

## Project layout

```text
shell/       Platform shell template and slide contract
src/         Build, dev server, and generator (TypeScript)
templates/   Built-in slide templates (also a browsable deck)
decks/about  Short “about hptx” sample deck
fixtures/    Test fixtures
openspec/    Specs and change proposals
```

## License

[MIT](LICENSE) © Pierre Awaragi
