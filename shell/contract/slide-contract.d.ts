/**
 * Slide contract API — what slide scripts may call and implement.
 * Reference for authors and editors; see SLIDE-CONTRACT.md for the rules.
 * Slide scripts are plain JavaScript; these declarations are never compiled
 * into a deck.
 */

/**
 * The `document` visible inside slide scripts. `getElementById`,
 * `querySelector`, and `querySelectorAll` search only the slide's
 * `<section class="slide" data-slide="<key>">` and its descendants (`:scope`
 * is that section);
 * every other member is the page document. `window.document` is always the
 * page document. Annotate in JS with `/** @type {SlideDocument} *\/`.
 */
interface SlideDocument extends Document {
  /** The slide's `<section class="slide">` element. */
  readonly slideRoot: HTMLElement;
}

/** Hooks and agenda fields a slide passes to `registerSlide`. All optional. */
interface SlideModule {
  /** Slide title (agenda, nav drawer, Settings slide list). Defaults to the key. */
  title?: string;
  /** Icon name from `Deck.iconPaths` for the agenda tile. Defaults to `compass`. */
  icon?: string;
  /** Agenda tile label when it should differ from `title`. */
  agendaTitle?: string;
  /** Agenda group heading; consecutive slides with the same value share a group. */
  agendaSection?: string;
  /** Set to false to leave the slide off the agenda (home page and `M` drawer; `⇧M` still lists it). Defaults to true. */
  showOnTitleAgenda?: boolean;
  /**
   * Optional estimated speaking time in whole minutes. Shown as a static
   * `N min` label in the speaker notes window (no timer). Omit or leave
   * invalid to hide the label.
   */
  estimatedMinutes?: number;

  /** Render and wire DOM. Runs once, after the deck is parsed and CDN scripts load. */
  boot?(deck: Deck): void;
  /** The slide became active; `prevKey` is the slide navigated from. */
  onEnter?(prevKey: string): void;
  /** The slide is being left; `nextKey` is the slide navigated to. */
  onLeave?(nextKey: string): void;
  /** Slide-specific keys. Return true to consume the key before the shell handles it. */
  onKey?(e: KeyboardEvent): boolean | void;
  /** Number of in-slide steps (default 0). The shell owns ←/→ stepping. */
  stepCount?: number | (() => number);
  /** Step index applied when the slide is entered (default 0). */
  landingStep?: number | (() => number);
  /** Paint the view for step `i` (0 ≤ i < stepCount). */
  setStep?(i: number): void;
  /** Enter key on the current step (for example open a detail modal). */
  activateStep?(): void;
  /** Reset interactive state (deck reset and print mode). */
  onReset?(): void;
  /** Re-render charts or canvases before native print layout. */
  redraw?(): void;
}

/** Shell API passed to `boot` and available as `window.Deck`. */
interface Deck {
  /** Slide keys in deck order; index 0 is `agenda`, the shell-owned home page. */
  readonly manifest: readonly string[];
  /** Key of the active slide. */
  currentKey(): string;
  /** Computed value of a theme token on `<html>`, e.g. `cssVar('--brand')`. */
  cssVar(name: string): string;
  /** `cssVar` for several tokens, in order. */
  cssVarList(names: string[]): string[];
  /** SVG markup (`<svg class="icon">`) for an icon name. */
  icon(name: string): string;
  /** Icon wrapped in `<span class="icon-badge [size]">`. */
  iconBadge(name: string, size?: string): string;
  /** Inline-sized icon (`<svg class="icon inline-icon">`) for use in text. */
  inlineIcon(name: string): string;
  /** Icon name → SVG inner markup. Keys are the valid icon names. */
  readonly iconPaths: Readonly<Record<string, string>>;
  /** Open the shared modal. `bodyHtml` is trusted HTML. */
  openModal(tag: string, title: string, bodyHtml: string, iconName?: string): void;
  /** Close the shared modal. */
  closeModal(): void;
  /** True when Settings → Navigation clicker mode is on. */
  clickerMode(): boolean;
  /** True when Settings → Navigation "remember last step" is on. */
  rememberSlideStep(): boolean;
  /** Move the active slide's step by `delta`. Returns false when it has no steps. */
  moveStep(delta: number): boolean;
  /** Current step index of a slide, or undefined before it was first entered. */
  stepIndex(key: string): number | undefined;
  /** Set a slide's step (clamped) and call its `setStep`. */
  setStep(key: string, idx: number): void;
  /**
   * Register a callback for when a theme is applied or cleared in
   * Settings; refresh values read with `cssVar` here. The light/dark toggle
   * does not call it (it only changes surface tokens): use `var(--token)`
   * styles for surface colors.
   */
  onThemeRefresh(fn: () => void): void;
  /** The registered module of a slide, if any. */
  get(key: string): SlideModule | undefined;
  /** Slide key at a deck index. */
  keyAt(idx: number): string | undefined;
  /** Navigate to a deck index (clamped). */
  goTo(idx: number): void;
  /** Navigate to a slide by key; warns when the key is unknown. */
  goToKey(key: string): void;
}

/** Register the slide this script belongs to. Call exactly once per slide file. */
declare function registerSlide(mod: SlideModule): void;

interface Window {
  registerSlide(mod: SlideModule): void;
  Deck: Deck;
}