import type { Command } from 'commander';
import { parseSettingsCliValue } from '../assemble/loadDeckConfig.ts';
import type { DeckSettingsPartial } from '../assemble/types.ts';
import { SETTINGS_KEYS } from '../assemble/types.ts';

/** Register shared `--settings.*` options on a Commander command. */
export function addSettingsOptions(command: Command): Command {
  return command
    .option('--settings.clicker <true|false>', 'default clicker mode (baked settings)')
    .option('--settings.rememberStep <true|false>', 'default remember-last-step (baked settings)')
    .option('--settings.timer <true|false>', 'default speak-timer mode (baked settings)')
    .option('--settings.appearance <light|dark>', 'default light/dark appearance (baked settings)');
}

/**
 * Read Commander opts for dotted `--settings.*` flags.
 * Commander keeps the dotted long name as the opts key (e.g. `settings.clicker`).
 */
export function settingsPartialFromOpts(opts: Record<string, unknown>): DeckSettingsPartial | undefined {
  const partial: DeckSettingsPartial = {};
  let any = false;

  const pairs: Array<[(typeof SETTINGS_KEYS)[number], string]> = [
    ['clicker', 'settings.clicker'],
    ['rememberStep', 'settings.rememberStep'],
    ['timer', 'settings.timer'],
    ['appearance', 'settings.appearance'],
  ];

  for (const [key, optKey] of pairs) {
    const raw = opts[optKey];
    if (raw === undefined) continue;
    if (typeof raw !== 'string') {
      throw new Error(`--${optKey} requires a value`);
    }
    const parsed = parseSettingsCliValue(key, raw, `--${optKey}`);
    if (key === 'appearance') partial.appearance = parsed as 'light' | 'dark';
    else partial[key] = parsed as boolean;
    any = true;
  }

  return any ? partial : undefined;
}
