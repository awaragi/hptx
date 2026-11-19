import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { exportHelpText, parseExportArgs } from '../exportArgs.ts';

describe('parseExportArgs', () => {
  const prev = process.env.INIT_CWD;

  afterEach(() => {
    if (prev === undefined) delete process.env.INIT_CWD;
    else process.env.INIT_CWD = prev;
  });

  it('defaults format to png and progress off; settings optional', () => {
    process.env.INIT_CWD = '/work';
    const args = parseExportArgs(['--cwd', 'decks/demo']);
    expect(args.format).toBe('png');
    expect(args.settings).toBeUndefined();
    expect(args.progress).toBe(false);
    expect(args.cwd).toBe(path.resolve('/work', 'decks/demo'));
  });

  it('accepts each format, settings appearance, and progress', () => {
    process.env.INIT_CWD = '/work';
    expect(parseExportArgs(['--cwd', 'd', '--format', 'pdf']).format).toBe('pdf');
    expect(parseExportArgs(['--cwd', 'd', '--format', 'print']).format).toBe('print');
    expect(parseExportArgs(['--cwd', 'd', '--format', 'pptx']).format).toBe('pptx');
    expect(parseExportArgs(['--cwd', 'd', '--settings.appearance', 'dark']).settings).toEqual({
      appearance: 'dark',
    });
    expect(parseExportArgs(['--cwd', 'd', '--progress']).progress).toBe(true);
  });

  it('rejects invalid format and settings values; rejects old --theme', () => {
    expect(() => parseExportArgs(['--cwd', 'd', '--format', 'webp'])).toThrow(/--format must be/);
    expect(() => parseExportArgs(['--cwd', 'd', '--format', 'png-pdf'])).toThrow(/--format must be/);
    expect(() => parseExportArgs(['--cwd', 'd', '--settings.appearance', 'blue'])).toThrow(
      /--settings\.appearance must be light or dark/,
    );
    expect(() => parseExportArgs(['--cwd', 'd', '--theme', 'dark'])).toThrow(/unknown option/i);
  });

  it('defaults cwd to invocation directory when --cwd and --deck are omitted', () => {
    process.env.INIT_CWD = '/work';
    expect(parseExportArgs([]).cwd).toBe(path.resolve('/work'));
  });

  it('documents format, settings appearance, progress, and HTML print in help', () => {
    const help = exportHelpText();
    expect(help).toMatch(/--format/);
    expect(help).toMatch(/png \| pdf \| print \| pptx/);
    expect(help).toMatch(/--settings\.appearance/);
    expect(help).toMatch(/--progress/);
    expect(help).toMatch(/Cmd\/Ctrl\+P/);
    expect(help).not.toMatch(/--theme <light\|dark>/);
  });
});
