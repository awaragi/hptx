import { Command, CommanderError } from 'commander';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  contractCssPath,
  DECK_SCHEMA_VERSION,
  loadDeckFile,
  RESERVED_SLIDE_KEYS,
} from '../assemble/index.ts';
import type { CdnEntry } from '../assemble/index.ts';
import { addDeckOptions, HelpDisplayedError } from '../cli/args.ts';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export const USAGE = `Usage:
  npx hptx new deck --cwd <dir> [--title <text>] [--output <path>] ...
  npx hptx new slide --cwd <dir> --key <stem> --from <template> [--title <text>] [--after <key>] [--deck <file>]
  npx hptx new --list`;

export interface CatalogEntry {
  description: string;
  scripts?: CdnEntry[];
  styles?: CdnEntry[];
}

export interface GeneratorPaths {
  /** Folder holding `<template>.html` files and `catalog.json`. */
  templatesDir: string;
  /** The contract stylesheet generated slides link to. */
  contractCss: string;
}

export function defaultPaths(): GeneratorPaths {
  return { templatesDir: path.join(REPO_ROOT, 'templates'), contractCss: contractCssPath() };
}

export function readCatalog(paths: GeneratorPaths = defaultPaths()): Record<string, CatalogEntry> {
  const file = path.join(paths.templatesDir, 'catalog.json');
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    throw new Error(`Cannot read template catalog ${file}: ${(err as Error).message}`);
  }
}

/** `detailView` → `Detail View`; `demo-deck` → `Demo Deck`. */
export function defaultTitle(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

const KEY_RE = /^[A-Za-z][A-Za-z0-9_-]*$/;

const escapeHtml = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** JS string literal body for `quote`; `<` is escaped so the title cannot close the script. */
const escapeJs = (s: string, quote: string): string =>
  s.replace(/\\/g, '\\\\').replace(new RegExp(quote, 'g'), '\\' + quote).replace(/</g, '\\u003c').replace(/\n/g, '\\n');

function exactlyOne(html: string, re: RegExp, what: string, template: string): RegExpExecArray {
  const all = [...html.matchAll(new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g'))];
  if (all.length !== 1) {
    throw new Error(`Template "${template}" must contain exactly one ${what} (found ${all.length})`);
  }
  return all[0] as RegExpExecArray;
}

const splice = (s: string, start: number, end: number, text: string): string => s.slice(0, start) + text + s.slice(end);

/**
 * Copy a template, changing only the document `<title>`, the `title` passed to
 * `registerSlide`, and the contract stylesheet `href`. Fails when any of the three
 * is not found exactly once.
 */
export function renderTemplate(html: string, template: string, title: string, contractHref: string): string {
  let out = html;

  const reg = exactlyOne(out, /registerSlide\s*\(/, 'registerSlide( call', template);
  const titleProp = /\btitle\s*:\s*(['"])((?:\\.|(?!\1)[^\\\n])*)\1/.exec(out.slice(reg.index));
  if (!titleProp) throw new Error(`Template "${template}" must pass a quoted title to registerSlide`);
  const q = titleProp[1];
  const propStart = reg.index + titleProp.index;
  out = splice(out, propStart, propStart + titleProp[0].length, `title: ${q}${escapeJs(title, q)}${q}`);

  const doc = exactlyOne(out, /<title\b[^>]*>[^<]*<\/title>/i, '<title> element', template);
  out = splice(out, doc.index, doc.index + doc[0].length, `<title>${escapeHtml(title)}</title>`);

  const link = exactlyOne(out, /(<link\b[^>]*\bhref=)(["'])([^"']*slide-contract\.css)\2/i, 'slide-contract.css link', template);
  const hrefStart = link.index + link[1].length + 1;
  out = splice(out, hrefStart, hrefStart + link[3].length, contractHref);

  return out;
}

function writeAtomic(file: string, text: string): void {
  const tmp = `${file}.tmp.${process.pid}`;
  try {
    fs.writeFileSync(tmp, text);
    fs.renameSync(tmp, file);
  } catch (err) {
    fs.rmSync(tmp, { force: true });
    throw err;
  }
}

const cdnSrc = (e: CdnEntry): string => (typeof e === 'string' ? e : e.src);

export interface CreateSlideOptions {
  cwd: string;
  key: string;
  template: string;
  title?: string;
  after?: string;
  deck?: string;
  paths?: GeneratorPaths;
}

export interface CreateSlideResult {
  slidePath: string;
  /** CDN URLs added to deck.json. */
  addedCdn: string[];
  /** Whether deck.json `slides` was updated. */
  listed: boolean;
}

/** Create `<cwd>/<key>.html` from a template; update deck file when present. */
export function createSlide(opts: CreateSlideOptions): CreateSlideResult {
  const paths = opts.paths ?? defaultPaths();
  const { key, template } = opts;
  const root = path.resolve(opts.cwd);

  if (!KEY_RE.test(key)) {
    throw new Error(`Invalid slide key "${key}": use letters, digits, "-" or "_", starting with a letter (e.g. detail)`);
  }
  if (RESERVED_SLIDE_KEYS.includes(key)) throw new Error(`The slide key "${key}" is reserved by the shell`);

  const filename = `${key}.html`;
  const slidePath = path.join(root, filename);

  const catalog = readCatalog(paths);
  const templatePath = path.join(paths.templatesDir, `${template}.html`);
  if (!catalog[template] || !fs.existsSync(templatePath)) {
    throw new Error(`Unknown template "${template}" (available: ${Object.keys(catalog).join(', ')})`);
  }

  const autoDeck = path.join(root, 'deck.json');
  const configPath =
    opts.deck !== undefined
      ? path.resolve(opts.deck)
      : fs.existsSync(autoDeck)
        ? autoDeck
        : undefined;

  let listed = false;
  let addedCdn: string[] = [];
  let raw: Record<string, unknown> | undefined;

  if (configPath !== undefined) {
    const deck = loadDeckFile(configPath, root);
    if (slidePath === deck.outputPath) throw new Error(`"${filename}" is the deck output file`);
    if (slidePath === deck.coverPath) throw new Error(`"${filename}" is the deck's cover; pick another slide key`);
    if (fs.existsSync(slidePath)) throw new Error(`${slidePath} already exists`);

    raw = JSON.parse(fs.readFileSync(configPath, 'utf8')) as Record<string, unknown>;
    const slides = raw.slides as string[] | undefined;
    if (opts.after !== undefined) {
      if (!slides) throw new Error('--after needs a "slides" list in deck.json (this deck discovers slides by filename)');
      const idx = slides.findIndex((s) => s.replace(/\.html?$/i, '') === opts.after);
      if (idx === -1) throw new Error(`--after "${opts.after}" is not in deck.json slides (${slides.join(', ')})`);
      slides.splice(idx + 1, 0, filename);
      listed = true;
    } else if (slides) {
      if (slides.some((s) => s.replace(/\.html?$/i, '') === key)) throw new Error(`"${key}" is already listed in deck.json slides`);
      slides.push(filename);
      listed = true;
    }

    addedCdn = [];
    for (const field of ['scripts', 'styles'] as const) {
      const need = catalog[template][field] ?? [];
      if (!need.length) continue;
      const list = (raw[field] as CdnEntry[] | undefined) ?? [];
      for (const entry of need) {
        if (!list.some((e) => cdnSrc(e) === cdnSrc(entry))) {
          list.push(entry);
          addedCdn.push(cdnSrc(entry));
        }
      }
      raw[field] = list;
    }
  } else {
    if (opts.after !== undefined) {
      throw new Error('--after needs a deck file with a "slides" list');
    }
    if (fs.existsSync(slidePath)) throw new Error(`${slidePath} already exists`);
  }

  const href = path.relative(root, paths.contractCss).split(path.sep).join('/');
  const html = renderTemplate(fs.readFileSync(templatePath, 'utf8'), template, opts.title ?? defaultTitle(key), href);

  writeAtomic(slidePath, html);
  if (configPath !== undefined && raw !== undefined && (listed || addedCdn.length)) {
    try {
      writeAtomic(configPath, JSON.stringify(raw, null, 2) + '\n');
    } catch (err) {
      fs.rmSync(slidePath, { force: true });
      throw err;
    }
  }
  return { slidePath, addedCdn, listed };
}

/** Library cover copied into new decks (`templates/cover.html`); not a catalog slide template. */
export const COVER_TEMPLATE = 'cover';

/**
 * Copy the library cover, changing only the document `<title>`, the headline text, and the
 * contract stylesheet `href`.
 */
export function renderCover(html: string, title: string, contractHref: string): string {
  let out = html;
  const doc = exactlyOne(out, /<title\b[^>]*>[^<]*<\/title>/i, '<title> element', COVER_TEMPLATE);
  out = splice(out, doc.index, doc.index + doc[0].length, `<title>${escapeHtml(title)}</title>`);
  const h1 = exactlyOne(out, /(<h1\b[^>]*class="title-main"[^>]*>)[\s\S]*?(<\/h1>)/i, 'h1.title-main headline', COVER_TEMPLATE);
  out = splice(out, h1.index, h1.index + h1[0].length, `${h1[1]}${escapeHtml(title)}${h1[2]}`);
  const link = exactlyOne(out, /(<link\b[^>]*\bhref=)(["'])([^"']*slide-contract\.css)\2/i, 'slide-contract.css link', COVER_TEMPLATE);
  const hrefStart = link.index + link[1].length + 1;
  return splice(out, hrefStart, hrefStart + link[3].length, contractHref);
}

export interface CreateDeckOptions {
  cwd: string;
  title?: string;
  output?: string;
  brand?: string;
  caption?: string;
  theme?: string;
  cover?: string;
  slides?: string[];
  scripts?: CdnEntry[];
  styles?: CdnEntry[];
  paths?: GeneratorPaths;
}

/** Create a deck folder with deck.json, cover, and overview. */
export function createDeck(opts: CreateDeckOptions): { root: string; files: string[] } {
  const root = path.resolve(opts.cwd);
  const existed = fs.existsSync(root);
  if (existed && (!fs.statSync(root).isDirectory() || fs.readdirSync(root).length > 0)) {
    throw new Error(`${root} already exists and is not an empty folder`);
  }
  const name = path.basename(root);
  const title = opts.title;
  const paths = opts.paths ?? defaultPaths();
  const coverFile = opts.cover ?? `${COVER_TEMPLATE}.html`;
  const coverBasename = path.basename(coverFile);

  try {
    fs.mkdirSync(root, { recursive: true });
    const href = path.relative(root, paths.contractCss).split(path.sep).join('/');
    const coverSrc = path.join(paths.templatesDir, `${COVER_TEMPLATE}.html`);
    const coverHtml = fs.readFileSync(coverSrc, 'utf8');
    const coverTitle = title ?? defaultTitle(name);
    writeAtomic(path.join(root, coverBasename), renderCover(coverHtml, coverTitle, href));

    const json: Record<string, unknown> = {
      version: DECK_SCHEMA_VERSION,
      cover: coverBasename,
      // Empty until createSlide appends overview.html (or opts.slides replaces after).
      slides: opts.slides ?? [],
    };
    if (title !== undefined) json.title = title;
    if (opts.output !== undefined) json.output = opts.output;
    if (opts.brand !== undefined) json.brand = opts.brand;
    if (opts.caption !== undefined) json.caption = opts.caption;
    if (opts.theme !== undefined) json.theme = opts.theme;
    if (opts.scripts !== undefined) json.scripts = opts.scripts;
    if (opts.styles !== undefined) json.styles = opts.styles;

    writeAtomic(path.join(root, 'deck.json'), JSON.stringify(json, null, 2) + '\n');
    if (!opts.slides) {
      createSlide({
        cwd: root,
        key: 'overview',
        template: 'blank',
        title: 'Overview',
        paths,
      });
    }
  } catch (err) {
    if (existed) for (const f of fs.readdirSync(root)) fs.rmSync(path.join(root, f), { recursive: true, force: true });
    else fs.rmSync(root, { recursive: true, force: true });
    throw err;
  }
  return { root, files: ['deck.json', coverBasename, 'overview.html'] };
}

export type NewArgs =
  | { mode: 'list' }
  | {
      mode: 'deck';
      cwd: string;
      title?: string;
      output?: string;
      brand?: string;
      caption?: string;
      theme?: string;
      cover?: string;
      scripts?: CdnEntry[];
      styles?: CdnEntry[];
    }
  | {
      mode: 'slide';
      cwd: string;
      key: string;
      template: string;
      title?: string;
      after?: string;
      deck?: string;
    };

function mapCommanderError(err: CommanderError): Error {
  if (err.code === 'commander.helpDisplayed' || err.code === 'commander.version') {
    return new HelpDisplayedError();
  }
  const raw = err.message.replace(/^error:\s*/i, '');
  if (/unknown option/i.test(raw)) {
    const opt = raw.match(/'([^']+)'/)?.[1] ?? raw;
    return new Error(`Unknown option ${opt}`);
  }
  return new Error(raw);
}

function collect(value: string, prev: string[]): string[] {
  prev.push(value);
  return prev;
}

function httpsList(flag: string, values: string[] | undefined): CdnEntry[] | undefined {
  if (!values?.length) return undefined;
  return values.map((v, i) => {
    if (!/^https:\/\//i.test(v.trim())) throw new Error(`${flag}[${i}] must be an https:// CDN URL`);
    return v.trim();
  });
}

/** Parse `npm run new` arguments via Commander subcommands. */
export function parseNewArgs(argv: string[]): NewArgs {
  if (argv.includes('--list')) {
    if (argv.length !== 1 || argv[0] !== '--list') {
      throw new Error('--list takes no other arguments');
    }
    return { mode: 'list' };
  }

  let result: NewArgs | undefined;

  const program = new Command()
    .name('hptx new')
    .exitOverride()
    .allowExcessArguments(false);

  const deckCmd = program.command('deck').description('create a new deck folder').exitOverride();
  addDeckOptions(deckCmd);
  deckCmd.action(() => {
    const opts = deckCmd.opts<{
      cwd?: string;
      output?: string;
      theme?: string;
      cover?: string;
      title?: string;
      brand?: string;
      caption?: string;
      script?: string[];
      style?: string[];
    }>();
    if (!opts.cwd || opts.cwd.trim() === '') throw new Error('--cwd is required for new deck');
    const scripts = httpsList('--script', opts.script);
    const styles = httpsList('--style', opts.style);
    result = {
      mode: 'deck',
      cwd: opts.cwd,
      ...(opts.title !== undefined ? { title: opts.title } : {}),
      ...(opts.output !== undefined ? { output: opts.output } : {}),
      ...(opts.brand !== undefined ? { brand: opts.brand } : {}),
      ...(opts.caption !== undefined ? { caption: opts.caption } : {}),
      ...(opts.theme !== undefined ? { theme: opts.theme } : {}),
      ...(opts.cover !== undefined ? { cover: opts.cover } : {}),
      ...(scripts ? { scripts } : {}),
      ...(styles ? { styles } : {}),
    };
  });

  const slideCmd = program
    .command('slide')
    .description('create a slide from a template')
    .exitOverride()
    .requiredOption('--cwd <dir>', 'deck working root')
    .requiredOption('--key <stem>', 'slide filename stem')
    .requiredOption('--from <template>', 'slide template key')
    .option('--title <text>', 'slide title')
    .option('--after <key>', 'insert after this key in deck.json slides')
    .option('--deck <file>', 'deck JSON to update (default: <cwd>/deck.json when present)');
  slideCmd.action(() => {
    const opts = slideCmd.opts<{
      cwd: string;
      key: string;
      from: string;
      title?: string;
      after?: string;
      deck?: string;
    }>();
    result = {
      mode: 'slide',
      cwd: opts.cwd,
      key: opts.key,
      template: opts.from,
      ...(opts.title !== undefined ? { title: opts.title } : {}),
      ...(opts.after !== undefined ? { after: opts.after } : {}),
      ...(opts.deck !== undefined ? { deck: opts.deck } : {}),
    };
  });

  try {
    program.parse(argv, { from: 'user' });
  } catch (err) {
    if (err instanceof CommanderError) throw mapCommanderError(err);
    throw err;
  }

  if (!result) throw new Error('Expected subcommand "deck" or "slide" (or --list)');
  return result;
}

/**
 * Run the generator; returns the lines to print. Relative paths resolve against `cwd`.
 * Throws with a user-facing message on failure.
 */
export function runNew(argv: string[], cwd: string = process.cwd(), paths: GeneratorPaths = defaultPaths()): string[] {
  const args = parseNewArgs(argv);
  if (args.mode === 'list') {
    const catalog = readCatalog(paths);
    const width = Math.max(...Object.keys(catalog).map((k) => k.length));
    return Object.entries(catalog).map(([k, e]) => `${k.padEnd(width)}  ${e.description}`);
  }
  if (args.mode === 'deck') {
    const { root, files } = createDeck({
      cwd: path.resolve(cwd, args.cwd),
      ...(args.title !== undefined ? { title: args.title } : {}),
      ...(args.output !== undefined ? { output: args.output } : {}),
      ...(args.brand !== undefined ? { brand: args.brand } : {}),
      ...(args.caption !== undefined ? { caption: args.caption } : {}),
      ...(args.theme !== undefined ? { theme: args.theme } : {}),
      ...(args.cover !== undefined ? { cover: args.cover } : {}),
      ...(args.scripts !== undefined ? { scripts: args.scripts } : {}),
      ...(args.styles !== undefined ? { styles: args.styles } : {}),
      paths,
    });
    const rel = path.relative(cwd, root) || '.';
    return [`Created deck ${root} (${files.join(', ')})`, `Preview: npx hptx dev --cwd ${rel}`];
  }
  const res = createSlide({
    cwd: path.resolve(cwd, args.cwd),
    key: args.key,
    template: args.template,
    ...(args.title !== undefined ? { title: args.title } : {}),
    ...(args.after !== undefined ? { after: args.after } : {}),
    ...(args.deck !== undefined ? { deck: path.resolve(cwd, args.deck) } : {}),
    paths,
  });
  const lines = [`Created ${res.slidePath} from ${args.template}`];
  if (res.listed) lines.push('Added to deck.json slides');
  for (const src of res.addedCdn) lines.push(`Added ${src} to deck.json`);
  return lines;
}
