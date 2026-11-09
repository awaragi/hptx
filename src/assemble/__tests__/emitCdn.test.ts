import { describe, expect, it } from 'vitest';
import { emitCdnTags } from '../emitCdn.ts';

describe('emitCdnTags', () => {
  it('emits a classic script tag for a string entry', () => {
    const { scriptHtml } = emitCdnTags(['https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js']);
    expect(scriptHtml).toBe('<script src="https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js"></script>');
  });

  it('includes integrity and crossorigin when present', () => {
    const { scriptHtml } = emitCdnTags([
      { src: 'https://cdn.example.com/lib.js', integrity: 'sha384-abc', crossorigin: 'anonymous' },
    ]);
    expect(scriptHtml).toBe(
      '<script src="https://cdn.example.com/lib.js" integrity="sha384-abc" crossorigin="anonymous"></script>',
    );
    expect(scriptHtml).not.toMatch(/async|defer/);
  });

  it('emits stylesheet links', () => {
    const { linkHtml } = emitCdnTags([], [{ src: 'https://cdn.example.com/x.css', crossorigin: 'anonymous' }]);
    expect(linkHtml).toBe('<link rel="stylesheet" href="https://cdn.example.com/x.css" crossorigin="anonymous">');
  });

  it('returns empty strings for no entries', () => {
    expect(emitCdnTags()).toEqual({ scriptHtml: '', linkHtml: '' });
  });
});
