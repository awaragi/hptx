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

/** Shell-owned home page: tile highlight steps are not export frames. */
export const AGENDA_KEY = 'agenda';

/**
 * Whether this slide exports stepped frames (`key-0.png` …).
 * Agenda and slides with no `stepCount` use a single unsuffixed `key.png`.
 */
export function slideHasExportSteps(slide: Pick<SlideStepInfo, 'key' | 'stepCount'>): boolean {
  if (slide.key === AGENDA_KEY) return false;
  return typeof slide.stepCount === 'number' && slide.stepCount > 0;
}

/**
 * Resolve which step ids to capture for a slide.
 * Content slides with steps: `0 .. stepCount-1`. Agenda / no steps: one synthetic frame at `0`.
 */
export function frameStepIds(slide: Pick<SlideStepInfo, 'key' | 'stepCount'>): number[] {
  if (!slideHasExportSteps(slide)) return [0];
  return Array.from({ length: Math.floor(slide.stepCount) }, (_, i) => i);
}

/** Ordered list of PNG paths that will be written for the given slides. */
export function plannedPngPaths(pngDir: string, slides: SlideStepInfo[]): string[] {
  const out: string[] = [];
  const slideCount = slides.length;
  for (let i = 0; i < slides.length; i++) {
    const s = slides[i]!;
    const withSuffix = slideHasExportSteps(s);
    for (const step of frameStepIds(s)) {
      out.push(
        path.join(
          pngDir,
          frameFileName({
            slideKey: s.key,
            stepId: step,
            withStepSuffix: withSuffix,
            slideIndex: i,
            slideCount,
            ...(withSuffix ? { stepCount: Math.floor(s.stepCount) } : {}),
          }),
        ),
      );
    }
  }
  return out;
}

/**
 * Progress line: `(s/S - step/steps) <filename>` when the slide has steps;
 * `(s/S) <filename>` when it does not.
 * `s`/`S` = one-based slide index/count; step counters are one-based within the slide.
 */
export function formatExportProgressLine(opts: {
  slideIndex: number;
  slideCount: number;
  fileName: string;
  /** One-based step within the slide; omit when the slide has no export steps. */
  stepIndex?: number;
  stepCount?: number;
}): string {
  const { slideIndex: s, slideCount: S, fileName, stepIndex, stepCount } = opts;
  if (stepIndex !== undefined && stepCount !== undefined && stepCount > 0) {
    return `(${s}/${S} - ${stepIndex}/${stepCount}) ${fileName}`;
  }
  return `(${s}/${S}) ${fileName}`;
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

/**
 * Injected during PNG capture: hide chrome and disable slide crossfades so
 * screenshots never include the previous slide mid-transition (~0.55–0.6s).
 */
export const EXPORT_CAPTURE_CSS = `
  header.chrome, .progress, .navdots, .counter, .arrows, .hint,
  .nav-drawer, #fsPrompt, #appLoader, #deckTimerFlash { display: none !important; }
  /* Instant slide swaps + step reveals (e.g. .rev { transition: opacity .5s }) so
     frames are never mid-fade / one step behind. */
  .slide,
  .slide *,
  .slide *::before,
  .slide *::after {
    transition: none !important;
    animation: none !important;
  }
  .slide:not(.active) {
    opacity: 0 !important;
    visibility: hidden !important;
    transform: none !important;
  }
  .slide.active {
    opacity: 1 !important;
    visibility: visible !important;
    transform: none !important;
  }
`;

async function preparePresentCapture(page: Page, appearance: AppearanceTheme): Promise<void> {
  await page.evaluate(
    ({ theme, css }) => {
      document.documentElement.setAttribute('data-theme', theme);
      const style = document.createElement('style');
      style.id = 'hptx-export-hide-chrome';
      style.textContent = css;
      document.head.appendChild(style);
      const canvas = document.getElementById('deckCanvas') as HTMLElement | null;
      if (canvas) canvas.style.transform = 'none';
    },
    { theme: appearance, css: EXPORT_CAPTURE_CSS },
  );
}

/** Wait until the named slide is the only active one and has been painted. */
async function settleOnSlide(page: Page, key: string): Promise<void> {
  await page.waitForFunction((slideKey) => {
    const active = document.querySelector('.slide.active');
    return !!(active && active.getAttribute('data-slide') === slideKey);
  }, key);
  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
}

/** Wait for step paint after Deck.setStep (transitions already disabled). */
async function settleAfterStep(page: Page): Promise<void> {
  await page.evaluate(async () => {
    // Force style flush so class toggles (e.g. .rev.on) apply before the screenshot.
    void document.body.offsetHeight;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
}

async function capturePngFrames(
  page: Page,
  pngDir: string,
  appearance: AppearanceTheme,
  onProgress?: (line: string) => void,
): Promise<string[]> {
  fs.mkdirSync(pngDir, { recursive: true });
  await preparePresentCapture(page, appearance);

  const slides = await readSlideSteps(page);
  const slideCount = slides.length;
  const written: string[] = [];

  for (let slideIndex = 0; slideIndex < slides.length; slideIndex++) {
    const slide = slides[slideIndex]!;
    const withSuffix = slideHasExportSteps(slide);
    await page.evaluate((key) => {
      (window as unknown as { Deck: { goToKey: (k: string) => void } }).Deck.goToKey(key);
    }, slide.key);
    await settleOnSlide(page, slide.key);

    for (const step of frameStepIds(slide)) {
      await page.evaluate(
        ({ key, step: stepIdx }) => {
          (window as unknown as { Deck: { setStep: (k: string, i: number) => void } }).Deck.setStep(
            key,
            stepIdx,
          );
        },
        { key: slide.key, step },
      );
      await settleAfterStep(page);

      const name = frameFileName({
        slideKey: slide.key,
        stepId: step,
        withStepSuffix: withSuffix,
        slideIndex,
        slideCount,
        ...(withSuffix ? { stepCount: Math.floor(slide.stepCount) } : {}),
      });
      const filePath = path.join(pngDir, name);
      const canvas = page.locator('#deckCanvas');
      await canvas.screenshot({ path: filePath, type: 'png' });
      written.push(filePath);
      if (onProgress) {
        onProgress(
          formatExportProgressLine({
            slideIndex: slideIndex + 1,
            slideCount,
            fileName: name,
            ...(withSuffix
              ? { stepIndex: step + 1, stepCount: Math.floor(slide.stepCount) }
              : {}),
          }),
        );
      }
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
  /** When set, called with each PNG progress line (and once for print PDF). */
  onProgress?: (line: string) => void;
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
      if (opts.onProgress) opts.onProgress(`(1/1 - 1/1) ${path.basename(opts.printPdfPath)}`);
      return { pngPaths: [], pdfPath: opts.printPdfPath };
    }

    const pngPaths = await capturePngFrames(page, opts.pngDir, opts.appearance, opts.onProgress);
    if (opts.format === 'png-pdf') {
      await stitchPngsToPdf(pngPaths, opts.pngPdfPath);
      if (opts.onProgress) opts.onProgress(`wrote ${path.basename(opts.pngPdfPath)}`);
      return { pngPaths, pdfPath: opts.pngPdfPath };
    }
    return { pngPaths };
  } finally {
    await context.close();
  }
}
