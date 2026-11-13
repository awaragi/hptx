import { JSDOM } from 'jsdom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { assembleDeck } from '../index.ts';
import { makeDeckDir } from './helpers.ts';

interface DeckApi {
  manifest: string[];
  currentKey(): string;
  goToKey(k: string): void;
}

const slide = (title: string) =>
  `<!doctype html><html><head><script>window.registerSlide({ title: ${JSON.stringify(title)} });</script></head>` +
  `<body><h1 class="slide-title">${title}</h1></body></html>`;

function deckFiles(n: number): Record<string, string> {
  const slides: string[] = [];
  const files: Record<string, string> = {};
  for (let i = 1; i <= n; i++) {
    const name = `s${i}.html`;
    slides.push(name);
    files[name] = slide(`Slide ${i}`);
  }
  files['deck.json'] = JSON.stringify({ output: 'o.html', slides });
  return files;
}

const doms: JSDOM[] = [];
afterEach(() => {
  vi.useRealTimers();
  for (const d of doms.splice(0)) d.window.close();
});

async function boot(files: Record<string, string>, opts: { stored?: Record<string, string> } = {}) {
  const { html } = await assembleDeck(makeDeckDir(files), {});
  const errors: string[] = [];
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'http://localhost/',
    beforeParse(win) {
      const w = win as unknown as Record<string, unknown>;
      w.matchMedia ??= () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
      w.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
      win.Element.prototype.scrollIntoView ??= function () {};
      for (const [k, v] of Object.entries(opts.stored ?? {})) win.localStorage.setItem(k, v);
      win.addEventListener('error', (e) => errors.push(String((e as ErrorEvent).message)));
    },
  });
  doms.push(dom);
  const win = dom.window;
  const Deck = (win as unknown as { Deck: DeckApi }).Deck;
  const doc = win.document;
  const key = (k: string, init: KeyboardEventInit = {}) =>
    win.dispatchEvent(new win.KeyboardEvent('keydown', { key: k, bubbles: true, ...init }));
  const candidateIndexes = () =>
    [...doc.querySelectorAll('#navDots button')].flatMap((btn, idx) =>
      btn.classList.contains('digit-nav-candidate') ? [idx] : [],
    );
  const digitNavActive = () => doc.getElementById('navDots')?.classList.contains('digit-nav-active') ?? false;
  const hintText = () =>
    [...doc.querySelectorAll('.title-kbd-hint')].map((el) => el.textContent?.replace(/\s+/g, ' ').trim() ?? '');
  return { win, Deck, doc, key, candidateIndexes, digitNavActive, hintText, errors };
}

describe('digit slide navigation', () => {
  it('documents digit jump under Settings → Help, not on the home hint list', async () => {
    const { hintText, doc, key, errors } = await boot(deckFiles(3));
    expect(errors).toEqual([]);
    expect(hintText().some((t) => t.includes('0–9'))).toBe(false);
    expect(hintText().some((t) => t.includes('?'))).toBe(true);
    key('?');
    expect(doc.getElementById('tcPanelHelp')?.textContent).toMatch(/0–9/);
  });

  it('jumps to slide 1 after idle on digit 1', async () => {
    vi.useFakeTimers();
    const { Deck, key } = await boot(deckFiles(12));
    expect(Deck.currentKey()).toBe('agenda');
    key('1');
    expect(Deck.currentKey()).toBe('agenda');
    await vi.advanceTimersByTimeAsync(2000);
    expect(Deck.currentKey()).toBe('s1');
  });

  it('jumps to slide 12 when 1 then 2 are typed quickly', async () => {
    vi.useFakeTimers();
    const { Deck, key } = await boot(deckFiles(12));
    key('1');
    key('2');
    expect(Deck.currentKey()).toBe('s12');
  });

  it('jumps home on 0 after idle', async () => {
    vi.useFakeTimers();
    const { Deck, key } = await boot(deckFiles(5));
    Deck.goToKey('s3');
    key('0');
    await vi.advanceTimersByTimeAsync(2000);
    expect(Deck.currentKey()).toBe('agenda');
  });

  it('commits leading-zero pad without waiting (05 → slide 5)', async () => {
    vi.useFakeTimers();
    const { Deck, key, digitNavActive } = await boot(deckFiles(12));
    key('0');
    expect(digitNavActive()).toBe(true);
    key('5');
    expect(Deck.currentKey()).toBe('s5');
    expect(digitNavActive()).toBe(false);
  });

  it('highlights 0–9 candidates after pressing 0, then narrows on 5', async () => {
    vi.useFakeTimers();
    const { key, candidateIndexes, digitNavActive } = await boot(deckFiles(12));
    key('0');
    expect(digitNavActive()).toBe(true);
    expect(candidateIndexes()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    key('5');
    expect(digitNavActive()).toBe(false);
  });

  it('confirms the buffer with Enter', async () => {
    vi.useFakeTimers();
    const { Deck, key, digitNavActive } = await boot(deckFiles(12));
    key('1');
    expect(digitNavActive()).toBe(true);
    key('Enter');
    expect(Deck.currentKey()).toBe('s1');
    expect(digitNavActive()).toBe(false);
  });

  it('cancels on Escape without navigating', async () => {
    vi.useFakeTimers();
    const { Deck, key, digitNavActive } = await boot(deckFiles(12));
    Deck.goToKey('s2');
    key('1');
    expect(digitNavActive()).toBe(true);
    key('Escape');
    expect(digitNavActive()).toBe(false);
    expect(Deck.currentKey()).toBe('s2');
    await vi.advanceTimersByTimeAsync(2000);
    expect(Deck.currentKey()).toBe('s2');
  });

  it('clears an out-of-range buffer without navigating', async () => {
    vi.useFakeTimers();
    const { Deck, key, digitNavActive } = await boot(deckFiles(5));
    Deck.goToKey('s1');
    key('9');
    expect(digitNavActive()).toBe(false);
    expect(Deck.currentKey()).toBe('s1');
  });

  it('skips hidden slides in digit numbering', async () => {
    vi.useFakeTimers();
    const { Deck, key } = await boot(deckFiles(4), { stored: { 'hptx/o/hidden-slides': '["s2"]' } });
    key('2');
    key('Enter');
    expect(Deck.currentKey()).toBe('s3');
  });
});
