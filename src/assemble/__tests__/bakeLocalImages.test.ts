import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  bakeLocalImages,
  emitAssetsHtml,
  isLocalRelativeImageRef,
} from '../bakeLocalImages.ts';
import { parseSlideDocument } from '../parseSlide.ts';
import { makeDeckDir, slideDoc } from './helpers.ts';

/** 1×1 PNG */
const PNG_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const PNG_BUF = Buffer.from(PNG_B64, 'base64');
const PNG_ID = createHash('sha256').update(PNG_BUF).digest('hex').slice(0, 12);

describe('isLocalRelativeImageRef', () => {
  it('accepts relative paths and rejects schemes and absolute urls', () => {
    expect(isLocalRelativeImageRef('assets/a.png')).toBe(true);
    expect(isLocalRelativeImageRef('./x.jpg')).toBe(true);
    expect(isLocalRelativeImageRef('../x.webp')).toBe(true);
    expect(isLocalRelativeImageRef('https://cdn.example.com/a.png')).toBe(false);
    expect(isLocalRelativeImageRef('data:image/png;base64,aa')).toBe(false);
    expect(isLocalRelativeImageRef('/abs/a.png')).toBe(false);
    expect(isLocalRelativeImageRef('//cdn.example.com/a.png')).toBe(false);
    expect(isLocalRelativeImageRef('')).toBe(false);
  });
});

describe('bakeLocalImages', () => {
  it('resolves relative to the slide file, rewrites img and css, and dedupes by content', () => {
    const dir = makeDeckDir({
      'a.html': slideDoc({
        style: '.hero{background-image:url(assets/logo.png)}',
        body: `<img src="assets/logo.png" alt="Logo"><script>window.registerSlide({boot(){}});</script>`,
      }),
      'nested/b.html': slideDoc({
        body: `<img src="../assets/logo.png" alt="Again"><script>window.registerSlide({boot(){}});</script>`,
      }),
    });
    fs.mkdirSync(path.join(dir, 'assets'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'assets/logo.png'), PNG_BUF);

    const aPath = path.join(dir, 'a.html');
    const bPath = path.join(dir, 'nested/b.html');
    const a = parseSlideDocument(fs.readFileSync(aPath, 'utf8'), aPath);
    const b = parseSlideDocument(fs.readFileSync(bPath, 'utf8'), bPath);

    const { registry, imagePaths } = bakeLocalImages([
      { parsed: a, filePath: aPath, label: 'a.html' },
      { parsed: b, filePath: bPath, label: 'nested/b.html' },
    ]);

    expect(Object.keys(registry)).toEqual([PNG_ID]);
    expect(registry[PNG_ID]).toBe(`data:image/png;base64,${PNG_B64}`);
    expect(imagePaths).toEqual([path.join(dir, 'assets/logo.png')]);

    expect(a.markupHtml).toContain(`data-asset="${PNG_ID}"`);
    expect(a.markupHtml).toContain('alt="Logo"');
    expect(a.markupHtml).not.toMatch(/src=["']assets\/logo\.png/);
    expect(a.styles[0]).toContain(`var(--asset-${PNG_ID})`);
    expect(a.styles[0]).not.toContain('url(assets/logo.png)');

    expect(b.markupHtml).toContain(`data-asset="${PNG_ID}"`);
    expect(b.markupHtml).not.toMatch(/src=/);
  });

  it('leaves https and data urls unchanged', () => {
    const dir = makeDeckDir({
      'x.html': slideDoc({
        style: '.r{background-image:url(https://cdn.example.com/a.png)}',
        body: `<img src="data:image/png;base64,aa" alt="d"><img src="https://cdn.example.com/b.png" alt="r"><script>window.registerSlide({boot(){}});</script>`,
      }),
    });
    const filePath = path.join(dir, 'x.html');
    const parsed = parseSlideDocument(fs.readFileSync(filePath, 'utf8'), filePath);
    const { registry } = bakeLocalImages([{ parsed, filePath }]);
    expect(registry).toEqual({});
    expect(parsed.markupHtml).toContain('src="data:image/png;base64,aa"');
    expect(parsed.markupHtml).toContain('src="https://cdn.example.com/b.png"');
    expect(parsed.styles[0]).toContain('url(https://cdn.example.com/a.png)');
  });

  it('fails when a local image is missing', () => {
    const dir = makeDeckDir({
      'x.html': slideDoc({
        body: `<img src="assets/missing.png" alt="x"><script>window.registerSlide({boot(){}});</script>`,
      }),
    });
    const filePath = path.join(dir, 'x.html');
    const parsed = parseSlideDocument(fs.readFileSync(filePath, 'utf8'), filePath);
    expect(() => bakeLocalImages([{ parsed, filePath, label: 'x.html' }])).toThrow(
      /x\.html.*assets\/missing\.png/,
    );
  });
});

describe('emitAssetsHtml', () => {
  it('emits nothing for an empty registry', () => {
    expect(emitAssetsHtml({})).toBe('');
  });

  it('emits json registry and applicator that references the same ids', () => {
    const html = emitAssetsHtml({ abc: 'data:image/png;base64,xx' });
    expect(html).toContain('id="deck-assets"');
    expect(html).toContain('"abc":"data:image/png;base64,xx"');
    expect(html).toContain("setProperty('--asset-' + id");
    expect(html).toContain('img[data-asset]');
  });
});
