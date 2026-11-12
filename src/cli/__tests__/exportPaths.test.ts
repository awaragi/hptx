import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  exportArtifactPaths,
  frameFileName,
  presentationNameFromOutput,
} from '../exportPaths.ts';

describe('exportPaths', () => {
  it('derives presentation name from HTML stem', () => {
    expect(presentationNameFromOutput('/repo/dist/about.html')).toBe('about');
    expect(presentationNameFromOutput('dist/templates.html')).toBe('templates');
  });

  it('maps dist/about.html to png dir, png-pdf, and print pdf', () => {
    const p = exportArtifactPaths(path.join('/repo', 'dist', 'about.html'));
    expect(p.name).toBe('about');
    expect(p.pngDir).toBe(path.join('/repo', 'dist', 'about', 'png'));
    expect(p.pngPdfPath).toBe(path.join('/repo', 'dist', 'about', 'png', 'about.pdf'));
    expect(p.printPdfPath).toBe(path.join('/repo', 'dist', 'about.pdf'));
  });

  it('names frames slideKey-stepId.png', () => {
    expect(frameFileName('agent', 0)).toBe('agent-0.png');
    expect(frameFileName('escape', 2)).toBe('escape-2.png');
  });
});
