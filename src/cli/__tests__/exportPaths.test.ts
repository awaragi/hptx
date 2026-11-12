import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  exportArtifactPaths,
  formatSlideIndexPrefix,
  frameFileName,
  presentationNameFromOutput,
  slideIndexPadWidth,
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

  it('pads slide indices so lexical order matches deck order', () => {
    expect(slideIndexPadWidth(3)).toBe(1);
    expect(slideIndexPadWidth(10)).toBe(1);
    expect(slideIndexPadWidth(11)).toBe(2);
    expect(formatSlideIndexPrefix(0, 11)).toBe('00');
    expect(formatSlideIndexPrefix(10, 11)).toBe('10');
  });

  it('prefixes frames with padded slide index', () => {
    expect(
      frameFileName({
        slideKey: 'agent',
        stepId: 0,
        withStepSuffix: true,
        slideIndex: 2,
        slideCount: 3,
      }),
    ).toBe('2-agent-0.png');
    expect(
      frameFileName({
        slideKey: 'escape',
        stepId: 2,
        withStepSuffix: true,
        slideIndex: 1,
        slideCount: 3,
      }),
    ).toBe('1-escape-2.png');
    expect(
      frameFileName({
        slideKey: 'blank',
        stepId: 0,
        withStepSuffix: false,
        slideIndex: 1,
        slideCount: 3,
      }),
    ).toBe('1-blank.png');
    expect(
      frameFileName({
        slideKey: 'agenda',
        stepId: 0,
        withStepSuffix: false,
        slideIndex: 0,
        slideCount: 3,
      }),
    ).toBe('0-agenda.png');
    expect(
      frameFileName({
        slideKey: 'agenda',
        stepId: 0,
        withStepSuffix: false,
        slideIndex: 0,
        slideCount: 11,
      }),
    ).toBe('00-agenda.png');
  });
});
