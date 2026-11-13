import { bakeTheme } from './bakeTheme.ts';
import { emitAssetsHtml, type AssetRegistry } from './bakeLocalImages.ts';
import { emitCdnTags } from './emitCdn.ts';
import { scopeCss, scopeSlideCss } from './scopeCss.ts';
import type { DeckConfig, ParsedSlide } from './types.ts';

export const CDN_STYLES_PLACEHOLDER = '<!-- DECK_CDN_STYLES -->';
export const CDN_SCRIPTS_PLACEHOLDER = '<!-- DECK_CDN_SCRIPTS -->';
export const SLIDES_PLACEHOLDER = '<!-- DECK_SLIDES -->';
export const CONTRACT_CSS_PLACEHOLDER = '/* DECK_CONTRACT_CSS */';
export const COVER_PLACEHOLDER = '<!-- DECK_COVER -->';
export const ASSETS_PLACEHOLDER = '<!-- DECK_ASSETS -->';
/** Attribute on the home page title block; cover CSS and the cover's `document` are scoped to it. */
export const COVER_SCOPE = '[data-deck-cover]';

export interface AssembleInput {
  template: string;
  config: DeckConfig;
  slides: ParsedSlide[];
  /** Parsed `deck.json` `cover`, rendered into the home page title block. */
  cover?: ParsedSlide;
  themeCss?: string;
  /** Slide contract stylesheet; required when the template has the contract placeholder. */
  contractCss?: string;
  /** Baked local image registry (id → data URI); omitted or empty skips emission. */
  assets?: AssetRegistry;
  /** Presentation slug for browser preference keys (`data-deck-slug`). */
  slug?: string;
}

function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(value: string): string {
  return escapeText(value).replace(/"/g, '&quot;');
}

function replacePlaceholder(html: string, placeholder: string, content: string): string {
  const idx = html.indexOf(placeholder);
  if (idx === -1) {
    throw new Error(`Template is missing the ${placeholder} placeholder`);
  }
  return html.slice(0, idx) + content + html.slice(idx + placeholder.length);
}

function setTitle(html: string, title: string): string {
  const re = /<title\b[^>]*>[\s\S]*?<\/title\s*>/i;
  if (!re.test(html)) {
    throw new Error('Template has no <title> element');
  }
  return html.replace(re, () => `<title>${escapeText(title)}</title>`);
}

/** Primary brand + optional caption → top bar (`small`) or loader (`span`) markup. */
function brandInnerHtml(brand: string, caption: string | undefined, tag: 'small' | 'span'): string {
  const primary = escapeText(brand);
  if (caption === undefined) return primary;
  const sep = tag === 'span' ? ' ' : '';
  return `${primary}${sep}<${tag}>${escapeText(caption)}</${tag}>`;
}

/** Replace the content of every leaf `<div>` whose class list contains `cls`. */
function setDivContent(html: string, cls: string, inner: string): string {
  const re = /(<div\b[^>]*\bclass="([^"]*)"[^>]*>)[^<]*(?:<(?:small|span)>[^<]*<\/(?:small|span)>)?[^<]*(<\/div>)/gi;
  return html.replace(re, (m, open: string, classes: string, close: string) =>
    classes.split(/\s+/).includes(cls) ? open + inner + close : m,
  );
}

/** Shell brand labels (top bar and loader); templates without them are left as is. */
function setBrand(html: string, brand: string, caption?: string): string {
  html = setDivContent(html, 'brand', brandInnerHtml(brand, caption, 'small'));
  return setDivContent(html, 'loader-brand', brandInnerHtml(brand, caption, 'span'));
}

/** Shell top-bar deck title. */
function setDeckTitle(html: string, title: string): string {
  return setDivContent(html, 'deck-title', escapeText(title));
}

/** Set `data-deck-slug` on the root `<html>` element for runtime preference scoping. */
function setDeckSlug(html: string, slug: string): string {
  const re = /<html\b([^>]*)>/i;
  if (!re.test(html)) {
    throw new Error('Template has no <html> element');
  }
  return html.replace(re, (_m, attrs: string) => {
    if (/\bdata-deck-slug\s*=/.test(attrs)) {
      return `<html${attrs.replace(/\bdata-deck-slug\s*=\s*(["']).*?\1/i, `data-deck-slug="${escapeAttr(slug)}"`)}>`;
    }
    return `<html${attrs} data-deck-slug="${escapeAttr(slug)}">`;
  });
}

export const SLIDE_SCOPE_OPEN = '(function (document) {';
export const SLIDE_SCOPE_CLOSE = '}).call(window, window.__deckSlideDocument(window.document.currentScript));';

/**
 * Wrap all of a slide's scripts in one function scope whose `document` is slide-scoped.
 * Each script starts on the same line it has in the slide file, so `sourceURL` stack
 * traces point at the authored line.
 */
export function wrapSlideScripts(slide: ParsedSlide): string {
  let out = SLIDE_SCOPE_OPEN;
  let line = 1;
  for (const s of slide.scripts) {
    if (s.line > line) {
      out += '\n'.repeat(s.line - line);
      line = s.line;
    } else {
      out += '\n';
      line += 1;
    }
    out += s.code;
    line += (s.code.match(/\n/g) ?? []).length;
  }
  const source = slide.sourceName.replace(/[\s'"]/g, '_');
  return `${out}\n${SLIDE_SCOPE_CLOSE}\n//# sourceURL=${source}\n`;
}

function renderSlide(slide: ParsedSlide): string {
  const css = slide.styles.map((s) => scopeSlideCss(s, slide.key)).join('\n');
  const keyAttr = escapeAttr(slide.key);
  const styleBlock = css.trim() ? `<style data-slide-style="${keyAttr}">\n${css}\n</style>\n` : '';
  const script = slide.scripts.length
    ? `\n<script data-slide-script="${keyAttr}">${wrapSlideScripts(slide)}</script>`
    : '';
  return styleBlock + `<section class="slide" data-slide="${keyAttr}">\n${slide.markupHtml}${script}\n</section>`;
}

function renderCover(cover: ParsedSlide): string {
  const css = cover.styles.map((s) => scopeCss(s, COVER_SCOPE, `Cover ${cover.sourceName}`)).join('\n');
  const styleBlock = css.trim() ? `<style data-cover-style>\n${css}\n</style>\n` : '';
  const script = cover.scripts.length ? `\n<script data-deck-cover-script>${wrapSlideScripts(cover)}</script>` : '';
  return styleBlock + cover.markupHtml + script;
}

/** Assemble the shell template with deck config, theme, cover and content slides. */
export function assembleHtml(input: AssembleInput): { html: string; warnings: string[] } {
  const { template, config, slides, cover, themeCss, contractCss, assets, slug } = input;
  const warnings: string[] = [];
  let html = template;

  if (html.includes(CONTRACT_CSS_PLACEHOLDER)) {
    if (contractCss === undefined) throw new Error('Template needs the slide contract stylesheet (contractCss)');
    if (/<\/style/i.test(contractCss)) throw new Error('slide-contract.css must not contain "</style"');
    html = replacePlaceholder(html, CONTRACT_CSS_PLACEHOLDER, contractCss);
  }

  if (config.title !== undefined) html = setDeckTitle(setTitle(html, config.title), config.title);
  if (slug !== undefined) html = setDeckSlug(html, slug);
  if (config.brand !== undefined || config.caption !== undefined) {
    html = setBrand(html, config.brand ?? 'Brand.', config.caption);
  }

  const assetsHtml = emitAssetsHtml(assets ?? {});
  if (html.includes(ASSETS_PLACEHOLDER)) {
    html = replacePlaceholder(html, ASSETS_PLACEHOLDER, assetsHtml);
  } else if (assetsHtml) {
    throw new Error(`Template is missing the ${ASSETS_PLACEHOLDER} placeholder needed for baked images`);
  }

  const { scriptHtml, linkHtml } = emitCdnTags(config.scripts, config.styles);
  html = replacePlaceholder(html, CDN_STYLES_PLACEHOLDER, linkHtml);
  html = replacePlaceholder(html, CDN_SCRIPTS_PLACEHOLDER, scriptHtml);

  if (themeCss !== undefined) {
    const baked = bakeTheme(html, themeCss);
    html = baked.html;
    warnings.push(...baked.warnings);
  }

  if (html.includes(COVER_PLACEHOLDER)) {
    html = replacePlaceholder(html, COVER_PLACEHOLDER, cover ? renderCover(cover) : '');
  } else if (cover) {
    throw new Error(`Template is missing the ${COVER_PLACEHOLDER} placeholder needed for the cover`);
  }

  const slidesHtml = slides.map(renderSlide).join('\n\n');
  html = replacePlaceholder(html, SLIDES_PLACEHOLDER, slidesHtml);

  return { html, warnings };
}
