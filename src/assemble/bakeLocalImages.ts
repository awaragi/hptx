import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { getAttr } from './parseSlide.ts';
import type { ParsedSlide } from './types.ts';

const MIME_BY_EXT: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.bmp': 'image/bmp',
};

const IMG_OR_SOURCE_RE = /<(img|source)\b([^>]*?)(\/?)>/gi;
const CSS_URL_RE = /url\(\s*(?:'([^']*)'|"([^"]*)"|([^'")]*))\s*\)/gi;

export type AssetRegistry = Record<string, string>;

export interface BakeLocalImagesResult {
  registry: AssetRegistry;
  /** Absolute paths of files baked (for dev watching). */
  imagePaths: string[];
}

export interface BakeLocalImagesItem {
  parsed: ParsedSlide;
  /** Absolute path of the slide or cover HTML file. */
  filePath: string;
  label?: string;
}

/** True when `ref` is a local relative path we may bake (not a scheme, data URI, or absolute URL path). */
export function isLocalRelativeImageRef(ref: string): boolean {
  const t = ref.trim();
  if (!t) return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(t)) return false; // scheme including data:, https:, file:
  if (t.startsWith('//')) return false;
  if (t.startsWith('/')) return false;
  return true;
}

function mimeForFile(abs: string): string {
  const ext = path.extname(abs).toLowerCase();
  const mime = MIME_BY_EXT[ext];
  if (!mime) {
    throw new Error(`Unsupported image type "${ext || '(none)'}" for ${abs}`);
  }
  return mime;
}

function assetIdForBytes(buf: Buffer): string {
  return createHash('sha256').update(buf).digest('hex').slice(0, 12);
}

function removeAttr(attrs: string, name: string): string {
  return attrs
    .replace(new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s"'>]+)`, 'i'), ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function setOrReplaceAttr(attrs: string, name: string, value: string): string {
  const cleaned = removeAttr(attrs, name);
  const escaped = value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  return `${cleaned} ${name}="${escaped}"`.trim();
}

/**
 * Discover local relative images in slide/cover markup and CSS, bake into a shared
 * data-URI registry, rewrite references, and return absolute paths for watching.
 */
export function bakeLocalImages(items: BakeLocalImagesItem[]): BakeLocalImagesResult {
  const registry: AssetRegistry = {};
  const imagePaths = new Set<string>();
  const absToId = new Map<string, string>();

  function register(filePath: string, ref: string, abs: string): string {
    const existing = absToId.get(abs);
    if (existing) {
      imagePaths.add(abs);
      return existing;
    }
    let buf: Buffer;
    try {
      buf = fs.readFileSync(abs);
    } catch (err) {
      throw new Error(
        `${labelFor(filePath)}: cannot read local image "${ref}" (${abs}): ${(err as Error).message}`,
      );
    }
    const id = assetIdForBytes(buf);
    if (!registry[id]) {
      const mime = mimeForFile(abs);
      registry[id] = `data:${mime};base64,${buf.toString('base64')}`;
    }
    absToId.set(abs, id);
    imagePaths.add(abs);
    return id;
  }

  function labelFor(filePath: string): string {
    const item = items.find((i) => i.filePath === filePath);
    return item?.label ?? path.basename(filePath);
  }

  function resolveRef(filePath: string, ref: string): string {
    const abs = path.resolve(path.dirname(filePath), ref.trim());
    return register(filePath, ref.trim(), abs);
  }

  for (const { parsed, filePath } of items) {
    parsed.styles = parsed.styles.map((css) =>
      css.replace(CSS_URL_RE, (full, q1: string | undefined, q2: string | undefined, bare: string | undefined) => {
        const ref = (q1 ?? q2 ?? bare ?? '').trim();
        if (!isLocalRelativeImageRef(ref)) return full;
        const id = resolveRef(filePath, ref);
        return `var(--asset-${id})`;
      }),
    );

    parsed.markupHtml = parsed.markupHtml.replace(
      IMG_OR_SOURCE_RE,
      (full, tag: string, attrs: string, selfClose: string) => {
        const src = getAttr(attrs, 'src');
        if (src === undefined || !isLocalRelativeImageRef(src)) return full;
        const id = resolveRef(filePath, src);
        let next = removeAttr(attrs, 'src');
        next = setOrReplaceAttr(next, 'data-asset', id);
        const close = selfClose ? ' /' : '';
        return `<${tag} ${next}${close}>`;
      },
    );
  }

  return { registry, imagePaths: [...imagePaths].sort() };
}

/** Escape JSON so it is safe inside a classic `<script>` element. */
export function assetsRegistryScriptJson(registry: AssetRegistry): string {
  return JSON.stringify(registry).replace(/</g, '\\u003c');
}

/**
 * HTML for the head assets placeholder: JSON registry + sync script that sets
 * `--asset-*` immediately and fills `img`/`source` `[data-asset]` on DOM ready
 * (body may not exist yet when the script runs in `<head>`).
 */
export function emitAssetsHtml(registry: AssetRegistry): string {
  if (Object.keys(registry).length === 0) return '';
  const json = assetsRegistryScriptJson(registry);
  return (
    `<script type="application/json" id="deck-assets">${json}</script>\n` +
    `<script>\n` +
    `(function(){\n` +
    `  var el = document.getElementById('deck-assets');\n` +
    `  if (!el) return;\n` +
    `  var reg = JSON.parse(el.textContent || '{}');\n` +
    `  var root = document.documentElement;\n` +
    `  for (var id in reg) {\n` +
    `    if (!Object.prototype.hasOwnProperty.call(reg, id)) continue;\n` +
    `    var uri = String(reg[id]).replace(/\\\\/g, '\\\\\\\\').replace(/"/g, '\\\\"');\n` +
    `    root.style.setProperty('--asset-' + id, 'url("' + uri + '")');\n` +
    `  }\n` +
    `  function applyImgs(){\n` +
    `    var nodes = document.querySelectorAll('img[data-asset], source[data-asset]');\n` +
    `    for (var i = 0; i < nodes.length; i++) {\n` +
    `      var n = nodes[i];\n` +
    `      var aid = n.getAttribute('data-asset');\n` +
    `      if (aid && reg[aid]) n.setAttribute('src', reg[aid]);\n` +
    `    }\n` +
    `  }\n` +
    `  if (document.body) applyImgs();\n` +
    `  else document.addEventListener('DOMContentLoaded', applyImgs);\n` +
    `})();\n` +
    `</script>`
  );
}
