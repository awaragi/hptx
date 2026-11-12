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

/** Frame filename for a slide key and zero-based step id. */
export function frameFileName(slideKey: string, stepId: number): string {
  return `${slideKey}-${stepId}.png`;
}
