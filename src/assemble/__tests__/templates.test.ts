import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import { assembleDeck, loadDeckConfig } from '../index.ts';
import { makeDeckDir } from './helpers.ts';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const TEMPLATES = path.join(REPO, 'templates');

interface CatalogEntry {
  description: string;
  scripts?: string[];
  styles?: string[];
}

const readCatalog = (): Record<string, CatalogEntry> =>
  JSON.parse(fs.readFileSync(path.join(TEMPLATES, 'catalog.json'), 'utf8'));
/** The template deck's cover; it is not a slide template. */
const COVER = 'cover';
const templateKeys = (): string[] =>
  fs.readdirSync(TEMPLATES).filter((f) => f.endsWith('.html')).map((f) => f.slice(0, -5)).filter((k) => k !== COVER).sort();
const readTemplate = (key: string): string => fs.readFileSync(path.join(TEMPLATES, `${key}.html`), 'utf8');

/** Template keys missing from the catalog, and catalog keys without a template. */
function catalogDrift(keys: string[], catalog: Record<string, unknown>): { uncataloged: string[]; missing: string[] } {
  return {
    uncataloged: keys.filter((k) => !(k in catalog)),
    missing: Object.keys(catalog).filter((k) => !keys.includes(k)),
  };
}

describe('template library', () => {
  it('has a catalog entry for every template and a template for every entry', () => {
    expect(catalogDrift(templateKeys(), readCatalog())).toEqual({ uncataloged: [], missing: [] });
  });

  it('names a template without a catalog entry', () => {
    const catalog = readCatalog();
    delete (catalog as Record<string, unknown>).stepper;
    expect(catalogDrift(templateKeys(), catalog).uncataloged).toEqual(['stepper']);
  });

  it('contains the starter templates, each with a description', () => {
    const catalog = readCatalog();
    expect(templateKeys()).toEqual(['blank', 'cardGrid', 'd3Chart', 'photoStrip', 'section', 'stepper']);
    for (const entry of Object.values(catalog)) expect(entry.description.length).toBeGreaterThan(10);
  });

  it('has a library cover that is the template deck cover, not a catalog slide', () => {
    expect(loadDeckConfig(TEMPLATES).config.cover).toBe(path.join(TEMPLATES, `${COVER}.html`));
    expect(readCatalog()).not.toHaveProperty(COVER);
    const html = readTemplate(COVER);
    expect(html).not.toMatch(/registerSlide\s*\(/);
    expect(html).toMatch(/<h1 class="title-main">/);
  });

  it('declares every catalog CDN dependency in templates/deck.json', () => {
    const deck = loadDeckConfig(TEMPLATES).config;
    const deckScripts = (deck.scripts ?? []).map((s) => (typeof s === 'string' ? s : s.src));
    const deckStyles = (deck.styles ?? []).map((s) => (typeof s === 'string' ? s : s.src));
    for (const [key, entry] of Object.entries(readCatalog())) {
      for (const src of entry.scripts ?? []) expect(deckScripts, key).toContain(src);
      for (const src of entry.styles ?? []) expect(deckStyles, key).toContain(src);
    }
    expect(readCatalog().d3Chart.scripts?.[0]).toMatch(/^https:\/\/.*d3/);
  });

  it.each([...templateKeys(), COVER])('%s follows the copy-safety rules', (key) => {
    const html = readTemplate(key);
    expect(html).toContain('<link rel="stylesheet" href="../shell/contract/slide-contract.css">');
    expect(html).toMatch(/SLIDE-CONTRACT\.md/);
    expect(html).not.toMatch(/#[0-9a-f]{3,8}\b(?![\w-])/i);
    expect(html).not.toMatch(/\brgba?\(\s*\d/);
    expect(html).not.toMatch(/\s(for|aria-(labelledby|describedby|controls|owns|activedescendant))="/);
    expect(html).not.toMatch(/href="#/);
    expect(html).not.toMatch(/\.style\.animation(Name)?\s*=|animationName\s*[=!]==?/);
    expect(html).not.toMatch(/d3\.select(All)?\(\s*['"]/);
    expect((html.match(/<title>[^<]*<\/title>/g) ?? []).length).toBe(1);
  });

  it('assembles with two verbatim copies of cardGrid and stepper that work independently', async () => {
    const files: Record<string, string> = {
      'deck.json': JSON.stringify({ output: 'out.html', slides: ['gridA.html', 'gridB.html', 'stepA.html', 'stepB.html'] }),
    };
    for (const [name, key] of [['gridA', 'cardGrid'], ['gridB', 'cardGrid'], ['stepA', 'stepper'], ['stepB', 'stepper']]) {
      files[`${name}.html`] = readTemplate(key);
    }
    const { html } = await assembleDeck(makeDeckDir(files));
    const errors: string[] = [];
    const dom = new JSDOM(html, {
      runScripts: 'dangerously',
      pretendToBeVisual: true,
      url: 'http://localhost/',
      beforeParse(win) {
        const w = win as unknown as Record<string, unknown>;
        w.matchMedia ??= () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
        win.addEventListener('error', (e) => errors.push(String((e as ErrorEvent).message)));
        const origError = win.console.error.bind(win.console);
        win.console.error = (...args: unknown[]) => { errors.push(args.map(String).join(' ')); origError(...args); };
      },
    });
    const doc = dom.window.document;
    const Deck = (dom.window as unknown as { Deck: { setStep(k: string, i: number): void } }).Deck;
    expect(errors).toEqual([]);
    expect(doc.querySelectorAll('[data-slide="gridA"] .cg-card').length).toBe(6);
    expect(doc.querySelectorAll('[data-slide="gridB"] .cg-card').length).toBe(6);
    expect(doc.querySelectorAll('[data-slide="stepB"] .st-step').length).toBe(5);

    Deck.setStep('gridB', 3);
    const hl = (k: string) => [...doc.querySelectorAll(`[data-slide="${k}"] .cg-card`)].findIndex((e) => e.classList.contains('highlight'));
    expect(hl('gridB')).toBe(3);
    expect(hl('gridA')).not.toBe(3);

    Deck.setStep('stepA', 2);
    const cur = (k: string) => doc.querySelector(`[data-slide="${k}"] .st-step.is-current .st-label`)?.textContent;
    expect(cur('stepA')).toBe('Build');
    expect(cur('stepB')).toBe('Discover');
    dom.window.close();
  });
});
