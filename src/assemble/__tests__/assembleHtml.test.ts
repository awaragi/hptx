import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { ASSETS_PLACEHOLDER, CONTRACT_CSS_PLACEHOLDER, assembleHtml } from '../assembleHtml.ts';
import { readDefaultThemeTokens } from '../bakeTheme.ts';
import { assembleDeck, readContractCss } from '../index.ts';
import { parseSlideDocument } from '../parseSlide.ts';
import { TEMPLATE, makeDeckDir, slideDoc } from './helpers.ts';

const PNG_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const PNG_BUF = Buffer.from(PNG_B64, 'base64');
const PNG_ID = createHash('sha256').update(PNG_BUF).digest('hex').slice(0, 12);

const slide = (key: string, style?: string) =>
  parseSlideDocument(slideDoc(style ? { style } : {}), `${key}.html`);

describe('assembleHtml', () => {
  it('wraps slides in sections, scopes css, tags scripts, and injects cdn tags', () => {
    const { html } = assembleHtml({
      template: TEMPLATE,
      config: {
        output: 'o.html',
        scripts: [{ src: 'https://cdn.example.com/d3.js', crossorigin: 'anonymous' }],
        styles: ['https://cdn.example.com/x.css'],
      },
      slides: [slide('metrics', '.rail{gap:12px}'), slide('overview')],
    });
    expect(html).toContain('<section class="slide" data-slide="metrics">');
    expect(html).toContain('<section class="slide" data-slide="overview">');
    expect(html.indexOf('data-slide="metrics"')).toBeLessThan(html.indexOf('data-slide="overview"'));
    expect(html).toContain('[data-slide="metrics"] .rail{gap:12px}');
    expect(html).toContain('<script data-slide-script="metrics">');
    expect(html).toContain('<script src="https://cdn.example.com/d3.js" crossorigin="anonymous"></script>');
    expect(html).toContain('<link rel="stylesheet" href="https://cdn.example.com/x.css">');
    expect(html).not.toContain('DECK_SLIDES');
    expect(html).not.toContain('DECK_CDN');
    // CDN scripts come before the slide scripts' position? styles in head, scripts after slides
    expect(html.indexOf('<link rel="stylesheet"')).toBeLessThan(html.indexOf('<body>'));
  });

  it('sets title, brand, and caption without magic splitting', () => {
    const { html, warnings } = assembleHtml({
      template: TEMPLATE,
      config: { output: 'o.html', title: 'Kickoff', brand: 'Acme.', caption: 'Deck' },
      slides: [slide('a')],
      themeCss: ':root{ --brand:#abc; --accent:#def; }',
    });
    expect(html).toContain('<title>Kickoff</title>');
    expect(html).toContain('<div class="brand">Acme.<small>Deck</small></div>');
    expect(html).toContain('<div class="loader-brand">Acme. <span>Deck</span></div>');
    expect(html).toContain('<div class="brand-row"><div class="nav-menu-slot"><button>m</button></div>');
    expect(html).toContain('<div class="deck-title">Kickoff</div>');
    expect(html).not.toContain('Shell.');
    expect(html).not.toContain('Default deck');
    expect(html).toContain('DECK THEME — START');
    expect(html).toContain('DECK THEME — END');
    expect(html).toContain('--brand:#abc');
    expect(warnings).toEqual([]);
  });

  it('does not split a brand that contains a period when caption is omitted', () => {
    const { html } = assembleHtml({
      template: TEMPLATE,
      config: { output: 'o.html', brand: 'Acme. Demo' },
      slides: [slide('a')],
    });
    expect(html).toContain('<div class="brand">Acme. Demo</div>');
    expect(html).not.toContain('<small>');
  });

  it('keeps shell default theme and title when none given', () => {
    const { html } = assembleHtml({ template: TEMPLATE, config: { output: 'o.html' }, slides: [slide('a')] });
    expect(html).toContain('<title>Default</title>');
    expect(html).toContain('--brand:#111');
  });

  it('emits one wrapper script per slide after the markup, line-aligned to the source', () => {
    const doc = [
      '<!doctype html><html><head>',
      '<script>function fmt(n){ return n; }</script>',
      '</head><body>',
      '<div id="rail"></div>',
      '<script type="application/json" id="rows">[1]</script>',
      '<script>',
      'window.registerSlide({ boot(){} });',
      '</script>',
      '</body></html>',
    ].join('\n');
    const { html } = assembleHtml({
      template: TEMPLATE,
      config: { output: 'o.html' },
      slides: [{ ...parseSlideDocument(doc, 'metrics.html'), sourceName: 'deck/metrics.html' }],
    });
    const section = html.slice(html.indexOf('<section class="slide" data-slide="metrics">'), html.indexOf('</section>'));
    expect(section.match(/<script data-slide-script/g)).toHaveLength(1);
    expect(section.indexOf('<div id="rail">')).toBeLessThan(section.indexOf('<script data-slide-script'));
    expect(section).toContain('<script type="application/json" id="rows">[1]</script>');
    const script = section.slice(section.indexOf('<script data-slide-script="metrics">') + '<script data-slide-script="metrics">'.length);
    const lines = script.split('\n');
    expect(lines[0]).toBe('(function (document) {');
    expect(lines[1]).toBe('function fmt(n){ return n; }');
    expect(lines[6]).toBe('window.registerSlide({ boot(){} });');
    expect(script).toContain('}).call(window, window.__deckSlideDocument(window.document.currentScript));');
    expect(script).toContain('//# sourceURL=deck/metrics.html');
  });

  it('renders the cover into the title block, scoped, with its own script wrapper', () => {
    const tpl = TEMPLATE.replace('<div id="slides">', '<div data-deck-cover><!-- DECK_COVER --></div>\n<div id="slides">');
    const cover = parseSlideDocument(
      '<!doctype html><html><head><style>.title-main{font-size:92px}</style></head><body><h1 class="title-main">Hello</h1><script>var x = 1;</script></body></html>',
      'cover.html',
      { kind: 'cover' },
    );
    const { html } = assembleHtml({ template: tpl, config: { output: 'o.html' }, slides: [slide('a')], cover });
    const block = html.slice(html.indexOf('<div data-deck-cover>'), html.indexOf('<div id="slides">'));
    expect(block).toContain('[data-deck-cover] .title-main{font-size:92px}');
    expect(block).toContain('<h1 class="title-main">Hello</h1>');
    expect(block).toContain('<script data-deck-cover-script>(function (document) {');
    expect(html).not.toContain('DECK_COVER');
    const empty = assembleHtml({ template: tpl, config: { output: 'o.html' }, slides: [slide('a')] }).html;
    expect(empty).toContain('<div data-deck-cover></div>');
  });

  it('fails when a cover is given but the template has no cover placeholder', () => {
    const cover = parseSlideDocument('<html><body><h1>x</h1></body></html>', 'cover.html', { kind: 'cover' });
    expect(() => assembleHtml({ template: TEMPLATE, config: { output: 'o.html' }, slides: [], cover })).toThrow(/DECK_COVER/);
  });

  it('throws when a placeholder is missing', () => {
    expect(() =>
      assembleHtml({ template: '<title>x</title>', config: { output: 'o.html' }, slides: [] }),
    ).toThrow(/DECK_CDN_STYLES/);
  });

  it('injects the assets registry before slides and leaves the placeholder empty when unused', () => {
    const dataUri = `data:image/png;base64,${PNG_B64}`;
    const withAssets = assembleHtml({
      template: TEMPLATE,
      config: { output: 'o.html' },
      slides: [
        {
          ...slide('pic'),
          styles: [`.hero{background-image:var(--asset-${PNG_ID})}`],
          markupHtml: `<img data-asset="${PNG_ID}" alt="Logo">`,
        },
      ],
      assets: { [PNG_ID]: dataUri },
    }).html;
    expect(withAssets).toContain('id="deck-assets"');
    expect(withAssets).toContain(dataUri);
    expect(withAssets.indexOf('id="deck-assets"')).toBeLessThan(withAssets.indexOf('data-slide="pic"'));
    expect(withAssets).toContain(`var(--asset-${PNG_ID})`);
    expect(withAssets).toContain(`data-asset="${PNG_ID}"`);
    expect(withAssets).not.toContain(ASSETS_PLACEHOLDER);

    const empty = assembleHtml({ template: TEMPLATE, config: { output: 'o.html' }, slides: [slide('a')] }).html;
    expect(empty).not.toContain('deck-assets');
    expect(empty).not.toContain('DECK_ASSETS');
  });

  it('fails when baked assets are present but the template has no assets placeholder', () => {
    const tpl = TEMPLATE.replace('<!-- DECK_ASSETS -->\n', '');
    expect(() =>
      assembleHtml({
        template: tpl,
        config: { output: 'o.html' },
        slides: [slide('a')],
        assets: { abc: 'data:image/png;base64,xx' },
      }),
    ).toThrow(/DECK_ASSETS/);
  });
});

describe('assembleDeck', () => {
  it('assembles a deck from disk with filter and local theme', async () => {
    const dir = makeDeckDir({
      'deck.json': JSON.stringify({ output: './Out.html', theme: './t.css', title: 'T' }),
      't.css': ':root{ --brand:#abc; --accent:#def; }',
      'a.html': slideDoc({ style: '.x{a:b}' }),
      'b.html': slideDoc(),
      'shell/tpl.html': TEMPLATE,
    });
    const res = await assembleDeck(dir, { slides: ['b', 'a.html'], templatePath: path.join(dir, 'shell', 'tpl.html') });
    expect(res.outputPath).toBe(path.join(dir, 'Out.html'));
    expect(res.html.indexOf('data-slide="b"')).toBeLessThan(res.html.indexOf('data-slide="a"'));
    expect(res.html).toContain('--brand:#abc');
    expect(res.html).toContain('<title>T</title>');
    expect(res.warnings).toEqual([]);
    expect(res.imagePaths).toEqual([]);
    expect(fs.existsSync(res.outputPath)).toBe(false);
  });

  it('bakes slide-relative local images into a shared registry', async () => {
    const dir = makeDeckDir({
      'deck.json': JSON.stringify({ output: './Out.html', slides: ['pic.html'] }),
      'pic.html': slideDoc({
        style: '.hero{background-image:url(assets/logo.png)}',
        body: `<img src="assets/logo.png" alt="Logo"><script>window.registerSlide({boot(){}});</script>`,
      }),
      'shell/tpl.html': TEMPLATE,
    });
    fs.mkdirSync(path.join(dir, 'assets'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'assets/logo.png'), PNG_BUF);
    const res = await assembleDeck(dir, { templatePath: path.join(dir, 'shell', 'tpl.html') });
    expect(res.imagePaths).toEqual([path.join(dir, 'assets/logo.png')]);
    expect(res.html).toContain('id="deck-assets"');
    expect(res.html).toContain(`data:image/png;base64,${PNG_B64}`);
    expect(res.html).toContain(`data-asset="${PNG_ID}"`);
    expect(res.html).toContain(`var(--asset-${PNG_ID})`);
    expect(res.html).not.toContain('src="assets/logo.png"');
    expect(res.html.indexOf('id="deck-assets"')).toBeLessThan(res.html.indexOf('data-slide="pic"'));
  });

  it('keeps the cover in a filtered deck', async () => {
    const dir = makeDeckDir({
      'deck.json': JSON.stringify({ output: 'o.html', cover: './cover.html' }),
      'cover.html': '<!doctype html><html><head></head><body><h1 class="title-main">Cover headline</h1></body></html>',
      'a.html': slideDoc(),
      'b.html': slideDoc(),
    });
    const { html } = await assembleDeck(dir, { slides: ['b'] });
    expect(html).toContain('Cover headline');
    expect(html).not.toContain('data-slide="a"');
    expect(html).not.toContain('data-slide="cover"');
  });

  it('runs the keyframe checks on the cover', async () => {
    const dir = makeDeckDir({
      'deck.json': JSON.stringify({ output: 'o.html', cover: 'cover.html' }),
      'cover.html': '<html><head><style>@keyframes pulse{to{opacity:1}}</style></head><body><h1>x</h1></body></html>',
      'a.html': slideDoc({ style: '@keyframes pulse{to{opacity:0}} .x{animation:pulse 1s}' }),
    });
    await expect(assembleDeck(dir)).rejects.toThrow(/@keyframes pulse is defined differently in slides cover and a/);
  });

  it('fails when the theme file is unreadable', async () => {
    const dir = makeDeckDir({
      'deck.json': JSON.stringify({ output: 'o.html', theme: './missing.css', slides: ['a.html'] }),
      'a.html': slideDoc(),
      'shell/tpl.html': TEMPLATE,
    });
    await expect(assembleDeck(dir, { templatePath: path.join(dir, 'shell', 'tpl.html') })).rejects.toThrow(/missing\.css/);
  });

  it('honors CLI outputPath and theme overrides', async () => {
    const dir = makeDeckDir({
      'deck.json': JSON.stringify({ output: './Out.html', theme: './deck-theme.css', title: 'T' }),
      'deck-theme.css': ':root{ --brand:#111111; }',
      'cli-theme.css': ':root{ --brand:#abcdef; }',
      'a.html': slideDoc(),
      'shell/tpl.html': TEMPLATE,
    });
    const out = path.join(dir, 'elsewhere', 'Built.html');
    const res = await assembleDeck(dir, {
      templatePath: path.join(dir, 'shell', 'tpl.html'),
      outputPath: out,
      theme: { kind: 'path', value: path.join(dir, 'cli-theme.css') },
    });
    expect(res.outputPath).toBe(out);
    expect(res.html).toContain('--brand:#abcdef');
    const region = res.html.slice(0, res.html.indexOf('DECK THEME — END'));
    expect(region).not.toContain('--brand:#111111');
  });

  it('assembles with the real default shell template', async () => {
    const dir = makeDeckDir({
      'deck.json': JSON.stringify({ output: 'o.html', slides: ['a.html'] }),
      'a.html': slideDoc(),
    });
    const res = await assembleDeck(dir);
    expect(res.html).toContain('<section class="slide" data-slide="a">');
  });

  it('inlines slide-contract.css into #deck-theme with the default tokens between the markers', async () => {
    const dir = makeDeckDir({ 'deck.json': JSON.stringify({ output: 'o.html' }), 'a.html': slideDoc() });
    const { html } = await assembleDeck(dir);
    const contract = readContractCss();
    const open = html.indexOf('<style id="deck-theme">');
    const theme = html.slice(open, html.indexOf('</style>', open));
    expect(theme).not.toContain(CONTRACT_CSS_PLACEHOLDER);
    expect(theme).toContain('DECK THEME — START');
    expect(theme).toContain('DECK THEME — END');
    expect(theme).toContain(contract.trim().slice(0, 200));
    expect(readDefaultThemeTokens(theme)).toContain('--brand');
    expect(html.indexOf('<style id="deck-theme">')).toBeLessThan(html.indexOf('<style id="deck-chrome">'));
  });

  it('bakes a deck theme after the contract default tokens', async () => {
    const dir = makeDeckDir({
      'deck.json': JSON.stringify({ output: 'o.html', theme: './t.css' }),
      't.css': ':root{ --brand:#abcdef; }',
      'a.html': slideDoc(),
    });
    const { html } = await assembleDeck(dir);
    const theme = html.slice(html.indexOf('<style id="deck-theme">'));
    const region = theme.slice(0, theme.indexOf('DECK THEME — END'));
    expect(region).toMatch(/--brand:\s*#0d6efd/i);
    expect(region).toContain('--brand:#abcdef');
    expect(region.indexOf('--brand:#abcdef')).toBeGreaterThan(region.search(/--brand:\s*#0d6efd/i));
    expect(theme).toContain('h1.slide-title');
  });

  it('defaults to the neutral palette, title, and brand', async () => {
    const { html } = await assembleDeck(makeDeckDir({ 'deck.json': JSON.stringify({ output: 'o.html' }), 'a.html': slideDoc() }));
    const theme = html.slice(html.indexOf('<style id="deck-theme">'));
    expect(theme.slice(0, theme.indexOf('DECK THEME — END'))).toMatch(/--brand:\s*#0d6efd/i);
    expect(html).toContain('<title>Presentation</title>');
    expect(html).toContain('<div class="brand">Brand.</div>');
    expect(html).toContain('<div class="deck-title">Presentation</div>');
  });

  it('keeps layout tokens when a baked theme sets only colors, and lets a theme override them', async () => {
    const build = async (css: string) =>
      (await assembleDeck(makeDeckDir({ 'deck.json': JSON.stringify({ output: 'o.html', theme: './t.css' }), 't.css': css, 'a.html': slideDoc() }))).html;
    const colorsOnly = await build(':root{ --brand:#abcdef; }');
    const start = colorsOnly.indexOf('DECK THEME — START');
    for (const token of ['--radius:14px', '--shadow:', '--ease:']) {
      expect(colorsOnly.indexOf(token)).toBeGreaterThan(-1);
      expect(colorsOnly.indexOf(token)).toBeLessThan(start);
    }
    const overridden = await build(':root{ --brand:#abcdef; --radius:4px; }');
    expect(overridden.indexOf('--radius:4px')).toBeGreaterThan(overridden.indexOf('--radius:14px'));
  });


  it('uses the given contract stylesheet text', () => {
    const tpl = TEMPLATE.replace('<style id="deck-theme">', `<style id="deck-theme">\n${CONTRACT_CSS_PLACEHOLDER}`);
    const { html } = assembleHtml({
      template: tpl,
      config: { output: 'o.html' },
      slides: [slide('a')],
      contractCss: '.eyebrow{ letter-spacing: 9px; }',
    });
    expect(html).toContain('.eyebrow{ letter-spacing: 9px; }');
    expect(() => assembleHtml({ template: tpl, config: { output: 'o.html' }, slides: [slide('a')] })).toThrow(/contract/);
  });
});
