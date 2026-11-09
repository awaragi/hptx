import { describe, expect, it } from 'vitest';
import { HelpDisplayedError } from '../args.ts';
import { parseRootArgs, rootHelpText } from '../main.ts';

describe('parseRootArgs', () => {
  it('lists build, dev, and new in root help', () => {
    const text = rootHelpText();
    expect(text).toMatch(/build/);
    expect(text).toMatch(/dev/);
    expect(text).toMatch(/\bnew\b/);
  });

  it('throws HelpDisplayedError for --help and empty argv', () => {
    expect(() => parseRootArgs(['--help'])).toThrow(HelpDisplayedError);
    expect(() => parseRootArgs([])).toThrow(HelpDisplayedError);
  });

  it('routes build/dev/new and passes remaining argv', () => {
    expect(parseRootArgs(['build', '--cwd', 'templates'])).toEqual({
      command: 'build',
      args: ['--cwd', 'templates'],
    });
    expect(parseRootArgs(['dev', '--deck', 'd.json'])).toEqual({
      command: 'dev',
      args: ['--deck', 'd.json'],
    });
    expect(parseRootArgs(['new', '--list'])).toEqual({
      command: 'new',
      args: ['--list'],
    });
  });

  it('fails on unknown subcommands', () => {
    expect(() => parseRootArgs(['publish'])).toThrow(/Unknown command 'publish'/);
  });
});
