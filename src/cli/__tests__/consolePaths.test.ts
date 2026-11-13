import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatConsoleCwd, formatConsolePath, leadingDotDotCount } from '../consolePaths.ts';

describe('leadingDotDotCount', () => {
  it('counts only leading .. segments', () => {
    expect(leadingDotDotCount('.')).toBe(0);
    expect(leadingDotDotCount('a/b')).toBe(0);
    expect(leadingDotDotCount('../x')).toBe(1);
    expect(leadingDotDotCount('../../x')).toBe(2);
    expect(leadingDotDotCount('../../../x')).toBe(3);
  });
});

describe('formatConsoleCwd', () => {
  it('shows relative when under invocation', () => {
    expect(formatConsoleCwd('/proj/templates', '/proj')).toBe('templates');
  });

  it('shows . when cwd equals invocation', () => {
    expect(formatConsoleCwd('/proj', '/proj')).toBe('.');
  });

  it('shows absolute when more than ../../ from invocation', () => {
    const cwd = '/a/b/c/d';
    const inv = '/a/x';
    // relative is ../../b/c/d → 2 leading .. → still allowed
    expect(formatConsoleCwd('/a/b', '/a/x/y/z')).toBe(path.resolve('/a/b'));
  });
});

describe('formatConsolePath', () => {
  const inv = '/proj';
  const cwd = '/proj/templates';

  it('prefers shorter <cwd>/ form under the working root', () => {
    expect(formatConsolePath('/proj/templates/deck.json', { cwd, invocationDir: inv })).toBe(
      '<cwd>/deck.json',
    );
  });

  it('prefers invocation-relative when shorter than <cwd>/../…', () => {
    expect(formatConsolePath('/proj/dist/templates.html', { cwd, invocationDir: inv })).toBe(
      'dist/templates.html',
    );
  });

  it('prints <cwd> alone for the working root', () => {
    expect(formatConsolePath('/proj/templates', { cwd, invocationDir: inv })).toBe('<cwd>');
  });

  it('falls back to absolute when more than ../../ is required', () => {
    const deepInv = '/proj/a/b/c/d';
    const deepCwd = '/proj/a/b/c/d/deck';
    // path outside both with many hops
    const far = '/other/place/file.html';
    expect(formatConsolePath(far, { cwd: deepCwd, invocationDir: deepInv })).toBe(
      path.resolve(far),
    );
  });

  it('allows up to ../../ in a candidate', () => {
    // from cwd /proj/templates/nested, target /proj/dist/out.html → <cwd>/../../dist/out.html (2 ..)
    // inv /proj → dist/out.html shorter
    expect(
      formatConsolePath('/proj/dist/out.html', {
        cwd: '/proj/templates/nested',
        invocationDir: '/proj',
      }),
    ).toBe('dist/out.html');
  });

  it('compacts build Wrote and export artifact paths like the CLI', () => {
    const ctx = { cwd, invocationDir: inv };
    expect(formatConsolePath('/proj/dist/templates.html', ctx)).toBe('dist/templates.html');
    expect(formatConsolePath('/proj/dist/slide-templates/png', ctx)).toBe(
      'dist/slide-templates/png',
    );
  });
});
