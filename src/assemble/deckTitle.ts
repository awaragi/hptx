import path from 'node:path';

/**
 * Filesystem-safe presentation slug from a resolved deck title.
 * Lowercase; non-alphanumeric runs become a single hyphen; edges trimmed.
 */
export function slugifyTitle(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

export interface ResolveDeckTitleInput {
  /** CLI `--title` when provided (may need trim). */
  cliTitle?: string;
  /** File-layer title when provided (already trimmed at parse when from deck.json). */
  fileTitle?: string;
  /** Absolute or relative effective output path. */
  outputPath?: string;
  /** Absolute working root. */
  root: string;
}

export interface ResolvedDeckTitle {
  /** Display title (trimmed). */
  title: string;
  /** Presentation slug for export paths and browser pref keys. */
  slug: string;
}

/**
 * Resolve deck title: CLI → file → output stem → cwd basename.
 * Rejects empty-after-trim explicit titles and titles that slugify to empty.
 */
export function resolveDeckTitle(input: ResolveDeckTitleInput): ResolvedDeckTitle {
  const explicit =
    input.cliTitle !== undefined
      ? input.cliTitle
      : input.fileTitle !== undefined
        ? input.fileTitle
        : undefined;

  let title: string;
  if (explicit !== undefined) {
    title = explicit.trim();
    if (!title) throw new Error('"title" must be a non-empty string');
  } else if (input.outputPath !== undefined) {
    title = path.parse(input.outputPath).name;
    if (!title) {
      throw new Error(`Cannot derive title from output path: ${input.outputPath}`);
    }
  } else {
    title = path.basename(path.resolve(input.root));
    if (!title || title === '.' || title === '..') {
      throw new Error(`Cannot derive title from working root: ${input.root}`);
    }
  }

  const slug = slugifyTitle(title);
  if (!slug) {
    throw new Error('"title" must produce a non-empty slug');
  }
  return { title, slug };
}
