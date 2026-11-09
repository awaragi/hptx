import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assembleDeck } from '../../assemble/index.ts';
import {
  createDeck,
  createSlide,
  defaultPaths,
  defaultTitle,
  parseNewArgs,
  readCatalog,
  renderTemplate,
  runNew,
} from '../index.ts';

const PATHS = defaultPaths();
const D3 = 'https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js';

const tmp = (): string => fs.mkdtempSync(path.join(os.tmpdir(), 'hptx-new-'));
function deckDir(config: Record<string, unknown>, files: Record<string, string> = {}): string {
  const dir = tmp();
  const cfg = { version: 1, ...config };
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify(cfg, null, 2) + '\n');
  for (const [name, text] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), text);
  return dir;
}
const readJson = (file: string) => JSON.parse(fs.readFileSync(file, 'utf8'));
const template = (key: string) => fs.readFileSync(path.join(PATHS.templatesDir, `${key}.html`), 'utf8');
const snapshot = (dir: string) =>
  Object.fromEntries(fs.readdirSync(dir).sort().map((f) => [f, fs.readFileSync(path.join(dir, f), 'utf8')]));

/** Lines of `a` and `b` that differ (same line count expected). */
function changedLines(a: string, b: string): Array<[string, string]> {
  const la = a.split('\n');
  const lb = b.split('\n');
  expect(lb.length).toBe(la.length);
  return la.flatMap((line, i) => (line === lb[i] ? [] : [[line.trim(), lb[i].trim()] as [string, string]]));
}

describe('defaultTitle', () => {
  it('splits camelCase and separators into capitalized words', () => {
    expect(defaultTitle('detailView')).toBe('Detail View');
    expect(defaultTitle('demo-deck')).toBe('Demo Deck');
    expect(defaultTitle('d3Chart')).toBe('D3 Chart');
  });
});

describe('parseNewArgs', () => {
  it('parses deck, slide, and list modes', () => {
    expect(
      parseNewArgs(['slide', '--cwd', 'd', '--key', 'detail', '--from', 'blank', '--title', 'Detail', '--after', 'process']),
    ).toEqual({
      mode: 'slide',
      cwd: 'd',
      key: 'detail',
      template: 'blank',
      title: 'Detail',
      after: 'process',
    });
    expect(parseNewArgs(['deck', '--cwd', 'decks/demo', '--title', 'Demo deck'])).toEqual({
      mode: 'deck',
      cwd: 'decks/demo',
      title: 'Demo deck',
    });
    expect(parseNewArgs(['--list'])).toEqual({ mode: 'list' });
  });

  it.each([
    [['slide', '--cwd', 'd', '--key', 'k'], /required option|--from/i],
    [['slide', '--key', 'k', '--from', 'blank'], /required option|--cwd/i],
    [['deck'], /--cwd is required/],
    [['slide', '--cwd', 'd', '--key', 'k', '--from', 'blank', '--bogus'], /Unknown option --bogus/],
  ])('rejects %j', (argv, msg) => {
    expect(() => parseNewArgs(argv)).toThrow(msg);
  });
});

describe('renderTemplate', () => {
  it('changes only the document title, registered title, and contract href', () => {
    const out = renderTemplate(template('cardGrid'), 'cardGrid', 'Risk & "ops"', '../x/slide-contract.css');
    expect(changedLines(template('cardGrid'), out)).toEqual([
      ['<title>Card grid</title>', '<title>Risk &amp; "ops"</title>'],
      ['<link rel="stylesheet" href="../shell/contract/slide-contract.css">', '<link rel="stylesheet" href="../x/slide-contract.css">'],
      ["title: 'Card grid',", "title: 'Risk & \"ops\"',"],
    ]);
  });

  it('keeps a title with quotes and </script> inside the script', () => {
    const out = renderTemplate(template('blank'), 'blank', "It's </script>", 'c/slide-contract.css');
    expect(out).toContain("title: 'It\\'s \\u003c/script>',");
    expect(out.match(/<\/script>/g)?.length).toBe(template('blank').match(/<\/script>/g)?.length);
  });

  it.each(Object.keys(readCatalog()))('%s renders with exactly three changed lines', (key) => {
    const out = renderTemplate(template(key), key, 'New title', '../../shell/contract/slide-contract.css');
    expect(changedLines(template(key), out)).toHaveLength(3);
  });

  it.each([
    ['<title>', (h: string) => h.replace(/<title>[^<]*<\/title>/, '')],
    ['slide-contract.css link', (h: string) => h.replace(/<link rel="stylesheet"[^>]*>/, '')],
    ['registerSlide( call', (h: string) => h.replace(/registerSlide\(/, 'register(')],
  ])('fails naming the template when the %s is missing', (what, mutate) => {
    expect(() => renderTemplate(mutate(template('stepper')), 'stepper', 'T', 'c.css')).toThrow(
      new RegExp(`Template "stepper" must contain exactly one ${what.replace(/[()]/g, '\\$&')}`),
    );
  });
});

describe('createSlide', () => {
  it('copies the template, adds it to slides, and leaves IDs, classes, and scripts unchanged', async () => {
    const dir = deckDir({ output: 'out.html', slides: ['a.html'] }, { 'a.html': template('blank') });
    const res = createSlide({ cwd: dir, key: 'detail', template: 'cardGrid' });
    const out = fs.readFileSync(res.slidePath, 'utf8');
    expect(path.basename(res.slidePath)).toBe('detail.html');
    expect(out).toContain('<title>Detail</title>');
    expect(out).toContain("title: 'Detail',");
    expect(changedLines(template('cardGrid'), out)).toHaveLength(3);
    expect(readJson(path.join(dir, 'deck.json')).slides).toEqual(['a.html', 'detail.html']);
    await expect(assembleDeck(dir)).resolves.toBeTruthy();
  });

  it('uses --title for both titles', () => {
    const dir = deckDir({ output: 'out.html' });
    const out = fs.readFileSync(
      createSlide({ cwd: dir, key: 'detail', template: 'blank', title: 'Detail view' }).slidePath,
      'utf8',
    );
    expect(out).toContain('<title>Detail view</title>');
    expect(out).toContain("title: 'Detail view',");
  });

  it('links the contract relative to a deck outside the framework folder', () => {
    const root = tmp();
    const deck = path.join(root, 'work', 'decks', 'q3');
    fs.mkdirSync(deck, { recursive: true });
    fs.writeFileSync(path.join(deck, 'deck.json'), JSON.stringify({ version: 1, output: 'q3.html' }));
    const paths = { ...PATHS, contractCss: path.join(root, 'work', 'hptx', 'shell', 'contract', 'slide-contract.css') };
    const out = fs.readFileSync(createSlide({ cwd: deck, key: 'detail', template: 'blank', paths }).slidePath, 'utf8');
    expect(out).toContain('href="../../hptx/shell/contract/slide-contract.css"');
  });

  it('inserts after a slide', () => {
    const dir = deckDir({ output: 'o.html', slides: ['overview.html', 'process.html', 'closing.html'] });
    createSlide({ cwd: dir, key: 'detail', template: 'blank', after: 'process' });
    expect(readJson(path.join(dir, 'deck.json')).slides).toEqual([
      'overview.html',
      'process.html',
      'detail.html',
      'closing.html',
    ]);
  });

  it('adds catalog CDN dependencies once, keeping deck.json key order', () => {
    const dir = deckDir({ title: 'T', output: 'o.html', slides: [] });
    const first = createSlide({ cwd: dir, key: 'chartA', template: 'd3Chart' });
    const second = createSlide({ cwd: dir, key: 'chartB', template: 'd3Chart' });
    const cfg = readJson(path.join(dir, 'deck.json'));
    expect(first.addedCdn).toEqual([D3]);
    expect(second.addedCdn).toEqual([]);
    expect(cfg.scripts).toEqual([D3]);
    expect(Object.keys(cfg)).toEqual(['version', 'title', 'output', 'slides', 'scripts']);
  });

  it('leaves deck.json untouched when the deck discovers slides and nothing is added', () => {
    const dir = deckDir({ output: 'o.html' });
    const before = fs.readFileSync(path.join(dir, 'deck.json'), 'utf8');
    expect(createSlide({ cwd: dir, key: 'x', template: 'blank' }).listed).toBe(false);
    expect(fs.readFileSync(path.join(dir, 'deck.json'), 'utf8')).toBe(before);
  });

  it('writes HTML only when no deck file exists', () => {
    const dir = tmp();
    const res = createSlide({ cwd: dir, key: 'detail', template: 'blank' });
    expect(fs.existsSync(res.slidePath)).toBe(true);
    expect(fs.existsSync(path.join(dir, 'deck.json'))).toBe(false);
  });

  it.each([
    ['--after without a slides list', { output: 'o.html' }, { key: 'k', template: 'blank', after: 'process' }, /--after needs a "slides" list/],
    ['--after key not in slides', { output: 'o.html', slides: ['a.html'] }, { key: 'k', template: 'blank', after: 'process' }, /--after "process" is not in deck.json slides/],
    ['unknown template', { output: 'o.html' }, { key: 'k', template: 'timeline' }, /Unknown template "timeline" \(available: .*cardGrid.*\)/],
    ['invalid key', { output: 'o.html' }, { key: '../evil', template: 'blank' }, /Invalid slide key "..\/evil"/],
    ['reserved key', { output: 'o.html' }, { key: 'agenda', template: 'blank' }, /"agenda" is reserved/],
    ['output file', { output: 'deck.html' }, { key: 'deck', template: 'blank' }, /is the deck output file/],
    ['existing file', { output: 'o.html' }, { key: 'a', template: 'blank' }, /a\.html already exists/],
    ['already listed', { output: 'o.html', slides: ['k.html'] }, { key: 'k', template: 'blank' }, /already listed/],
  ])('fails without writing: %s', (_name, config, opts, msg) => {
    const dir = deckDir(config, { 'a.html': 'original' });
    const before = snapshot(dir);
    expect(() => createSlide({ cwd: dir, ...opts })).toThrow(msg);
    expect(snapshot(dir)).toEqual(before);
  });
});

describe('createDeck', () => {
  it('creates a deck that assembles with the cover on the home page and the overview slide', async () => {
    const dir = path.join(tmp(), 'demo');
    createDeck({ cwd: dir, title: 'Demo deck', output: './demo.html' });
    expect(readJson(path.join(dir, 'deck.json'))).toEqual({
      version: 1,
      title: 'Demo deck',
      output: './demo.html',
      cover: 'cover.html',
      slides: ['overview.html'],
    });
    const cover = fs.readFileSync(path.join(dir, 'cover.html'), 'utf8');
    expect(changedLines(template('cover'), cover)).toEqual([
      ['<title>Deck title</title>', '<title>Demo deck</title>'],
      [
        '<link rel="stylesheet" href="../shell/contract/slide-contract.css">',
        `<link rel="stylesheet" href="${path.relative(dir, PATHS.contractCss)}">`,
      ],
      ['<h1 class="title-main">Deck<br><span>title.</span></h1>', '<h1 class="title-main">Demo deck</h1>'],
    ]);
    const { html } = await assembleDeck(dir);
    expect(html).toContain('<title>Demo deck</title>');
    expect(html).not.toContain('data-slide="cover"');
    expect(html).toContain('data-slide="overview"');
    const home = html.slice(html.indexOf('data-slide="agenda"'), html.indexOf('data-slide="overview"'));
    expect(home).toContain('<h1 class="title-main">Demo deck</h1>');
    expect(home).toContain('id="tocGrid"');
  });

  it('omits unpassed optional fields', () => {
    const dir = path.join(tmp(), 'demo');
    createDeck({ cwd: dir });
    const cfg = readJson(path.join(dir, 'deck.json'));
    expect(cfg.version).toBe(1);
    expect(cfg.brand).toBeUndefined();
    expect(cfg.caption).toBeUndefined();
    expect(cfg.output).toBeUndefined();
    expect(cfg.title).toBeUndefined();
  });

  it('protects the cover from slide creation', () => {
    const dir = path.join(tmp(), 'demo');
    createDeck({ cwd: dir, output: './demo.html' });
    const before = snapshot(dir);
    expect(() => createSlide({ cwd: dir, key: 'cover', template: 'blank' })).toThrow(/"cover\.html" is the deck's cover/);
    expect(snapshot(dir)).toEqual(before);
  });

  it('refuses a non-empty folder and writes nothing', () => {
    const dir = tmp();
    fs.writeFileSync(path.join(dir, 'notes.txt'), 'x');
    expect(() => createDeck({ cwd: dir })).toThrow(/already exists and is not an empty folder/);
    expect(fs.readdirSync(dir)).toEqual(['notes.txt']);
  });
});

describe('runNew', () => {
  it('lists templates with descriptions', () => {
    const lines = runNew(['--list']);
    expect(lines.find((l) => l.startsWith('cardGrid'))).toContain(readCatalog().cardGrid.description);
    expect(lines).toHaveLength(Object.keys(readCatalog()).length);
  });

  it('resolves relative paths against the given working directory', () => {
    const cwd = tmp();
    expect(runNew(['deck', '--cwd', 'decks/demo', '--output', './demo.html', '--title', 'Demo'], cwd)[1]).toBe(
      `Preview: npx hptx dev --cwd ${path.join('decks', 'demo')}`,
    );
    runNew(['slide', '--cwd', 'decks/demo', '--key', 'detail', '--from', 'blank'], cwd);
    expect(fs.readdirSync(path.join(cwd, 'decks', 'demo')).sort()).toEqual([
      'cover.html',
      'deck.json',
      'detail.html',
      'overview.html',
    ]);
  });

  it('reports what it created', () => {
    const dir = deckDir({ output: 'o.html', slides: [] });
    expect(runNew(['slide', '--cwd', dir, '--key', 'chart', '--from', 'd3Chart'])).toEqual([
      `Created ${path.join(dir, 'chart.html')} from d3Chart`,
      'Added to deck.json slides',
      `Added ${D3} to deck.json`,
    ]);
  });
});
