import fs from 'node:fs';
import path from 'node:path';
import { parseSlideDocument, slideKeyFromFilename } from './parseSlide.ts';
import type { ResolvedDeck, ResolvedSlide } from './types.ts';

export const RESERVED_SLIDE_KEYS = ['agenda'];

function discoverHtmlFiles(deck: ResolvedDeck): string[] {
  return fs
    .readdirSync(deck.root, { withFileTypes: true })
    .filter((e) => e.isFile() && /\.html$/i.test(e.name))
    .map((e) => e.name)
    .filter((name) => {
      const abs = path.resolve(deck.root, name);
      return abs !== deck.outputPath && abs !== deck.coverPath;
    })
    .sort();
}

/** Absolute path of the deck's cover file, or undefined. Throws when it is configured but missing. */
export function resolveCover(deck: ResolvedDeck): string | undefined {
  if (!deck.coverPath) return undefined;
  if (!fs.existsSync(deck.coverPath)) {
    throw new Error(`Cover file not found: ${deck.coverPath}`);
  }
  return deck.coverPath;
}

function checkKeys(slides: ResolvedSlide[]): void {
  const seen = new Map<string, ResolvedSlide>();
  for (const s of slides) {
    if (RESERVED_SLIDE_KEYS.includes(s.key)) {
      throw new Error(`Slide "${s.filename}": the key "${s.key}" is reserved by the shell`);
    }
    const prior = seen.get(s.key);
    if (prior) {
      throw new Error(
        `Duplicate slide key "${s.key}": "${prior.filename}" and "${s.filename}" share the same filename stem`,
      );
    }
    seen.set(s.key, s);
  }
}

/**
 * Resolve the full, ordered slide set: `deck.json` `slides`, else `*.html` in the
 * deck root (sorted, excluding `output` and `cover`). Neither file is ever a slide.
 */
export function resolveSlideList(deck: ResolvedDeck): ResolvedSlide[] {
  resolveCover(deck);
  const explicit = deck.config.slides;
  const filenames = explicit ?? discoverHtmlFiles(deck);

  const slides: ResolvedSlide[] = filenames.map((entry) => {
    const abs = path.resolve(deck.root, entry);
    // Display name relative to the working root when possible (stable for nested paths).
    const rel = path.relative(deck.root, abs).split(path.sep).join('/');
    const filename = rel && !rel.startsWith('..') ? rel : path.basename(abs);
    if (abs === deck.outputPath) {
      throw new Error(`Slide "${filename}" is the deck output file and cannot be a slide`);
    }
    if (abs === deck.coverPath) {
      throw new Error(`"${path.basename(abs)}" is the deck cover and must not be listed in "slides"`);
    }
    return { key: slideKeyFromFilename(abs), filename, path: abs };
  });

  checkKeys(slides);

  if (!explicit) {
    for (const s of slides) {
      try {
        parseSlideDocument(fs.readFileSync(s.path, 'utf8'), s.path);
      } catch (err) {
        throw new Error(
          `Discovered file "${s.filename}" is not a valid slide: ${(err as Error).message}. ` +
            `Move it out of the deck root or list slides explicitly with "slides" in deck.json.`,
        );
      }
    }
  } else {
    for (const s of slides) {
      if (!fs.existsSync(s.path)) {
        throw new Error(`Slide file not found: "${s.filename}" (${s.path})`);
      }
    }
  }

  return slides;
}

/**
 * Filter the full slide set by CLI `--slide` entries (key or filename), keeping
 * CLI order. Unknown or repeated entries throw.
 */
export function filterSlides(all: ResolvedSlide[], entries: string[]): ResolvedSlide[] {
  const byKey = new Map(all.map((s) => [s.key, s] as const));
  const seen = new Set<string>();
  const out: ResolvedSlide[] = [];

  for (const raw of entries) {
    const entry = raw.trim();
    if (entry === '') {
      throw new Error('--slide contains an empty entry');
    }
    const key = slideKeyFromFilename(entry);
    const slide = byKey.get(key);
    if (!slide) {
      throw new Error(
        `Unknown slide "${entry}" in --slide (available: ${all.map((s) => s.key).join(', ') || 'none'})`,
      );
    }
    if (seen.has(key)) {
      throw new Error(`Duplicate slide "${entry}" in --slide`);
    }
    seen.add(key);
    out.push(slide);
  }
  return out;
}
