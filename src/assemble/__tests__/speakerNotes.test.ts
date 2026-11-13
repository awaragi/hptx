import { JSDOM } from 'jsdom';
import { afterEach, describe, expect, it } from 'vitest';
import { assembleDeck } from '../index.ts';
import { makeDeckDir } from './helpers.ts';

interface DeckApi {
  currentKey(): string;
  goTo(i: number): void;
  goToKey(k: string): void;
  setStep(k: string, i: number): void;
}

type Popup = Window & { closed: boolean };

const slide = (title: string, body = '', extra = '') =>
  `<!doctype html><html><head><script>window.registerSlide({ title: ${JSON.stringify(title)}${extra} });</script></head>` +
  `<body><h1 class="slide-title">${title}</h1>${body}</body></html>`;

const STEPS = ', stepCount: 3, setStep(){}';

const DECK = {
  'deck.json': JSON.stringify({ output: 'o.html', slides: ['overview.html', 'process.html', 'closing.html'] }),
  'overview.html': slide(
    'Overview',
    '<aside class="notes"><p>Open with the <b>goal</b>.</p></aside><p>Body</p>' +
      '<aside class="notes"><p style="color: var(--brand)">Second note.</p></aside>',
  ),
  'process.html': slide('Process', '<aside class="notes"><p>Walk the steps.</p></aside>', STEPS),
  'closing.html': slide('Closing'),
};

const doms: JSDOM[] = [];
afterEach(() => {
  for (const d of doms.splice(0)) d.window.close();
});

async function boot(files: Record<string, string>) {
  const { html } = await assembleDeck(makeDeckDir(files), {});
  const errors: string[] = [];
  const popups: Record<string, Popup> = {};
  let opened = 0;
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
      const origError = win.console.error.bind(win.console);
      win.console.error = (...args: unknown[]) => { errors.push(args.map(String).join(' ')); origError(...args); };
      win.open = ((_url: string, name: string) => {
        const existing = popups[name];
        if (existing && !existing.closed) return existing;
        const pdom = new JSDOM('', { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/' });
        doms.push(pdom);
        const pw = pdom.window as unknown as Popup;
        let closed = false;
        Object.defineProperty(pw, 'closed', { get: () => closed, configurable: true });
        Object.defineProperty(pw, 'opener', { get: () => (deckClosed ? { closed: true } : win), configurable: true });
        pw.close = () => { closed = true; };
        pw.focus = () => {};
        popups[name] = pw;
        opened++;
        return pw;
      }) as typeof win.open;
    },
  });
  doms.push(dom);
  let deckClosed = false;
  const win = dom.window;
  const Deck = (win as unknown as { Deck: DeckApi }).Deck;
  const key = (k: string, init: KeyboardEventInit = {}) =>
    win.dispatchEvent(new win.KeyboardEvent('keydown', { key: k, bubbles: true, ...init }));
  const notes = () => popups['hptx-notes'];
  const nd = () => notes().document;
  const notesKey = (k: string, init: KeyboardEventInit = {}) =>
    nd().dispatchEvent(new (notes() as unknown as typeof win).KeyboardEvent('keydown', { key: k, bubbles: true, ...init }));
  const click = (act: string) => (nd().querySelector(`button[data-act="${act}"]`) as HTMLButtonElement).click();
  const btn = (act: string) => nd().querySelector(`button[data-act="${act}"]`) as HTMLButtonElement;
  const text = (id: string) => nd().getElementById(id)?.textContent ?? '';
  return {
    dom, doc: win.document, Deck, key, notes, nd, notesKey, click, btn, text, errors,
    opened: () => opened,
    closeDeck: () => { deckClosed = true; },
  };
}

describe('speaker notes on the canvas', () => {
  it('keeps notes asides in the slide markup and hides them with shell CSS', async () => {
    const { doc, errors } = await boot(DECK);
    expect(errors).toEqual([]);
    const aside = doc.querySelector('[data-slide="overview"] aside.notes') as HTMLElement;
    expect(aside).not.toBeNull();
    expect(doc.defaultView!.getComputedStyle(aside).display).toBe('none');
  });

  it('documents N under Settings → Help, not on the home hint list', async () => {
    const { doc, key } = await boot(DECK);
    const keys = [...doc.querySelectorAll('[data-slide="agenda"] .title-kbd-hint .key')].map((e) => e.textContent);
    expect(keys).not.toContain('N');
    expect(keys).toContain('?');
    key('?');
    const helpKeys = [...doc.querySelectorAll('#tcPanelHelp .tc-help-row .key')].map((e) => e.textContent);
    expect(helpKeys).toContain('N');
  });
});

describe('speaker notes window (jsdom)', () => {
  it('opens on N, reuses the window on a second N, and closes on ⇧N', async () => {
    const { key, notes, opened } = await boot(DECK);
    key('n');
    expect(opened()).toBe(1);
    expect(notes().closed).toBe(false);
    key('n');
    expect(opened()).toBe(1);
    key('N', { shiftKey: true });
    expect(notes().closed).toBe(true);
    key('N', { shiftKey: true });
    expect(notes().closed).toBe(true);
  });

  it('shows Home and the placeholder on the home page, then the slide notes in order', async () => {
    const { key, Deck, nd, text } = await boot(DECK);
    key('n');
    expect(text('nwTitle')).toBe('Home');
    expect(text('nwNotes')).toBe('No notes');
    Deck.goToKey('overview');
    expect(text('nwTitle')).toBe('Overview');
    expect(text('nwSlidePos')).toBe('Slide 1 / 3');
    const blocks = [...nd().querySelectorAll('#nwNotes .notes-block')].map((e) => e.textContent);
    expect(blocks).toEqual(['Open with the goal.', 'Second note.']);
    expect(nd().querySelector('#nwNotes b')?.textContent).toBe('goal');
    expect((nd().querySelector('#nwNotes p[style]') as HTMLElement).getAttribute('style')).toContain('var(--brand)');
    Deck.goToKey('closing');
    expect(text('nwNotes')).toBe('No notes');
  });

  it('shows a static estimated-minutes label and clears it when absent or on home', async () => {
    const files = {
      'deck.json': JSON.stringify({ output: 'o.html', slides: ['overview.html', 'process.html', 'closing.html'] }),
      'overview.html': slide('Overview', '<aside class="notes"><p>A</p></aside>', ', estimatedMinutes: 3'),
      'process.html': slide('Process', '<aside class="notes"><p>B</p></aside>', ', estimatedMinutes: 5' + STEPS),
      'closing.html': slide('Closing', '', ', estimatedMinutes: 0'),
    };
    const { key, Deck, text } = await boot(files);
    key('n');
    expect(text('nwEst')).toBe('');
    Deck.goToKey('overview');
    expect(text('nwEst')).toBe('3 min');
    Deck.goToKey('process');
    expect(text('nwEst')).toBe('5 min');
    Deck.goToKey('closing');
    expect(text('nwEst')).toBe('');
    Deck.goToKey('agenda');
    expect(text('nwEst')).toBe('');
  });

  it('shows and updates the step position', async () => {
    const { key, Deck, text, btn } = await boot(DECK);
    key('n');
    Deck.goToKey('process');
    expect(text('nwStepPos')).toBe('Step 1 / 3');
    expect(btn('prevStep').disabled).toBe(true);
    Deck.setStep('process', 1);
    expect(text('nwStepPos')).toBe('Step 2 / 3');
    expect(btn('prevStep').disabled).toBe(false);
    Deck.setStep('process', 2);
    expect(btn('nextStep').disabled).toBe(true);
  });

  it('forwards keys from the notes window to the deck', async () => {
    const { key, Deck, notesKey, text, doc } = await boot(DECK);
    key('n');
    notesKey('ArrowDown');
    expect(Deck.currentKey()).toBe('overview');
    expect(text('nwTitle')).toBe('Overview');
    notesKey('h');
    expect(Deck.currentKey()).toBe('overview');
    notesKey('?');
    expect(doc.getElementById('themeCustomizer')?.classList.contains('open')).toBe(true);
    expect(doc.getElementById('tcTabHelp')?.getAttribute('aria-selected')).toBe('true');
    key('Escape');
    notesKey('0');
    notesKey('Enter');
    expect(Deck.currentKey()).toBe('agenda');
    expect(text('nwTitle')).toBe('Home');
  });

  it('closes the notes window with ⇧N pressed in the notes window', async () => {
    const { key, notes, notesKey } = await boot(DECK);
    key('n');
    notesKey('N', { shiftKey: true });
    expect(notes().closed).toBe(true);
  });

  it('navigates with the toolbar and disables step buttons without steps', async () => {
    const { key, Deck, click, btn } = await boot(DECK);
    key('n');
    expect(btn('prevSlide').disabled).toBe(true);
    click('nextSlide');
    expect(Deck.currentKey()).toBe('overview');
    expect(btn('prevStep').disabled).toBe(true);
    expect(btn('nextStep').disabled).toBe(true);
    click('nextSlide');
    expect(Deck.currentKey()).toBe('process');
    click('nextStep');
    expect(Deck.currentKey()).toBe('process');
    click('prevSlide');
    expect(Deck.currentKey()).toBe('overview');
    Deck.goToKey('closing');
    expect(btn('nextSlide').disabled).toBe(true);
  });

  it('orders the toolbar as media controls with the progress in the middle', async () => {
    const { key, nd, Deck, text } = await boot(DECK);
    key('n');
    const nav = [...nd().querySelectorAll('.nw-nav > *')].map((e) => e.getAttribute('aria-label') ?? e.className);
    expect(nav).toEqual(['Previous slide', 'Previous step', 'nw-progress', 'Next step', 'Next slide']);
    expect(nd().querySelectorAll('.nw-nav button svg').length).toBe(4);
    expect(text('nwSlidePos')).toBe('Home');
    Deck.goToKey('process');
    expect(text('nwSlidePos')).toBe('Slide 2 / 3');
  });

  it('follows the theme and light/dark mode with the deck switch', async () => {
    const { key, doc, nd, notesKey } = await boot(DECK);
    key('n');
    expect(nd().getElementById('nwTheme')?.textContent).toContain('--brand');
    const sw = () => nd().getElementById('nwThemeCheckbox') as HTMLInputElement;
    const mode = () => doc.documentElement.getAttribute('data-theme');
    const before = mode();
    expect(nd().documentElement.getAttribute('data-theme')).toBe(before);
    expect(sw().checked).toBe(before === 'dark');
    notesKey('t');
    const after = mode();
    expect(after).not.toBe(before);
    expect(nd().documentElement.getAttribute('data-theme')).toBe(after);
    expect(sw().checked).toBe(after === 'dark');
    key('t');
    expect(sw().checked).toBe(before === 'dark');
    sw().click();
    expect(mode()).toBe(after);
    expect(nd().documentElement.getAttribute('data-theme')).toBe(after);
    expect(sw().checked).toBe(after === 'dark');
  });

  it('shows the disconnected banner when the deck window is gone', async () => {
    const { key, nd, closeDeck, notes } = await boot(DECK);
    key('n');
    expect(nd().documentElement.classList.contains('is-disconnected')).toBe(false);
    closeDeck();
    await new Promise((r) => (notes() as unknown as Window).setTimeout(r, 1100));
    expect(nd().documentElement.classList.contains('is-disconnected')).toBe(true);
  });
});
