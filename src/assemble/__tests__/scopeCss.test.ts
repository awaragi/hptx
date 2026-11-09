import { describe, expect, it } from 'vitest';
import { scopeCss, scopeSlideCss } from '../scopeCss.ts';

describe('scopeSlideCss', () => {
  it('prepends scope to plain selectors', () => {
    expect(scopeSlideCss('.rail { gap: 12px; }', 'metrics')).toBe('[data-slide="metrics"] .rail { gap: 12px; }');
  });

  it('scopes every selector in a list', () => {
    expect(scopeSlideCss('.a, .b > i { x: 1 }', 'k')).toBe('[data-slide="k"] .a, [data-slide="k"] .b > i { x: 1 }');
  });

  it('maps :scope and top-level & to the section itself', () => {
    expect(scopeSlideCss(':scope { align-items: stretch; }', 'overview')).toBe(
      '[data-slide="overview"] { align-items: stretch; }',
    );
    expect(scopeSlideCss('&.on .x { y: 1 }', 'overview')).toBe('[data-slide="overview"].on .x { y: 1 }');
  });

  it('keeps html/body/:root anchors first', () => {
    expect(scopeSlideCss('html.deck-print-mode .slide-title { font-size: 92px; }', 'overview')).toBe(
      'html.deck-print-mode [data-slide="overview"] .slide-title { font-size: 92px; }',
    );
    expect(scopeSlideCss('body .x { a: b }', 'k')).toBe('body [data-slide="k"] .x { a: b }');
    expect(scopeSlideCss(':root .x { a: b }', 'k')).toBe(':root [data-slide="k"] .x { a: b }');
    expect(scopeSlideCss('html[data-theme="dark"] .x { a: b }', 'k')).toBe(
      'html[data-theme="dark"] [data-slide="k"] .x { a: b }',
    );
  });

  it('recurses into @media / @supports', () => {
    expect(scopeSlideCss('@media (min-width: 1px) { .x { a: b } }', 'k')).toBe(
      '@media (min-width: 1px) { [data-slide="k"] .x { a: b } }',
    );
    expect(scopeSlideCss('@supports (display:grid) { .x { a: b } }', 'k')).toContain('[data-slide="k"] .x');
  });

  it('leaves @keyframes and @font-face alone', () => {
    const css = '@keyframes k_pulse { from { opacity: 0 } 50% { opacity: .5 } to { opacity: 1 } }\n@font-face { font-family: X; src: url(x.woff2); }';
    expect(scopeSlideCss(css, 'k')).toBe(css);
  });
});

describe('scopeCss (cover scope)', () => {
  const S = '[data-deck-cover]';

  it('scopes plain, :scope, and print-mode selectors to the cover block', () => {
    expect(scopeCss('.title-main { font-size: 92px; }', S)).toBe('[data-deck-cover] .title-main { font-size: 92px; }');
    expect(scopeCss(':scope { gap: 8px; }', S)).toBe('[data-deck-cover] { gap: 8px; }');
    expect(scopeCss('html.deck-print-mode .title-main { a: b }', S)).toBe('html.deck-print-mode [data-deck-cover] .title-main { a: b }');
  });

  it('rejects a compound scope', () => {
    expect(() => scopeCss('.x { a: b }', '.a .b')).toThrow(/single simple selector/);
  });
});
