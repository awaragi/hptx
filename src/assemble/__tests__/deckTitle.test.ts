import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveDeckTitle, slugifyTitle } from '../deckTitle.ts';

describe('slugifyTitle', () => {
  it('lowercases and hyphenates spaced titles', () => {
    expect(slugifyTitle('Q3 Review')).toBe('q3-review');
    expect(slugifyTitle('  Demo Deck  ')).toBe('demo-deck');
  });

  it('collapses punctuation and repeats', () => {
    expect(slugifyTitle('Acme. / Demo!!')).toBe('acme-demo');
    expect(slugifyTitle('a---b')).toBe('a-b');
  });

  it('returns empty for titles with no alphanumeric characters', () => {
    expect(slugifyTitle('!!!')).toBe('');
    expect(slugifyTitle('🎯')).toBe('');
  });
});

describe('resolveDeckTitle', () => {
  const root = path.join('/decks', 'about');

  it('prefers CLI title over file and output', () => {
    expect(
      resolveDeckTitle({
        cliTitle: 'From CLI',
        fileTitle: 'From file',
        outputPath: '/decks/about/Out.html',
        root,
      }),
    ).toEqual({ title: 'From CLI', slug: 'from-cli' });
  });

  it('uses file title when CLI omitted', () => {
    expect(
      resolveDeckTitle({
        fileTitle: 'Team Kickoff',
        outputPath: '/x/Out.html',
        root,
      }),
    ).toEqual({ title: 'Team Kickoff', slug: 'team-kickoff' });
  });

  it('uses output stem when title omitted', () => {
    expect(resolveDeckTitle({ outputPath: '/repo/dist/Q3-Review.html', root })).toEqual({
      title: 'Q3-Review',
      slug: 'q3-review',
    });
  });

  it('uses working-root basename when title and output omitted', () => {
    expect(resolveDeckTitle({ root })).toEqual({ title: 'about', slug: 'about' });
  });

  it('trims and rejects empty explicit titles', () => {
    expect(() => resolveDeckTitle({ cliTitle: '  ', root })).toThrow(/"title" must be a non-empty string/);
    expect(() => resolveDeckTitle({ fileTitle: '', root })).toThrow(/"title" must be a non-empty string/);
  });

  it('rejects titles that cannot slugify', () => {
    expect(() => resolveDeckTitle({ cliTitle: '!!!', root })).toThrow(/non-empty slug/);
  });
});
