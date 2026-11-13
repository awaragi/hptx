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
      },
      slides: [
        { key: 'a', filename: 'a.html', path: '/proj/templates/a.html' },
        { key: 'b', filename: 'b.html', path: '/proj/templates/b.html' },
      ],
      templatePath: '/shell/template.html',
      requireOutput: true,
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
    expect(text).not.toContain('/proj/templates/deck.json');
    log.mockRestore();
  });
});
