/**
 * npm does not put the root package's own `bin` into node_modules/.bin.
 * Symlink so local `npx hptx` / `.bin/hptx` works after install.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const binDir = path.join(root, 'node_modules', '.bin');
const linkPath = path.join(binDir, 'hptx');
const target = path.join(root, 'bin', 'hptx.js');

if (!fs.existsSync(target)) {
  console.warn('link-local-bin: bin/hptx.js missing; skip');
  process.exit(0);
}

fs.mkdirSync(binDir, { recursive: true });
const rel = path.relative(binDir, target);
try {
  const st = fs.lstatSync(linkPath);
  if (st.isSymbolicLink() || st.isFile()) fs.unlinkSync(linkPath);
} catch {
  /* no existing link */
}
fs.symlinkSync(rel, linkPath);
