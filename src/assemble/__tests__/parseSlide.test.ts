import { describe, expect, it } from 'vitest';
import { parseSlideDocument } from '../parseSlide.ts';
import { slideDoc } from './helpers.ts';

const REG = `<script>window.registerSlide({ title: 'T', boot(){} });</script>`;

describe('parseSlideDocument', () => {
  it('harvests styles, scripts and markup, keyed by filename stem', () => {
    const doc = slideDoc({ style: '.rail{gap:12px}' });
    const parsed = parseSlideDocument(doc, '/x/processFlow.html');
    expect(parsed.key).toBe('processFlow');
    expect(parsed.styles).toEqual(['.rail{gap:12px}']);
    expect(parsed.markupHtml).toBe('<div>hi</div>');
    expect(parsed.scripts).toHaveLength(1);
    expect(parsed.scripts[0]).toMatchObject({ origin: 'body' });
    expect(parsed.scripts[0].code).toContain('registerSlide');
  });

  it('accepts registration in a head script with markup-only body', () => {
    const parsed = parseSlideDocument(slideDoc({ head: REG, body: '<div>x</div>' }), 'metrics.html');
    expect(parsed.scripts.map((s) => s.origin)).toEqual(['head']);
    expect(parsed.markupHtml).toBe('<div>x</div>');
  });

  it('harvests multiple styles and scripts, head scripts first, in document order', () => {
    const doc = [
      '<!doctype html><html><head>',
      '<style>.a{}</style><style>.b{}</style>',
      '<script>var h1 = 1;</script>',
      '<script>var h2 = 2;</script>',
      '</head><body>',
      '<div>x</div>',
      '<script>var b1 = 3;</script>',
      '<p>y</p>',
      `<script>window.registerSlide({});</script>`,
      '</body></html>',
    ].join('\n');
    const parsed = parseSlideDocument(doc, 'a.html');
    expect(parsed.styles).toEqual(['.a{}', '.b{}']);
    expect(parsed.scripts.map((s) => s.code)).toEqual(['var h1 = 1;', 'var h2 = 2;', 'var b1 = 3;', 'window.registerSlide({});']);
    expect(parsed.scripts.map((s) => s.line)).toEqual([3, 4, 7, 9]);
    expect(parsed.markupHtml).toBe('<div>x</div>\n\n<p>y</p>');
  });

  it('keeps JSON data blocks in the markup and does not treat them as scripts', () => {
    const body = `<script type="application/json" id="rows">[1,2]</script><div>x</div>${REG}`;
    const parsed = parseSlideDocument(slideDoc({ body }), 'a.html');
    expect(parsed.markupHtml).toContain('<script type="application/json" id="rows">[1,2]</script>');
    expect(parsed.scripts).toHaveLength(1);
  });

  it('does not count registerSlide inside a data block', () => {
    const body = `<script type="application/json">"registerSlide("</script>${REG}`;
    expect(() => parseSlideDocument(slideDoc({ body }), 'a.html')).not.toThrow();
  });

  it('ignores scripts inside HTML comments', () => {
    const body = `<!-- <script src="x.js"></script> -->${REG}`;
    const parsed = parseSlideDocument(slideDoc({ body }), 'a.html');
    expect(parsed.scripts).toHaveLength(1);
  });

  it('rejects module scripts', () => {
    const body = `<script type="module">window.registerSlide({});</script>`;
    expect(() => parseSlideDocument(slideDoc({ body }), 'a.html')).toThrow(/a\.html.*type="module".*classic/);
  });

  it('rejects external scripts and points to deck.json', () => {
    const head = '<script src="https://cdn.example.com/chart.js"></script>';
    expect(() => parseSlideDocument(slideDoc({ head }), 'a.html')).toThrow(
      /a\.html: external script "https:\/\/cdn\.example\.com\/chart\.js".*deck\.json `scripts`/,
    );
  });

  it('rejects other stylesheets and points to deck.json', () => {
    const head = '<link rel="stylesheet" href="extra.css">';
    expect(() => parseSlideDocument(slideDoc({ head }), 'a.html')).toThrow(/a\.html: external stylesheet "extra\.css".*`styles`/);
  });

  it('accepts and strips the contract stylesheet link', () => {
    const head = '<link rel="stylesheet" href="../shell/contract/slide-contract.css">';
    const body = `<link rel="stylesheet" href="slide-contract.css?v=1"><div>x</div>${REG}`;
    const parsed = parseSlideDocument(slideDoc({ head, body }), 'a.html');
    expect(parsed.markupHtml).toBe('<div>x</div>');
  });

  it('ignores non-stylesheet links', () => {
    const head = '<link rel="icon" href="favicon.png">';
    expect(() => parseSlideDocument(slideDoc({ head }), 'a.html')).not.toThrow();
  });

  it('fails on empty body', () => {
    expect(() => parseSlideDocument('<html><head></head><body>  </body></html>', 'a.html')).toThrow(/a\.html.*empty/);
    expect(() => parseSlideDocument(slideDoc({ head: REG, body: ' ' }), 'a.html')).toThrow(/a\.html.*empty/);
  });

  it('fails when there is no body', () => {
    expect(() => parseSlideDocument('<html><head></head></html>', 'a.html')).toThrow(/a\.html.*missing <body>/);
  });

  it('fails when registerSlide is missing', () => {
    expect(() => parseSlideDocument(slideDoc({ body: '<div>x</div>' }), 'a.html')).toThrow(/a\.html.*registerSlide/);
  });

  it('fails on more than one registerSlide call', () => {
    const body = '<script>registerSlide({});</script><script>registerSlide({});</script>';
    expect(() => parseSlideDocument(slideDoc({ body }), 'a.html')).toThrow(/2 registerSlide/);
  });

  it('counts registerSlide across head and body', () => {
    expect(() => parseSlideDocument(slideDoc({ head: REG }), 'a.html')).toThrow(/a\.html: found 2 registerSlide/);
  });
});

describe('parseSlideDocument (cover)', () => {
  const cover = (head: string, body: string) => `<!doctype html><html><head>${head}</head><body>${body}</body></html>`;

  it('harvests a cover without registration or scripts', () => {
    const p = parseSlideDocument(cover('<style>.title-main{font-size:92px}</style>', '<h1 class="title-main">Hello</h1>'), 'cover.html', { kind: 'cover' });
    expect(p.styles).toEqual(['.title-main{font-size:92px}']);
    expect(p.markupHtml).toBe('<h1 class="title-main">Hello</h1>');
    expect(p.scripts).toEqual([]);
  });

  it('keeps cover scripts', () => {
    const p = parseSlideDocument(cover('', '<span id="today"></span><script>document.getElementById("today").textContent = "x";</script>'), 'cover.html', { kind: 'cover' });
    expect(p.scripts.map((s) => s.origin)).toEqual(['body']);
  });

  it('rejects registerSlide in a cover, naming the file', () => {
    expect(() => parseSlideDocument(slideDoc(), 'cover.html', { kind: 'cover' })).toThrow(
      /Cover cover\.html: a cover is not a slide and must not call registerSlide/,
    );
  });

  it('applies the slide reference rules to covers', () => {
    expect(() => parseSlideDocument(cover('', '<script src="https://x.example/a.js"></script><p>x</p>'), 'cover.html', { kind: 'cover' })).toThrow(
      /Cover cover\.html: external script/,
    );
  });
});
