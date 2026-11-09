import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer, type Plugin } from 'vite';
import { assembleFromPlan, contractCssPath, defaultTemplatePath, planAssemble } from '../assemble/index.ts';
import type { AssembleDeckOptions, AssemblePlan } from '../assemble/index.ts';
import { DECK_USAGE, HelpDisplayedError, parseDeckArgs } from './args.ts';
import { printEffectiveConfig } from './printConfig.ts';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function assembleOptsFromArgs(args: ReturnType<typeof parseDeckArgs>): AssembleDeckOptions {
  return {
    ...(args.cwd !== undefined ? { cwd: args.cwd } : {}),
    ...(args.deck !== undefined ? { deck: args.deck } : {}),
    baseDir: '/',
    ...(args.slides ? { slides: args.slides } : {}),
    ...(args.theme ? { theme: args.theme } : {}),
    ...(args.cover ? { cover: args.cover } : {}),
    ...(args.title ? { title: args.title } : {}),
    ...(args.brand ? { brand: args.brand } : {}),
    ...(args.caption ? { caption: args.caption } : {}),
    ...(args.scripts ? { scripts: args.scripts } : {}),
    ...(args.styles ? { styles: args.styles } : {}),
  };
}

/** Start the live preview server; `argv` is flags after the `dev` subcommand. */
export async function runDev(argv: string[]): Promise<void> {
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

  const opts = assembleOptsFromArgs(args);
  let plan: AssemblePlan = planAssemble(opts);
  printEffectiveConfig(plan, { command: 'dev' });

  const first = await assembleFromPlan(plan);
  first.warnings.forEach((w) => console.warn(w));
  const deckRoot = plan.deck.root;
  const configPath = plan.deck.configPath;

  const plugin: Plugin = {
    name: 'hptx-assemble',
    configureServer(server) {
      const watched = [
        path.join(deckRoot, '**', '*.html'),
        defaultTemplatePath(),
        contractCssPath(),
      ];
      if (configPath) watched.push(configPath);
      const theme = plan.deck.theme;
      if (theme?.kind === 'path') watched.push(theme.value);
      server.watcher.add(watched);

      const reload = (file: string) => {
        const abs = path.resolve(file);
        const root = deckRoot + path.sep;
        if (abs.startsWith(root) || abs === configPath || watched.includes(abs)) {
          server.ws.send({ type: 'full-reload' });
        }
      };
      server.watcher.on('change', reload);
      server.watcher.on('add', reload);
      server.watcher.on('unlink', reload);

      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0] ?? '';
        if (url !== '/' && url !== '/index.html') return next();
        try {
          // Re-plan on each request so deck.json / slide edits are picked up.
          plan = planAssemble(opts);
          const { html, warnings } = await assembleFromPlan(plan);
          warnings.forEach((w) => console.warn(w));
          const transformed = await server.transformIndexHtml(req.url ?? '/', html);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(transformed);
        } catch (e) {
          console.error(e instanceof Error ? e.message : String(e));
          res.statusCode = 500;
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end(e instanceof Error ? e.message : String(e));
        }
      });
    },
  };

  const server = await createServer({
    root: REPO_ROOT,
    configFile: false,
    appType: 'custom',
    plugins: [plugin],
    server: { port: 5173 },
  });
  await server.listen();
  server.printUrls();
}
