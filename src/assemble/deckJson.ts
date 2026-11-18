import fs from 'node:fs';
import JSON5 from 'json5';

/** Parse deck config text as JSON5. Errors name `label` (typically a path or basename). */
export function parseDeckJson(text: string, label = 'deck.json'): unknown {
  try {
    return JSON5.parse(text);
  } catch (err) {
    throw new Error(`Invalid deck JSON in ${label}: ${(err as Error).message}`);
  }
}

/** Read a deck config file and parse it as JSON5. */
export function readDeckJson(configPath: string): unknown {
  let text: string;
  try {
    text = fs.readFileSync(configPath, 'utf8');
  } catch (err) {
    throw new Error(`Cannot read ${configPath}: ${(err as Error).message}`);
  }
  return parseDeckJson(text, configPath);
}

/** Pretty-print deck config as strict JSON (2-space indent, trailing newline). */
export function formatDeckJson(data: unknown): string {
  return JSON.stringify(data, null, 2) + '\n';
}

function writeAtomic(file: string, text: string): void {
  const tmp = `${file}.tmp.${process.pid}`;
  try {
    fs.writeFileSync(tmp, text);
    fs.renameSync(tmp, file);
  } catch (err) {
    fs.rmSync(tmp, { force: true });
    throw err;
  }
}

/** Atomically write deck config as strict JSON. Does not preserve JSON5-only source syntax. */
export function writeDeckJson(configPath: string, data: unknown): void {
  writeAtomic(configPath, formatDeckJson(data));
}
