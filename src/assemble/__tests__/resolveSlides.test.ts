import { describe, expect, it } from 'vitest';
import { loadDeckConfig } from '../loadDeckConfig.ts';
import { filterSlides, resolveSlideList } from '../resolveSlides.ts';
import { makeDeckDir, slideDoc } from './helpers.ts';

function deckWith(config: object, files: Record<string, string>) {
  const dir = makeDeckDir({ 'deck.json': JSON.stringify(config), ...files });
  return loadDeckConfig(dir);
}

describe('resolveSlideList', () => {
  it('discovers *.html sorted and skips the output file', () => {
    const deck = deckWith(
      { output: './Deck.html' },
      { 'b.html': slideDoc(), 'a.html': slideDoc(), 'Deck.html': '<html>built</html>' },
    );
    expect(resolveSlideList(deck).map((s) => s.key)).toEqual(['a', 'b']);
  });

  it('uses the explicit slides list in order', () => {
    const deck = deckWith(
      { output: 'o.html', slides: ['z.html', 'a.html'] },
      { 'a.html': slideDoc(), 'z.html': slideDoc() },
    );
    expect(resolveSlideList(deck).map((s) => s.key)).toEqual(['z', 'a']);
  });

  it('fails discovery on a stray HTML file, naming it', () => {
    const deck = deckWith({ output: 'o.html' }, { 'a.html': slideDoc(), 'notes.html': '<html><body>n</body></html>' });
    expect(() => resolveSlideList(deck)).toThrow(/notes\.html/);
  });

  it('fails on duplicate stems naming both files', () => {
    const deck = deckWith(
      { output: 'o.html', slides: ['a/metrics.html', 'b/metrics.html'] },
      { 'a/metrics.html': slideDoc(), 'b/metrics.html': slideDoc() },
    );
    expect(() => resolveSlideList(deck)).toThrow(/a\/metrics\.html.*b\/metrics\.html/);
  });

  it('skips the cover during discovery, even when it is not a valid slide', () => {
    const cover = '<!doctype html><html><head></head><body><h1>Cover</h1></body></html>';
    const deck = deckWith({ output: 'o.html', cover: './cover.html' }, { 'cover.html': cover, 'metrics.html': slideDoc() });
    expect(resolveSlideList(deck).map((s) => s.key)).toEqual(['metrics']);
  });

  it('fails when the cover is listed in slides', () => {
    const deck = deckWith(
      { output: 'o.html', cover: 'cover.html', slides: ['cover.html', 'metrics.html'] },
      { 'cover.html': slideDoc(), 'metrics.html': slideDoc() },
    );
    expect(() => resolveSlideList(deck)).toThrow(/"cover\.html" is the deck cover and must not be listed in "slides"/);
  });

  it('fails when the cover file is missing', () => {
    const deck = deckWith({ output: 'o.html', cover: './missing.html' }, { 'metrics.html': slideDoc() });
    expect(() => resolveSlideList(deck)).toThrow(/Cover file not found:.*missing\.html/);
  });

  it('fails on reserved key agenda', () => {
    const deck = deckWith({ output: 'o.html' }, { 'agenda.html': slideDoc() });
    expect(() => resolveSlideList(deck)).toThrow(/agenda.*reserved/);
  });
});

describe('filterSlides', () => {
  const deck = deckWith(
    { output: 'o.html' },
    { 'overview.html': slideDoc(), 'metrics.html': slideDoc(), 'closing.html': slideDoc() },
  );
  const all = resolveSlideList(deck);

  it('follows CLI order and accepts keys or filenames', () => {
    expect(filterSlides(all, ['closing', 'overview.html']).map((s) => s.key)).toEqual(['closing', 'overview']);
  });

  it('fails on unknown entries', () => {
    expect(() => filterSlides(all, ['nope'])).toThrow(/Unknown slide "nope"/);
  });

  it('fails on duplicate entries', () => {
    expect(() => filterSlides(all, ['metrics', 'metrics.html'])).toThrow(/Duplicate slide/);
  });
});
