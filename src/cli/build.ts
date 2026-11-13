import fs from 'node:fs';
import path from 'node:path';
import { assembleFromPlan, planAssemble } from '../assemble/index.ts';
import type { AssembleDeckOptions } from '../assemble/index.ts';
import { DECK_USAGE, HelpDisplayedError, invocationDir, parseDeckArgs } from './args.ts';
import { formatConsolePath } from './consolePaths.ts';
import { printEffectiveConfig } from './printConfig.ts';

function assembleOptsFromArgs(args: ReturnType<typeof parseDeckArgs>, requireOutput: boolean): AssembleDeckOptions {
  return {
    ...(args.cwd !== undefined ? { cwd: args.cwd } : {}),
    ...(args.deck !== undefined ? { deck: args.deck } : {}),
    baseDir: '/',
    requireOutput,
    ...(args.slides ? { slides: args.slides } : {}),
    ...(args.outputPath ? { outputPath: args.outputPath } : {}),
    ...(args.theme ? { theme: args.theme } : {}),
    ...(args.cover ? { cover: args.cover } : {}),
    ...(args.title ? { title: args.title } : {}),
    ...(args.brand ? { brand: args.brand } : {}),
    ...(args.caption ? { caption: args.caption } : {}),
    ...(args.scripts ? { scripts: args.scripts } : {}),
    ...(args.styles ? { styles: args.styles } : {}),
  };
}

/** Assemble and write the deck; `argv` is flags after the `build` subcommand. */
export async function runBuild(argv: string[]): Promise<void> {
  let args;
  try {
    args = parseDeckArgs(argv);
  } catch (err) {
    if (err instanceof HelpDisplayedError) return;
    console.error((err as Error).message);
    console.error(DECK_USAGE);
    process.exitCode = 1;
    return;
  }

  const plan = planAssemble(assembleOptsFromArgs(args, true));
  printEffectiveConfig(plan, { command: 'build' });

  const { html, outputPath, warnings } = await assembleFromPlan(plan);
  for (const w of warnings) console.error(w);

  const tmpPath = `${outputPath}.tmp.${process.pid}`;
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  try {
    fs.writeFileSync(tmpPath, html);
    fs.renameSync(tmpPath, outputPath);
  } catch (err) {
    fs.rmSync(tmpPath, { force: true });
    throw err;
  }
  console.log(
    `Wrote ${formatConsolePath(outputPath, { cwd: plan.deck.root, invocationDir: invocationDir() })}`,
  );
}
