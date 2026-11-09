import { runNew, USAGE } from '../generate/index.ts';
import { HelpDisplayedError, invocationDir } from './args.ts';

/** Run generator; `argv` is flags/subcommands after the `new` subcommand. */
export function runNewCommand(argv: string[]): void {
  if (argv.length === 0) {
    console.error(USAGE);
    process.exitCode = 1;
    return;
  }
  try {
    for (const line of runNew(argv, invocationDir())) console.log(line);
  } catch (err) {
    if (err instanceof HelpDisplayedError) return;
    console.error(err instanceof Error ? err.message : String(err));
    console.error(USAGE);
    process.exitCode = 1;
  }
}
