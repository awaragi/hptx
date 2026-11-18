import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatDeckJson, parseDeckJson, readDeckJson, writeDeckJson } from '../deckJson.ts';

describe('deckJson', () => {
  it('parses comments and trailing commas', () => {
    const raw = parseDeckJson(`{
      // skip metrics for this build
      "version": 1,
      "slides": [
        "overview.html",
        /* "metrics.html", */
        "closing.html",
      ],
    }`);
    expect(raw).toEqual({
      version: 1,
      slides: ['overview.html', 'closing.html'],
    });
  });

  it('rejects invalid text naming the label', () => {
    expect(() => parseDeckJson('{ nope', 'demo/deck.json')).toThrow(/Invalid deck JSON in demo\/deck\.json/);
  });

  it('reads from disk and round-trips as strict JSON', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hptx-deckjson-'));
    const file = path.join(dir, 'deck.json');
    fs.writeFileSync(
      file,
      `{
  // comment
  "version": 1,
  "slides": ["a.html",],
}
`,
    );
    const data = readDeckJson(file) as { version: number; slides: string[] };
    expect(data.slides).toEqual(['a.html']);
    writeDeckJson(file, { ...data, slides: ['a.html', 'b.html'] });
    const written = fs.readFileSync(file, 'utf8');
    expect(written).toBe(formatDeckJson({ version: 1, slides: ['a.html', 'b.html'] }));
    expect(() => JSON.parse(written)).not.toThrow();
    expect(written).not.toContain('//');
  });
});
