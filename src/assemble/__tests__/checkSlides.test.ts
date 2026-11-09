import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assembleDeck } from '../index.ts';
import { checkSlides, collectAnimationNames, collectIds, collectKeyframes } from '../checkSlides.ts';
import type { ParsedSlide } from '../types.ts';
import { TEMPLATE, makeDeckDir, slideDoc } from './helpers.ts';

const slide = (key: string, css = '', markupHtml = '<div></div>'): ParsedSlide => ({
  key,
  styles: [css],
  scripts: [],
  markupHtml,
  sourceName: `${key}.html`,
});

const PULSE = '@keyframes demoPulse{ 0%{ opacity:1 } 100%{ opacity:0 } }';

describe('collectAnimationNames', () => {
  it('handles every common animation pattern', () => {
    const css = `
      .a{ animation:none !important; }
      .b{ animation:arrowPulse 1.6s ease-in-out infinite; }
      .c{ animation:swipeInFromLeft var(--ss-swipe-ms, .48s) var(--ease, cubic-bezier(.25,.8,.25,1)) forwards; }
      .d{ animation-name: spinA, spinB; -webkit-animation: wobble 2s 3 alternate both; }
    `;
    expect([...collectAnimationNames(css)].sort()).toEqual(['arrowPulse', 'spinA', 'spinB', 'swipeInFromLeft', 'wobble']);
  });
});

describe('collectKeyframes', () => {
  it('normalizes whitespace and keeps vendor prefixes apart', () => {
    const a = collectKeyframes('@keyframes x{0%{opacity:1}100%{opacity:0}}');
    const b = collectKeyframes('@keyframes x {\n  0% { opacity: 1; }\n  100% { opacity: 0; }\n}');
    expect(a.get('x')).toBe(b.get('x'));
    expect([...collectKeyframes('@-webkit-keyframes x{0%{top:0}}').keys()]).toEqual(['-webkit-x']);
  });
});

describe('collectIds', () => {
  it('finds ids and markup references', () => {
    const { defined, referenced } = collectIds(
      '<label for="q">Q</label><input id="q"><a href="#top">t</a><div aria-labelledby="h1 h2" id="box"></div><!-- <i id="c"> -->',
    );
    expect([...defined].sort()).toEqual(['box', 'q']);
    expect([...referenced].sort()).toEqual(['h1', 'h2', 'q', 'top']);
  });
});

describe('checkSlides', () => {
  it('accepts identical keyframes in two slides', () => {
    expect(() => checkSlides([slide('cardsA', PULSE), slide('cardsB', PULSE.replace(/ /g, '  '))])).not.toThrow();
  });

  it('rejects conflicting keyframes, naming the keyframe and both slides', () => {
    const other = '@keyframes demoPulse{ 0%{ opacity:0 } 100%{ opacity:1 } }';
    expect(() => checkSlides([slide('alpha', PULSE), slide('beta', other)])).toThrow(
      /@keyframes demoPulse is defined differently in slides alpha and beta/,
    );
  });

  it('rejects a borrowed animation even when the defining slide is in the deck', () => {
    const user = '.dot{ animation: demoPulse 1.8s ease-out infinite; }';
    expect(() => checkSlides([slide('alpha', PULSE), slide('beta', user)])).toThrow(
      /slide beta uses animation "demoPulse" but does not define @keyframes demoPulse/,
    );
  });

  it('accepts an animation defined by the contract stylesheet', () => {
    const user = '.spin{ animation: deckSpin 1s linear infinite; }';
    expect(() => checkSlides([slide('a', user)], '@keyframes deckSpin{ to{ transform:rotate(1turn) } }')).not.toThrow();
  });

  it('accepts vendor-prefixed keyframes for an unprefixed use', () => {
    expect(() => checkSlides([slide('a', '@-webkit-keyframes w{0%{top:0}} .x{ animation: w 1s; }')])).not.toThrow();
  });

  it('rejects an ID referenced from markup and defined in two slides', () => {
    const a = slide('riskA', '', '<label for="q">Q</label><input id="q">');
    const b = slide('riskB', '', '<input id="q">');
    expect(() => checkSlides([a, b])).toThrow(/id "q" is referenced from markup .* defined in slides riskA, riskB/);
  });

  it('accepts duplicate IDs that no markup references', () => {
    expect(() => checkSlides([slide('a', '', '<div id="rail"></div>'), slide('b', '', '<div id="rail"></div>')])).not.toThrow();
  });

  it('runs as part of assembleDeck on the selected slides', async () => {
    const dir = makeDeckDir({
      'deck.json': JSON.stringify({ output: 'o.html', slides: ['alpha.html', 'beta.html'] }),
      'alpha.html': slideDoc({ style: PULSE }),
      'beta.html': slideDoc({ style: '.dot{ animation: demoPulse 1.8s; }' }),
      'shell/tpl.html': TEMPLATE,
    });
    const templatePath = path.join(dir, 'shell', 'tpl.html');
    await expect(assembleDeck(dir, { slides: ['beta'], templatePath })).rejects.toThrow(/beta uses animation "demoPulse"/);
    await expect(assembleDeck(dir, { templatePath })).rejects.toThrow(/beta uses animation "demoPulse"/);
  });
});
