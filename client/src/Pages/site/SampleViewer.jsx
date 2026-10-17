import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ExternalLink, X, Lock } from 'lucide-react';
import { toEmbedUrl } from '../../lib/embedUrl';
import { PROMPT_DELAY_MS, submitLead, track } from '../../lib/leadTest';
import { useFocusTrap } from '../../components/ui/Modal';

// Rendered inside .site so the site's button and colour rules apply.
const mountPoint = () => document.querySelector('.site') || document.body;

/** Name + phone form. `variant` only labels the result for the A/B test. */
export function OptInForm({ variant, sample, onDone, onSkip, compact = false }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [trap, setTrap] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (name.trim().length < 2) { setError('Please enter your name'); return; }
    if (!/^\+?[0-9]{7,15}$/.test(phone.replace(/[\s\-().]/g, ''))) { setError('Please enter a valid phone number, e.g. 01012345678'); return; }
    setBusy(true);
    try {
      await submitLead({ name: name.trim(), phone, variant, sampleId: sample.id, website: trap });
      onDone();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form className={`sv-form ${compact ? 'compact' : ''}`} onSubmit={submit} noValidate>
      <label><span>Your name</span><input autoComplete="name" value={name} maxLength={80} onChange={e => setName(e.target.value)} placeholder="Full name" /></label>
      <label><span>Phone / WhatsApp number</span><input type="tel" inputMode="tel" autoComplete="tel" value={phone} maxLength={20} onChange={e => setPhone(e.target.value)} placeholder="01012345678" /></label>
      {/* Honeypot: hidden from people, filled in by bots */}
      <input className="sv-trap" tabIndex={-1} autoComplete="off" aria-hidden="true" value={trap} onChange={e => setTrap(e.target.value)} name="website" />
      {error && <p className="sv-err" role="alert">{error}</p>}
      <button className="btn btn-p" disabled={busy}>{busy ? 'Saving…' : compact ? 'Send my details' : 'Unlock free sample'}</button>
      {onSkip && <button type="button" className="sv-skip" onClick={onSkip}>Not now</button>}
      <small className="sv-fine">We'll only use your number to follow up about this course. No spam.</small>
    </form>
  );
}

/** Version A: the gate. A dialog before anything opens. */
export function OptInGate({ sample, variant, onDone, onClose }) {
  const ref = useRef(null);
  useFocusTrap(ref, true, undefined, 'input');
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return createPortal(
    <div className="sv-back" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sv-gate" ref={ref} role="dialog" aria-modal="true" aria-labelledby="sv-gate-t" tabIndex={-1}>
        <button type="button" className="sv-x" aria-label="Close" onClick={onClose}><X size={18} /></button>
        <span className="sv-lock"><Lock size={20} aria-hidden="true" /></span>
        <h3 id="sv-gate-t">Unlock “{sample.title}”</h3>
        <p>It's free. Leave your name and number and the sample opens right away.</p>
        <OptInForm variant={variant} sample={sample} onDone={onDone} />
      </div>
    </div>,
    mountPoint()
  );
}

/** Big in-page reader for the sample link. Version B asks for details after a short while. */
export default function SampleViewer({ sample, variant, askLater, onClose }) {
  const ref = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [asking, setAsking] = useState(false);
  const [thanks, setThanks] = useState(false);
  const asked = useRef(false);
  useFocusTrap(ref, true);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  useEffect(() => {
    if (!askLater) return undefined;
    const t = setTimeout(() => {
      if (asked.current) return;
      asked.current = true;
      setAsking(true);
      track('prompt', { variant, sampleId: sample.id });
    }, PROMPT_DELAY_MS);
    return () => clearTimeout(t);
  }, [askLater, variant, sample.id]);

  const dismiss = () => { setAsking(false); track('dismiss', { variant, sampleId: sample.id }); };
  const done = () => { setAsking(false); setThanks(true); setTimeout(() => setThanks(false), 4000); };

  return createPortal(
    <div className="sv" ref={ref} role="dialog" aria-modal="true" aria-label={sample.title} tabIndex={-1}>
      <header className="sv-top">
        <button type="button" className="sv-back-btn" onClick={onClose}><ArrowLeft size={16} aria-hidden="true" />Back to samples</button>
        <h2>{sample.title}</h2>
        <a className="sv-open" href={sample.url} target="_blank" rel="noopener noreferrer"><ExternalLink size={16} aria-hidden="true" /><span>Open in new tab</span></a>
      </header>
      <div className="sv-body">
        {!loaded && <div className="sv-load" role="status">Loading…</div>}
        <iframe
          className="sv-frame"
          title={sample.title}
          src={toEmbedUrl(sample.url)}
          onLoad={() => setLoaded(true)}
          allow="fullscreen; autoplay; clipboard-write"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation"
        />
        <p className="sv-hint">Page not showing? Some sites don't allow being embedded. Use <b>Open in new tab</b>.</p>
        {asking && (
          <div className="sv-ask" role="dialog" aria-label="Get the full course details">
            <h3>Enjoying this?</h3>
            <p>Leave your name and WhatsApp number and we'll send you the next free lesson and the course details.</p>
            <OptInForm compact variant={variant} sample={sample} onDone={done} onSkip={dismiss} />
          </div>
        )}
        {thanks && <div className="sv-thanks" role="status">Thank you! We'll be in touch on WhatsApp.</div>}
      </div>
    </div>,
    mountPoint()
  );
}
