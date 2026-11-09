import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { HelpDisplayedError, invocationDir, parseDeckArgs, resolveAgainst, resolveCliPath } from '../args.ts';

describe('parseDeckArgs', () => {
  const prev = process.env.INIT_CWD;

  afterEach(() => {
    if (prev === undefined) delete process.env.INIT_CWD;
    else process.env.INIT_CWD = prev;
  });

  it('parses --cwd and resolves other paths against the working root', () => {
    process.env.INIT_CWD = '/work';
    const args = parseDeckArgs([
      '--cwd',
      'decks/demo',
      '--slide',
      'a',
      '--slide',
      'b',
      '--output',
      'out/X.html',
      '--theme',
      './t.css',
      '--cover',
      'cover.html',
      '--title',
      'Q3',
      '--script',
      'https://cdn.example.com/a.js',
      '--script',
      'https://cdn.example.com/b.js',
    ]);
    const root = path.resolve('/work', 'decks/demo');
    expect(args).toEqual({
      cwd: root,
      slides: ['a', 'b'],
      outputPath: path.resolve(root, 'out/X.html'),
      theme: { kind: 'path', value: path.resolve(root, './t.css') },
      cover: path.resolve(root, 'cover.html'),
      title: 'Q3',
      scripts: ['https://cdn.example.com/a.js', 'https://cdn.example.com/b.js'],
    });
  });

  it('keeps absolute --output and --theme', () => {
    process.env.INIT_CWD = '/work';
    const args = parseDeckArgs([
      '--cwd',
      'decks/demo',
      '--output',
      '/tmp/Out.html',
      '--theme',
      '/themes/client.css',
    ]);
    expect(args.outputPath).toBe('/tmp/Out.html');
    expect(args.theme).toEqual({ kind: 'path', value: '/themes/client.css' });
  });

  it('resolves --deck against invocation and other paths against dirname(deck)', () => {
    process.env.INIT_CWD = '/work';
    const args = parseDeckArgs(['--deck', 'decks/demo/deck.json', '--output', './Out.html']);
    expect(args.deck).toBe(path.resolve('/work', 'decks/demo/deck.json'));
    expect(args.outputPath).toBe(path.resolve('/work', 'decks/demo', './Out.html'));
  });

  it('fails without --cwd or --deck', () => {
    expect(() => parseDeckArgs([])).toThrow(/--cwd|--deck/);
    expect(() => parseDeckArgs(['--slide', 'a'])).toThrow(/--cwd|--deck/);
  });

  it('rejects -o and --slides', () => {
    expect(() => parseDeckArgs(['--cwd', 'd', '-o', 'x.html'])).toThrow(/unknown option/i);
    expect(() => parseDeckArgs(['--cwd', 'd', '--slides', 'a,b'])).toThrow(/unknown option/i);
  });

  it('accepts https theme URLs', () => {
    const args = parseDeckArgs(['--cwd', 'd', '--theme', 'https://example.com/t.css']);
    expect(args.theme).toEqual({ kind: 'url', value: 'https://example.com/t.css' });
  });

  it('rejects http theme and unknown options', () => {
    expect(() => parseDeckArgs(['--cwd', 'd', '--theme', 'http://example.com/t.css'])).toThrow(/https/);
    expect(() => parseDeckArgs(['--cwd', 'd', '--bogus'])).toThrow(/unknown option/i);
  });

  it('surfaces help as HelpDisplayedError', () => {
    expect(() => parseDeckArgs(['--help'])).toThrow(HelpDisplayedError);
  });
});

describe('resolveAgainst', () => {
  it('resolves relative paths and keeps absolute ones', () => {
    expect(resolveAgainst('/root', 'rel')).toBe(path.resolve('/root', 'rel'));
    expect(resolveAgainst('/root', '/abs')).toBe('/abs');
  });
});

describe('resolveCliPath', () => {
  it('resolves against invocationDir', () => {
    process.env.INIT_CWD = '/work';
    expect(resolveCliPath('rel')).toBe(path.resolve('/work', 'rel'));
    expect(invocationDir()).toBe('/work');
  });
});
