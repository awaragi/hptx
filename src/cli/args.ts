import { Command, CommanderError } from 'commander';
import path from 'node:path';
import { resolveThemeSource } from '../assemble/loadDeckConfig.ts';
import type { CdnEntry, ThemeSource } from '../assemble/types.ts';
import type { DeckOverrides } from '../assemble/loadDeckConfig.ts';

/**
 * Directory the user ran the command from. `npm run` switches to the package
 * root and passes the original directory as INIT_CWD.
 */
export function invocationDir(): string {
  return process.env.INIT_CWD ?? process.cwd();
}

/** Resolve a path against `base`. Absolute inputs are unchanged. */
export function resolveAgainst(base: string, p: string): string {
  return path.resolve(base, p);
}

/** @deprecated Prefer resolveAgainst(workingRoot, p). Kept for callers locating --cwd/--deck. */
export function resolveCliPath(p: string): string {
  return resolveAgainst(invocationDir(), p);
}

export interface DeckArgs {
  /** Absolute working root (`--cwd`), when set. */
  cwd?: string;
  /** Absolute path to deck JSON (`--deck`), when set. */
  deck?: string;
  /** Parsed `--slide` filter entries in CLI order; undefined when the flag is absent. */
  slides?: string[];
  /** Absolute output path from `--output`; undefined when absent. */
  outputPath?: string;
  /** Theme override from `--theme`; undefined when absent. */
  theme?: ThemeSource;
  cover?: string;
  title?: string;
  brand?: string;
  caption?: string;
  scripts?: CdnEntry[];
  styles?: CdnEntry[];
}

function collect(value: string, prev: string[]): string[] {
  prev.push(value);
  return prev;
}

/** Shared long-only deck options for `dev` / `build` (and mirrored by `new deck`). */
export function addDeckOptions(command: Command): Command {
  return command
    .option('--cwd <dir>', 'working root for slides and relative deck paths')
    .option('--deck <file>', 'path to deck JSON (default: <cwd>/deck.json when present)')
    .option('--slide <key>', 'include this slide key or filename (repeatable; filter order)', collect, [])
    .option('--output <path>', 'output HTML path (required for build unless set in the deck file)')
    .option('--theme <src>', 'theme CSS (local path or https:// URL)')
    .option('--cover <file>', 'cover HTML file')
    .option('--title <text>', 'document / presentation title')
    .option('--brand <text>', 'primary brand label')
    .option('--caption <text>', 'secondary brand caption')
    .option('--script <url>', 'https CDN script URL (repeatable; replaces file scripts)', collect, [])
    .option('--style <url>', 'https CDN stylesheet URL (repeatable; replaces file styles)', collect, []);
}

export class HelpDisplayedError extends Error {
  readonly code = 'commander.helpDisplayed';
  constructor() {
    super('help displayed');
    this.name = 'HelpDisplayedError';
  }
}

function deckCommand(): Command {
  return addDeckOptions(
    new Command()
      .name('hptx')
      .exitOverride()
      .configureHelp({ helpWidth: 100 })
      .allowExcessArguments(false),
  );
}

function mapParseError(err: CommanderError): Error {
  if (err.code === 'commander.helpDisplayed' || err.code === 'commander.version') {
    return new HelpDisplayedError();
  }
  return new Error(err.message.replace(/^error: /i, ''));
}

function httpsCdnList(flag: string, values: string[] | undefined): CdnEntry[] | undefined {
  if (values === undefined || values.length === 0) return undefined;
  return values.map((v, i) => {
    const trimmed = v.trim();
    if (!/^https:\/\//i.test(trimmed)) {
      throw new Error(`${flag}[${i}] must be an https:// CDN URL`);
    }
    return trimmed;
  });
}

/**
 * Parse `--cwd` / `--deck` and deck field flags via Commander.
 * `--cwd` / `--deck` resolve against the invocation directory; all other relative
 * paths resolve against the working root. Absolute paths are accepted everywhere.
 */
export function parseDeckArgs(argv: string[]): DeckArgs {
  const program = deckCommand();
  try {
    program.parse(argv, { from: 'user' });
  } catch (err) {
    if (err instanceof CommanderError) throw mapParseError(err);
    throw err;
  }

  const opts = program.opts<{
    cwd?: string;
    deck?: string;
    slide?: string[];
    output?: string;
    theme?: string;
    cover?: string;
    title?: string;
    brand?: string;
    caption?: string;
    script?: string[];
    style?: string[];
  }>();

  if (opts.cwd === undefined && opts.deck === undefined) {
    throw new Error('Provide --cwd <dir> and/or --deck <file>');
  }

  const inv = invocationDir();
  const result: DeckArgs = {};

  if (opts.cwd !== undefined) {
    if (opts.cwd.trim() === '') throw new Error('--cwd requires a path');
    result.cwd = resolveAgainst(inv, opts.cwd);
  }
  if (opts.deck !== undefined) {
    if (opts.deck.trim() === '') throw new Error('--deck requires a path');
    result.deck = resolveAgainst(inv, opts.deck);
  }

  const root = result.cwd ?? path.dirname(result.deck!);

  if (opts.slide !== undefined && opts.slide.length > 0) {
    const slides = opts.slide.map((s) => s.trim()).filter(Boolean);
    if (slides.length === 0) throw new Error('--slide requires a slide key or filename');
    result.slides = slides;
  }
  if (opts.output !== undefined) {
    if (opts.output.trim() === '') throw new Error('--output requires a path');
    result.outputPath = resolveAgainst(root, opts.output);
  }
  if (opts.theme !== undefined) {
    result.theme = resolveThemeSource(opts.theme, root, '--theme');
  }
  if (opts.cover !== undefined) {
    if (opts.cover.trim() === '') throw new Error('--cover requires a path');
    result.cover = resolveAgainst(root, opts.cover);
  }
  if (opts.title !== undefined) result.title = opts.title;
  if (opts.brand !== undefined) {
    if (opts.brand.trim() === '') throw new Error('--brand must be a non-empty string');
    result.brand = opts.brand;
  }
  if (opts.caption !== undefined) {
    if (opts.caption.trim() === '') throw new Error('--caption must be a non-empty string');
    result.caption = opts.caption;
  }
  const scripts = httpsCdnList('--script', opts.script);
  if (scripts) result.scripts = scripts;
  const styles = httpsCdnList('--style', opts.style);
  if (styles) result.styles = styles;

  return result;
}

/** Map parsed CLI args into assemble overrides (excluding slides filter and cwd/deck). */
export function deckArgsToOverrides(args: DeckArgs): DeckOverrides {
  return {
    ...(args.outputPath !== undefined ? { outputPath: args.outputPath } : {}),
    ...(args.theme !== undefined ? { theme: args.theme } : {}),
    ...(args.cover !== undefined ? { cover: args.cover } : {}),
    ...(args.title !== undefined ? { title: args.title } : {}),
    ...(args.brand !== undefined ? { brand: args.brand } : {}),
    ...(args.caption !== undefined ? { caption: args.caption } : {}),
    ...(args.scripts !== undefined ? { scripts: args.scripts } : {}),
    ...(args.styles !== undefined ? { styles: args.styles } : {}),
  };
}

/** Shared usage hint for build/dev error paths. */
export const DECK_USAGE =
  'Usage: npx hptx <dev|build> --cwd <dir> | --deck <file> [--slide key]... [--output path] [--theme src] ...';
