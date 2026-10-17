/**
 * Opens a blank tab right now (inside the click, so popup blockers allow it) and lets you point it at a URL
 * once an async step finishes. If the browser still blocks it, go() falls back to a new-tab link click.
 *   const tab = openTab();  try { const url = await fetchUrl(); tab.go(url); } catch { tab.cancel(); }
 */
export default function openTab() {
  const w = window.open('', '_blank');
  if (w) { try { w.opener = null; } catch { /* ignore */ } }
  return {
    go(url) {
      if (w && !w.closed) { w.location.href = url; return; }
      const a = document.createElement('a');
      a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
      document.body.appendChild(a); a.click(); a.remove();
    },
    cancel() { if (w && !w.closed) w.close(); }
  };
}
