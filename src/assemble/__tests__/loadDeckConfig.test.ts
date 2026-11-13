import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadDeckConfig, resolveDeckInvocation, validateDeckConfig } from '../loadDeckConfig.ts';
import { makeDeckDir, withVersion } from './helpers.ts';

const load = (cfg: unknown) => loadDeckConfig(makeDeckDir({ 'deck.json': JSON.stringify(cfg) }));

describe('loadDeckConfig', () => {
  it('loads a minimal valid config and resolves output against deck root', () => {
    const dir = makeDeckDir({ 'deck.json': JSON.stringify(withVersion({ output: './Deck.html' })) });
    const deck = loadDeckConfig(dir);
    expect(deck.outputPath).toBe(path.join(dir, 'Deck.html'));
    expect(deck.theme).toBeUndefined();
    expect(deck.config.version).toBe(1);
    expect(deck.config.title).toBe('Deck');
    expect(deck.slug).toBe('deck');
  });

  it('fails when version is missing', () => {
    const dir = makeDeckDir({});
    fsWriteRaw(dir, { output: 'a.html' });
    expect(() => loadDeckConfig(dir)).toThrow(/"version" is required/);
  });

  it('fails when version is unsupported', () => {
    expect(() => load(withVersion({ version: 99, output: 'a.html' }))).toThrow(/not supported/);
  });

  it('allows file without output', () => {
    const deck = load(withVersion({ title: 'x' }));
    expect(deck.outputPath).toBeUndefined();
    expect(deck.config.title).toBe('x');
    expect(deck.slug).toBe('x');
    expect(deck.titleFromFile).toBe('x');
  });

  it('rejects empty title and derives title from output stem', () => {
    expect(() => load(withVersion({ output: 'a.html', title: '  ' }))).toThrow(/"title" must be a non-empty string/);
    const deck = load(withVersion({ output: './dist/Q3-Review.html' }));
    expect(deck.config.title).toBe('Q3-Review');
    expect(deck.slug).toBe('q3-review');
  });

  it('rejects unknown fields naming the field', () => {
    expect(() => load(withVersion({ output: 'a.html', script: ['https://cdn.example.com/x.js'] }))).toThrow(
      /unknown field "script"/,
    );
  });

  it('rejects relative script paths', () => {
    expect(() => load(withVersion({ output: 'a.html', scripts: ['./vendor/d3.min.js'] }))).toThrow(
      /scripts must be https:\/\/ CDN URLs/,
    );
  });

  it('rejects relative style paths', () => {
    expect(() => load(withVersion({ output: 'a.html', styles: ['./extra.css'] }))).toThrow(
      /styles must be https:\/\/ CDN URLs/,
    );
  });

  it('rejects http script URLs', () => {
    expect(() => load(withVersion({ output: 'a.html', scripts: ['http://cdn.example.com/lib.js'] }))).toThrow(
      /scripts must be https:\/\/ CDN URLs/,
    );
  });

  it('accepts SRI object entries', () => {
    const deck = load(
      withVersion({
        output: 'a.html',
        scripts: [{ src: 'https://cdn.example.com/lib.js', integrity: 'sha384-abc', crossorigin: 'anonymous' }],
      }),
    );
    expect(deck.config.scripts).toEqual([
      { src: 'https://cdn.example.com/lib.js', integrity: 'sha384-abc', crossorigin: 'anonymous' },
    ]);
  });

  it('rejects unknown keys in CDN objects', () => {
    expect(() =>
      load(withVersion({ output: 'a.html', scripts: [{ src: 'https://cdn.example.com/x.js', async: true }] })),
    ).toThrow(/unknown key "async"/);
  });

  it('accepts https theme URL and rejects http theme', () => {
    const deck = load(withVersion({ output: 'a.html', theme: 'https://example.com/theme.css' }));
    expect(deck.theme).toEqual({ kind: 'url', value: 'https://example.com/theme.css' });
    expect(() => load(withVersion({ output: 'a.html', theme: 'http://example.com/theme.css' }))).toThrow(
      /remote themes must use https/,
    );
  });

  it('resolves cover against the deck root as absolute paths in config', () => {
    const dir = makeDeckDir({
      'deck.json': JSON.stringify(withVersion({ output: 'a.html', cover: './cover.html' })),
    });
    const deck = loadDeckConfig(dir);
    expect(deck.config.cover).toBe(path.join(dir, 'cover.html'));
    expect(deck.coverPath).toBe(path.join(dir, 'cover.html'));
    expect(deck.config.output).toBe(path.join(dir, 'a.html'));
    expect(load(withVersion({ output: 'a.html' })).coverPath).toBeUndefined();
  });

  it('absolutizes slides and local theme in the effective config', () => {
    const dir = makeDeckDir({
      'deck.json': JSON.stringify(
        withVersion({ output: './Out.html', theme: './t.css', slides: ['a.html', 'b.html'] }),
      ),
    });
    const deck = loadDeckConfig(dir);
    expect(deck.config.slides).toEqual([path.join(dir, 'a.html'), path.join(dir, 'b.html')]);
    expect(deck.config.theme).toBe(path.join(dir, 't.css'));
    expect(deck.theme).toEqual({ kind: 'path', value: path.join(dir, 't.css') });
  });

  it('rejects a non-HTML or empty cover', () => {
    expect(() => load(withVersion({ output: 'a.html', cover: './cover.md' }))).toThrow(
      /cover "\.\/cover\.md" must be an \.html file/,
    );
    expect(() => load(withVersion({ output: 'a.html', cover: '' }))).toThrow(/"cover" must be a non-empty string/);
  });

  it('rejects a cover that is the output file', () => {
    expect(() => load(withVersion({ output: './Deck.html', cover: 'Deck.html' }))).toThrow(
      /is the deck output file/,
    );
  });

  it('resolves a relative theme path against the deck root', () => {
    const dir = makeDeckDir({
      'deck.json': JSON.stringify(withVersion({ output: 'a.html', theme: './client.css' })),
    });
    expect(loadDeckConfig(dir).theme).toEqual({ kind: 'path', value: path.join(dir, 'client.css') });
  });

  it('accepts brand and caption and rejects empty values', () => {
    const deck = load(withVersion({ output: 'a.html', brand: 'Acme.', caption: 'Demo' }));
    expect(deck.config.brand).toBe('Acme.');
    expect(deck.config.caption).toBe('Demo');
    expect(() => load(withVersion({ output: 'a.html', brand: '  ' }))).toThrow(/"brand" must be a non-empty string/);
    expect(() => load(withVersion({ output: 'a.html', caption: '' }))).toThrow(/"caption" must be a non-empty string/);
  });
});

describe('resolveDeckInvocation', () => {
  it('requires cwd or deck', () => {
    expect(() => resolveDeckInvocation({ baseDir: '/work' })).toThrow(/--cwd|--deck/);
  });

  it('uses dirname(--deck) as root and merges CLI title over file', () => {
    const dir = makeDeckDir({
      'deck.json': JSON.stringify(withVersion({ output: './Out.html', title: 'File' })),
    });
    const deck = resolveDeckInvocation({
      deck: path.join(dir, 'deck.json'),
      baseDir: '/work',
      overrides: { title: 'CLI' },
    });
    expect(deck.root).toBe(dir);
    expect(deck.config.title).toBe('CLI');
    expect(deck.outputPath).toBe(path.join(dir, 'Out.html'));
  });

  it('allows pure CLI with no file when output is supplied', () => {
    const dir = makeDeckDir({ 'a.html': '<html></html>' });
    const deck = resolveDeckInvocation({
      cwd: dir,
      baseDir: '/',
      overrides: { outputPath: path.join(dir, 'Out.html'), title: 'Pure' },
      requireOutput: true,
    });
    expect(deck.configPath).toBeUndefined();
    expect(deck.config.title).toBe('Pure');
    expect(deck.slug).toBe('pure');
    expect(deck.outputPath).toBe(path.join(dir, 'Out.html'));
  });

  it('derives title from CLI output stem when title omitted', () => {
    const dir = makeDeckDir({ 'a.html': '<html></html>' });
    const deck = resolveDeckInvocation({
      cwd: dir,
      baseDir: '/',
      overrides: { outputPath: path.join(dir, 'Demo.html') },
    });
    expect(deck.config.title).toBe('Demo');
    expect(deck.slug).toBe('demo');
  });

  it('derives title from cwd basename when title and output omitted', () => {
    const parent = makeDeckDir({});
    const dir = path.join(parent, 'about');
    fs.mkdirSync(dir);
    const deck = resolveDeckInvocation({ cwd: dir, baseDir: '/' });
    expect(deck.config.title).toBe('about');
    expect(deck.slug).toBe('about');
  });

  it('fails build merge when output missing', () => {
    const dir = makeDeckDir({ 'deck.json': JSON.stringify(withVersion({ title: 'T' })) });
    expect(() =>
      resolveDeckInvocation({ cwd: dir, baseDir: '/', requireOutput: true }),
    ).toThrow(/"output" is required/);
  });
});

describe('validateDeckConfig', () => {
  it('requires integer version 1', () => {
    expect(() => validateDeckConfig({ output: 'a.html' })).toThrow(/version/);
    expect(validateDeckConfig({ version: 1, output: 'a.html' }).version).toBe(1);
  });
});

function fsWriteRaw(dir: string, cfg: Record<string, unknown>): void {
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify(cfg));
}
