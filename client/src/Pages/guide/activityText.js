// The practical activities are self-contained web components with their labels written inside them.
// To let the teacher reword those labels, we keep a map { original text: new text } on the block and
// apply it to the activity's shadow DOM, and again whenever the activity redraws itself.

const state = new WeakMap(); // text node -> { orig, applied }

const SKIP = new Set(['STYLE', 'SCRIPT']);

function textNodes(root) {
  const out = [];
  const walk = (node) => {
    node.childNodes.forEach((child) => {
      if (child.nodeType === 3) out.push(child);
      else if (child.nodeType === 1 && !SKIP.has(child.tagName)) walk(child);
    });
  };
  walk(root);
  return out;
}

const worthEditing = (text) => text.length > 1 && /[A-Za-z]{2}/.test(text);

/** Replace (or restore) the visible text under `root` from `map`. Safe to call repeatedly. */
export function applyOverrides(root, map = {}) {
  textNodes(root).forEach((node) => {
    let s = state.get(node);
    // The activity changed this text itself: whatever it wrote is the new original.
    if (s && node.nodeValue !== s.applied && node.nodeValue !== s.orig) s = null;
    const orig = s ? s.orig : node.nodeValue;
    const key = orig.trim();
    const next = key ? map[key] : undefined;
    if (next != null && next !== '') {
      const want = orig.replace(key, () => next);
      state.set(node, { orig, applied: want });
      if (node.nodeValue !== want) node.nodeValue = want;
    } else if (s) {
      state.delete(node);
      if (node.nodeValue !== orig) node.nodeValue = orig;
    }
  });
}

/** Distinct visible strings under `root`, as originally written, in reading order. */
export function collectTexts(root) {
  const seen = new Set();
  const list = [];
  textNodes(root).forEach((node) => {
    const s = state.get(node);
    const key = (s ? s.orig : node.nodeValue).trim();
    if (worthEditing(key) && !seen.has(key)) {
      seen.add(key);
      list.push(key);
    }
  });
  return list;
}

/** Keep `root` showing the overrides as the activity redraws. Returns a function that stops. */
export function watchOverrides(root, getMap) {
  applyOverrides(root, getMap());
  const observer = new MutationObserver(() => applyOverrides(root, getMap()));
  observer.observe(root, { childList: true, subtree: true, characterData: true });
  return () => observer.disconnect();
}

let loading = null;
/** Loads /guide/demos.js once; resolves when the activities are registered. */
export function loadDemos() {
  if (typeof customElements !== 'undefined' && customElements.get('compiler-demo')) return Promise.resolve();
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/guide/demos.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => { loading = null; reject(new Error('The practical activities could not be loaded')); };
      document.head.appendChild(script);
    });
  }
  return loading;
}
