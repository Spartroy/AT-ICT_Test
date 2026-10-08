import React, { forwardRef, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Ic } from '../kit';
import { useReducedMotion } from '../../../hooks/useMediaQuery';
import usePdfPages from './usePdfPages';

const Page = forwardRef(function Page({ n, src }, ref) {
  return (
    <div className="pf-page" ref={ref}>
      {src ? <img src={src} alt={`Page ${n}`} draggable={false} /> : <span className="pf-spin" role="status" aria-label={`Loading page ${n}`} />}
      <i className="pf-num" aria-hidden="true">{n}</i>
    </div>
  );
});

/** PDF as a page-turning book: a two-page spread on wide screens, one page on narrow ones. */
export default function FlipBook({ data, title }) {
  const reduced = useReducedMotion();
  const { total, ratio, urls, error, loading, focus } = usePdfPages(data);
  const stageRef = useRef(null);
  const bookRef = useRef(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [page, setPage] = useState(0);

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return undefined;
    let raf;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setBox({ w: el.clientWidth - 32, h: el.clientHeight - 32 }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => { ro.disconnect(); cancelAnimationFrame(raf); };
  }, [loading, error]);

  const single = box.w < 760;
  const pageH = Math.max(120, Math.floor(Math.min(box.h, (single ? box.w : box.w / 2) / ratio)));
  const pageW = Math.floor(pageH * ratio);

  const go = useCallback((dir) => {
    const flip = bookRef.current?.pageFlip();
    if (!flip) return;
    if (dir > 0) flip.flipNext(); else flip.flipPrev();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  if (error) return <p className="vw-msg" role="alert">This PDF couldn't be opened. Try Download instead.</p>;
  if (loading) return <div className="vw-msg" role="status"><span className="pf-spin" />Opening “{title}”…</div>;

  const shown = single || page === 0 || page >= total - 1 ? `${page + 1}` : `${page + 1}–${Math.min(page + 2, total)}`;
  const atStart = page <= 0;
  const atEnd = page >= total - (single ? 1 : 2);

  return (
    <div className="pf-wrap">
      <div className="pf-stage" ref={stageRef}>
        {pageW > 0 && box.h > 0 && (
          <HTMLFlipBook
            key={`${single ? 's' : 'd'}-${pageW}x${pageH}`}
            ref={bookRef}
            width={pageW}
            height={pageH}
            size="fixed"
            minWidth={pageW}
            maxWidth={pageW}
            minHeight={pageH}
            maxHeight={pageH}
            startPage={Math.min(page, total - 1)}
            usePortrait={single}
            showCover
            drawShadow
            maxShadowOpacity={0.45}
            flippingTime={reduced ? 1 : 900}
            mobileScrollSupport={false}
            swipeDistance={30}
            className="pf-book"
            onFlip={(e) => { setPage(e.data); focus(e.data); }}
          >
            {urls.map((src, i) => <Page key={i} n={i + 1} src={src} />)}
          </HTMLFlipBook>
        )}
      </div>
      <div className="pf-bar">
        <button type="button" className="ib" aria-label="Previous page" onClick={() => go(-1)} disabled={atStart}><Ic as={ChevronLeft} /></button>
        <span className="pf-count" aria-live="polite">{shown} <small>/ {total}</small></span>
        <button type="button" className="ib" aria-label="Next page" onClick={() => go(1)} disabled={atEnd}><Ic as={ChevronRight} /></button>
      </div>
    </div>
  );
}
