import { Command } from 'commander';
import { HelpDisplayedError } from './args.ts';
import { runBuild } from './build.ts';
import { runDev } from './dev.ts';
import { runNewCommand } from './new.ts';

export type RootCommand = 'build' | 'dev' | 'new';

export interface ParsedRoot {
  command: RootCommand;
  args: string[];
}

const COMMANDS: readonly RootCommand[] = ['build', 'dev', 'new'];

const DESCRIPTIONS: Record<RootCommand, string> = {
  build: 'Write the single-file presentation HTML',
  dev: 'Live-reload preview server',
  new: 'Scaffold a deck or slide (deck | slide | --list)',
};

function rootProgram(): Command {
  const program = new Command()
    .name('hptx')
    .description('HTML presentation platform CLI')
    .configureHelp({ helpWidth: 100 })
    .addHelpCommand(false);

  for (const name of COMMANDS) {
    program.command(name).description(DESCRIPTIONS[name]);
  }
  return program;
}

/** Root CLI help text (subcommands listed). */
export function rootHelpText(): string {
  return rootProgram().helpInformation();
}

function isRootCommand(value: string): value is RootCommand {
  return (COMMANDS as readonly string[]).includes(value);
}

/**
 * Parse top-level `hptx <build|dev|new> …`. Leaf flag parsing stays in each command.
 * Throws {@link HelpDisplayedError} when root help was printed.
 */
export function parseRootArgs(argv: string[]): ParsedRoot {
  if (argv.length === 0 || argv[0] === '--help' || argv[0] === '-h') {
    process.stdout.write(rootHelpText());
    throw new HelpDisplayedError();
  }

  const [head, ...rest] = argv;
  if (!isRootCommand(head)) {
    throw new Error(`Unknown command '${head}'`);
  }
  return { command: head, args: rest };
}

/** Dispatch `argv` (typically `process.argv.slice(2)`) to build / dev / new. */
export async function runMain(argv: string[]): Promise<void> {
  let root: ParsedRoot;
  try {
    root = parseRootArgs(argv);
  } catch (err) {
    if (err instanceof HelpDisplayedError) return;
    console.error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
    return;
  }

  if (root.command === 'build') {
    await runBuild(root.args);
    return;
  }
  if (root.command === 'dev') {
    await runDev(root.args);
    return;
  }
  runNewCommand(root.args);
}

const entry = process.argv[1] ?? '';
const isDirect =
  /(?:^|[/\\])(?:cli[/\\]main\.ts|bin[/\\]hptx\.js|hptx)$/.test(entry);

if (isDirect) {
  runMain(process.argv.slice(2)).catch((err) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
}
