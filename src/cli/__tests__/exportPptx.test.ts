import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { pptxSlideSizeInches, stitchPngsToPptx } from '../exportPptx.ts';

/** Minimal valid PNG bytes (2×2) for stitch tests without Chrome. */
function writeTinyPng(filePath: string): void {
  const pngB64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEklEQVR42mP8z8BQz0AEYBxVSF+FAP5FDvcfRYWgAAAAAElFTkSuQmCC';
  fs.writeFileSync(filePath, Buffer.from(pngB64, 'base64'));
}

describe('exportPptx', () => {
  const tmpDirs: string[] = [];

  afterEach(() => {
    for (const dir of tmpDirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    tmpDirs.length = 0;
  });

  it('uses 16:9 slide size matching Full HD aspect', () => {
    const { w, h } = pptxSlideSizeInches();
    expect(h).toBe(7.5);
    expect(w / h).toBeCloseTo(16 / 9, 5);
  });

  it('writes a pptx with one slide per PNG without Chrome', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hptx-pptx-'));
    tmpDirs.push(dir);
    const a = path.join(dir, '0-a.png');
    const b = path.join(dir, '1-b.png');
    writeTinyPng(a);
    writeTinyPng(b);
    const out = path.join(dir, 'demo.pptx');
    await stitchPngsToPptx([a, b], out);
    expect(fs.existsSync(out)).toBe(true);
    const bytes = fs.readFileSync(out);
    // PPTX is a ZIP (PK header)
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
    expect(bytes.length).toBeGreaterThan(1000);
  });
});
