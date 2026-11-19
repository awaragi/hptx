/** @vitest-environment node */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assembleDeck } from '../index.ts';
import { TEMPLATE, makeDeckDir, slideDoc } from './helpers.ts';

describe('assembleDeck minify flag', () => {
  it('leaves CSS/JS readable when minify is false (default)', async () => {
    const dir = makeDeckDir({
      'deck.json': JSON.stringify({ output: './Out.html', slides: ['a.html'] }),
      'a.html': slideDoc({
        style: '.hero {\n  color: red;\n  margin: 0;\n}',
        body: `<div>hi</div><script>
  function greet ( name ) {
    return "hi " + name;
  }
  window.registerSlide({ title: 'T', boot(){ greet("x"); } });
</script>`,
      }),
      'shell/tpl.html': TEMPLATE,
    });
    const res = await assembleDeck(dir, { templatePath: path.join(dir, 'shell', 'tpl.html') });
    expect(res.html).toMatch(/function greet/);
    expect(res.html).toMatch(/\.hero\s*\{/);
  });

  it('minifies inline CSS/JS when minify is true', async () => {
    const dir = makeDeckDir({
      'deck.json': JSON.stringify({ output: './Out.html', slides: ['a.html'] }),
      'a.html': slideDoc({
        style: '.hero {\n  color: red;\n  margin: 0;\n}',
        body: `<div>hi</div><script>
  function greet ( name ) {
    return "hi " + name;
  }
  window.registerSlide({ title: 'T', boot(){ greet("x"); } });
</script>`,
      }),
      'shell/tpl.html': TEMPLATE,
    });
    const plain = await assembleDeck(dir, { templatePath: path.join(dir, 'shell', 'tpl.html'), minify: false });
    const mini = await assembleDeck(dir, { templatePath: path.join(dir, 'shell', 'tpl.html'), minify: true });
    expect(mini.html.length).toBeLessThan(plain.html.length);
    expect(mini.html).toContain('registerSlide');
    expect(mini.html).not.toMatch(/function greet \( name \)/);
    expect(fs.existsSync(mini.outputPath)).toBe(false);
  });
});
