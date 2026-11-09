import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import { assembleHtml } from '../assembleHtml.ts';
import { defaultTemplatePath } from '../index.ts';
import { parseSlideDocument } from '../parseSlide.ts';
import { TEMPLATE } from './helpers.ts';

/** The real shell shim (registerSlide + __deckSlideDocument) from the shell template. */
function shellShim(): string {
  const tpl = fs.readFileSync(defaultTemplatePath(), 'utf8');
  const start = tpl.indexOf('<script>\n  window.__deckSlideQueue = [];');
  const end = tpl.indexOf('</script>', start) + '</script>'.length;
  if (start === -1) throw new Error('shim not found in shell template');
  return tpl.slice(start, end);
}

/** Template with the real shim before the slides, plus a tiny engine that drains the queue. */
const RUNTIME_TEMPLATE = TEMPLATE.replace('<div id="slides">', () => `${shellShim()}\n<div id="shellEl"></div>\n<div id="slides">`).replace(
  '<!-- DECK_CDN_SCRIPTS -->',
  `<!-- DECK_CDN_SCRIPTS -->
<script>
  window.__booted = [];
  window.__deckSlideQueue.forEach(function(e){ window.__booted.push(e[0]); if (e[1].boot) e[1].boot({}); });
</script>`,
);

function load(slides: Record<string, string>): JSDOM {
  const parsed = Object.entries(slides).map(([key, doc]) => parseSlideDocument(doc, `${key}.html`));
  const { html } = assembleHtml({ template: RUNTIME_TEMPLATE, config: { output: 'o.html' }, slides: parsed });
  const errors: string[] = [];
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    beforeParse(win) {
      win.addEventListener('error', (e) => errors.push(String((e as ErrorEvent).message)));
    },
  });
  if (errors.length) throw new Error('page errors: ' + errors.join('; '));
  return dom;
}

const doc = (head: string, body: string) =>
  `<!doctype html><html><head>${head}</head><body>${body}</body></html>`;

describe('slide runtime scoping (jsdom)', () => {
  it('binds registration to the slide key and boots each slide', () => {
    const dom = load({
      metrics: doc('<script>window.registerSlide({ title: "K" });</script>', '<div>k</div>'),
      process: doc('', '<div>p</div><script>window.registerSlide({ title: "P" });</script>'),
    });
    const w = dom.window as unknown as { __booted: string[]; __deckSlideQueue: Array<[string, { title: string }]> };
    expect(w.__deckSlideQueue.map((e) => [e[0], e[1].title])).toEqual([
      ['metrics', 'K'],
      ['process', 'P'],
    ]);
  });

  it('shares helpers across a slide\'s head and body scripts', () => {
    const dom = load({
      metrics: doc(
        '<script>function fmt(n){ return "#" + n; }</script>',
        '<div id="out"></div><script>window.registerSlide({ boot(){ document.getElementById("out").textContent = fmt(3); } });</script>',
      ),
    });
    expect(dom.window.document.querySelector('[data-slide="metrics"] #out')?.textContent).toBe('#3');
  });

  it('isolates top-level names between slides and does not leak globals', () => {
    const slide = (v: number) =>
      doc('', `<div id="v"></div><script>const data = ${v}; var total = ${v}; window.registerSlide({ boot(){ document.getElementById("v").textContent = String(data); } });</script>`);
    const dom = load({ a: slide(1), b: slide(2) });
    const d = dom.window.document;
    expect(d.querySelector('[data-slide="a"] #v')?.textContent).toBe('1');
    expect(d.querySelector('[data-slide="b"] #v')?.textContent).toBe('2');
    expect((dom.window as unknown as { total?: number }).total).toBeUndefined();
  });

  it('scopes id and selector lookups to the slide, including from late handlers', () => {
    const slide = (label: string) =>
      doc(
        '',
        `<div id="rail"><button class="card" id="btn">${label}</button><span class="card"></span></div><div id="detail"></div>
         <script>window.registerSlide({ boot(){
           document.getElementById("btn").addEventListener("click", function(){
             document.getElementById("detail").textContent = "${label}:" + document.querySelectorAll(":scope .card").length;
           });
         } });</script>`,
      );
    const dom = load({ riskA: slide('A'), riskB: slide('B') });
    const d = dom.window.document;
    (d.querySelector('[data-slide="riskB"] #btn') as HTMLButtonElement).click();
    expect(d.querySelector('[data-slide="riskB"] #detail')?.textContent).toBe('B:2');
    expect(d.querySelector('[data-slide="riskA"] #detail')?.textContent).toBe('');
  });

  it('exposes slideRoot, page-level members and window.document', () => {
    const dom = load({
      metrics: doc(
        '',
        `<div id="here"></div><script>window.registerSlide({ boot(){
          var probe = document.createElement("div"); probe.id = "probe"; document.body.appendChild(probe);
          var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          window.__r = {
            root: document.slideRoot.getAttribute("data-slide"),
            probeOnBody: probe.parentNode === window.document.body,
            svg: svg.namespaceURI,
            shell: !!window.document.getElementById("shellEl"),
            shellScoped: document.getElementById("shellEl"),
            outside: document.getElementById("probe")
          };
        } });</script>`,
      ),
    });
    expect((dom.window as unknown as { __r: unknown }).__r).toEqual({
      root: 'metrics',
      probeOnBody: true,
      svg: 'http://www.w3.org/2000/svg',
      shell: true,
      shellScoped: null,
      outside: null,
    });
  });

  it('matches the slide section itself, first, without reaching other slides', () => {
    const slide = doc(
      '',
      `<div class="slide-part"></div><script>window.registerSlide({ boot(){
        window.__r = window.__r || {};
        window.__r[document.slideRoot.getAttribute("data-slide")] = {
          byAttr: document.querySelector('[data-slide]') === document.slideRoot,
          all: Array.from(document.querySelectorAll(".slide, .slide-part")).map(function(e){ return e.className; }),
          item: document.querySelectorAll(".slide").item(0) === document.slideRoot,
          descendantsOnly: document.querySelectorAll(".slide-part").length
        };
      } });</script>`,
    );
    const dom = load({ a: slide, b: slide });
    const expected = { byAttr: true, all: ['slide', 'slide-part'], item: true, descendantsOnly: 1 };
    expect((dom.window as unknown as { __r: unknown }).__r).toEqual({ a: expected, b: expected });
  });

  it('reads JSON data blocks from the slide', () => {
    const dom = load({
      metrics: doc(
        '',
        `<script type="application/json" id="rows">[1,2,3]</script><div id="n"></div>
         <script>window.registerSlide({ boot(){ document.getElementById("n").textContent = JSON.parse(document.getElementById("rows").textContent).length; } });</script>`,
      ),
    });
    expect(dom.window.document.querySelector('#n')?.textContent).toBe('3');
  });

  it('scopes cover script lookups to the home page title block', () => {
    const tpl = RUNTIME_TEMPLATE.replace(
      '<div id="slides">',
      () => '<div id="slides"><section class="slide" data-slide="agenda"><div data-deck-cover><!-- DECK_COVER --></div><span id="today">shell</span></section>',
    );
    const cover = parseSlideDocument(
      doc('', '<span id="today"></span><script>document.getElementById("today").textContent = "cover:" + (document.slideRoot.hasAttribute("data-deck-cover"));</script>'),
      'cover.html',
      { kind: 'cover' },
    );
    const { html } = assembleHtml({ template: tpl, config: { output: 'o.html' }, slides: [], cover });
    const dom = new JSDOM(html, { runScripts: 'dangerously' });
    const d = dom.window.document;
    expect(d.querySelector('[data-deck-cover] #today')?.textContent).toBe('cover:true');
    expect(d.querySelector('[data-slide="agenda"] > #today')?.textContent).toBe('shell');
  });

  it('has the slide sourceURL on the wrapper so errors map to the slide file', () => {
    const parsed = parseSlideDocument(doc('', '<div></div>\n<script>\nwindow.registerSlide({});\n</script>'), 'metrics.html');
    const { html } = assembleHtml({
      template: RUNTIME_TEMPLATE,
      config: { output: 'o.html' },
      slides: [{ ...parsed, sourceName: path.posix.join('deck', 'metrics.html') }],
    });
    expect(html).toContain('//# sourceURL=deck/metrics.html');
  });
});
