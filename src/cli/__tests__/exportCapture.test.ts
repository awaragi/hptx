import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { CHROME_MISSING_MESSAGE, launchSystemChrome } from '../exportChrome.ts';
import {
  formatExportProgressLine,
  frameStepIds,
  plannedPngPaths,
  slideHasExportSteps,
} from '../exportCapture.ts';
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
    expect(frameStepIds({ key: 'blank', stepCount: 0 })).toEqual([0]);
    expect(slideHasExportSteps({ key: 'blank', stepCount: 0 })).toBe(false);
    expect(frameStepIds({ key: 'agent', stepCount: 3 })).toEqual([0, 1, 2]);
    expect(slideHasExportSteps({ key: 'agent', stepCount: 3 })).toBe(true);
  });

  it('captures agenda as a single unsuffixed frame even when stepCount > 1', () => {
    expect(frameStepIds({ key: 'agenda', stepCount: 5 })).toEqual([0]);
    expect(slideHasExportSteps({ key: 'agenda', stepCount: 5 })).toBe(false);
  });

  it('plans png paths in slide then step order', () => {
    const dir = '/tmp/png';
    expect(
      plannedPngPaths(dir, [
        { key: 'agenda', stepCount: 4 },
        { key: 'blank', stepCount: 0 },
        { key: 'agent', stepCount: 2 },
      ]),
    ).toEqual([
      path.join(dir, '0-agenda.png'),
      path.join(dir, '1-blank.png'),
      path.join(dir, '2-agent-0.png'),
      path.join(dir, '2-agent-1.png'),
    ]);
  });

  it('formats progress with per-slide step counters only when stepped', () => {
    expect(
      formatExportProgressLine({
        slideIndex: 2,
        slideCount: 3,
        stepIndex: 2,
        stepCount: 5,
        fileName: '1-escape-1.png',
      }),
    ).toBe('(2/3 - 2/5) 1-escape-1.png');
    expect(
      formatExportProgressLine({
        slideIndex: 1,
        slideCount: 3,
        fileName: '0-agenda.png',
      }),
    ).toBe('(1/3) 0-agenda.png');
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
