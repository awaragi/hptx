import path from 'node:path';

/** Max leading `..` segments allowed in a compact console path. */
const MAX_LEADING_DOTDOT = 2;

function toPosix(p: string): string {
  return p.split(path.sep).join('/');
}

/** Count leading `..` segments in a posix-style relative path. */
export function leadingDotDotCount(rel: string): number {
  if (!rel || rel === '.') return 0;
  let n = 0;
  for (const part of rel.split('/')) {
    if (part === '..') n++;
    else break;
  }
  return n;
}

function usableRelative(rel: string): boolean {
  if (path.isAbsolute(rel)) return false;
  return leadingDotDotCount(toPosix(rel)) <= MAX_LEADING_DOTDOT;
}

function normalizeRel(rel: string): string {
  const d = toPosix(rel);
  return d === '' ? '.' : d;
}

export interface ConsolePathContext {
  cwd: string;
  invocationDir: string;
}

/** Format the working-root line: invocation-relative when shallow, else absolute. */
export function formatConsoleCwd(cwd: string, invocationDir: string): string {
  const absCwd = path.resolve(cwd);
  const rel = path.relative(path.resolve(invocationDir), absCwd);
  if (!usableRelative(rel)) return absCwd;
  return normalizeRel(rel);
}

/**
 * Format a filesystem path for CLI console: shorter of invocation-relative vs
 * `<cwd>/…`; absolute when every candidate needs more than `../../`.
 */
export function formatConsolePath(absPath: string, ctx: ConsolePathContext): string {
  const abs = path.resolve(absPath);
  const cwd = path.resolve(ctx.cwd);
  const inv = path.resolve(ctx.invocationDir);

  const candidates: string[] = [];

  const invRel = path.relative(inv, abs);
  if (usableRelative(invRel)) {
    candidates.push(normalizeRel(invRel));
  }

  const cwdRel = path.relative(cwd, abs);
  if (usableRelative(cwdRel)) {
    const norm = normalizeRel(cwdRel);
    candidates.push(norm === '.' ? '<cwd>' : `<cwd>/${norm}`);
  }

  if (candidates.length === 0) return abs;

  candidates.sort((a, b) => {
    if (a.length !== b.length) return a.length - b.length;
    const aCwd = a === '<cwd>' || a.startsWith('<cwd>/');
    const bCwd = b === '<cwd>' || b.startsWith('<cwd>/');
    if (aCwd !== bCwd) return aCwd ? -1 : 1;
    return 0;
  });
  return candidates[0]!;
}
