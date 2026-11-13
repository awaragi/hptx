import { Command, CommanderError } from 'commander';
import path from 'node:path';
import {
  HelpDisplayedError,
  invocationDir,
  resolveAgainst,
} from './args.ts';
import type { CdnEntry } from '../assemble/types.ts';

export type ExportFormat = 'png' | 'pdf' | 'print';
export type AppearanceTheme = 'light' | 'dark';

const FORMATS = new Set<ExportFormat>(['png', 'pdf', 'print']);
const APPEARANCES = new Set<AppearanceTheme>(['light', 'dark']);

export interface ExportArgs {
  cwd?: string;
  deck?: string;
  slides?: string[];
  outputPath?: string;
  cover?: string;
  title?: string;
  brand?: string;
  caption?: string;
  scripts?: CdnEntry[];
  styles?: CdnEntry[];
  /** Capture format; default png. */
  format: ExportFormat;
  /** Shell light/dark appearance; default light. Not a CSS theme file. */
  appearance: AppearanceTheme;
  /** Log each frame as it is written (`(s/S - n/N) file`). */
  progress: boolean;
}

function collect(value: string, prev: string[]): string[] {
  prev.push(value);
  return prev;
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

function exportCommand(): Command {
  return new Command()
    .name('hptx export')
    .description(
      'Export slide frames / PDFs via system Chrome (playwright-core). ' +
        'Print-layout PDF: --format print, or Cmd/Ctrl+P on the previewed/built HTML.',
    )
    .exitOverride()
    .configureHelp({ helpWidth: 100 })
    .allowExcessArguments(false)
    .option('--cwd <dir>', 'working root for slides and relative deck paths')
    .option('--deck <file>', 'path to deck JSON (default: <cwd>/deck.json when present)')
    .option('--slide <key>', 'include this slide key or filename (repeatable; filter order)', collect, [])
    .option('--output <path>', 'HTML output path (required unless set in the deck file; names export artifacts)')
    .option('--format <fmt>', 'png | pdf | print (one per run; default: png)')
    .option('--theme <light|dark>', 'presentation appearance light|dark (default: light; not a CSS theme file)')
    .option('--progress', 'log each frame as (slide/total - step/steps) filename')
    .option('--cover <file>', 'cover HTML file')
    .option('--title <text>', 'document / presentation title')
    .option('--brand <text>', 'primary brand label')
    .option('--caption <text>', 'secondary brand caption')
    .option('--script <url>', 'https CDN script URL (repeatable; replaces file scripts)', collect, [])
    .option('--style <url>', 'https CDN stylesheet URL (repeatable; replaces file styles)', collect, []);
}

/** Help text for `hptx export --help`. */
export function exportHelpText(): string {
  return exportCommand().helpInformation();
}

export const EXPORT_USAGE =
  'Usage: npx hptx export --cwd <dir> | --deck <file> [--format png|pdf|print] [--theme light|dark] [--progress] [--output path] ...';

/**
 * Parse export flags. `--theme` is appearance (light|dark), not a CSS theme path.
 * CSS bake still comes from the deck file.
 */
export function parseExportArgs(argv: string[]): ExportArgs {
  const program = exportCommand();
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
    format?: string;
    theme?: string;
    progress?: boolean;
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

  let format: ExportFormat = 'png';
  if (opts.format !== undefined) {
    const f = opts.format.trim() as ExportFormat;
    if (!FORMATS.has(f)) {
      throw new Error(`--format must be png, pdf, or print (got '${opts.format}')`);
    }
    format = f;
  }

  let appearance: AppearanceTheme = 'light';
  if (opts.theme !== undefined) {
    const t = opts.theme.trim() as AppearanceTheme;
    if (!APPEARANCES.has(t)) {
      throw new Error(`--theme must be light or dark (got '${opts.theme}')`);
    }
    appearance = t;
  }

  const inv = invocationDir();
  const result: ExportArgs = { format, appearance, progress: opts.progress === true };

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
