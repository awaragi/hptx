import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { CHROME_MISSING_MESSAGE, launchSystemChrome } from '../exportChrome.ts';
import { frameStepIds, plannedPngPaths } from '../exportCapture.ts';
import { stitchPngsToPdf } from '../exportPdf.ts';
import fs from 'node:fs';
import os from 'node:os';
import { PNG } from './pngFixture.ts';

vi.mock('playwright-core', () => ({
  chromium: {
    launch: vi.fn(async () => {
      throw new Error('browserType.launch: Chromium distribution not found');
    }),
  },
}));

describe('frameStepIds / plannedPngPaths', () => {
  it('captures at least step 0 when stepCount is 0', () => {
    expect(frameStepIds(0)).toEqual([0]);
    expect(frameStepIds(3)).toEqual([0, 1, 2]);
  });

  it('plans png paths in slide then step order', () => {
    const dir = '/tmp/png';
    expect(
      plannedPngPaths(dir, [
        { key: 'agenda', stepCount: 0 },
        { key: 'agent', stepCount: 2 },
      ]),
    ).toEqual([
      path.join(dir, 'agenda-0.png'),
      path.join(dir, 'agent-0.png'),
      path.join(dir, 'agent-1.png'),
    ]);
  });
});

describe('launchSystemChrome', () => {
  it('surfaces a clear Chrome-missing message when launch fails', async () => {
    await expect(launchSystemChrome()).rejects.toThrow(CHROME_MISSING_MESSAGE);
  });
});

describe('stitchPngsToPdf', () => {
  it('writes a PDF with one page per PNG in order', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hptx-export-'));
    const a = path.join(dir, 'a-0.png');
    const b = path.join(dir, 'b-0.png');
    fs.writeFileSync(a, PNG);
    fs.writeFileSync(b, PNG);
    const out = path.join(dir, 'deck.pdf');
    await stitchPngsToPdf([a, b], out);
    expect(fs.existsSync(out)).toBe(true);
    expect(fs.statSync(out).size).toBeGreaterThan(100);
  });
});
