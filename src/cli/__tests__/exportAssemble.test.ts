import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assembleFromPlan, planAssemble } from '../../assemble/index.ts';
import { serveAssembledHtml } from '../exportServe.ts';

function slideDoc(title: string): string {
  return `<!DOCTYPE html><html><head><title>${title}</title>
<link rel="stylesheet" href="slide-contract.css">
<style>.x{color:var(--brand)}</style>
<script>registerSlide({title:${JSON.stringify(title)},icon:'layers',boot:function(){}});</script>
</head><body><h1 class="slide-title">${title}</h1></body></html>`;
}

describe('export assemble + serve', () => {
  it('fails when output is missing (requireOutput)', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hptx-export-no-out-'));
    fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify({ version: 1, slides: ['a.html'] }));
    fs.writeFileSync(path.join(dir, 'a.html'), slideDoc('A'));
    expect(() => planAssemble({ cwd: dir, baseDir: '/', requireOutput: true })).toThrow(
      /output.*required/i,
    );
  });

  it('serves assembled HTML over localhost', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hptx-export-srv-'));
    fs.writeFileSync(
      path.join(dir, 'deck.json'),
      JSON.stringify({ version: 1, output: 'Out.html', slides: ['a.html'] }),
    );
    fs.writeFileSync(path.join(dir, 'a.html'), slideDoc('A'));
    const { html } = await assembleFromPlan(planAssemble({ cwd: dir, baseDir: '/', requireOutput: true }));
    const server = await serveAssembledHtml(html);
    try {
      const res = await fetch(server.url);
      expect(res.status).toBe(200);
      const body = await res.text();
      expect(body).toContain('data-slide');
    } finally {
      await server.close();
    }
  });
});
