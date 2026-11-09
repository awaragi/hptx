import { describe, expect, it, vi } from 'vitest';
import type { AssemblePlan } from '../../assemble/index.ts';
import { printEffectiveConfig } from '../printConfig.ts';

describe('printEffectiveConfig', () => {
  it('prints plan fields as stored (no remapping)', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const plan: AssemblePlan = {
      deck: {
        root: '/decks/demo',
        configPath: '/decks/demo/deck.json',
        config: {
          version: 1,
          title: 'Demo',
          brand: 'Acme.',
          caption: 'Cap',
          output: '/decks/demo/Out.html',
          cover: '/decks/demo/cover.html',
          theme: '/decks/demo/theme.css',
          slides: ['/decks/demo/a.html', '/decks/demo/b.html'],
          scripts: ['https://cdn.example.com/x.js', 'https://cdn.example.com/y.js'],
          styles: ['https://cdn.example.com/a.css', 'https://cdn.example.com/b.css'],
        },
        outputPath: '/decks/demo/Out.html',
        coverPath: '/decks/demo/cover.html',
        theme: { kind: 'path', value: '/decks/demo/theme.css' },
      },
      slides: [
        { key: 'a', filename: 'a.html', path: '/decks/demo/a.html' },
        { key: 'b', filename: 'b.html', path: '/decks/demo/b.html' },
      ],
      templatePath: '/shell/template.html',
      requireOutput: true,
    };
    printEffectiveConfig(plan, { command: 'build' });
    const text = log.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(text).toContain('Effective configuration:');
    expect(text).toContain('/decks/demo/Out.html');
    expect(text).toContain('/decks/demo/cover.html');
    expect(text).toContain('/decks/demo/theme.css');
    expect(text).toMatch(/slides\s+\/decks\/demo\/a\.html\n\s+\/decks\/demo\/b\.html/);
    expect(text).toMatch(/scripts\s+https:\/\/cdn\.example\.com\/x\.js\n\s+https:\/\/cdn\.example\.com\/y\.js/);
    expect(text).toMatch(/styles\s+https:\/\/cdn\.example\.com\/a\.css\n\s+https:\/\/cdn\.example\.com\/b\.css/);
    log.mockRestore();
  });
});
