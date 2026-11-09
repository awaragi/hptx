import { describe, expect, it } from 'vitest';
import { bakeTheme, readDefaultThemeTokens } from '../bakeTheme.ts';
import { TEMPLATE } from './helpers.ts';

describe('readDefaultThemeTokens', () => {
  it('reads :root custom properties between the markers', () => {
    expect(readDefaultThemeTokens(TEMPLATE)).toEqual(['--brand', '--accent']);
  });

  it('returns [] without markers', () => {
    expect(readDefaultThemeTokens('<html></html>')).toEqual([]);
  });
});

describe('bakeTheme', () => {
  it('appends theme CSS after defaults, keeping markers', () => {
    const { html, warnings } = bakeTheme(TEMPLATE, ':root{ --brand:#abc; --accent:#def; }');
    expect(html).toContain('/* DECK THEME — START */');
    expect(html).toContain('/* DECK THEME — END */');
    expect(html).toContain('--brand:#111');
    expect(html).toContain('--brand:#abc');
    expect(html.indexOf('--brand:#abc')).toBeGreaterThan(html.indexOf('--brand:#111'));
    expect(warnings).toEqual([]);
  });

  it('does not interpret $ patterns in theme CSS', () => {
    const { html } = bakeTheme(TEMPLATE, ':root{ --brand:"$&"; --accent:#fff }');
    expect(html).toContain('"$&"');
  });

  it('rejects themes containing </style (case-insensitive)', () => {
    expect(() => bakeTheme(TEMPLATE, ':root{}</STYLE><script>')).toThrow(/<\/style/);
  });

  it('warns about extra tokens but not missing ones', () => {
    const { warnings } = bakeTheme(TEMPLATE, ':root{ --brand:#abc; --custom-extra:1; }');
    expect(warnings.some((w) => w.includes('--accent') && /missing/.test(w))).toBe(false);
    expect(warnings.some((w) => w.includes('--custom-extra') && /extra/.test(w))).toBe(true);
  });

  it('throws when the template lacks markers', () => {
    expect(() => bakeTheme('<html></html>', ':root{}')).toThrow(/markers/);
  });
});
