/** @vitest-environment node */
import { describe, expect, it } from 'vitest';
import { minifyAssembledHtml } from '../minifyHtml.ts';

describe('minifyAssembledHtml', () => {
  it('minifies inline CSS and JavaScript', async () => {
    const html = `<!DOCTYPE html><html><head>
<style>
  .foo {
    color: red;
    margin: 0;
  }
</style>
</head><body>
<script>
  function greet ( name ) {
    return "hi " + name;
  }
  greet( "deck" );
</script>
</body></html>`;

    const out = await minifyAssembledHtml(html);
    const styleBody = out.match(/<style>([\s\S]*?)<\/style>/i)?.[1] ?? '';
    const scriptBody = out.match(/<script>([\s\S]*?)<\/script>/i)?.[1] ?? '';

    expect(styleBody.length).toBeLessThan('.foo {\n    color: red;\n    margin: 0;\n  }'.length);
    expect(styleBody).toContain('.foo');
    expect(styleBody).not.toMatch(/\n\s+color:/);
    expect(scriptBody.length).toBeLessThan(html.match(/<script>([\s\S]*?)<\/script>/i)![1]!.length);
    expect(scriptBody).toMatch(/greet/);
    expect(scriptBody).not.toMatch(/function greet \( name \)/);
  });

  it('leaves script src tags and their URLs unchanged', async () => {
    const html = `<html><head>
<link rel="stylesheet" href="https://cdn.example.com/a.css">
<script src="https://cdn.example.com/a.js"></script>
<style>  .a { color: blue; }  </style>
</head><body></body></html>`;

    const out = await minifyAssembledHtml(html);
    expect(out).toContain('<script src="https://cdn.example.com/a.js"></script>');
    expect(out).toContain('href="https://cdn.example.com/a.css"');
    expect(out).toMatch(/<style>\.a\{color:#00f\}<\/style>/i);
  });

  it('keeps </script sequences escaped inside the script body', async () => {
    // Concatenation so the HTML extractor sees a full body (no raw </script> mid-source).
    const js = 'const s = "</" + "script>";\nconsole.log(s);';
    const html = `<html><body><script>${js}</script></body></html>`;

    const out = await minifyAssembledHtml(html);
    const open = out.toLowerCase().indexOf('<script>');
    const close = out.toLowerCase().indexOf('</script>', open + 1);
    expect(open).toBeGreaterThanOrEqual(0);
    expect(close).toBeGreaterThan(open);
    const body = out.slice(open + '<script>'.length, close);
    expect(body.toLowerCase()).not.toMatch(/<\/script/);
    expect(body).toContain('<\\/script');
  });

  it('preserves data-* attributes on style and script tags', async () => {
    const html = `<style data-slide-style="x">  .z { opacity: 1; }  </style>
<script data-slide-script="x">  var a = 1 + 2;  </script>`;
    const out = await minifyAssembledHtml(html);
    expect(out).toContain('data-slide-style="x"');
    expect(out).toContain('data-slide-script="x"');
  });

  it('leaves application/json data blocks unminified', async () => {
    const json = `{
  "label": "MTTR",
  "value": 42
}`;
    const html = `<html><body>
<script type="application/json" id="rows">${json}</script>
<script>  var x = 1 + 2;  </script>
</body></html>`;
    const out = await minifyAssembledHtml(html);
    expect(out).toContain(`<script type="application/json" id="rows">${json}</script>`);
    expect(out).toMatch(/<script>var x=3;?<\/script>/);
  });

  it('does not minify <style>…</style> text that lives inside a script string builder', async () => {
    // Mirrors shell notesDocumentHtml: '<style>' + NOTES_WINDOW_CSS + '</style>'
    const html = `<html><head>
<style>
  .real { color: blue; margin: 0; }
</style>
</head><body><script>
  var NOTES_WINDOW_CSS = ".nw{ color: red; }";
  function doc(){
    return '<style id="nwTheme"></style>' +
      '<style>' + NOTES_WINDOW_CSS + '</style></head><body>';
  }
  doc();
</script></body></html>`;

    const out = await minifyAssembledHtml(html);
    expect(out).toMatch(/<style>\.real\{color:#00f;margin:0\}<\/style>/i);
    // JS minify may fold quotes, but must still concatenate NOTES_WINDOW_CSS — not CSS-corrupt it.
    expect(out).toMatch(/NOTES_WINDOW_CSS\s*\+|NOTES_WINDOW_CSS\+/);
    expect(out).toMatch(/<style>'?\+?NOTES_WINDOW_CSS/);
    expect(out).not.toContain('NOTES_WINDOW_CSS + "{}');
    expect(out).not.toContain('<style>" + NOTES_WINDOW_CSS');
  });
});
