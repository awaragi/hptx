import fs from 'node:fs';
import path from 'node:path';
import { resolveDeckTitle } from './deckTitle.ts';
import type { CdnEntry, DeckConfig, ResolvedDeck, ThemeSource } from './types.ts';

export const DECK_SCHEMA_VERSION = 1;

const KNOWN_FIELDS = [
  'version',
  'slides',
  'output',
  'cover',
  'theme',
  'scripts',
  'styles',
  'title',
  'brand',
  'caption',
] as const;
const CDN_OBJECT_KEYS = ['src', 'integrity', 'crossorigin'];

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Resolve a theme string (deck.json or CLI) against `baseDir` for local paths.
 * Rejects non-https remote schemes. Empty/whitespace-only values are rejected.
 */
export function resolveThemeSource(value: string, baseDir: string, label = 'theme'): ThemeSource {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${label} must be a non-empty string`);
  if (/^[a-z][a-z0-9+.-]+:/i.test(trimmed)) {
    if (!isHttpsUrl(trimmed)) {
      throw new Error(`${label} ${describe(trimmed)} is not allowed; remote themes must use https://`);
    }
    return { kind: 'url', value: trimmed };
  }
  return { kind: 'path', value: path.resolve(baseDir, trimmed) };
}

function describe(value: unknown): string {
  return JSON.stringify(value) ?? String(value);
}

function validateCdnList(field: 'scripts' | 'styles', value: unknown, label: string): CdnEntry[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label}: "${field}" must be an array of https:// CDN URLs`);
  }
  const fail = (index: number, detail: string): never => {
    throw new Error(`${label}: ${field}[${index}] ${detail}; ${field} must be https:// CDN URLs`);
  };
  return value.map((entry, i): CdnEntry => {
    if (typeof entry === 'string') {
      if (!isHttpsUrl(entry)) fail(i, `(${describe(entry)}) is not an https:// URL`);
      return entry;
    }
    if (!isPlainObject(entry)) {
      return fail(i, `(${describe(entry)}) must be a string or { src, integrity?, crossorigin? }`);
    }
    for (const k of Object.keys(entry)) {
      if (!CDN_OBJECT_KEYS.includes(k)) fail(i, `has unknown key "${k}"`);
    }
    const { src, integrity, crossorigin } = entry;
    if (typeof src !== 'string' || !isHttpsUrl(src)) {
      fail(i, `has a missing or non-https "src" (${describe(src)})`);
    }
    if (integrity !== undefined && typeof integrity !== 'string') {
      fail(i, '"integrity" must be a string');
    }
    if (crossorigin !== undefined && typeof crossorigin !== 'string') {
      fail(i, '"crossorigin" must be a string');
    }
    const out: { src: string; integrity?: string; crossorigin?: string } = { src: src as string };
    if (integrity !== undefined) out.integrity = integrity as string;
    if (crossorigin !== undefined) out.crossorigin = crossorigin as string;
    return out;
  });
}

/** Validate parsed deck JSON data (file layer). Throws on any contract violation. */
export function validateDeckConfig(raw: unknown, label = 'deck.json'): DeckConfig {
  if (!isPlainObject(raw)) {
    throw new Error(`${label}: must be a JSON object`);
  }
  const unknown = Object.keys(raw).filter((k) => !(KNOWN_FIELDS as readonly string[]).includes(k));
  if (unknown.length > 0) {
    const names = unknown.map((k) => `"${k}"`).join(', ');
    throw new Error(
      `${label}: unknown field${unknown.length > 1 ? 's' : ''} ${names} (allowed: ${KNOWN_FIELDS.join(', ')})`,
    );
  }

  if (raw.version === undefined) {
    throw new Error(`${label}: "version" is required`);
  }
  if (typeof raw.version !== 'number' || !Number.isInteger(raw.version)) {
    throw new Error(`${label}: "version" must be an integer`);
  }
  if (raw.version !== DECK_SCHEMA_VERSION) {
    throw new Error(
      `${label}: version ${raw.version} is not supported (this toolchain supports ${DECK_SCHEMA_VERSION})`,
    );
  }

  if (raw.output !== undefined) {
    if (typeof raw.output !== 'string' || raw.output.trim() === '') {
      throw new Error(`${label}: "output" must be a non-empty string`);
    }
  }

  const config: DeckConfig = { version: raw.version };

  if (raw.output !== undefined) config.output = raw.output as string;

  if (raw.slides !== undefined) {
    if (
      !Array.isArray(raw.slides) ||
      !raw.slides.every((s) => typeof s === 'string' && s.trim() !== '')
    ) {
      throw new Error(`${label}: "slides" must be an array of non-empty filename strings`);
    }
    config.slides = raw.slides as string[];
  }

  if (raw.cover !== undefined) {
    if (typeof raw.cover !== 'string' || raw.cover.trim() === '') {
      throw new Error(`${label}: "cover" must be a non-empty string`);
    }
    if (!/\.html?$/i.test(raw.cover)) {
      throw new Error(`${label}: cover ${describe(raw.cover)} must be an .html file`);
    }
    config.cover = raw.cover;
  }

  if (raw.theme !== undefined) {
    if (typeof raw.theme !== 'string' || raw.theme.trim() === '') {
      throw new Error(`${label}: "theme" must be a non-empty string`);
    }
    resolveThemeSource(raw.theme, '.', `${label}: theme`);
    config.theme = raw.theme;
  }

  if (raw.scripts !== undefined) config.scripts = validateCdnList('scripts', raw.scripts, label);
  if (raw.styles !== undefined) config.styles = validateCdnList('styles', raw.styles, label);

  for (const field of ['title', 'brand', 'caption'] as const) {
    if (raw[field] !== undefined) {
      if (typeof raw[field] !== 'string') {
        throw new Error(`${label}: "${field}" must be a string`);
      }
      const trimmed = (raw[field] as string).trim();
      if (trimmed === '') {
        throw new Error(`${label}: "${field}" must be a non-empty string`);
      }
      config[field] = trimmed;
    }
  }

  return config;
}

/**
 * Make filesystem paths in a deck config absolute against `root`.
 * https theme URLs and CDN entries are left unchanged. Idempotent for already-absolute paths.
 */
export function absolutizeDeckConfig(root: string, config: DeckConfig): DeckConfig {
  const abs = path.resolve(root);
  const out: DeckConfig = { ...config };
  if (out.output !== undefined) out.output = path.resolve(abs, out.output);
  if (out.cover !== undefined) out.cover = path.resolve(abs, out.cover);
  if (out.theme !== undefined) {
    const theme = resolveThemeSource(out.theme, abs, 'theme');
    out.theme = theme.value;
  }
  if (out.slides !== undefined) {
    out.slides = out.slides.map((s) => path.resolve(abs, s));
  }
  return out;
}

function pathsFromConfig(root: string, config: DeckConfig, label: string): Pick<ResolvedDeck, 'outputPath' | 'coverPath' | 'theme'> {
  // `config` must already be absolutized.
  const outputPath = config.output;
  const coverPath = config.cover;
  if (coverPath !== undefined && outputPath !== undefined && coverPath === outputPath) {
    throw new Error(`${label}: cover "${config.cover}" is the deck output file`);
  }
  const theme =
    config.theme !== undefined ? resolveThemeSource(config.theme, root, `${label}: theme`) : undefined;
  return {
    ...(outputPath !== undefined ? { outputPath } : {}),
    ...(coverPath !== undefined ? { coverPath } : {}),
    ...(theme !== undefined ? { theme } : {}),
  };
}

/** Load and validate a deck JSON file; resolve paths against `root`. */
export function loadDeckFile(configPath: string, root: string): ResolvedDeck {
  const absConfig = path.resolve(configPath);
  const absRoot = path.resolve(root);
  let text: string;
  try {
    text = fs.readFileSync(absConfig, 'utf8');
  } catch (err) {
    throw new Error(`Cannot read ${absConfig}: ${(err as Error).message}`);
  }

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (err) {
    throw new Error(`Invalid JSON in ${absConfig}: ${(err as Error).message}`);
  }

  const label = path.basename(absConfig);
  const config = absolutizeDeckConfig(absRoot, validateDeckConfig(raw, label));
  const derived = pathsFromConfig(absRoot, config, label);
  const titleFromFile = config.title;
  const { title, slug } = resolveDeckTitle({
    ...(titleFromFile !== undefined ? { fileTitle: titleFromFile } : {}),
    outputPath: derived.outputPath,
    root: absRoot,
  });
  config.title = title;
  return {
    root: absRoot,
    configPath: absConfig,
    config,
    slug,
    ...(titleFromFile !== undefined ? { titleFromFile } : {}),
    ...derived,
  };
}

/**
 * Load `<deckRoot>/deck.json` when present. Throws if the file is missing or invalid.
 * Prefer `resolveDeckInvocation` for CLI entry points.
 */
export function loadDeckConfig(deckRoot: string): ResolvedDeck {
  const root = path.resolve(deckRoot);
  const configPath = path.join(root, 'deck.json');
  if (!fs.existsSync(configPath)) {
    throw new Error(`Cannot read ${configPath}: file not found`);
  }
  return loadDeckFile(configPath, root);
}

/** CLI / call-site overrides merged over a deck file (paths already absolute where needed). */
export interface DeckOverrides {
  /** Absolute output path from `--output`. */
  outputPath?: string;
  /** Theme from `--theme` (already resolved). */
  theme?: ThemeSource;
  /** Cover path string (absolute or relative to working root). */
  cover?: string;
  title?: string;
  brand?: string;
  caption?: string;
  /** When set (including empty array), replaces file scripts entirely. */
  scripts?: CdnEntry[];
  /** When set (including empty array), replaces file styles entirely. */
  styles?: CdnEntry[];
}

const DEFAULTS: Pick<DeckConfig, 'brand'> = {
  brand: 'Brand.',
};

function mergeEffective(file: DeckConfig | undefined, overrides: DeckOverrides): DeckConfig {
  const config: DeckConfig = {
    ...(file?.version !== undefined ? { version: file.version } : {}),
    brand: overrides.brand ?? file?.brand ?? DEFAULTS.brand,
  };

  if (overrides.outputPath !== undefined) config.output = overrides.outputPath;
  else if (file?.output !== undefined) config.output = file.output;

  if (overrides.cover !== undefined) config.cover = overrides.cover;
  else if (file?.cover !== undefined) config.cover = file.cover;

  if (overrides.theme !== undefined) {
    // Store a path/url string for config consumers that read config.theme; ResolvedDeck.theme wins.
    config.theme = overrides.theme.kind === 'url' ? overrides.theme.value : overrides.theme.value;
  } else if (file?.theme !== undefined) {
    config.theme = file.theme;
  }

  if (overrides.caption !== undefined) config.caption = overrides.caption;
  else if (file?.caption !== undefined) config.caption = file.caption;

  if (file?.slides !== undefined) config.slides = file.slides;

  if (overrides.scripts !== undefined) config.scripts = overrides.scripts;
  else if (file?.scripts !== undefined) config.scripts = file.scripts;

  if (overrides.styles !== undefined) config.styles = overrides.styles;
  else if (file?.styles !== undefined) config.styles = file.styles;

  return config;
}

export interface ResolveDeckInvocationInput {
  /** Absolute working root, or relative (caller should resolve). */
  cwd?: string;
  /** Absolute or relative path to a deck JSON file. */
  deck?: string;
  /** Base directory for resolving relative `--cwd` / `--deck` (invocation dir). */
  baseDir: string;
  overrides?: DeckOverrides;
  /** When true (build), effective `output` is required. */
  requireOutput?: boolean;
}

/**
 * Resolve working root + optional deck file + CLI overrides into an effective ResolvedDeck.
 */
export function resolveDeckInvocation(input: ResolveDeckInvocationInput): ResolvedDeck {
  const { baseDir, overrides = {}, requireOutput = false } = input;
  if (!input.cwd && !input.deck) {
    throw new Error('Provide --cwd <dir> and/or --deck <file>');
  }

  const deckFileAbs = input.deck !== undefined ? path.resolve(baseDir, input.deck) : undefined;
  const root = path.resolve(
    input.cwd !== undefined ? path.resolve(baseDir, input.cwd) : path.dirname(deckFileAbs!),
  );

  let fileDeck: ResolvedDeck | undefined;
  const autoPath = path.join(root, 'deck.json');
  const configPath = deckFileAbs ?? (fs.existsSync(autoPath) ? autoPath : undefined);
  if (configPath !== undefined) {
    fileDeck = loadDeckFile(configPath, root);
  }

  const merged = mergeEffective(fileDeck?.config, overrides);

  if (requireOutput && merged.output === undefined && overrides.outputPath === undefined) {
    throw new Error('"output" is required (set it in the deck file or pass --output)');
  }

  // Prefer CLI absolute output already in overrides; mergeEffective may have left a relative file value.
  if (overrides.outputPath !== undefined) merged.output = overrides.outputPath;
  if (overrides.cover !== undefined) {
    merged.cover = path.isAbsolute(overrides.cover) ? overrides.cover : path.resolve(root, overrides.cover);
  }
  if (overrides.theme !== undefined) {
    merged.theme = overrides.theme.value;
  }

  const effective = absolutizeDeckConfig(root, merged);
  const derived = pathsFromConfig(root, effective, 'deck');
  const { title, slug } = resolveDeckTitle({
    ...(overrides.title !== undefined ? { cliTitle: overrides.title } : {}),
    ...(fileDeck?.titleFromFile !== undefined ? { fileTitle: fileDeck.titleFromFile } : {}),
    outputPath: derived.outputPath,
    root,
  });
  effective.title = title;

  return {
    root,
    ...(configPath !== undefined ? { configPath } : {}),
    config: effective,
    slug,
    ...(fileDeck?.titleFromFile !== undefined ? { titleFromFile: fileDeck.titleFromFile } : {}),
    ...derived,
  };
}
