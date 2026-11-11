import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/** Ensure a deck.json object includes schema version 1 (for tests). */
export function withVersion(cfg: Record<string, unknown>): Record<string, unknown> {
  return { version: 1, ...cfg };
}

export function makeDeckDir(files: Record<string, string> = {}): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hptx-assemble-'));
  for (const [name, content] of Object.entries(files)) {
    let text = content;
    if (name === 'deck.json' || name.endsWith('/deck.json')) {
      try {
        const parsed = JSON.parse(content) as Record<string, unknown>;
        if (parsed.version === undefined) text = JSON.stringify(withVersion(parsed));
      } catch {
        /* leave invalid JSON for negative tests */
      }
    }
    const p = path.join(dir, name);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, text);
  }
  return dir;
}

export function slideDoc(opts: { style?: string; head?: string; body?: string } = {}): string {
  const style = opts.style ? `<style>${opts.style}</style>` : '';
  const body = opts.body ?? `<div>hi</div><script>window.registerSlide({ title: 'T', boot(){} });</script>`;
  return `<!doctype html><html><head><title>x</title>${style}${opts.head ?? ''}</head><body>${body}</body></html>`;
}

export const TEMPLATE = `<!doctype html>
<html><head>
<title>Default</title>
<style id="deck-theme">
/* DECK THEME — START */
:root{ --brand:#111; --accent:#222; }
/* DECK THEME — END */
</style>
<!-- DECK_ASSETS -->
<!-- DECK_CDN_STYLES -->
</head><body>
<div class="loader-brand">Shell. <span>Default</span></div>
<div class="brand-row"><div class="nav-menu-slot"><button>m</button></div>
<div class="brand">Shell.<small>Default</small></div></div>
<div class="deck-title">Default deck</div>
<div id="slides">
<!-- DECK_SLIDES -->
</div>
<!-- DECK_CDN_SCRIPTS -->
</body></html>`;
