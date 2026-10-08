import React, { useEffect, useId, useRef } from 'react';
import { Dialog, DialogHeader } from '../../../components/portal/PortalUI';

/** Pages call this to reload when a modal saves something of `kind` ('assignment', 'video', …). */
export function useTeacherChange(kinds, onChange) {
  const key = [].concat(kinds).join(',');
  const cb = useRef(onChange);
  cb.current = onChange;
  useEffect(() => {
    const list = key.split(',');
    const handler = (e) => { if (list.includes(e.detail)) cb.current(); };
    window.addEventListener('teacher:changed', handler);
    return () => window.removeEventListener('teacher:changed', handler);
  }, [key]);
}

export const announceChange = (kind) => window.dispatchEvent(new CustomEvent('teacher:changed', { detail: kind }));

/** Dialog with header, a <form class="mbody"> and Cancel / submit footer. */
export function FormDialog({ open, onClose, icon, title, sub, size = '', submitLabel = 'Save', busy, error, onSubmit, children }) {
  const id = useId();
  return (
    <Dialog open={open} onClose={onClose} size={size} labelledBy={id}>
      <DialogHeader id={id} icon={icon} title={title} sub={sub} onClose={onClose} />
      <form className="mbody" noValidate onSubmit={e => { e.preventDefault(); onSubmit(); }}>
        {children}
        {error && <p className="fld-err" role="alert" style={{ marginTop: 6 }}>{error}</p>}
        <div className="mfoot">
          <button type="button" className="btn o" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn p" disabled={busy}>{busy ? 'Saving…' : submitLabel}</button>
        </div>
      </form>
    </Dialog>
  );
}

/** Labelled field wrapper (.fld) with optional inline error. */
export function Fld({ label, error, children, className = '' }) {
  return (
    <label className={`fld ${className}`}>
      <span>{label}</span>
      {children}
      {error && <span className="fld-err">{error}</span>}
    </label>
  );
}

/** Chip row (single choice) used inside forms (.hwq). */
export function ChoiceRow({ title, options, value, onChange }) {
  return (
    <div className="hwq">
      <small>{title}</small>
      <div className="chips" role="group" aria-label={title}>
        {options.map(o => (
          <button key={String(o.value)} type="button" className={`ch ${value === o.value ? 'on' : ''}`} aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** First server validation message, or the error message. */
export const apiError = (err) => err?.body?.errors?.[0]?.msg || err?.message || 'Something went wrong';

/** "2026-10-08T14:30" for datetime-local inputs. */
export const toLocalInput = (d) => {
  if (!d) return '';
  const x = new Date(d);
  const pad = (n) => String(n).padStart(2, '0');
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:${pad(x.getMinutes())}`;
};
