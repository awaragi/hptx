import { describe, expect, it, vi } from 'vitest';
import type { AssemblePlan } from '../../assemble/index.ts';
import { printEffectiveConfig } from '../printConfig.ts';

describe('printEffectiveConfig', () => {
  it('prints compact console paths (not long absolutes under cwd)', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const plan: AssemblePlan = {
      deck: {
        root: '/proj/templates',
        configPath: '/proj/templates/deck.json',
        config: {
          version: 1,
          title: 'Demo',
          brand: 'Acme.',
          caption: 'Cap',
          output: '/proj/dist/Out.html',
          cover: '/proj/templates/cover.html',
          theme: '/proj/templates/theme.css',
          slides: ['/proj/templates/a.html', '/proj/templates/b.html'],
          scripts: ['https://cdn.example.com/x.js', 'https://cdn.example.com/y.js'],
          styles: ['https://cdn.example.com/a.css', 'https://cdn.example.com/b.css'],
        },
        outputPath: '/proj/dist/Out.html',
        coverPath: '/proj/templates/cover.html',
        theme: { kind: 'path', value: '/proj/templates/theme.css' },
        settings: { clicker: true, rememberStep: false, timer: false, appearance: 'dark' },
        slug: 'demo',
      },
      slides: [
        { key: 'a', filename: 'a.html', path: '/proj/templates/a.html' },
        { key: 'b', filename: 'b.html', path: '/proj/templates/b.html' },
      ],
      templatePath: '/shell/template.html',
      requireOutput: true,
      minify: true,
    };
    printEffectiveConfig(plan, { command: 'build', invocationDir: '/proj' });
    const text = log.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(text).toContain('Effective configuration:');
    expect(text).toMatch(/cwd\s+templates/);
    expect(text).toContain('<cwd>/deck.json');
    expect(text).toContain('<cwd>/cover.html');
    expect(text).toContain('<cwd>/theme.css');
    expect(text).toContain('dist/Out.html');
    expect(text).toMatch(/slides\s+<cwd>\/a\.html\n\s+<cwd>\/b\.html/);
    expect(text).toMatch(/scripts\s+https:\/\/cdn\.example\.com\/x\.js\n\s+https:\/\/cdn\.example\.com\/y\.js/);
    expect(text).toMatch(/styles\s+https:\/\/cdn\.example\.com\/a\.css\n\s+https:\/\/cdn\.example\.com\/b\.css/);
    expect(text).toMatch(/settings\s+clicker=true rememberStep=false timer=false appearance=dark/);
    expect(text).toMatch(/minify\s+on/);
    expect(text).not.toContain('/proj/templates/deck.json');
    log.mockRestore();
  });

  it('prints minify off when plan.minify is false', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const plan: AssemblePlan = {
      deck: {
        root: '/proj/templates',
        config: { version: 1, output: '/proj/dist/Out.html' },
        outputPath: '/proj/dist/Out.html',
        settings: { clicker: false, rememberStep: true, timer: false, appearance: 'light' },
        slug: 'out',
      },
      slides: [],
      templatePath: '/shell/template.html',
      requireOutput: true,
      minify: false,
    };
    printEffectiveConfig(plan, { command: 'build', invocationDir: '/proj' });
    const text = log.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(text).toMatch(/minify\s+off/);
    log.mockRestore();
  });
});
