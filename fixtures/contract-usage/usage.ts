// Type-checks every declaration in shell/contract/slide-contract.d.ts.
const slideDoc = document as SlideDocument;
const root: HTMLElement = slideDoc.slideRoot;
root.style.setProperty('--x', '1');

let step = 0;
const mod: SlideModule = {
  title: 'Usage',
  icon: 'compass',
  agendaTitle: 'Usage tile',
  agendaSection: 'Fixtures',
  showOnTitleAgenda: true,
  stepCount: () => 3,
  landingStep: 0,
  boot(D: Deck) {
    const keys: readonly string[] = D.manifest;
    const key: string = D.currentKey();
    const brand: string = D.cssVar('--brand');
    const pair: string[] = D.cssVarList(['--brand', '--accent']);
    const html: string = D.icon('compass') + D.iconBadge('compass', 'lg') + D.inlineIcon('compass');
    const names: string[] = Object.keys(D.iconPaths);
    D.openModal('Tag', 'Title', '<p>Body</p>', 'compass');
    D.closeModal();
    const flags: boolean[] = [D.clickerMode(), D.rememberSlideStep(), D.moveStep(1)];
    const idx: number | undefined = D.stepIndex(key);
    D.setStep(key, 0);
    D.onThemeRefresh(() => undefined);
    const other: SlideModule | undefined = D.get(keys[0]);
    const at: string | undefined = D.keyAt(1);
    D.goTo(0);
    D.goToKey('agenda');
    void [brand, pair, html, names, flags, idx, other, at];
  },
  onEnter(prevKey: string) { void prevKey; },
  onLeave(nextKey: string) { void nextKey; },
  onKey(e: KeyboardEvent) { return e.key === 'x'; },
  setStep(i: number) { step = i; },
  activateStep() { step += 0; },
  onReset() { step = 0; },
  redraw() {},
};

registerSlide(mod);
window.registerSlide(mod);
window.Deck.goToKey('agenda');
