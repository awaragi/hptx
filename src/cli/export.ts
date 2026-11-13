import type { AssembleDeckOptions } from '../assemble/index.ts';
import { assembleFromPlan, planAssemble } from '../assemble/index.ts';
import { HelpDisplayedError, invocationDir } from './args.ts';
import type { ExportArgs } from './exportArgs.ts';
import { EXPORT_USAGE, exportHelpText, parseExportArgs } from './exportArgs.ts';
import { formatConsolePath, type ConsolePathContext } from './consolePaths.ts';
import { launchSystemChrome } from './exportChrome.ts';
import { captureExport } from './exportCapture.ts';
import { exportArtifactPaths } from './exportPaths.ts';
import { serveAssembledHtml } from './exportServe.ts';
import { printEffectiveConfig } from './printConfig.ts';

function assembleOptsFromExport(args: ExportArgs): AssembleDeckOptions {
  return {
    ...(args.cwd !== undefined ? { cwd: args.cwd } : {}),
    ...(args.deck !== undefined ? { deck: args.deck } : {}),
    baseDir: '/',
    requireOutput: true,
    ...(args.slides ? { slides: args.slides } : {}),
    ...(args.outputPath ? { outputPath: args.outputPath } : {}),
    ...(args.cover ? { cover: args.cover } : {}),
    ...(args.title ? { title: args.title } : {}),
    ...(args.brand ? { brand: args.brand } : {}),
    ...(args.caption ? { caption: args.caption } : {}),
    ...(args.scripts ? { scripts: args.scripts } : {}),
    ...(args.styles ? { styles: args.styles } : {}),
  };
}

function printExportSummary(opts: {
  format: string;
  appearance: string;
  name: string;
  paths: string[];
  pathCtx: ConsolePathContext;
}): void {
  const show = (p: string) => formatConsolePath(p, opts.pathCtx);
  console.log('Export:');
  console.log(`  format       ${opts.format}`);
  console.log(`  appearance   ${opts.appearance}`);
  console.log(`  name         ${opts.name}`);
  console.log(`  artifacts    ${opts.paths[0] !== undefined ? show(opts.paths[0]) : '(none)'}`);
  for (let i = 1; i < opts.paths.length; i++) {
    console.log(`               ${show(opts.paths[i]!)}`);
  }
  console.log('');
}

/** Assemble and export; `argv` is flags after the `export` subcommand. */
export async function runExport(argv: string[]): Promise<void> {
  let args: ExportArgs;
  try {
    if (argv[0] === '--help' || argv[0] === '-h') {
      process.stdout.write(exportHelpText());
      return;
    }
    args = parseExportArgs(argv);
  } catch (err) {
    if (err instanceof HelpDisplayedError) return;
    console.error((err as Error).message);
    console.error(EXPORT_USAGE);
    process.exitCode = 1;
    return;
  }

  let plan;
  try {
    plan = planAssemble(assembleOptsFromExport(args));
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    console.error(EXPORT_USAGE);
    process.exitCode = 1;
    return;
  }

  printEffectiveConfig(plan, { command: 'export' });

  let assembled;
  try {
    assembled = await assembleFromPlan(plan);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
    return;
  }

  const { html, outputPath, warnings, deck } = assembled;
  for (const w of warnings) console.error(w);

  const artifacts = exportArtifactPaths({ outputPath, name: deck.slug });
  const pathCtx: ConsolePathContext = {
    cwd: plan.deck.root,
    invocationDir: invocationDir(),
  };
  const summaryPaths =
    args.format === 'print'
      ? [artifacts.printPdfPath]
      : args.format === 'pdf'
        ? [artifacts.pngDir, artifacts.pngPdfPath]
        : args.format === 'pptx'
          ? [artifacts.pngDir, artifacts.pptxPath]
          : [artifacts.pngDir];
  printExportSummary({
    format: args.format,
    appearance: args.appearance,
    name: artifacts.name,
    paths: summaryPaths,
    pathCtx,
  });

  const server = await serveAssembledHtml(html);
  let browser;
  try {
    browser = await launchSystemChrome();
    const result = await captureExport({
      browser,
      url: server.url,
      appearance: args.appearance,
      format: args.format,
      pngDir: artifacts.pngDir,
      pngPdfPath: artifacts.pngPdfPath,
      pptxPath: artifacts.pptxPath,
      printPdfPath: artifacts.printPdfPath,
      ...(args.progress ? { onProgress: (line) => console.log(line) } : {}),
    });
    if (result.pngPaths.length) {
      console.log(
        `Wrote ${result.pngPaths.length} PNG(s) under ${formatConsolePath(artifacts.pngDir, pathCtx)}`,
      );
    }
    if (result.pdfPath) {
      console.log(`Wrote ${formatConsolePath(result.pdfPath, pathCtx)}`);
    }
    if (result.pptxPath) {
      console.log(`Wrote ${formatConsolePath(result.pptxPath, pathCtx)}`);
    }
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close().catch(() => {});
    await server.close().catch(() => {});
  }
}
