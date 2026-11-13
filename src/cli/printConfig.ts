import type { CdnEntry } from '../assemble/types.ts';
import type { AssemblePlan } from '../assemble/index.ts';
import { invocationDir } from './args.ts';
import { formatConsoleCwd, formatConsolePath } from './consolePaths.ts';

function cdnLine(e: CdnEntry): string {
  return typeof e === 'string' ? e : e.src + (e.integrity ? ` (integrity)` : '');
}

export interface PrintConfigOptions {
  /** Command label shown in the banner (`build` / `dev`). */
  command: string;
  /** Override invocation directory (tests). Defaults to `invocationDir()`. */
  invocationDir?: string;
}

type ConfigLine = [string, string | string[]];

function isHttpsUrl(s: string): boolean {
  return /^https:\/\//i.test(s);
}

/**
 * Print the assemble plan as it will be used — same object build/dev pass to assemble.
 * Filesystem paths are compacted for the console (see `consolePaths`).
 */
export function printEffectiveConfig(plan: AssemblePlan, opts: PrintConfigOptions): void {
  const { deck, slides } = plan;
  const { config } = deck;
  const inv = opts.invocationDir ?? invocationDir();
  const ctx = { cwd: deck.root, invocationDir: inv };

  const fmt = (p: string | undefined | null, none = '(none)'): string => {
    if (p === undefined || p === null || p === '') return none;
    if (isHttpsUrl(p)) return p;
    return formatConsolePath(p, ctx);
  };

  const theme =
    config.theme === undefined || config.theme === ''
      ? '(none)'
      : isHttpsUrl(config.theme)
        ? config.theme
        : formatConsolePath(config.theme, ctx);

  const lines: ConfigLine[] = [
    ['command', opts.command],
    ['cwd', formatConsoleCwd(deck.root, inv)],
    ['deck', deck.configPath ? formatConsolePath(deck.configPath, ctx) : '(none)'],
    ['version', config.version !== undefined ? String(config.version) : '(n/a)'],
    ['title', config.title ?? '(none)'],
    ['brand', config.brand ?? '(none)'],
    ['caption', config.caption ?? '(none)'],
    ['output', fmt(config.output)],
    ['cover', fmt(config.cover)],
    ['theme', theme],
    ['slides', slides.length ? slides.map((s) => formatConsolePath(s.path, ctx)) : '(none)'],
    ['scripts', config.scripts?.length ? config.scripts.map(cdnLine) : '(none)'],
    ['styles', config.styles?.length ? config.styles.map(cdnLine) : '(none)'],
  ];

  const width = Math.max(...lines.map(([k]) => k.length));
  console.log('Effective configuration:');
  for (const [k, v] of lines) {
    if (Array.isArray(v)) {
      console.log(`  ${k.padEnd(width)}  ${v[0]}`);
      for (let i = 1; i < v.length; i++) {
        console.log(`  ${''.padEnd(width)}  ${v[i]}`);
      }
    } else {
      console.log(`  ${k.padEnd(width)}  ${v}`);
    }
  }
  console.log('');
}
