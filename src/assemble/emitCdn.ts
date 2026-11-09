import type { CdnEntry } from './types.ts';

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function normalize(entry: CdnEntry): { src: string; integrity?: string; crossorigin?: string } {
  return typeof entry === 'string' ? { src: entry } : entry;
}

function extraAttrs(e: { integrity?: string; crossorigin?: string }): string {
  let out = '';
  if (e.integrity !== undefined) out += ` integrity="${escapeAttr(e.integrity)}"`;
  if (e.crossorigin !== undefined) out += ` crossorigin="${escapeAttr(e.crossorigin)}"`;
  return out;
}

/** Emit classic (no async/defer) `<script src>` and `<link rel="stylesheet">` tags. */
export function emitCdnTags(
  scripts: CdnEntry[] = [],
  styles: CdnEntry[] = [],
): { scriptHtml: string; linkHtml: string } {
  const scriptHtml = scripts
    .map(normalize)
    .map((e) => `<script src="${escapeAttr(e.src)}"${extraAttrs(e)}></script>`)
    .join('\n');
  const linkHtml = styles
    .map(normalize)
    .map((e) => `<link rel="stylesheet" href="${escapeAttr(e.src)}"${extraAttrs(e)}>`)
    .join('\n');
  return { scriptHtml, linkHtml };
}
