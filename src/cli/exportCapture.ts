import fs from 'node:fs';
import path from 'node:path';
import type { Browser, Page } from 'playwright-core';
import type { AppearanceTheme } from './exportArgs.ts';
import { frameFileName } from './exportPaths.ts';
import { deckSizeInches, stitchPngsToPdf } from './exportPdf.ts';

export const DECK_REF_W = 1710;
export const DECK_REF_H = 1107;

export interface SlideStepInfo {
  key: string;
  stepCount: number;
}

/** Resolve how many frames to capture for a slide (at least one at step 0). */
export function frameStepIds(stepCount: number): number[] {
  const n = typeof stepCount === 'number' && stepCount > 0 ? Math.floor(stepCount) : 1;
  return Array.from({ length: n }, (_, i) => i);
}

/** Ordered list of PNG paths that will be written for the given slides. */
export function plannedPngPaths(pngDir: string, slides: SlideStepInfo[]): string[] {
  const out: string[] = [];
  for (const s of slides) {
    for (const step of frameStepIds(s.stepCount)) {
      out.push(path.join(pngDir, frameFileName(s.key, step)));
    }
  }
  return out;
}

async function waitForDeck(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const w = window as unknown as { Deck?: { manifest?: string[] } };
    return !!(w.Deck && Array.isArray(w.Deck.manifest) && w.Deck.manifest.length > 0);
  });
  await page.waitForFunction(() => !document.documentElement.classList.contains('is-loading'));
}

async function readSlideSteps(page: Page): Promise<SlideStepInfo[]> {
  return page.evaluate(() => {
    const Deck = (window as unknown as {
      Deck: {
        manifest: string[];
        get: (key: string) => { stepCount?: number } | undefined;
      };
    }).Deck;
    return Deck.manifest.map((key) => {
      const mod = Deck.get(key);
      const stepCount = mod && typeof mod.stepCount === 'number' ? mod.stepCount : 0;
      return { key, stepCount };
    });
  });
}

async function preparePresentCapture(page: Page, appearance: AppearanceTheme): Promise<void> {
  await page.evaluate((theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    const style = document.createElement('style');
    style.id = 'hptx-export-hide-chrome';
    style.textContent = `
      header.chrome, .progress, .navdots, .counter, .arrows, .hint,
      .nav-drawer, #fsPrompt, #appLoader, #deckTimerFlash { display: none !important; }
    `;
    document.head.appendChild(style);
    const canvas = document.getElementById('deckCanvas') as HTMLElement | null;
    if (canvas) canvas.style.transform = 'none';
  }, appearance);
}

async function capturePngFrames(
  page: Page,
  pngDir: string,
  appearance: AppearanceTheme,
): Promise<string[]> {
  fs.mkdirSync(pngDir, { recursive: true });
  await preparePresentCapture(page, appearance);

  const slides = await readSlideSteps(page);
  const written: string[] = [];

  for (const slide of slides) {
    await page.evaluate((key) => {
      (window as unknown as { Deck: { goToKey: (k: string) => void } }).Deck.goToKey(key);
    }, slide.key);

    for (const step of frameStepIds(slide.stepCount)) {
      await page.evaluate(
        ({ key, step: stepIdx }) => {
          (window as unknown as { Deck: { setStep: (k: string, i: number) => void } }).Deck.setStep(
            key,
            stepIdx,
          );
        },
        { key: slide.key, step },
      );
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

      const filePath = path.join(pngDir, frameFileName(slide.key, step));
      const canvas = page.locator('#deckCanvas');
      await canvas.screenshot({ path: filePath, type: 'png' });
      written.push(filePath);
    }
  }
  return written;
}

async function capturePrintPdf(page: Page, printPdfPath: string): Promise<void> {
  fs.mkdirSync(path.dirname(printPdfPath), { recursive: true });
  await page.evaluate(() => {
    window.dispatchEvent(new Event('beforeprint'));
  });
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const size = deckSizeInches();
  await page.pdf({
    path: printPdfPath,
    width: size.width,
    height: size.height,
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });
  await page.evaluate(() => {
    window.dispatchEvent(new Event('afterprint'));
  });
}

export interface CaptureOptions {
  browser: Browser;
  url: string;
  appearance: AppearanceTheme;
  format: 'png' | 'png-pdf' | 'pdf';
  pngDir: string;
  pngPdfPath: string;
  printPdfPath: string;
}

export interface CaptureResult {
  pngPaths: string[];
  pdfPath?: string;
}

/** Drive a loaded deck page and write the requested export artifacts. */
export async function captureExport(opts: CaptureOptions): Promise<CaptureResult> {
  const context = await opts.browser.newContext({
    viewport: { width: DECK_REF_W, height: DECK_REF_H },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  try {
    await page.goto(opts.url, { waitUntil: 'networkidle' });
    await waitForDeck(page);

    if (opts.format === 'pdf') {
      await capturePrintPdf(page, opts.printPdfPath);
      return { pngPaths: [], pdfPath: opts.printPdfPath };
    }

    const pngPaths = await capturePngFrames(page, opts.pngDir, opts.appearance);
    if (opts.format === 'png-pdf') {
      await stitchPngsToPdf(pngPaths, opts.pngPdfPath);
      return { pngPaths, pdfPath: opts.pngPdfPath };
    }
    return { pngPaths };
  } finally {
    await context.close();
  }
}
