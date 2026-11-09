import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { assembleDeck } from '../index.ts';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const DTS = path.join(REPO, 'shell', 'contract', 'slide-contract.d.ts');
const USAGE = path.join(REPO, 'fixtures', 'contract-usage', 'usage.ts');

/** Member names of `interface <name>` in the contract declarations. */
function declaredMembers(source: string, name: string): string[] {
  const sf = ts.createSourceFile('contract.d.ts', source, ts.ScriptTarget.ES2022, true);
  const decl = sf.statements.find(
    (s): s is ts.InterfaceDeclaration => ts.isInterfaceDeclaration(s) && s.name.text === name,
  );
  if (!decl) throw new Error(`interface ${name} not found`);
  return decl.members.map((m) => (m.name as ts.Identifier).text);
}

/** Booted `window.Deck` keys of an assembled deck. */
async function bootedDeckKeys(deckRoot: string): Promise<string[]> {
  const { html } = await assembleDeck(deckRoot);
  const errors: string[] = [];
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'http://localhost/',
    beforeParse(win) {
      const w = win as unknown as Record<string, unknown>;
      w.matchMedia ??= () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
      w.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
      win.addEventListener('error', (e) => errors.push(String((e as ErrorEvent).message)));
    },
  });
  const deck = (dom.window as unknown as { Deck?: object }).Deck;
  dom.window.close();
  if (!deck) throw new Error('window.Deck missing after boot; page errors: ' + errors.join('; '));
  return Object.keys(deck);
}

function diff(runtime: string[], declared: string[]): { undeclared: string[]; stale: string[] } {
  return {
    undeclared: runtime.filter((k) => !declared.includes(k)),
    stale: declared.filter((k) => !runtime.includes(k)),
  };
}

describe('slide-contract.d.ts', () => {
  const dts = fs.readFileSync(DTS, 'utf8');

  it('declares exactly the members of the booted window.Deck', async () => {
    const runtime = await bootedDeckKeys(path.join(REPO, 'fixtures', 'tiny-deck'));
    expect(diff(runtime, declaredMembers(dts, 'Deck'))).toEqual({ undeclared: [], stale: [] });
  });

  it('names an undeclared or stale member', () => {
    const declared = declaredMembers(dts, 'Deck');
    expect(diff([...declared, 'newThing'], declared).undeclared).toEqual(['newThing']);
    expect(diff(declared.filter((k) => k !== 'goTo'), declared).stale).toEqual(['goTo']);
  });

  it('declares every slide hook the shell documents', () => {
    const tpl = fs.readFileSync(path.join(REPO, 'shell', 'template.html'), 'utf8');
    const block = tpl.slice(tpl.indexOf('SLIDE REGISTRY'), tpl.indexOf('*/', tpl.indexOf('SLIDE REGISTRY')));
    const hooks = [...block.matchAll(/^\s+(\w+)(?:\([^)]*\))?\s{2,}/gm)].map((m) => m[1]);
    expect(hooks.length).toBeGreaterThanOrEqual(10);
    const members = declaredMembers(dts, 'SlideModule');
    expect(hooks.filter((h) => !members.includes(h))).toEqual([]);
  });

  function typeErrors(extra?: string): string[] {
    const files = [DTS, USAGE];
    const host = ts.createCompilerHost({});
    const extraName = path.join(REPO, 'fixtures', 'contract-usage', '__bad.ts');
    if (extra !== undefined) {
      const orig = host.getSourceFile;
      host.getSourceFile = (name, lang, ...rest) =>
        name === extraName ? ts.createSourceFile(name, extra, lang) : orig.call(host, name, lang, ...rest);
      files.push(extraName);
    }
    const program = ts.createProgram(files, { strict: true, noEmit: true, target: ts.ScriptTarget.ES2022, lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'], types: [] }, host);
    return ts.getPreEmitDiagnostics(program).map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'));
  }

  it('type-checks the usage fixture', () => {
    expect(typeErrors()).toEqual([]);
  });

  it('rejects misuse', () => {
    const errs = typeErrors("registerSlide({ boot(D) { D.goToKey(1); } }); window.Deck.nope();");
    expect(errs.length).toBe(2);
  });
});

describe('slide-contract.css', () => {
  it('leaves the home page layout to shell chrome and keeps the cover classes', () => {
    const css = fs.readFileSync(path.join(REPO, 'shell', 'contract', 'slide-contract.css'), 'utf8');
    const tpl = fs.readFileSync(path.join(REPO, 'shell', 'template.html'), 'utf8');
    const chrome = tpl.slice(tpl.indexOf('<style id="deck-chrome">'), tpl.indexOf('</style>', tpl.indexOf('<style id="deck-chrome">')));
    for (const cls of ['.agenda-col', '.agenda-label', '.toc-item', '.toc-grid', '.title-kbd-hint', '.title-row', '.title-left']) {
      expect(css, cls).not.toMatch(new RegExp(`\\${cls}\\b`));
      expect(chrome, cls).toContain(cls);
    }
    for (const cls of ['.title-logo', '.title-main', '.title-desc', '.title-tags']) expect(css, cls).toContain(cls);
  });
});
