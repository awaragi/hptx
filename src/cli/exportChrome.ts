import { chromium, type Browser } from 'playwright-core';

export const CHROME_MISSING_MESSAGE =
  'export requires Google Chrome installed (playwright-core channel "chrome"); this package does not download a browser.';

export type LaunchChrome = () => Promise<Browser>;

/** Launch system Google Chrome via playwright-core. No bundled Chromium. */
export async function launchSystemChrome(): Promise<Browser> {
  try {
    return await chromium.launch({ channel: 'chrome', headless: true });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`${CHROME_MISSING_MESSAGE}\n${detail}`);
  }
}
