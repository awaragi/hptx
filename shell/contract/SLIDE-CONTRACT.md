# Slide contract

Everything a slide may rely on from the presentation platform, and the rules
the assembler enforces. Companion files in this folder:

- `slide-contract.css` — theme tokens and the shared classes slides may use.
- `slide-contract.d.ts` — `registerSlide`, slide module hooks, and the `Deck` API.

Start new slides from the template library instead of from scratch:
`npm run dev -- templates` to browse, `npm run new -- <deck> <key> --from <template>` to copy.

## File layout

One standalone HTML document per slide. The filename stem is the slide key
(`detail.html` → `detail`); never write the key in markup, CSS, or scripts.
`agenda` is reserved: it is the shell's home page (see [Cover and home page](#cover-and-home-page)).

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Detail operations</title>
<!-- Reference only; stripped by assemble. -->
<link rel="stylesheet" href="../shell/contract/slide-contract.css">
<style>
  :scope { justify-content: flex-start; }
  .rail { display: grid; gap: 12px; }
</style>
<script>
  function fmt(n){ return n.toLocaleString(); }
  window.registerSlide({
    title: 'Detail operations', icon: 'shield',
    boot: function(D){ /* render and wire DOM */ }
  });
</script>
</head>
<body>
  <div class="eyebrow">Operations</div>
  <h1 class="slide-title">Detail operations</h1>
  <div class="rail" id="rail"></div>
  <script type="application/json" id="rows">[{ "label": "MTTR", "value": 42 }]</script>
</body>
</html>
```

- **`<head>`**: any number of `<style>` blocks and inline `<script>` blocks.
  `<title>`, `<meta>`, and non-stylesheet `<link>` elements are ignored.
- **`<body>`**: the slide markup, plus optional inline scripts and data blocks.
  It must not be empty. Do not write the `<section>` wrapper; assemble adds
  `<section class="slide" data-slide="<key>">`.
- **Registration**: exactly one `window.registerSlide({ … })` call per slide,
  in a head or body script. No key argument.
- **Canvas**: slides are laid out on a fixed **1710×1107** canvas that the
  shell scales. Size type and spacing for that canvas.

## Scripts

- Inline **classic** scripts only. `<script type="module">` fails the build.
- **No external scripts or stylesheets.** `<script src>` and stylesheet
  `<link>`s fail the build. Declare CDN libraries in `deck.json` `scripts` /
  `styles`; they load before any slide boots. The only allowed link is the
  reference link to `slide-contract.css`, which assemble removes.
- **Data blocks**: `<script type="application/json" id="…">` (or any other
  non-JavaScript type) stays in the markup as data. Read it with
  `JSON.parse(document.getElementById('…').textContent)`.
- **One scope per slide**: all of a slide's scripts (head first, then body, in
  file order) run inside one function. Top-level `var` / `let` / `const` /
  `function` are shared by that slide's scripts and invisible to other slides.
  Nothing becomes a global unless you assign `window.x` explicitly. Because the
  scripts share a scope, declaring the same `const` twice in one slide is an error.
- **Timing**: `registerSlide` only queues the module. The shell calls
  `boot(Deck)` once after the whole deck is parsed and CDN libraries are
  loaded; do DOM work in `boot` and the other hooks.
- **Error locations**: each slide's scripts keep their original line numbers
  and carry `//# sourceURL=<deck-relative path>`, so stack traces point at the
  slide file.

## Local images

Photos, diagrams, and other raster/vector files may sit next to the slide (or
cover) HTML and be referenced with **paths relative to that HTML file** — not
relative to `deck.json`, the working root, or the framework.

```html
<img src="assets/logo.png" alt="Logo">
```
```css
.hero { background-image: url(assets/hero.jpg); }
```

Assemble reads those files, content-hashes them into a **shared registry** of
`data:` URIs in the single-file output (same bytes used on several slides or
in both CSS and markup appear once), rewrites markup to `data-asset="<id>"`
and CSS `url(...)` to `var(--asset-<id>)`, then an early script sets the CSS
variables and fills `img` / `source` `src` from that registry. The built deck
still opens via `file://` with no sibling assets folder.

- Supported extensions: `.png`, `.jpg` / `.jpeg`, `.gif`, `.webp`, `.svg`,
  `.ico`, `.bmp`.
- `https:` (and other non-relative) image URLs are left as network references.
- A missing local file fails assemble with the slide/cover path and reference.
- Covers use the same rules relative to the cover HTML file.

## API

`slide-contract.d.ts` declares `registerSlide`, the `SlideModule` hooks and
agenda fields, `SlideDocument`, and every `Deck` member (a test keeps it in
sync with the shell). Slides stay plain JavaScript; the file is for editors
and AI tools.

Lifecycle of a slide module:

1. **`boot(D)`** — once per slide, in deck order, after all markup and CDN
   libraries exist. Render and wire events. The light/dark toggle only changes
   surface tokens (`--bg`, `--panel`, `--line`, `--text*`): color generated
   SVG and HTML with `var(--token)` styles for those. Accent values read with
   `D.cssVar` (for example D3 fills) only change when a theme is
   applied or cleared; refresh them from `D.onThemeRefresh(fn)`.
2. **`onEnter(prevKey)`** / **`onLeave(nextKey)`** — on navigation the shell
   calls the old slide's `onLeave`, lands the new slide's step, then calls its
   `onEnter`.
3. **Steps** — declare `stepCount` and optional `landingStep` (numbers or
   functions). The shell owns ←/→ and calls **`setStep(i)`**; Enter calls
   **`activateStep()`**. Change steps from code with `D.setStep(key, i)` or
   `D.moveStep(±1)`; never keep a separate step counter.
4. **`onKey(e)`** — slide-specific keys, checked before ←/→/Enter. Return
   `true` to consume the key.
5. **`onReset()`** — deck reset and print mode: return to the initial state.
   **`redraw()`** — re-render charts before print layout.

Agenda fields: `title`, `icon` (a key of `D.iconPaths`), `agendaTitle`,
`agendaSection`, `showOnTitleAgenda` (false leaves the slide off the home page
agenda and the `M` drawer; `⇧M` still lists it).

## Cover and home page

The shell always renders a **home page** as the first page of the deck (key
`agenda`). It holds a title block (top left), the keyboard hints below it, and
the agenda tiles on the right, built from each slide's agenda fields. `H` and
`Home` return to it. Presenters can turn the agenda off in Settings → Slides;
the title block and hints then move to the center. No slide needs to provide an
agenda.

The title block is filled from the deck's **cover**, an HTML file named in
`deck.json`:

```json
{ "output": "./Deck.html", "cover": "cover.html", "slides": ["overview.html"] }
```

- **Not a slide.** The cover has no navigation entry, dot, counter position, or
  agenda tile. It must not call `registerSlide` (the build fails). Do not list
  it in `slides`; slide discovery skips it. Without `cover`, the title block is
  empty.
- **Same file format as a slide**: standalone document, `<style>` and inline
  scripts, contract link allowed, no external references.
- **Content**: keep it to a logo, headline, description, and a line such as a
  date or presenter. The contract classes `.title-logo` (with `.mark` and
  `.word`), `.title-main` (a `<span>` inside is brand-colored), `.title-desc`,
  and `.title-tags` are made for it. Start from `templates/cover.html`.
- **Scoping**: cover CSS is scoped to the title block (`:scope` is the block).
  Cover scripts share one private scope whose `document` lookups see only the
  title block, like slide scripts. They run while the page is parsed, before
  `window.Deck` exists: use
  `window.addEventListener('DOMContentLoaded', …)` to reach it.
- The home page layout, agenda tiles, and hints are shell chrome; do not style
  them from a cover or slide.

## Speaker notes

Write notes for a slide in its body as one or more `<aside class="notes">`
elements. They are hidden on the canvas and shown, in file order, in the
speaker notes window.

```html
<aside class="notes">
  <p>Open with the <b>goal</b>, then walk the three steps.</p>
  <ul><li>Mention the <span style="color: var(--brand)">pilot</span> results.</li></ul>
</aside>
```

- **Content**: basic HTML formatting (`p`, `b`, `em`, `ul`, `ol`, `code`, …)
  and inline `style` attributes. Colors in inline styles follow the token rule
  (`var(--brand)`, not hex). Scripts and `<style>` blocks inside notes are not
  run or applied in the notes window.
- **Estimated time**: optional `estimatedMinutes` on `registerSlide` (whole
  minutes). The notes window shows a static `N min` label near the title.
  Omit it (or pass a non-positive / non-integer value) to hide the label.
  Head `<meta>` stays ignored; put the estimate on the module, not in
  `<head>`.
- **Speak timer**: optional presenter mode (`S` or the Timer switch beside
  theme on the home page / notes toolbar; stored as `hptx-timer`). When on,
  each content slide starts a clock — countdown from `estimatedMinutes`, or
  count-up as `+m:ss` when there is no estimate. Notes show the live readout;
  the deck canvas uses a subtle 1px border flash (start: fade-in then snap
  off; warnings at 60s/30s: snap on then fade out; lock on at overtime).
  `⇧S` restarts the current slide’s clock; `S` again turns mode off and
  clears visuals.
- **Styling**: the shell styles the notes window with the deck's theme. Slide
  CSS does not reach it.
- **Scope**: one set of notes per slide; notes cannot change per step yet. The
  home page has no notes.
- **Presenting**: `N` opens the notes window, brings it forward, or reconnects
  it after the deck reloads; `⇧N` closes it. Keys pressed in the notes window
  act on the deck. Its toolbar has previous slide / previous step, the
  progress (`Slide n / N` and step), next step / next slide, the deck's
  Light / Dark switch, and full screen for the notes window.

## `document` inside a slide

Inside slide scripts — including `boot`, event handlers, and timers — the name
`document` is the **slide's** document:

| Member | Behavior |
| --- | --- |
| `document.getElementById(id)` | Only this slide's section and the elements inside it |
| `document.querySelector(sel)` / `querySelectorAll(sel)` | This slide's section (first, when it matches) and the elements inside it; `:scope` is the section |
| `document.slideRoot` | This slide's `<section class="slide">` element |
| everything else (`createElement`, `createElementNS`, `body`, `documentElement`, `addEventListener`, …) | The page document |

So plain IDs such as `id="rail"` are safe even when two slides (for example
two copies of one template) use the same ID.

Rules that follow from this:

- Use **`window.document`** when you really need the whole page (for example a
  shell element). `getElementsByClassName`, `getElementsByTagName`, and similar
  collections are not scoped.
- The slide document is a stand-in: `document instanceof Document` is false,
  and passing `document` itself to browser APIs that need a real node (for
  example `observer.observe(document)`) throws. Pass `window.document` there.
- **Pass elements, not selector strings, to libraries.** Libraries resolve
  strings against the page: write `d3.select(document.getElementById('chart'))`,
  not `d3.select('#chart')`.
- Prefer `document.slideRoot.style.setProperty('--x', …)` over setting custom
  properties on `document.documentElement`; values set on the slide root
  inherit to everything in the slide and do not leak to other slides.

## CSS

- Assemble scopes every rule to the slide: `.rail {…}` becomes
  `[data-slide="<key>"] .rail {…}`. `:scope` (or a top-level `&`) is the slide
  section itself. Rules anchored at `html`, `body`, or `:root` keep the anchor
  first (`html.deck-print-mode .x` → `html.deck-print-mode [data-slide="<key>"] .x`).
- Colors come from theme tokens only: `var(--brand)`,
  `rgba(var(--brand-rgb), .2)`, `D.cssVar('--accent')`. Never hardcode hex,
  `rgb()`, or named colors (`transparent` / `currentColor` are fine). Do not
  invent new color tokens; the list is in `slide-contract.css`.
- A slide must not depend on CSS from another slide. If two slides need the
  same rule, each carries a copy.

## Shared CSS and tokens

`slide-contract.css` is the CSS every slide gets for free. Assemble inlines it
into the deck's `<style id="deck-theme">`. A `deck.json` `theme` is **appended**
after the default tokens between the `DECK THEME` markers (CSS cascade —
partial themes keep unspecified defaults). Settings override injects a separate
style tag on top of both.

- **Tokens**: `--brand`, `--accent`, `--bg`, `--text-strong`, … plus `*-rgb`
  companions for `rgba()`. Light values on `:root`, dark on
  `html[data-theme="dark"]`.
- **Canvas classes**: `.slide` layout, `.eyebrow`, `h1.slide-title`,
  `p.slide-sub`, `.content-area`, `.highlight`, `.box`, `.detail-box`.
- **Helper output**: `.icon`, `.icon-badge`, `.inline-icon` (from `D.icon`,
  `D.iconBadge`, `D.inlineIcon`) and the modal classes used by `D.openModal`.
- **Cover classes**: `.title-logo`, `.title-main`, `.title-desc`, `.title-tags`.

Everything else in the shell (top bar, nav drawer, Settings, loader, print
layout, home page layout and agenda tiles) is chrome: do not style or depend on it.

Link the file from the slide `<head>` with a relative path so editors and AI
tools can resolve it. The link is a reference only; assemble removes it.

```html
<!-- slide in templates/ or in a deck folder at the repo root -->
<link rel="stylesheet" href="../shell/contract/slide-contract.css">
```

`npm run new` rewrites the `href` for the target deck's location. Any link
whose file name is `slide-contract.css` is accepted; other stylesheet links
fail the build.

## Names that stay global

Scoping cannot reach a few names, so the build checks them instead of renaming
anything. Your slide file is used exactly as written.

- **`@keyframes` names are global.** Two slides may define the same name only
  with an identical definition (this is what happens when a template is copied
  twice). Different definitions under one name fail the build: rename one.
- **A slide must define every animation it uses.** Each name in `animation` /
  `animation-name` must have its `@keyframes` in the same slide, or in
  `slide-contract.css`. Borrowing another slide's keyframes fails the build —
  copy them into your slide.
- **Recommendation:** start and stop animations from scripts by toggling
  classes, not by setting `el.style.animation = 'name …'` or comparing
  `event.animationName`; that keeps names in CSS where the build can see them.
- **IDs referenced from markup must be unique across slides.** The browser
  resolves `for="…"`, `href="#…"`, and `aria-labelledby` / `aria-describedby` /
  `aria-controls` / `aria-owns` / `aria-activedescendant` page-wide. If such an
  ID is defined in more than one slide, the build fails. Duplicate IDs that are
  only used from scripts are fine (see the slide `document` above). Templates
  avoid markup ID references altogether.

## Creating slides and decks

The template library in `templates/` is a normal deck: browse it with
`npm run dev -- templates`. `templates/catalog.json` describes each template
and the CDN libraries it needs.

```bash
npm run new -- --list                                   # templates and descriptions
npm run new -- <deck-root> <key> --from <template>      # new slide <key>.html
npm run new -- <deck-root> <key> --from <template> --title "Detail view" --after overview
npm run new -- <dir> --deck --title "Demo deck"         # new deck: cover + overview
```

- The slide is a verbatim copy of the template. Only the `<title>`, the
  `title` passed to `registerSlide`, and the contract link `href` change; IDs,
  classes, keyframe names, and scripts stay as they are, which is safe because
  slides are scoped. Without `--title`, the key is split into words
  (`detail` → "Detail").
- If `deck.json` has a `slides` list, the new file is added at the end or after
  `--after <key>`. CDN scripts and styles the template needs are added to
  `deck.json` when missing.
- Nothing is written when the deck has no valid `deck.json`, the key is invalid
  or `agenda`, `<key>.html` is the deck's cover or already exists, the template
  is unknown, or `--after` is not in `slides`.
- `--deck` creates `deck.json` (`title`, `output: "./<dir>.html"`,
  `cover: "cover.html"`), `cover.html` from `templates/cover.html` with the deck
  title as its headline, and `overview.html` from `blank`. The folder must be
  new or empty.
