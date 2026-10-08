import React, { useEffect, useId, useState } from 'react';
import { ChevronDown, Search as SearchIcon, X, Info } from 'lucide-react';
import logoFull from '../../assets/brand/logo-full.webp';
import logoMark from '../../assets/brand/logo-mark.png';

/** Lucide icon with the portal's `.i` sizing. */
export const Ic = ({ as: Icon, ...props }) => <Icon className="i" aria-hidden="true" {...props} />;

/** Logo on a white tile (the PNG is dark on white). mark = compact square. */
export const LogoTile = ({ mark = false, className = '' }) => (
  <span className={`lg ${mark ? 'm' : ''} ${className}`}>
    <img className="lgi" src={mark ? logoMark : logoFull} alt="AT-ICT" />
  </span>
);

export const initials = (name = '') => name.split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';

/** Animated progress ring. p: 0-100. */
export function Ring({ p = 0, color = 'var(--crimson-glow)', size = 76, fs = '1rem', w = 7, label }) {
  const r = (size - w) / 2;
  const L = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, Math.round(p)));
  const [offset, setOffset] = useState(L);
  useEffect(() => {
    const t = requestAnimationFrame(() => setOffset(L * (1 - pct / 100)));
    return () => cancelAnimationFrame(t);
  }, [L, pct]);
  return (
    <div className="ring" style={{ width: size, height: size, '--fs': fs }} role="img" aria-label={label || `${pct}%`}>
      <svg width={size} height={size} aria-hidden="true">
        <circle className="t" cx={size / 2} cy={size / 2} r={r} strokeWidth={w} />
        <circle className="v" cx={size / 2} cy={size / 2} r={r} strokeWidth={w} stroke={color} strokeDasharray={L} strokeDashoffset={offset} />
      </svg>
      <b aria-hidden="true">{pct}%</b>
    </div>
  );
}

/** Segmented tabs. tabs: [{ id, label, icon?, count? }]. Renders buttons with aria-pressed. */
export function Seg({ tabs, value, onChange, label = 'Sections', className = '' }) {
  return (
    <div className={`seg ${className}`} role="tablist" aria-label={label}>
      {tabs.map(t => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={value === t.id}
          className={value === t.id ? 'on' : ''}
          onClick={() => onChange(t.id)}
        >
          {t.icon && <Ic as={t.icon} />}
          {t.label}
          {t.count !== undefined && t.count !== '' && t.count !== null && <em>{t.count}</em>}
        </button>
      ))}
    </div>
  );
}

/** Filter chips (single choice). items: [{ id, label, count? }]. */
export function Chips({ items, value, onChange, label = 'Filter', className = '', style }) {
  return (
    <div className={`chips ${className}`} role="group" aria-label={label} style={style}>
      {items.map(c => (
        <button key={c.id} type="button" className={`ch ${value === c.id ? 'on' : ''}`} aria-pressed={value === c.id} onClick={() => onChange(c.id)}>
          {c.label}
          {c.count !== undefined && <em>{c.count}</em>}
        </button>
      ))}
    </div>
  );
}

/** Accordion card. `head` is the left part of the header button; open state is controlled or internal. */
export function Accordion({ head, count, defaultOpen = false, open: openProp, onToggle, children, className = '' }) {
  const [inner, setInner] = useState(defaultOpen);
  const open = openProp ?? inner;
  const id = useId();
  const toggle = () => (onToggle ? onToggle(!open) : setInner(o => !o));
  return (
    <div className={`acc ${open ? '' : 'cl'} ${className}`}>
      <button type="button" aria-expanded={open} aria-controls={id} onClick={toggle}>
        {head}
        {count !== undefined && <span className="gcount">{count}</span>}
        <ChevronDown className="i" aria-hidden="true" />
      </button>
      <div className="bd3" id={id}>
        <div inert={open ? undefined : ''}>{children}</div>
      </div>
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder, label, className = '', style, inputRef }) {
  return (
    <div className={`search ${className}`} style={style}>
      <SearchIcon className="i" aria-hidden="true" />
      <input ref={inputRef} type="search" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} aria-label={label || placeholder} />
      {value && (
        <button type="button" className="search-clear" aria-label="Clear search" onClick={() => onChange('')}><X className="i" aria-hidden="true" /></button>
      )}
    </div>
  );
}

export const Empty = ({ icon: Icon = Info, children }) => (
  <div className="empty-s">
    <Icon className="i" aria-hidden="true" />
    <p>{children}</p>
  </div>
);

/** Stat tile; `ring` renders a progress ring on the right. */
export const Stat = ({ icon, label, value, note, ring }) => (
  <div className="stat">
    <div>
      <small>{icon && <Ic as={icon} />}{label}</small>
      <b>{value}</b>
      {note}
    </div>
    {ring}
  </div>
);

export const PageHead = ({ eyebrow, title, children, actions }) => (
  <div className={`ph ${actions ? 'pr' : ''}`}>
    <div>
      {eyebrow && <span className="eb">{eyebrow}</span>}
      <h1>{title}</h1>
      {children}
    </div>
    {actions && <div className="ph-actions">{actions}</div>}
  </div>
);

export function Loading({ label = 'Loading…' }) {
  return <div className="pt-loading" role="status"><span className="pt-spin" aria-hidden="true" />{label}</div>;
}

export function ErrorNote({ error, onRetry }) {
  return (
    <div className="pt-error" role="alert">
      <span>{error?.message || 'Something went wrong.'}</span>
      {onRetry && <button type="button" className="btn o sm" onClick={onRetry}>Try again</button>}
    </div>
  );
}

/** Small helpers for dates shown across the portals. */
export const fmtDate = (d, opts = { month: 'short', day: 'numeric' }) => (d ? new Date(d).toLocaleDateString('en-GB', opts) : '—');
export const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');
