import path from 'node:path';

/** Presentation name = filename stem of the HTML output path. */
export function presentationNameFromOutput(outputPath: string): string {
  const name = path.parse(outputPath).name;
  if (!name) throw new Error(`Cannot derive presentation name from output path: ${outputPath}`);
  return name;
}

export interface ExportArtifactPaths {
  /** HTML output path (naming source). */
  outputPath: string;
  /** Presentation name (HTML stem). */
  name: string;
  /** Directory for PNG frames: `<dir(output)>/<name>/png`. */
  pngDir: string;
  /** Raster concat PDF: `<pngDir>/<name>.pdf`. */
  pngPdfPath: string;
  /** Print PDF: `<dir(output)>/<name>.pdf`. */
  printPdfPath: string;
}

/** Resolve export artifact paths from the effective HTML output path. */
export function exportArtifactPaths(outputPath: string): ExportArtifactPaths {
  const name = presentationNameFromOutput(outputPath);
  const outDir = path.dirname(outputPath);
  const pngDir = path.join(outDir, name, 'png');
  return {
    outputPath,
    name,
    pngDir,
    pngPdfPath: path.join(pngDir, `${name}.pdf`),
    printPdfPath: path.join(outDir, `${name}.pdf`),
  };
}

/** Digit width so zero-based indices `0 .. slideCount-1` sort lexicographically. */
export function slideIndexPadWidth(slideCount: number): number {
  if (slideCount <= 1) return 1;
  return String(slideCount - 1).length;
}

/** Zero-padded zero-based slide index for filename prefixes. */
export function formatSlideIndexPrefix(slideIndex: number, slideCount: number): string {
  return String(slideIndex).padStart(slideIndexPadWidth(slideCount), '0');
}

export interface FrameFileNameOpts {
  slideKey: string;
  stepId: number;
  withStepSuffix: boolean;
  /** Zero-based slide index in capture order (agenda is 0). */
  slideIndex: number;
  slideCount: number;
}

/**
 * Frame filename: `<paddedIndex>-<key>-<stepId>.png` when the slide has export steps;
 * `<paddedIndex>-<key>.png` when it has none.
 */
export function frameFileName(opts: FrameFileNameOpts): string {
  const prefix = formatSlideIndexPrefix(opts.slideIndex, opts.slideCount);
  const body = opts.withStepSuffix ? `${opts.slideKey}-${opts.stepId}` : opts.slideKey;
  return `${prefix}-${body}.png`;
}
