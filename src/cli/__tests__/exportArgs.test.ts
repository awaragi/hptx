import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { exportHelpText, parseExportArgs } from '../exportArgs.ts';

describe('parseExportArgs', () => {
  const prev = process.env.INIT_CWD;

  afterEach(() => {
    if (prev === undefined) delete process.env.INIT_CWD;
    else process.env.INIT_CWD = prev;
  });

  it('defaults format to png and appearance to light', () => {
    process.env.INIT_CWD = '/work';
    const args = parseExportArgs(['--cwd', 'decks/demo']);
    expect(args.format).toBe('png');
    expect(args.appearance).toBe('light');
    expect(args.cwd).toBe(path.resolve('/work', 'decks/demo'));
  });

  it('accepts each format and dark theme', () => {
    process.env.INIT_CWD = '/work';
    expect(parseExportArgs(['--cwd', 'd', '--format', 'png-pdf']).format).toBe('png-pdf');
    expect(parseExportArgs(['--cwd', 'd', '--format', 'pdf']).format).toBe('pdf');
    expect(parseExportArgs(['--cwd', 'd', '--theme', 'dark']).appearance).toBe('dark');
  });

  it('rejects invalid format and theme', () => {
    expect(() => parseExportArgs(['--cwd', 'd', '--format', 'webp'])).toThrow(/--format must be/);
    expect(() => parseExportArgs(['--cwd', 'd', '--theme', 'blue'])).toThrow(/--theme must be light or dark/);
  });

  it('requires cwd or deck', () => {
    expect(() => parseExportArgs([])).toThrow(/--cwd/);
  });

  it('documents format and theme in help', () => {
    const help = exportHelpText();
    expect(help).toMatch(/--format/);
    expect(help).toMatch(/light\|dark/);
  });
});
