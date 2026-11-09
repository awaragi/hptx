import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import { assembleDeck } from '../index.ts';
import { makeDeckDir } from './helpers.ts';

interface DeckApi {
  currentKey(): string;
  goToKey(k: string): void;
  setStep(k: string, i: number): void;
  moveStep(delta: number): boolean;
  stepIndex(key: string): number | undefined;
}

const stepped = (title: string, count: number, landing = 0) =>
  `<!doctype html><html><head><script>
window.registerSlide({
  title: ${JSON.stringify(title)},
  stepCount: ${count},
  landingStep: ${landing},
  setStep: function () {}
});
</script></head><body><h1 class="slide-title">${title}</h1></body></html>`;

async function boot(url: string, files: Record<string, string>) {
  const { html } = await assembleDeck(makeDeckDir(files));
  const errors: string[] = [];
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url,
    beforeParse(win) {
      const w = win as unknown as Record<string, unknown>;
      w.matchMedia ??= () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
      w.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
      win.Element.prototype.scrollIntoView ??= function () {};
      win.addEventListener('error', (e) => errors.push(String((e as ErrorEvent).message)));
      const origError = win.console.error.bind(win.console);
      win.console.error = (...args: unknown[]) => { errors.push(args.map(String).join(' ')); origError(...args); };
    },
  });
  const Deck = (dom.window as unknown as { Deck: DeckApi }).Deck;
  const search = () => dom.window.location.search;
  return { dom, Deck, search, errors };
}

const DECK = {
  'deck.json': JSON.stringify({ output: 'o.html', slides: ['alpha.html', 'beta.html'] }),
  'alpha.html': stepped('Alpha', 4),
  'beta.html': stepped('Beta', 3, 1),
};

describe('URL slide + step sync (jsdom)', () => {
  it('writes step while scrubbing and omits it at 0', async () => {
    const { Deck, search, errors, dom } = await boot('http://localhost/', DECK);
    expect(errors).toEqual([]);
    Deck.goToKey('alpha');
    expect(search()).toBe('?slide=alpha');
    Deck.setStep('alpha', 2);
    expect(search()).toBe('?slide=alpha&step=2');
    expect(Deck.moveStep(1)).toBe(true);
    expect(search()).toBe('?slide=alpha&step=3');
    Deck.setStep('alpha', 0);
    expect(search()).toBe('?slide=alpha');
    dom.window.close();
  });

  it('restores slide and step from the query on load', async () => {
    const { Deck, search, errors, dom } = await boot('http://localhost/?slide=alpha&step=2', DECK);
    expect(errors).toEqual([]);
    expect(Deck.currentKey()).toBe('alpha');
    expect(Deck.stepIndex('alpha')).toBe(2);
    expect(search()).toBe('?slide=alpha&step=2');
    dom.window.close();
  });

  it('treats ?slide= without step as step 0 (not landingStep)', async () => {
    const { Deck, errors, dom } = await boot('http://localhost/?slide=beta', DECK);
    expect(errors).toEqual([]);
    expect(Deck.currentKey()).toBe('beta');
    expect(Deck.stepIndex('beta')).toBe(0);
    dom.window.close();
  });

  it('clamps an out-of-range step on load', async () => {
    const { Deck, errors, dom } = await boot('http://localhost/?slide=alpha&step=99', DECK);
    expect(errors).toEqual([]);
    expect(Deck.currentKey()).toBe('alpha');
    expect(Deck.stepIndex('alpha')).toBe(3);
    dom.window.close();
  });

  it('on cross-slide jump uses landing, not the previous URL step', async () => {
    const { Deck, search, errors, dom } = await boot('http://localhost/?slide=alpha&step=2', DECK);
    expect(errors).toEqual([]);
    expect(Deck.stepIndex('alpha')).toBe(2);
    Deck.goToKey('beta');
    expect(Deck.currentKey()).toBe('beta');
    expect(Deck.stepIndex('beta')).toBe(1);
    expect(search()).toBe('?slide=beta&step=1');
    dom.window.close();
  });

  it('clears slide and step on home', async () => {
    const { Deck, search, errors, dom } = await boot('http://localhost/?slide=alpha&step=2', DECK);
    expect(errors).toEqual([]);
    Deck.goToKey('agenda');
    expect(search()).toBe('');
    dom.window.close();
  });
});
