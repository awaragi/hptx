import fs from 'node:fs';
import path from 'node:path';
import PptxGenJS from 'pptxgenjs';

const DECK_W = 1920;
const DECK_H = 1080;

/** Layout name registered for Full HD 16:9 slides. */
export const PPTX_LAYOUT_NAME = 'HPTX_FULL_HD';

/**
 * PowerPoint slide size in inches for a 1920×1080 design canvas.
 * Uses the standard widescreen height (7.5") so aspect is exactly 16:9.
 */
export function pptxSlideSizeInches(): { w: number; h: number } {
  const h = 7.5;
  const w = h * (DECK_W / DECK_H);
  return { w, h };
}

/** Build a PPTX with one full-bleed image slide per PNG, in array order. */
export async function stitchPngsToPptx(pngPaths: string[], outPath: string): Promise<void> {
  const pptx = new PptxGenJS();
  const { w, h } = pptxSlideSizeInches();
  pptx.defineLayout({ name: PPTX_LAYOUT_NAME, width: w, height: h });
  pptx.layout = PPTX_LAYOUT_NAME;

  for (const pngPath of pngPaths) {
    const slide = pptx.addSlide();
    const abs = path.resolve(pngPath);
    slide.addImage({ path: abs, x: 0, y: 0, w, h });
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  await pptx.writeFile({ fileName: outPath });
}
