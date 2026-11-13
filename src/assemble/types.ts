/** A CDN asset: bare https URL or an object with optional SRI attributes. */
export type CdnEntry =
  | string
  | {
      src: string;
      integrity?: string;
      crossorigin?: string;
    };

/**
 * Deck fields. On disk / at parse time, paths may be relative.
 * After resolve (`ResolvedDeck.config`), filesystem paths and slide entries are absolute;
 * remote `theme` / CDN URLs stay as https URLs.
 */
export interface DeckConfig {
  /** Schema version; required on disk, optional on pure-CLI effective configs. */
  version?: number;
  slides?: string[];
  /** Output path; required for build after merge, optional in the file alone. */
  output?: string;
  /** HTML file shown in the home page title block; not a slide. */
  cover?: string;
  theme?: string;
  scripts?: CdnEntry[];
  styles?: CdnEntry[];
  title?: string;
  brand?: string;
  /** Secondary line under the brand in the shell chrome (optional). */
  caption?: string;
}

export type ThemeSource =
  | { kind: 'path'; value: string }
  | { kind: 'url'; value: string };

/** Deck config with filesystem paths resolved against the working root. */
export interface ResolvedDeck {
  /** Absolute working root directory. */
  root: string;
  /** Absolute path to the deck JSON file when one was loaded. */
  configPath?: string;
  config: DeckConfig;
  /** Absolute output path when `output` is set on the effective config. */
  outputPath?: string;
  /** Absolute cover path, when `cover` is set. */
  coverPath?: string;
  /** Theme source, with local paths made absolute. */
  theme?: ThemeSource;
  /** Presentation slug from the resolved title (export paths + browser pref keys). */
  slug: string;
  /** Explicit `title` from the deck file when present (pre-cascade; for CLI re-resolve). */
  titleFromFile?: string;
}

/** A slide file selected for the deck. */
export interface ResolvedSlide {
  /** Slide key (filename stem). */
  key: string;
  /** Path as listed in deck.json, or the discovered filename. */
  filename: string;
  /** Absolute path to the slide file. */
  path: string;
}

/** One inline classic script harvested from a slide document. */
export interface SlideScript {
  /** Script text, exactly as authored. */
  code: string;
  /** 1-based line in the slide file where the script text starts. */
  line: number;
  origin: 'head' | 'body';
}

/** Harvested contents of a slide document. */
export interface ParsedSlide {
  key: string;
  /** Raw CSS text of each head `<style>` block, in order. */
  styles: string[];
  /** Inline classic scripts: head scripts first, then body scripts, in document order. */
  scripts: SlideScript[];
  /** Body markup without executable scripts; data blocks (e.g. `application/json`) stay in place. */
  markupHtml: string;
  /** Name used for `//# sourceURL` (deck-relative slide path). */
  sourceName: string;
}
