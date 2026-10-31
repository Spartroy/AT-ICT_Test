import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft } from 'lucide-react';
import { Ic } from '../../components/portal/kit';
import { usePortalUI } from '../../components/portal/PortalUI';
import '../../styles/guide.css';

/**
 * The guide opens full screen over the portal, like the notes and videos viewers: a slim top bar
 * (back, title, actions) and the whole document below it. Dialogs and toasts stay above it.
 * `escCloses` is off for the editor, where Esc already means "undo this edit".
 */
export default function GuideScreen({ title, onClose, backLabel = 'Back', actions, escCloses = true, editor = false, children }) {
  const { layer } = usePortalUI();
  const rootRef = useRef(null);
  const bodyRef = useRef(null);

  // The page behind does not scroll while the guide is open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => { rootRef.current?.focus(); }, [layer]);

  useEffect(() => {
    if (!escCloses) return undefined;
    const onKey = (e) => {
      if (e.key !== 'Escape' || e.target.isContentEditable) return;
      // A dialog (confirm, picker) closes itself first.
      const dialogs = layer ? [...layer.querySelectorAll('[role="dialog"], [role="alertdialog"]')].filter(d => d !== rootRef.current) : [];
      if (dialogs.length) return;
      onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, escCloses, layer]);

  if (!layer) return null;
  return createPortal(
    <div ref={rootRef} className="sg-screen" role="dialog" aria-modal="false" aria-label={title} tabIndex={-1}>
      <header className="sg-screen-top">
        <button type="button" className="btn o sm" onClick={onClose}><Ic as={ArrowLeft} />{backLabel}</button>
        <h2 className="sg-screen-title">{title}</h2>
        <div className="sg-screen-acts">{actions}</div>
      </header>
      <div ref={bodyRef} className="sg-screen-body">
        <div className={`sg sg-screen-inner${editor ? ' sg-editor' : ''}`}>{children}</div>
      </div>
    </div>,
    layer
  );
}
