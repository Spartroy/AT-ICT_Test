import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Download } from 'lucide-react';
import { API_ENDPOINTS } from '../../../config/api';
import { downloadFile } from '../../../lib/api';
import { Ic } from '../../../components/portal/kit';
import { usePortalUI } from '../../../components/portal/PortalUI';
import { useReducedMotion } from '../../../hooks/useMediaQuery';
import { useFocusTrap } from '../../../components/ui/Modal';
import ResourceViewer from '../../../components/portal/viewer/ResourceViewer';
import logoCircle from '../../../assets/brand/logo-circle.png';
import { AUTHOR, COVER_PHONE, iconFor, sizeTier, splitTitle } from './bookDesign';
import '../../../styles/books.css';

// Every book uses the brand crimson accent.
export const SPINE = { c: 'var(--crimson-500)', tc: 'var(--white)' };

/** Title with the first letter in the accent colour and the last one faded, like the printed covers. */
export function CoverTitle({ title, fadeLast = false }) {
  const { first, middle, last } = splitTitle(title);
  return <><span className="t-first">{first}</span>{fadeLast ? <>{middle}<span className="t-last">{last}</span></> : `${middle}${last}`}</>;
}

const metaOf = (m) => m.fileName?.split('.').pop()?.toUpperCase() || '';

/** The book that flies from its spine to the centre, opens, and shows the PDF / link in the in-page reader. */
export default function BookOverlay({ m, spine, style, catLabel, onClosed }) {
  const isPdf = /\.pdf$/i.test(m.fileName || '');
  const isLink = !!m.externalUrl && !m.fileName;
  const BookIcon = iconFor(m);
  const { layer, toast } = usePortalUI();
  const overlayRef = useRef(null);
  useFocusTrap(overlayRef, true);
  const reduced = useReducedMotion();
  const flyRef = useRef(null);
  const viewRef = useRef(null);
  const [on, setOn] = useState(false);
  const [opened, setOpened] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const closing = useRef(false);
  const timers = useRef([]);
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));

  // Transform that puts the centred book exactly over the spine (FLIP "first" frame).
  const fromSpine = useCallback(() => {
    const fly = flyRef.current;
    if (!fly || !spine) return 'none';
    const target = fly.getBoundingClientRect();
    const s = spine.getBoundingClientRect();
    return `translate(${s.left + s.width / 2 - (target.left + target.width / 2)}px, ${s.top + s.height / 2 - (target.top + target.height / 2)}px) scale(${s.width / target.width}, ${s.height / target.height})`;
  }, [spine]);

  useLayoutEffect(() => {
    const fly = flyRef.current;
    document.body.style.overflow = 'hidden';
    if (reduced) {
      setOn(true);
      setOpened(true);
      return undefined;
    }
    fly.style.transition = 'none';
    fly.style.transform = fromSpine();
    void fly.offsetWidth; // commit the starting frame
    const raf = requestAnimationFrame(() => {
      setOn(true);
      fly.style.transition = 'transform .75s cubic-bezier(.22,1,.36,1)';
      fly.style.transform = 'none';
      later(() => setOpened(true), 800);
    });
    return () => cancelAnimationFrame(raf);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // PDFs and links open straight into the in-page reader once the book has finished opening.
  useEffect(() => {
    if (!opened) return;
    if (isPdf || isLink) setReading(true);
    else viewRef.current?.focus();
  }, [opened]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    const done = () => {
      document.body.style.overflow = '';
      spine?.focus();
      onClosed();
    };
    if (reduced) return done();
    setOpened(false);
    later(() => {
      const fly = flyRef.current;
      if (fly) fly.style.transform = fromSpine();
      setOn(false);
      later(done, 750);
    }, 950);
  }, [reduced, fromSpine, spine, onClosed]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    const pending = timers.current;
    return () => {
      document.removeEventListener('keydown', onKey);
      pending.forEach(clearTimeout);
      document.body.style.overflow = '';
    };
  }, [close]);

  const downloadUrl = `${API_ENDPOINTS.STUDENT.MATERIALS}/${m._id}/download`;

  const download = async () => {
    setBusy(true);
    try {
      await downloadFile(downloadUrl, m.fileName || m.title);
    } catch {
      toast("Couldn't download this material. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div ref={overlayRef} className={`bk-ov ${on ? 'on' : ''}`} role="dialog" aria-modal="true" aria-label={`${m.title} book`} onMouseDown={e => e.target === e.currentTarget && close()}>
      <div className="fly" ref={flyRef}>
        <div className="bwrap">
          <div className={`book ${opened ? 'open' : ''}`} style={{ '--c': style.c }}>
            <div className="pgr" aria-hidden={!opened}>
              <small>{catLabel} material</small>
              <h3>{m.title}</h3>
              {metaOf(m) && <span className="chip" style={{ background: style.c, color: style.tc }}>{metaOf(m)}</span>}
              {m.description && <p className="bk-desc">{m.description}</p>}
              <div className="pact">
                {!isPdf && !isLink && (
                  <button ref={viewRef} type="button" className="btn p" onClick={download} disabled={busy || !opened}>
                    <Ic as={Download} />{busy ? 'Downloading…' : 'Download'}
                  </button>
                )}
                <button type="button" className="btn o" onClick={close} disabled={!opened}>Close book</button>
              </div>
            </div>
            <div className="cover" aria-hidden="true">
              <div className={`front tier-${sizeTier(m.title)}`}>
                <i />
                <img className="fr-logo" src={logoCircle} alt="" />
                <b className="fr-title"><CoverTitle title={m.title} fadeLast /></b>
                <small className="fr-author">{AUTHOR}</small>
                <BookIcon className="fr-icon" aria-hidden="true" />
                <footer><span>{COVER_PHONE}</span><span>{catLabel}</span></footer>
              </div>
              <div className="back"><span className="bn"><BookIcon className="i" /></span><p>{catLabel}</p></div>
            </div>
          </div>
        </div>
      </div>
      <button type="button" className="bk-x" aria-label="Close book" onClick={close}><Ic as={X} /></button>
      {reading && (
        <ResourceViewer
          kind={isPdf ? 'pdf' : 'web'}
          src={isPdf ? downloadUrl : m.externalUrl}
          title={m.title}
          backLabel="Back to materials"
          onClose={() => { setReading(false); close(); }}
        />
      )}
    </div>,
    layer || document.body
  );
}
