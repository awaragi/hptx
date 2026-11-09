import type { CdnEntry } from '../assemble/types.ts';
import type { AssemblePlan } from '../assemble/index.ts';

function cdnLine(e: CdnEntry): string {
  return typeof e === 'string' ? e : e.src + (e.integrity ? ` (integrity)` : '');
}

export interface PrintConfigOptions {
  /** Command label shown in the banner (`build` / `dev`). */
  command: string;
}

type ConfigLine = [string, string | string[]];

/**
 * Print the assemble plan as it will be used — same object build/dev pass to assemble.
 * No extra path resolution or field remapping.
 */
export function printEffectiveConfig(plan: AssemblePlan, opts: PrintConfigOptions): void {
  const { deck, slides } = plan;
  const { config } = deck;
  const lines: ConfigLine[] = [
    ['command', opts.command],
    ['cwd', deck.root],
    ['deck', deck.configPath ?? '(none)'],
    ['version', config.version !== undefined ? String(config.version) : '(n/a)'],
    ['title', config.title ?? '(none)'],
    ['brand', config.brand ?? '(none)'],
    ['caption', config.caption ?? '(none)'],
    ['output', config.output ?? '(none)'],
    ['cover', config.cover ?? '(none)'],
    ['theme', config.theme ?? '(none)'],
    ['slides', slides.length ? slides.map((s) => s.path) : '(none)'],
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
