import postcss from 'postcss';
import type { ParsedSlide } from './types.ts';

/** Markup attributes whose value is a single ID reference or a space-separated list of them. */
const ID_REF_ATTRS = ['for', 'aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-owns', 'aria-activedescendant'];

const ANIMATION_KEYWORDS = new Set([
  'none', 'infinite', 'normal', 'reverse', 'alternate', 'alternate-reverse', 'forwards', 'backwards', 'both',
  'running', 'paused', 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear', 'step-start', 'step-end',
  'initial', 'inherit', 'unset', 'revert', 'revert-layer', 'auto',
]);

function parseCss(css: string, label: string): postcss.Root {
  try {
    return postcss.parse(css);
  } catch (err) {
    throw new Error(`${label}: invalid CSS: ${(err as Error).message}`);
  }
}

function normalizeCss(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{}:;,])\s*/g, '$1').replace(/;}/g, '}').trim();
}

/** `@keyframes` definitions in a stylesheet: name → normalized body (vendor prefix kept in the key). */
export function collectKeyframes(css: string, label = 'CSS'): Map<string, string> {
  const out = new Map<string, string>();
  parseCss(css, label).walkAtRules(/^(-[a-z]+-)?keyframes$/i, (at) => {
    const vendor = /^(-[a-z]+-)/i.exec(at.name)?.[1]?.toLowerCase() ?? '';
    const name = at.params.trim().replace(/^["']|["']$/g, '');
    out.set(vendor + name, normalizeCss((at.nodes ?? []).map((n) => n.toString()).join(';')));
  });
  return out;
}

/** Split a CSS value into top-level tokens, dropping function calls such as `var(…)` and `cubic-bezier(…)`. */
function valueTokens(value: string): string[][] {
  const groups: string[][] = [[]];
  let depth = 0;
  let tok = '';
  const flush = () => {
    if (tok) groups[groups.length - 1].push(tok);
    tok = '';
  };
  for (const ch of value) {
    if (ch === '(') {
      depth++;
      tok = '';
      continue;
    }
    if (ch === ')') {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (depth > 0) continue;
    if (ch === ',') {
      flush();
      groups.push([]);
    } else if (/\s/.test(ch)) {
      flush();
    } else {
      tok += ch;
    }
  }
  flush();
  return groups;
}

/** Animation names referenced by `animation` / `animation-name` declarations. */
export function collectAnimationNames(css: string, label = 'CSS'): Set<string> {
  const names = new Set<string>();
  parseCss(css, label).walkDecls(/^(-[a-z]+-)?animation(-name)?$/i, (decl) => {
    for (const group of valueTokens(decl.value)) {
      for (const raw of group) {
        const t = raw.replace(/^["']|["']$/g, '');
        if (!t || ANIMATION_KEYWORDS.has(t.toLowerCase())) continue;
        if (/^[-+]?(\d|\.\d)/.test(t)) continue;
        if (!/^-?[A-Za-z_][\w-]*$/.test(t)) continue;
        names.add(t);
      }
    }
  });
  return names;
}

function stripComments(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

function attrValues(html: string, attr: string): string[] {
  const re = new RegExp(`\\s${attr}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, 'gi');
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) out.push(m[1] ?? m[2] ?? m[3] ?? '');
  return out;
}

/** IDs defined (`id=`) and referenced (`for`, `href="#…"`, `aria-*`) in slide markup. */
export function collectIds(markupHtml: string): { defined: Set<string>; referenced: Set<string> } {
  const html = stripComments(markupHtml);
  const defined = new Set(attrValues(html, 'id').map((v) => v.trim()).filter(Boolean));
  const referenced = new Set<string>();
  for (const attr of ID_REF_ATTRS) {
    for (const v of attrValues(html, attr)) v.split(/\s+/).filter(Boolean).forEach((id) => referenced.add(id));
  }
  for (const v of attrValues(html, 'href')) if (v.startsWith('#') && v.length > 1) referenced.add(v.slice(1));
  return { defined, referenced };
}

/**
 * Build-time checks for names that stay global after assembly (keyframes, markup ID references).
 * Throws one error listing every problem.
 * @param slides selected slides, in deck order
 * @param contractCss slide contract stylesheet (its keyframes count as defined for every slide)
 */
export function checkSlides(slides: ParsedSlide[], contractCss = ''): void {
  const problems: string[] = [];

  const contractFrames = collectKeyframes(contractCss, 'slide-contract.css');
  const contractNames = new Set([...contractFrames.keys()].map((k) => k.replace(/^-[a-z]+-/i, '')));
  const owners = new Map<string, { slide: string; body: string }>();
  for (const s of slides) {
    const css = s.styles.join('\n');
    const label = `Slide ${s.key}`;
    const frames = collectKeyframes(css, label);
    for (const [name, body] of frames) {
      const prev = owners.get(name);
      if (prev && prev.body !== body) {
        problems.push(`@keyframes ${name} is defined differently in slides ${prev.slide} and ${s.key}; make the definitions identical or rename one`);
      } else if (!prev) {
        owners.set(name, { slide: s.key, body });
      }
    }
    const own = new Set([...frames.keys()].map((k) => k.replace(/^-[a-z]+-/i, '')));
    for (const name of collectAnimationNames(css, label)) {
      if (!own.has(name) && !contractNames.has(name)) {
        problems.push(`slide ${s.key} uses animation "${name}" but does not define @keyframes ${name}; copy the keyframes into the slide`);
      }
    }
  }

  const idOwners = new Map<string, string[]>();
  const refs: Array<{ slide: string; id: string }> = [];
  for (const s of slides) {
    const { defined, referenced } = collectIds(s.markupHtml);
    for (const id of defined) idOwners.set(id, [...(idOwners.get(id) ?? []), s.key]);
    for (const id of referenced) refs.push({ slide: s.key, id });
  }
  const reported = new Set<string>();
  for (const { id } of refs) {
    const where = idOwners.get(id) ?? [];
    if (where.length > 1 && !reported.has(id)) {
      reported.add(id);
      problems.push(`id "${id}" is referenced from markup (for / href / aria-*) but defined in slides ${where.join(', ')}; HTML references resolve page-wide, so give it a unique id`);
    }
  }

  if (problems.length) {
    throw new Error(`Slide checks failed:\n  - ${problems.join('\n  - ')}`);
  }
}
