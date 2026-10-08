import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Download, ExternalLink } from 'lucide-react';
import { api } from '../../../lib/api';
import { Ic } from '../kit';
import { usePortalUI } from '../PortalUI';
import { useFocusTrap } from '../../ui/Modal';
import { toEmbedUrl } from '../../../lib/embedUrl';
import '../../../styles/viewer.css';

const FlipBook = lazy(() => import('./FlipBook'));

const Spinner = ({ children }) => <div className="vw-msg" role="status"><span className="pf-spin" />{children}</div>;

/**
 * Full-page reader that keeps the student inside the portal (no new tab).
 *   kind="pdf": `src` is an API path to a PDF; shown as a page-turning book.
 *   kind="web": `src` is an external URL; shown in a large iframe.
 * The Back button (and Esc) returns to wherever the resource was opened from.
 * `actions` adds buttons to the top bar (e.g. Mark as read); `onDownload` adds a Download button.
 */
export default function ResourceViewer({ kind, src, title, onClose, onDownload, backLabel = 'Back', actions }) {
  const { layer } = usePortalUI();
  const rootRef = useRef(null);
  const backRef = useRef(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [frameLoaded, setFrameLoaded] = useState(false);
  useFocusTrap(rootRef, true, backRef);

  // Esc closes the viewer only, not whatever opened it.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    if (kind !== 'pdf') return undefined;
    let cancelled = false;
    setData(null);
    setError('');
    (async () => {
      try {
        const res = await api.raw(src);
        const buf = await res.arrayBuffer();
        if (!cancelled) setData(buf);
      } catch {
        if (!cancelled) setError("We couldn't load this file. Please try again.");
      }
    })();
    return () => { cancelled = true; };
  }, [kind, src]);

  return createPortal(
    <div ref={rootRef} className="vw" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}>
      <header className="vw-top">
        <button ref={backRef} type="button" className="btn o sm" onClick={onClose}><Ic as={ArrowLeft} />{backLabel}</button>
        <h2 className="vw-title">{title}</h2>
        <div className="vw-acts">
          {actions}
          {kind === 'web' && <a className="btn o sm" href={src} target="_blank" rel="noopener noreferrer"><Ic as={ExternalLink} /><span>Open in new tab</span></a>}
          {onDownload && <button type="button" className="btn o sm" onClick={onDownload}><Ic as={Download} /><span>Download</span></button>}
        </div>
      </header>
      <div className="vw-body">
        {kind === 'pdf' && (
          error ? <p className="vw-msg" role="alert">{error}</p> : !data ? <Spinner>Loading…</Spinner> : (
            <Suspense fallback={<Spinner>Preparing the book…</Spinner>}>
              <FlipBook data={data} title={title} />
            </Suspense>
          )
        )}
        {kind === 'web' && (
          <>
            {!frameLoaded && <Spinner>Loading…</Spinner>}
            <iframe
              className="vw-frame"
              title={title}
              src={toEmbedUrl(src)}
              onLoad={() => setFrameLoaded(true)}
              allow="fullscreen; autoplay; clipboard-write"
             
              referrerPolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation"
            />
            <p className="vw-hint">Page not showing? Some sites don't allow being embedded. Use <b>Open in new tab</b>.</p>
          </>
        )}
      </div>
    </div>,
    layer || document.body
  );
}
