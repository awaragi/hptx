import { getAttr } from './parseSlide.ts';

/** Same classic JS MIME set as slide harvesting (`parseSlide`). */
const JS_SCRIPT_TYPES = new Set([
  '',
  'text/javascript',
  'application/javascript',
  'application/ecmascript',
  'text/ecmascript',
]);

const STYLE_RE = /<style(\b[^>]*)>([\s\S]*?)<\/style\s*>/gi;
const SCRIPT_RE = /<script(\b[^>]*)>([\s\S]*?)<\/script\s*>/gi;

function escapeScriptBody(code: string): string {
  return code.replace(/<\/script/gi, '<\\/script');
}

function hasSrcAttr(attrs: string): boolean {
  return getAttr(attrs, 'src') !== undefined;
}

/** True for classic inline JS (no `type` or a JavaScript MIME). Data blocks are false. */
function isClassicInlineJs(attrs: string): boolean {
  if (hasSrcAttr(attrs)) return false;
  const type = (getAttr(attrs, 'type') ?? '').trim().toLowerCase();
  return JS_SCRIPT_TYPES.has(type);
}

function scriptLabel(attrs: string): string {
  const id = getAttr(attrs, 'id');
  const type = getAttr(attrs, 'type');
  const parts = [
    id !== undefined && id !== '' ? `id=${id}` : undefined,
    type !== undefined && type !== '' ? `type=${type}` : undefined,
  ].filter(Boolean);
  return parts.length ? parts.join(' ') : 'inline script';
}

/** Inclusive ranges of real HTML `<script>…</script>` elements (document order). */
function scriptElementRanges(html: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  const re = new RegExp(SCRIPT_RE.source, 'gi');
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    ranges.push([m.index, m.index + m[0].length]);
  }
  return ranges;
}

function inRanges(index: number, ranges: Array<[number, number]>): boolean {
  return ranges.some(([start, end]) => index >= start && index < end);
}

/**
 * Minify inline `<style>` and classic inline `<script>` bodies in assembled HTML.
 * Leaves markup, attributes, `<script src>`, and non-JS data blocks (e.g.
 * `type="application/json"`) unchanged. Does not collapse HTML whitespace
 * outside style/script bodies.
 *
 * Style tags that appear only as text inside a `<script>` (e.g. the speaker-notes
 * document builder) MUST NOT be treated as real stylesheets — matching them
 * corrupts the JS (NOTES_WINDOW_CSS concat).
 *
 * Loads `esbuild` on demand so Vitest's jsdom environment is not forced to import it
 * for suites that never minify.
 */
export async function minifyAssembledHtml(html: string): Promise<string> {
  const { transformSync } = await import('esbuild');

  const minifyCss = (css: string): string => {
    try {
      return transformSync(css, { loader: 'css', minify: true }).code.trimEnd();
    } catch (err) {
      throw new Error(`CSS minify failed: ${(err as Error).message}`);
    }
  };

  const minifyJs = (js: string, label: string): string => {
    try {
      return transformSync(js, { loader: 'js', minify: true }).code.trimEnd();
    } catch (err) {
      throw new Error(`JavaScript minify failed (${label}): ${(err as Error).message}`);
    }
  };

  // Skip <style> matches that live inside real <script> elements (string builders).
  const scriptRanges = scriptElementRanges(html);
  let out = '';
  let last = 0;
  const styleRe = new RegExp(STYLE_RE.source, 'gi');
  let sm: RegExpExecArray | null;
  while ((sm = styleRe.exec(html)) !== null) {
    if (inRanges(sm.index, scriptRanges)) continue;
    const attrs = sm[1] ?? '';
    const body = sm[2] ?? '';
    out += html.slice(last, sm.index);
    if (!body.trim()) {
      out += sm[0];
    } else {
      out += `<style${attrs}>${minifyCss(body)}</style>`;
    }
    last = sm.index + sm[0].length;
  }
  out += html.slice(last);

  out = out.replace(new RegExp(SCRIPT_RE.source, 'gi'), (full, attrs: string, body: string) => {
    if (!isClassicInlineJs(attrs)) return full;
    if (!body.trim()) return full;
    const label = scriptLabel(attrs);
    return `<script${attrs}>${escapeScriptBody(minifyJs(body, label))}</script>`;
  });

  return out;
}
