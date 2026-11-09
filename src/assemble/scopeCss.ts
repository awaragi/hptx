import postcss from 'postcss';
import type { Rule } from 'postcss';
import selectorParser from 'postcss-selector-parser';
import type { Selector } from 'postcss-selector-parser';

type SelNode = Selector['nodes'][number];

const ANCHOR_TAGS = ['html', 'body'];

function escapeAttrValue(key: string): string {
  return key.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/** Scope selector for a slide section. */
export function slideScopeSelector(key: string): string {
  return `[data-slide="${escapeAttrValue(key)}"]`;
}

function makeScopeNode(scope: string): SelNode {
  let node: SelNode | undefined;
  selectorParser((root) => {
    const sel = root.first;
    if (sel.nodes.length === 1) node = sel.first;
  }).processSync(scope);
  if (!node) throw new Error(`Scope "${scope}" must be a single simple selector`);
  return node;
}

function isScopeRef(n: SelNode): boolean {
  return n.type === 'nesting' || (n.type === 'pseudo' && n.value.toLowerCase() === ':scope');
}

function isAnchor(n: SelNode): boolean {
  if (n.type === 'tag') return ANCHOR_TAGS.includes(n.value.toLowerCase());
  if (n.type === 'pseudo') return n.value.toLowerCase() === ':root';
  return false;
}

function scopeOne(selector: Selector, scopeText: string): void {
  const nodes = [...selector.nodes];

  // :scope / top-level & → the scope element itself.
  const refs = nodes.filter(isScopeRef);
  if (refs.length > 0) {
    for (const ref of refs) {
      const scope = makeScopeNode(scopeText);
      scope.spaces.before = ref.spaces.before;
      scope.spaces.after = ref.spaces.after;
      ref.replaceWith(scope);
    }
    return;
  }

  const firstComb = nodes.findIndex((n) => n.type === 'combinator');
  const compoundEnd = firstComb === -1 ? nodes.length : firstComb;
  const anchored = nodes.slice(0, compoundEnd).some(isAnchor);

  const descendant = (): SelNode => selectorParser.combinator({ value: ' ' });

  if (anchored) {
    const target = nodes[compoundEnd];
    if (target) {
      selector.insertBefore(target, descendant());
      selector.insertBefore(target, makeScopeNode(scopeText));
    } else {
      selector.append(descendant());
      selector.append(makeScopeNode(scopeText));
    }
  } else {
    const scope = makeScopeNode(scopeText);
    const first = nodes[0];
    if (first) {
      // Leading whitespace (e.g. after a comma) belongs before the scope, not the old first node.
      scope.spaces.before = first.spaces.before;
      first.spaces.before = '';
    }
    selector.prepend(descendant());
    selector.prepend(scope);
  }
}

/** Scope a selector list to a slide key. */
export function scopeSelector(selectorText: string, key: string): string {
  return scopeSelectorTo(selectorText, slideScopeSelector(key));
}

/** Scope a selector list to `scope`, a single simple selector such as `[data-deck-cover]`. */
export function scopeSelectorTo(selectorText: string, scope: string): string {
  return selectorParser((root) => {
    root.each((sel) => scopeOne(sel, scope));
  }).processSync(selectorText);
}

function inUnscopedAtRule(rule: Rule): boolean {
  for (let p = rule.parent; p && p.type !== 'root'; p = p.parent) {
    if (p.type === 'rule') return true; // natively nested rule: parent already scoped
    if (p.type === 'atrule') {
      const name = (p as postcss.AtRule).name.toLowerCase();
      if (/keyframes$/.test(name) || name === 'font-face') return true;
    }
  }
  return false;
}

/** Scope every rule of a slide's CSS to `[data-slide="<key>"]`. */
export function scopeSlideCss(css: string, key: string): string {
  return scopeCss(css, slideScopeSelector(key), `Slide "${key}"`);
}

/** Scope every rule of `css` to `scope`; `:scope` / top-level `&` become the scope element itself. */
export function scopeCss(css: string, scope: string, label = `Scope ${scope}`): string {
  let root: postcss.Root;
  try {
    root = postcss.parse(css);
  } catch (err) {
    throw new Error(`${label}: invalid CSS: ${(err as Error).message}`);
  }
  root.walkRules((rule) => {
    if (inUnscopedAtRule(rule)) return;
    rule.selector = scopeSelectorTo(rule.selector, scope);
  });
  return root.toString();
}
