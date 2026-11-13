import fs from 'node:fs';
import { PDFDocument } from 'pdf-lib';

const DECK_W = 1920;
const DECK_H = 1080;

/** Build a PDF with one 1920×1080 page per PNG, in array order. */
export async function stitchPngsToPdf(pngPaths: string[], outPath: string): Promise<void> {
  const pdf = await PDFDocument.create();
  for (const pngPath of pngPaths) {
    const bytes = new Uint8Array(fs.readFileSync(pngPath));
    const image = await pdf.embedPng(bytes);
    const page = pdf.addPage([DECK_W, DECK_H]);
    page.drawImage(image, { x: 0, y: 0, width: DECK_W, height: DECK_H });
  }
  const out = await pdf.save();
  fs.writeFileSync(outPath, out);
}

/** CSS px → inches at 96dpi for Playwright page.pdf. */
export function deckSizeInches(): { width: string; height: string } {
  return {
    width: `${DECK_W / 96}in`,
    height: `${DECK_H / 96}in`,
  };
}
