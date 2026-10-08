import { useEffect, useRef, useState } from 'react';

const MAX_RENDER_WIDTH = 1100; // px of a rendered page image; plenty for one page of a 2-page spread on a laptop

/**
 * Renders a PDF into page images, nearest-to-the-reader first.
 * `data` is an ArrayBuffer. Returns { total, ratio (width / height), urls[] (null until rendered), error, loading, focus(i) }.
 */
export default function usePdfPages(data) {
  const [state, setState] = useState({ total: 0, ratio: 0.707, urls: [], error: null, loading: true });
  const focusRef = useRef(0);

  useEffect(() => {
    if (!data) return undefined;
    let cancelled = false;
    let doc;
    const urls = [];

    (async () => {
      try {
        const pdfjs = (await import('./pdfjs')).default;
        doc = await pdfjs.getDocument({ data: new Uint8Array(data.slice(0)) }).promise;
        if (cancelled) return;
        const first = await doc.getPage(1);
        const vp = first.getViewport({ scale: 1 });
        const total = doc.numPages;
        for (let i = 0; i < total; i++) urls.push(null);
        setState({ total, ratio: vp.width / vp.height, urls: [...urls], error: null, loading: false });

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const scale = Math.min((MAX_RENDER_WIDTH * dpr) / vp.width, 3);
        const done = new Set();
        while (!cancelled && done.size < total) {
          // Next page to render: the unrendered one closest to where the reader is.
          let next = -1;
          for (let i = 0; i < total; i++) {
            if (done.has(i)) continue;
            if (next === -1 || Math.abs(i - focusRef.current) < Math.abs(next - focusRef.current)) next = i;
          }
          const page = await doc.getPage(next + 1);
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, viewport }).promise;
          const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.88));
          page.cleanup();
          if (cancelled) return;
          urls[next] = URL.createObjectURL(blob);
          done.add(next);
          setState(s => ({ ...s, urls: [...urls] }));
        }
      } catch (error) {
        if (!cancelled) setState(s => ({ ...s, error, loading: false }));
      }
    })();

    return () => {
      cancelled = true;
      urls.forEach(u => u && URL.revokeObjectURL(u));
      doc?.destroy();
    };
  }, [data]);

  return { ...state, focus: (i) => { focusRef.current = i; } };
}
