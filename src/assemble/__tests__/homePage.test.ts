import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import { assembleDeck } from '../index.ts';
import { makeDeckDir } from './helpers.ts';

interface DeckApi {
  manifest: string[];
  currentKey(): string;
  goTo(i: number): void;
  goToKey(k: string): void;
  setStep(k: string, i: number): void;
  get(k: string): { stepCount?: number } | undefined;
}

const slide = (title: string, section?: string) =>
  `<!doctype html><html><head><script>window.registerSlide({ title: ${JSON.stringify(title)}${
    section ? `, agendaSection: ${JSON.stringify(section)}` : ''
  } });</script></head><body><h1 class="slide-title">${title}</h1></body></html>`;

const COVER =
  '<!doctype html><html><head><style>.title-main{font-size:92px}</style></head><body>' +
  '<h1 class="title-main">Q3<br><span>review.</span></h1><p class="title-desc">About.</p><span id="today"></span>' +
  '<script>document.getElementById("today").textContent = "today";</script></body></html>';

async function boot(files: Record<string, string>, opts: { stored?: Record<string, string>; slides?: string[] } = {}) {
  const { html } = await assembleDeck(makeDeckDir(files), opts.slides ? { slides: opts.slides } : {});
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
      const origError = win.console.error.bind(win.console);
      win.console.error = (...args: unknown[]) => { errors.push(args.map(String).join(' ')); origError(...args); };
    },
  });
  const doc = dom.window.document;
  const Deck = (dom.window as unknown as { Deck: DeckApi }).Deck;
  const home = doc.querySelector('[data-slide="agenda"]') as HTMLElement;
  const tiles = () => [...home.querySelectorAll('#tocGrid .toc-item')].map((e) => e.textContent?.trim());
  const key = (k: string) => dom.window.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: k, bubbles: true }));
  const agendaBox = () => doc.querySelector('#tcSlideList .tc-agenda-row input') as HTMLInputElement;
  return { dom, doc, Deck, home, tiles, key, agendaBox, errors };
}

const DECK = {
  'deck.json': JSON.stringify({ output: 'o.html', cover: 'cover.html', slides: ['process.html', 'metrics.html', 'closing.html'] }),
  'cover.html': COVER,
  'process.html': slide('Process overview', 'Why'),
  'metrics.html': slide('Metrics', 'Why'),
  'closing.html': slide('Closing', 'Wrap'),
};

describe('shell home page (jsdom)', () => {
  it('is index 0 with the cover, keyboard hints, and agenda tiles', async () => {
    const { Deck, home, tiles, doc, errors } = await boot(DECK);
    expect(errors).toEqual([]);
    expect(Deck.manifest).toEqual(['agenda', 'process', 'metrics', 'closing']);
    expect(Deck.currentKey()).toBe('agenda');
    expect(home.classList.contains('active')).toBe(true);
    expect(home.querySelector('[data-deck-cover] .title-main')?.textContent).toBe('Q3review.');
    expect(home.querySelector('[data-deck-cover] #today')?.textContent).toBe('today');
    expect(home.querySelector('.title-kbd-hints')).not.toBeNull();
    expect(tiles()).toEqual(['Process overview', 'Metrics', 'Closing']);
    expect([...home.querySelectorAll('.toc-section-label')].map((e) => e.textContent)).toEqual(['Why', 'Wrap']);
    expect(doc.getElementById('totalNum')?.textContent).toBe('03');
    expect(doc.querySelectorAll('[data-slide="cover"]').length).toBe(0);
  });

  it('uses agenda tiles as home page steps', async () => {
    const { Deck, home, key } = await boot(DECK);
    Deck.setStep('agenda', 1);
    const hl = () => [...home.querySelectorAll('#tocGrid .toc-item')].findIndex((e) => e.classList.contains('highlight'));
    expect(hl()).toBe(1);
    key('ArrowRight');
    expect(hl()).toBe(2);
    key('Enter');
    expect(Deck.currentKey()).toBe('closing');
    key('h');
    expect(Deck.currentKey()).toBe('agenda');
  });

  it('renders an empty title block when no cover is configured', async () => {
    const { home, tiles, errors } = await boot({
      'deck.json': JSON.stringify({ output: 'o.html', slides: ['metrics.html'] }),
      'metrics.html': slide('Metrics'),
    });
    expect(errors).toEqual([]);
    expect(home.querySelector('[data-deck-cover]')?.innerHTML).toBe('');
    expect(home.querySelector('.title-kbd-hints')).not.toBeNull();
    expect(tiles()).toEqual(['Metrics']);
  });

  it('keeps the home page and cover in a filtered deck, counting only content slides', async () => {
    const { Deck, home, tiles, doc } = await boot(DECK, { slides: ['metrics', 'closing'] });
    expect(Deck.manifest).toEqual(['agenda', 'metrics', 'closing']);
    expect(home.querySelector('[data-deck-cover] .title-main')).not.toBeNull();
    expect(tiles()).toEqual(['Metrics', 'Closing']);
    expect(doc.getElementById('totalNum')?.textContent).toBe('02');
  });
});

describe('agenda toggle (jsdom)', () => {
  it('is pinned above the slide groups in Settings → Slides and hides the agenda when unchecked', async () => {
    const { Deck, dom, home, tiles, agendaBox, doc, key } = await boot(DECK);
    const rows = [...doc.querySelectorAll('#tcSlideList .tc-check-row span')].map((e) => e.textContent);
    expect(rows[0]).toBe('Agenda');
    expect(rows.slice(1)).toEqual(['Why', 'Process overview', 'Metrics', 'Wrap', 'Closing']);
    expect(agendaBox().checked).toBe(true);

    agendaBox().click();
    expect(home.classList.contains('is-agenda-off')).toBe(true);
    expect(tiles()).toEqual([]);
    expect(Deck.get('agenda')?.stepCount).toBe(0);
    expect(dom.window.localStorage.getItem('hptx/o/show-agenda')).toBe('0');
    expect(agendaBox().checked).toBe(false);
    expect(Deck.currentKey()).toBe('agenda');
    key('ArrowRight');
    expect(home.querySelectorAll('.highlight').length).toBe(0);

    Deck.goToKey('metrics');
    key('m');
    expect(doc.getElementById('navDrawer')?.classList.contains('open')).toBe(true);
    expect([...doc.querySelectorAll('#navDrawerList .toc-item')].map((e) => e.textContent?.trim())).toEqual([
      'Process overview',
      'Metrics',
      'Closing',
    ]);
  });

  it('restores the stored choice on load', async () => {
    const { home, tiles, agendaBox } = await boot(DECK, { stored: { 'hptx/o/show-agenda': '0' } });
    expect(home.classList.contains('is-agenda-off')).toBe(true);
    expect(tiles()).toEqual([]);
    expect(agendaBox().checked).toBe(false);
  });

  it('turns back on with Show all', async () => {
    const { dom, home, tiles, doc } = await boot(DECK, { stored: { 'hptx/o/show-agenda': '0', 'hptx/o/hidden-slides': '["metrics"]' } });
    expect(tiles()).toEqual([]);
    (doc.getElementById('tcShowAllSlidesBtn') as HTMLButtonElement).click();
    expect(home.classList.contains('is-agenda-off')).toBe(false);
    expect(tiles()).toEqual(['Process overview', 'Metrics', 'Closing']);
    expect(dom.window.localStorage.getItem('hptx/o/show-agenda')).toBeNull();
  });
});

describe('theme toggle chrome (jsdom)', () => {
  it('shows the theme toggle only on the home page; T still works on content slides', async () => {
    const { doc, Deck, key } = await boot(DECK);
    const wrap = doc.getElementById('themeToggleWrap') as HTMLElement;
    expect(doc.documentElement.classList.contains('is-deck-home')).toBe(true);
    expect(doc.defaultView!.getComputedStyle(wrap).display).not.toBe('none');
    const before = doc.documentElement.getAttribute('data-theme');

    Deck.goTo(1);
    expect(doc.documentElement.classList.contains('is-deck-home')).toBe(false);
    expect(doc.defaultView!.getComputedStyle(wrap).display).toBe('none');
    key('t');
    expect(doc.documentElement.getAttribute('data-theme')).not.toBe(before);

    Deck.goTo(0);
    expect(doc.documentElement.classList.contains('is-deck-home')).toBe(true);
    expect(doc.defaultView!.getComputedStyle(wrap).display).not.toBe('none');
  });

  it('disables T when the theme locks the toggle token', async () => {
    const { doc, key } = await boot(DECK, {
      stored: { 'hptx/o/custom-theme-css': ':root { --brand: #654321; --deck-theme-toggle-display: none; }' },
    });
    const before = doc.documentElement.getAttribute('data-theme');
    key('t');
    expect(doc.documentElement.getAttribute('data-theme')).toBe(before);
    expect((doc.getElementById('themeCheckbox') as HTMLInputElement).disabled).toBe(true);
  });
});

describe('Settings theme (jsdom)', () => {
  const OTHER_NAMES = ':root { --primary: #123456; }';

  it('exposes Theme, Slides, Playback, and Reset tabs', async () => {
    const { doc, key } = await boot(DECK);
    key('c');
    const labels = [...doc.querySelectorAll('.tc-tabs .tc-tab')].map((el) => el.textContent?.trim());
    expect(labels).toEqual(['Theme', 'Slides', 'Playback', 'Reset']);
    expect(doc.getElementById('tcPanelTheme')).not.toBeNull();
    expect(doc.getElementById('tcPasteIn')).not.toBeNull();
    expect(doc.getElementById('tcPromptOut')).not.toBeNull();
    expect(doc.getElementById('tcThemeInstructions')).not.toBeNull();
    expect(doc.getElementById('tcPanelPrompt')).toBeNull();
    expect(doc.getElementById('tcPanelDelivery')).toBeNull();
  });

  it('applies a stored theme as written', async () => {
    const { doc, dom } = await boot(DECK, { stored: { 'hptx/o/custom-theme-css': `${OTHER_NAMES} :root { --brand: #654321; }` } });
    expect(doc.getElementById('hptxCustomThemeStyle')?.textContent).toContain('--primary: #123456');
    expect(dom.window.localStorage.getItem('hptx/o/custom-theme-css')).toContain('--primary');
  });

  it('rejects a pasted theme that uses other token names instead of --brand', async () => {
    const { doc, key } = await boot(DECK);
    key('c');
    (doc.getElementById('tcPasteIn') as HTMLTextAreaElement).value = OTHER_NAMES;
    (doc.getElementById('tcApplyBtn') as HTMLButtonElement).click();
    expect(doc.getElementById('tcStatus')?.textContent).toBe('Theme must set --brand (primary CTA).');
    expect(doc.getElementById('hptxCustomThemeStyle')?.textContent ?? '').not.toContain('--primary');
  });

  it('explains theming through deck.json and a build', async () => {
    const { doc, key } = await boot(DECK);
    key('c');
    const text = (doc.getElementById('tcThemeInstructions') as HTMLTextAreaElement).value;
    expect(text).toContain('deck.json');
    expect(text).toContain('npm run build');
    expect(text).toContain('cascade');
    expect(text).toMatch(/defaults.*bake.*Settings override/s);
    expect((doc.getElementById('tcPromptOut') as HTMLTextAreaElement).value).toContain('deck.json');
  });

  it('Generate-theme baseline prefers later baked :root decls', async () => {
    const { doc, key } = await boot({
      ...DECK,
      'deck.json': JSON.stringify({
        output: 'o.html',
        cover: 'cover.html',
        slides: ['process.html'],
        theme: './t.css',
      }),
      't.css': ':root { --brand: #16a34a; }',
    });
    key('c');
    const prompt = (doc.getElementById('tcPromptOut') as HTMLTextAreaElement).value;
    const baseline = prompt.slice(prompt.indexOf('Current :root baseline'));
    expect(baseline).toMatch(/--brand:\s*#16a34a/);
    expect(baseline).not.toMatch(/--brand:\s*#0d6efd/);
  });

  it('ignores legacy flat preference keys', async () => {
    const { doc } = await boot(DECK, { stored: { 'hptx-theme': 'dark' } });
    expect(doc.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('re-applies slug-scoped prefs from a storage event', async () => {
    const { doc, dom } = await boot(DECK);
    expect(doc.documentElement.getAttribute('data-theme')).toBe('light');
    const StorageEvent = dom.window.StorageEvent;
    dom.window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'hptx/o/theme',
        newValue: 'dark',
        oldValue: 'light',
        storageArea: dom.window.localStorage,
      }),
    );
    expect(doc.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
