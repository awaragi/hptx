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

/** Digit width so zero-based indices `0 .. count-1` sort lexicographically. */
export function indexPadWidth(count: number): number {
  if (count <= 1) return 1;
  return String(count - 1).length;
}

/** Zero-padded zero-based index for filename segments. */
export function formatPaddedIndex(index: number, count: number): string {
  return String(index).padStart(indexPadWidth(count), '0');
}

export interface FrameFileNameOpts {
  slideKey: string;
  stepId: number;
  withStepSuffix: boolean;
  /** Zero-based slide index in capture order (agenda is 0). */
  slideIndex: number;
  slideCount: number;
  /** Total steps on this slide; required when `withStepSuffix` is true. */
  stepCount?: number;
}

/**
 * Frame filename: `<paddedSlide>-<key>-<paddedStep>.png` when the slide has export steps;
 * `<paddedSlide>-<key>.png` when it has none.
 */
export function frameFileName(opts: FrameFileNameOpts): string {
  const prefix = formatPaddedIndex(opts.slideIndex, opts.slideCount);
  if (!opts.withStepSuffix) return `${prefix}-${opts.slideKey}.png`;
  const steps = opts.stepCount ?? 0;
  if (steps <= 0) {
    throw new Error('frameFileName: stepCount is required when withStepSuffix is true');
  }
  const step = formatPaddedIndex(opts.stepId, steps);
  return `${prefix}-${opts.slideKey}-${step}.png`;
}
