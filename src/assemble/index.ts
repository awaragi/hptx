import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assembleHtml } from './assembleHtml.ts';
import { bakeLocalImages } from './bakeLocalImages.ts';
import { checkSlides } from './checkSlides.ts';
import { resolveDeckInvocation, type DeckOverrides } from './loadDeckConfig.ts';
import { parseSlideDocument } from './parseSlide.ts';
import { filterSlides, resolveCover, resolveSlideList } from './resolveSlides.ts';
import type { ResolvedDeck, ResolvedSlide, ThemeSource } from './types.ts';

export * from './types.ts';
export * from './loadDeckConfig.ts';
export * from './resolveSlides.ts';
export * from './parseSlide.ts';
export * from './scopeCss.ts';
export * from './bakeTheme.ts';
export * from './bakeLocalImages.ts';
export * from './emitCdn.ts';
export * from './assembleHtml.ts';
export * from './checkSlides.ts';

export const THEME_FETCH_TIMEOUT_MS = 10_000;
/** Env var overriding the default shell template path. */
export const TEMPLATE_ENV_VAR = 'HPTX_SHELL_TEMPLATE';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export function defaultTemplatePath(): string {
  const fromEnv = process.env[TEMPLATE_ENV_VAR];
  return fromEnv ? path.resolve(fromEnv) : path.join(REPO_ROOT, 'shell', 'template.html');
}

/** The slide contract stylesheet (`shell/contract/slide-contract.css`). */
export function contractCssPath(): string {
  return path.join(REPO_ROOT, 'shell', 'contract', 'slide-contract.css');
}

export function readContractCss(): string {
  try {
    return fs.readFileSync(contractCssPath(), 'utf8');
  } catch (err) {
    throw new Error(`Cannot read slide contract stylesheet ${contractCssPath()}: ${(err as Error).message}`);
  }
}

async function readThemeCss(theme: NonNullable<ResolvedDeck['theme']>): Promise<string> {
  if (theme.kind === 'path') {
    try {
      return fs.readFileSync(theme.value, 'utf8');
    } catch (err) {
      throw new Error(`Cannot read theme ${theme.value}: ${(err as Error).message}`);
    }
  }
  try {
    const res = await fetch(theme.value, { signal: AbortSignal.timeout(THEME_FETCH_TIMEOUT_MS) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (err) {
    throw new Error(`Cannot fetch theme ${theme.value}: ${(err as Error).message}`);
  }
}

export interface AssembleDeckOptions {
  /** Absolute working root (`--cwd`). */
  cwd?: string;
  /** Path to deck JSON (`--deck`). */
  deck?: string;
  /** Base dir for resolving relative cwd/deck (default: process.cwd()). */
  baseDir?: string;
  /** CLI `--slide` filter entries (key or filename), in desired order. */
  slides?: string[];
  /** Shell template path (default: $HPTX_SHELL_TEMPLATE or shell/template.html). */
  templatePath?: string;
  /** Absolute output path override (CLI `--output`). */
  outputPath?: string;
  /** Theme source override (CLI `--theme`). */
  theme?: ThemeSource;
  cover?: string;
  title?: string;
  brand?: string;
  caption?: string;
  scripts?: import('./types.ts').CdnEntry[];
  styles?: import('./types.ts').CdnEntry[];
  /** When true, require effective output (build). Default false. */
  requireOutput?: boolean;
  /**
   * Legacy: absolute deck root that must contain deck.json.
   * Prefer `cwd` / `deck`. When set alone, treated as `--cwd`.
   */
  deckRoot?: string;
}

/** Fully resolved assemble inputs — compute once, print, then assemble from this. */
export interface AssemblePlan {
  deck: ResolvedDeck;
  /** Slides that will be assembled (after optional CLI filter), absolute paths. */
  slides: ResolvedSlide[];
  templatePath: string;
  requireOutput: boolean;
}

export interface AssembleDeckResult {
  html: string;
  outputPath: string;
  warnings: string[];
  deck: ResolvedDeck;
  /** Absolute paths of local images baked into this assemble (for dev watching). */
  imagePaths: string[];
}

/** Resolve working root + optional deck file + CLI overrides (no assemble). */
export function resolveFromOpts(opts: AssembleDeckOptions): ResolvedDeck {
  const baseDir = opts.baseDir ?? process.cwd();
  const overrides: DeckOverrides = {
    ...(opts.outputPath !== undefined ? { outputPath: opts.outputPath } : {}),
    ...(opts.theme !== undefined ? { theme: opts.theme } : {}),
    ...(opts.cover !== undefined ? { cover: opts.cover } : {}),
    ...(opts.title !== undefined ? { title: opts.title } : {}),
    ...(opts.brand !== undefined ? { brand: opts.brand } : {}),
    ...(opts.caption !== undefined ? { caption: opts.caption } : {}),
    ...(opts.scripts !== undefined ? { scripts: opts.scripts } : {}),
    ...(opts.styles !== undefined ? { styles: opts.styles } : {}),
  };

  if (opts.cwd !== undefined || opts.deck !== undefined) {
    return resolveDeckInvocation({
      ...(opts.cwd !== undefined ? { cwd: opts.cwd } : {}),
      ...(opts.deck !== undefined ? { deck: opts.deck } : {}),
      baseDir,
      overrides,
      requireOutput: opts.requireOutput === true,
    });
  }

  if (opts.deckRoot !== undefined) {
    return resolveDeckInvocation({
      cwd: opts.deckRoot,
      baseDir,
      overrides,
      requireOutput: opts.requireOutput === true,
    });
  }

  throw new Error('Provide --cwd <dir> and/or --deck <file>');
}

/** Compute the assemble plan once (resolve config + select slides). */
export function planAssemble(opts: AssembleDeckOptions): AssemblePlan {
  const deck = resolveFromOpts(opts);
  const all = resolveSlideList(deck);
  const slides = opts.slides ? filterSlides(all, opts.slides) : all;
  const templatePath = opts.templatePath ? path.resolve(opts.templatePath) : defaultTemplatePath();
  return { deck, slides, templatePath, requireOutput: opts.requireOutput === true };
}

/** Assemble from an already-computed plan (no second resolve). */
export async function assembleFromPlan(plan: AssemblePlan): Promise<AssembleDeckResult> {
  const { deck, slides: selected, templatePath, requireOutput } = plan;

  const sourceName = (abs: string) => path.relative(deck.root, abs).split(path.sep).join('/');
  const parsed = selected.map((s) => ({
    ...parseSlideDocument(fs.readFileSync(s.path, 'utf8'), s.path),
    sourceName: sourceName(s.path),
  }));
  const coverPath = resolveCover(deck);
  const cover = coverPath
    ? { ...parseSlideDocument(fs.readFileSync(coverPath, 'utf8'), coverPath, { kind: 'cover' }), sourceName: sourceName(coverPath) }
    : undefined;
  const bakeItems = [
    ...selected.map((s, i) => ({
      parsed: parsed[i]!,
      filePath: s.path,
      label: sourceName(s.path),
    })),
    ...(cover && coverPath
      ? [{ parsed: cover, filePath: coverPath, label: sourceName(coverPath) }]
      : []),
  ];
  const { registry: assets, imagePaths } = bakeLocalImages(bakeItems);
  const contractCss = readContractCss();
  checkSlides(cover ? [cover, ...parsed] : parsed, contractCss);
  const theme = deck.theme;
  const themeCss = theme ? await readThemeCss(theme) : undefined;

  let template: string;
  try {
    template = fs.readFileSync(templatePath, 'utf8');
  } catch (err) {
    throw new Error(`Cannot read shell template ${templatePath}: ${(err as Error).message}`);
  }

  const { html, warnings } = assembleHtml({
    template,
    config: deck.config,
    slides: parsed,
    ...(cover ? { cover } : {}),
    contractCss,
    assets,
    ...(themeCss !== undefined ? { themeCss } : {}),
  });

  const outputPath = deck.outputPath ?? deck.config.output;
  if (outputPath === undefined && requireOutput) {
    throw new Error('"output" is required (set it in the deck file or pass --output)');
  }
  return {
    html,
    outputPath: outputPath ?? path.join(deck.root, 'Deck.html'),
    warnings,
    deck,
    imagePaths,
  };
}

/** Resolve and assemble a deck into a single HTML string. Does not write output. */
export async function assembleDeck(
  deckRootOrOpts: string | AssembleDeckOptions = {},
  maybeOpts: AssembleDeckOptions = {},
): Promise<AssembleDeckResult> {
  const opts: AssembleDeckOptions =
    typeof deckRootOrOpts === 'string'
      ? { ...maybeOpts, deckRoot: deckRootOrOpts }
      : deckRootOrOpts;

  return assembleFromPlan(planAssemble(opts));
}
