import postcss from 'postcss';

export const THEME_START_MARKER = 'DECK THEME — START';
export const THEME_END_MARKER = 'DECK THEME — END';

interface ThemeRegion {
  /** Index just after the comment that closes the START marker line. */
  bodyStart: number;
  /** Index of the `/*` that opens the END marker comment. */
  bodyEnd: number;
}

function findThemeRegion(html: string): ThemeRegion | null {
  const startIdx = html.indexOf(THEME_START_MARKER);
  if (startIdx === -1) return null;
  const startClose = html.indexOf('*/', startIdx);
  if (startClose === -1) return null;
  const bodyStart = startClose + 2;

  const endIdx = html.indexOf(THEME_END_MARKER, bodyStart);
  if (endIdx === -1) return null;
  const bodyEnd = html.lastIndexOf('/*', endIdx);
  if (bodyEnd < bodyStart) return null;

  return { bodyStart, bodyEnd };
}

/** Collect `--*` custom property names declared in `:root` rules of a CSS string. */
function rootTokens(css: string): string[] {
  const names = new Set<string>();
  const root = postcss.parse(css);
  root.walkRules((rule) => {
    const isRoot = rule.selectors.some((s) => s.trim().toLowerCase() === ':root');
    if (!isRoot) return;
    rule.each((child) => {
      if (child.type === 'decl' && child.prop.startsWith('--')) names.add(child.prop);
    });
  });
  return [...names];
}

/**
 * Parse the `:root { --* }` token names from the deck-theme region of
 * a shell template. Returns `[]` when the markers are absent.
 */
export function readDefaultThemeTokens(templateHtml: string): string[] {
  const region = findThemeRegion(templateHtml);
  if (!region) return [];
  return rootTokens(templateHtml.slice(region.bodyStart, region.bodyEnd));
}

/**
 * Append `themeCss` after the default tokens between the theme markers (markers kept).
 * CSS cascade lets the bake override defaults; unspecified tokens keep shell values.
 * Warns (never fails) about `:root` tokens extra to the default block.
 */
export function bakeTheme(
  html: string,
  themeCss: string,
  defaultRootTokens?: string[],
): { html: string; warnings: string[] } {
  if (/<\/style/i.test(themeCss)) {
    throw new Error('Theme CSS must not contain "</style"');
  }
  const region = findThemeRegion(html);
  if (!region) {
    throw new Error(`Template is missing the "${THEME_START_MARKER}" / "${THEME_END_MARKER}" markers`);
  }

  const defaults = defaultRootTokens ?? readDefaultThemeTokens(html);
  const warnings: string[] = [];
  try {
    const theme = new Set(rootTokens(themeCss));
    const known = new Set(defaults);
    for (const t of theme) {
      if (!known.has(t)) warnings.push(`Theme :root declares extra token ${t} not in the shell default`);
    }
  } catch (err) {
    warnings.push(`Could not parse theme CSS to check tokens: ${(err as Error).message}`);
  }

  const existing = html.slice(region.bodyStart, region.bodyEnd);
  const next =
    html.slice(0, region.bodyStart) +
    '\n' +
    existing.trimEnd() +
    '\n' +
    themeCss.trim() +
    '\n  ' +
    html.slice(region.bodyEnd);
  return { html: next, warnings };
}
