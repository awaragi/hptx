import { JSDOM } from 'jsdom';
import { afterEach, describe, expect, it } from 'vitest';
import { assembleDeck } from '../index.ts';
import { makeDeckDir } from './helpers.ts';

interface SpeakTimerApi {
  isOn(): boolean;
  setMode(on: boolean): void;
  resetSlide(): void;
  useFakeNow(ms?: number): void;
  advanceMs(ms: number): void;
  snapshot(): { mode: boolean; live: string; locked: boolean };
  clock(): { kind: string; locked: boolean; warned60: boolean; warned30: boolean } | null;
}

interface DeckApi {
  currentKey(): string;
  goToKey(k: string): void;
}

type Popup = Window & { closed: boolean };

const slide = (title: string, body = '', extra = '') =>
  `<!doctype html><html><head><script>window.registerSlide({ title: ${JSON.stringify(title)}${extra} });</script></head>` +
  `<body><h1 class="slide-title">${title}</h1>${body}</body></html>`;

const DECK = {
  'deck.json': JSON.stringify({ output: 'o.html', slides: ['timed.html', 'free.html'] }),
  'timed.html': slide('Timed', '<aside class="notes"><p>A</p></aside>', ', estimatedMinutes: 2'),
  'free.html': slide('Free', '<aside class="notes"><p>B</p></aside>'),
};

const doms: JSDOM[] = [];
afterEach(() => {
  for (const d of doms.splice(0)) d.window.close();
});

async function boot(files: Record<string, string> = DECK) {
  const { html } = await assembleDeck(makeDeckDir(files), {});
  const errors: string[] = [];
  const popups: Record<string, Popup> = {};
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'http://localhost/',
    beforeParse(win) {
      const w = win as unknown as Record<string, unknown>;
      w.matchMedia ??= () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
      w.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
      win.Element.prototype.scrollIntoView ??= function () {};
      win.addEventListener('error', (e) => errors.push(String((e as ErrorEvent).message)));
      win.open = ((_url: string, name: string) => {
        const existing = popups[name];
        if (existing && !existing.closed) return existing;
        const pdom = new JSDOM('', { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/' });
        doms.push(pdom);
        const pw = pdom.window as unknown as Popup;
        let closed = false;
        Object.defineProperty(pw, 'closed', { get: () => closed, configurable: true });
        Object.defineProperty(pw, 'opener', { get: () => win, configurable: true });
        pw.close = () => { closed = true; };
        pw.focus = () => {};
        popups[name] = pw;
        return pw;
      }) as typeof win.open;
    },
  });
  doms.push(dom);
  const win = dom.window;
  const Deck = (win as unknown as { Deck: DeckApi }).Deck;
  const Timer = (win as unknown as { __hptxSpeakTimer: SpeakTimerApi }).__hptxSpeakTimer;
  const key = (k: string, init: KeyboardEventInit = {}) =>
    win.dispatchEvent(new win.KeyboardEvent('keydown', { key: k, bubbles: true, ...init }));
  const notes = () => popups['hptx-notes'];
  const text = (id: string) => notes()?.document.getElementById(id)?.textContent ?? '';
  const flash = () => win.document.getElementById('deckTimerFlash') as HTMLElement;
  return { win, Deck, Timer, key, notes, text, flash, errors, doc: win.document };
}

describe('speak timer', () => {
  it('toggles with S, persists, and clears on S off', async () => {
    const { Timer, key, Deck, flash, doc } = await boot();
    expect(Timer.isOn()).toBe(false);
    Deck.goToKey('timed');
    Timer.useFakeNow(0);
    key('s');
    expect(Timer.isOn()).toBe(true);
    expect(doc.defaultView!.localStorage.getItem('hptx-timer')).toBe('1');
    expect(flash().classList.contains('is-flash-start')).toBe(true);
    expect(Timer.snapshot().live).toBe('2:00');
    key('s');
    expect(Timer.isOn()).toBe(false);
    expect(doc.defaultView!.localStorage.getItem('hptx-timer')).toBeNull();
    expect(flash().classList.contains('is-flash-end')).toBe(true);
    expect(flash().classList.contains('is-locked')).toBe(false);
    expect(Timer.snapshot().live).toBe('');
  });

  it('counts down timed slides and counts up untimed slides without locking', async () => {
    const { Timer, Deck, flash } = await boot();
    Deck.goToKey('timed');
    Timer.useFakeNow(0);
    Timer.setMode(true);
    expect(Timer.clock()?.kind).toBe('countdown');
    Timer.advanceMs(30_000);
    expect(Timer.snapshot().live).toBe('1:30');
    Deck.goToKey('free');
    expect(Timer.clock()?.kind).toBe('countup');
    Timer.advanceMs(15_000);
    expect(Timer.snapshot().live).toBe('+0:15');
    expect(flash().classList.contains('is-locked')).toBe(false);
  });

  it('warns at 60s and 30s, locks with + overtime, and Shift+S resets', async () => {
    const { Timer, Deck, flash, key } = await boot();
    Deck.goToKey('timed');
    Timer.useFakeNow(0);
    Timer.setMode(true);
    Timer.advanceMs(60_000);
    expect(Timer.clock()?.warned60).toBe(true);
    expect(flash().classList.contains('is-flash-end')).toBe(true);
    expect(Timer.snapshot().live).toBe('1:00');
    Timer.advanceMs(30_000);
    expect(Timer.clock()?.warned30).toBe(true);
    expect(Timer.snapshot().live).toBe('0:30');
    Timer.advanceMs(30_000);
    expect(Timer.clock()?.locked).toBe(true);
    expect(flash().classList.contains('is-locked')).toBe(true);
    expect(Timer.snapshot().live).toBe('+0:00');
    Timer.advanceMs(15_000);
    expect(Timer.snapshot().live).toBe('+0:15');
    key('S', { shiftKey: true });
    expect(Timer.isOn()).toBe(true);
    expect(Timer.clock()?.locked).toBe(false);
    expect(flash().classList.contains('is-locked')).toBe(false);
    expect(Timer.snapshot().live).toBe('2:00');
  });

  it('shows live readout in notes and clears on home', async () => {
    const { Timer, Deck, key, text, flash } = await boot();
    key('n');
    Deck.goToKey('timed');
    Timer.useFakeNow(0);
    Timer.setMode(true);
    expect(text('nwLive')).toBe('2:00');
    expect(text('nwEst')).toBe('2 min');
    Deck.goToKey('agenda');
    expect(text('nwLive')).toBe('');
    expect(flash().classList.contains('is-locked')).toBe(false);
  });

  it('clears hptx-timer on Reset browser data', async () => {
    const { Timer, doc, win } = await boot();
    Timer.setMode(true);
    expect(doc.defaultView!.localStorage.getItem('hptx-timer')).toBe('1');
    win.confirm = () => true;
    const btn = doc.getElementById('tcEraseAllBtn') as HTMLButtonElement | null;
    expect(btn).not.toBeNull();
    btn!.click();
    expect(doc.defaultView!.localStorage.getItem('hptx-timer')).toBeNull();
    expect(Timer.isOn()).toBe(false);
  });
});
