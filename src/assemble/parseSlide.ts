import path from 'node:path';
import type { ParsedSlide, SlideScript } from './types.ts';

/** File name of the slide contract stylesheet; links to it are reference-only and stripped. */
export const CONTRACT_STYLESHEET = 'slide-contract.css';

const JS_TYPES = new Set([
  '',
  'text/javascript',
  'application/javascript',
  'application/ecmascript',
  'text/ecmascript',
]);

/** Slide key = filename without the `.html` extension. */
export function slideKeyFromFilename(filename: string): string {
  return path.basename(filename).replace(/\.html?$/i, '');
}

/** Read one attribute value from a raw open-tag attribute string. */
export function getAttr(attrs: string, name: string): string | undefined {
  const re = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, 'i');
  const m = re.exec(attrs);
  if (m) return m[1] ?? m[2] ?? m[3] ?? '';
  return new RegExp(`(?:^|\\s)${name}(?=\\s|$|/)`, 'i').test(attrs) ? '' : undefined;
}

function commentRanges(html: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  const re = /<!--[\s\S]*?(?:-->|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) ranges.push([m.index, m.index + m[0].length]);
  return ranges;
}

function inRanges(i: number, ranges: Array<[number, number]>): boolean {
  return ranges.some(([s, e]) => i >= s && i < e);
}

function lineAt(html: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index; i++) if (html.charCodeAt(i) === 10) line++;
  return line;
}

interface ScriptTag {
  start: number;
  end: number;
  attrs: string;
  code: string;
  codeStart: number;
}

function findScripts(html: string, from: number, to: number, comments: Array<[number, number]>): ScriptTag[] {
  const out: ScriptTag[] = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
  re.lastIndex = from;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null && m.index < to) {
    if (inRanges(m.index, comments)) continue;
    const openLen = m[0].indexOf('>') + 1;
    out.push({ start: m.index, end: m.index + m[0].length, attrs: m[1], code: m[2], codeStart: m.index + openLen });
  }
  return out;
}

function isStylesheetLink(attrs: string): boolean {
  return (getAttr(attrs, 'rel') ?? '').toLowerCase().split(/\s+/).includes('stylesheet');
}

function isContractHref(href: string): boolean {
  const clean = href.split(/[?#]/)[0];
  return clean.split('/').pop() === CONTRACT_STYLESHEET;
}

const REFERENCE_HELP = 'Declare CDN dependencies in deck.json `scripts` / `styles` instead.';

export interface ParseOptions {
  /** `cover`: the home page title block; it must not call `registerSlide`. */
  kind?: 'slide' | 'cover';
}

/**
 * Harvest a standalone slide document: head `<style>` blocks, head and body inline
 * scripts (in document order), and the body markup without its executable scripts.
 * @param html full slide document text
 * @param filename slide filename (used for the key and error messages)
 */
export function parseSlideDocument(html: string, filename: string, opts: ParseOptions = {}): ParsedSlide {
  const isCover = opts.kind === 'cover';
  const noun = isCover ? 'Cover' : 'Slide';
  const key = slideKeyFromFilename(filename);
  const label = path.basename(filename);
  const comments = commentRanges(html);

  const bodyRe = /<body\b[^>]*>/gi;
  let bodyOpen: RegExpExecArray | null;
  do bodyOpen = bodyRe.exec(html);
  while (bodyOpen && inRanges(bodyOpen.index, comments));
  if (!bodyOpen) {
    throw new Error(`${noun} ${label}: missing <body>`);
  }
  const bodyStart = bodyOpen.index + bodyOpen[0].length;
  const closeIdx = html.toLowerCase().lastIndexOf('</body');
  const bodyEnd = closeIdx >= bodyStart ? closeIdx : html.length;

  const linkRe = /<link\b([^>]*)>/gi;
  const strippedLinks: Array<[number, number]> = [];
  let lm: RegExpExecArray | null;
  while ((lm = linkRe.exec(html)) !== null) {
    if (inRanges(lm.index, comments) || !isStylesheetLink(lm[1])) continue;
    const href = getAttr(lm[1], 'href') ?? '';
    if (!isContractHref(href)) {
      throw new Error(`${noun} ${label}: external stylesheet "${href}" is not allowed. ${REFERENCE_HELP}`);
    }
    if (lm.index >= bodyStart) strippedLinks.push([lm.index, lm.index + lm[0].length]);
  }

  const head = html.slice(0, bodyOpen.index);
  const styles: string[] = [];
  const styleRe = /<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi;
  let m: RegExpExecArray | null;
  while ((m = styleRe.exec(head)) !== null) {
    if (!inRanges(m.index, comments)) styles.push(m[1]);
  }

  const scripts: SlideScript[] = [];
  const headData: string[] = [];
  const bodyRemovals: Array<[number, number]> = [...strippedLinks];
  for (const tag of findScripts(html, 0, bodyEnd, comments)) {
    const inBody = tag.start >= bodyStart;
    const src = getAttr(tag.attrs, 'src');
    if (src !== undefined) {
      throw new Error(`${noun} ${label}: external script "${src}" is not allowed. ${REFERENCE_HELP}`);
    }
    const type = (getAttr(tag.attrs, 'type') ?? '').trim().toLowerCase();
    if (type === 'module') {
      throw new Error(`${noun} ${label}: <script type="module"> is not supported; slide scripts must be classic inline scripts`);
    }
    if (!JS_TYPES.has(type)) {
      if (!inBody) headData.push(html.slice(tag.start, tag.end));
      continue;
    }
    scripts.push({ code: tag.code, line: lineAt(html, tag.codeStart), origin: inBody ? 'body' : 'head' });
    if (inBody) bodyRemovals.push([tag.start, tag.end]);
  }

  bodyRemovals.sort((a, b) => a[0] - b[0]);
  let markup = '';
  let pos = bodyStart;
  for (const [s, e] of bodyRemovals) {
    markup += html.slice(pos, s);
    pos = e;
  }
  markup += html.slice(pos, bodyEnd);
  const markupHtml = [...headData, markup.trim()].filter(Boolean).join('\n');

  if (markupHtml === '' && !scripts.some((s) => s.origin === 'body')) {
    throw new Error(`${noun} ${label}: <body> is empty`);
  }

  const calls = scripts.reduce((n, s) => n + (s.code.match(/registerSlide\s*\(/g) ?? []).length, 0);
  if (isCover) {
    if (calls > 0) {
      throw new Error(`${noun} ${label}: a cover is not a slide and must not call registerSlide(...)`);
    }
    return { key, styles, scripts, markupHtml, sourceName: label };
  }
  if (calls === 0) {
    throw new Error(`${noun} ${label}: no registerSlide(...) call found (exactly one is required)`);
  }
  if (calls > 1) {
    throw new Error(`${noun} ${label}: found ${calls} registerSlide(...) calls (exactly one is required)`);
  }

  return { key, styles, scripts, markupHtml, sourceName: label };
}
