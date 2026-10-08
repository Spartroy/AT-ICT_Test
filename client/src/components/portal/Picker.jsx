import React, { useEffect, useId, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Popover picker: a button showing the current value and a panel (bottom sheet ≤700px).
 * Only one is open at a time (the parent passes `open` / `onOpenChange`). Click outside or Esc closes.
 */
export default function Picker({ icon: Icon, label, value, open, onOpenChange, children, className = '' }) {
  const ref = useRef(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!ref.current?.contains(e.target)) onOpenChange(false); };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onOpenChange(false);
        ref.current?.querySelector('.pkb')?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    const first = ref.current?.querySelector('.pkp input, .pkp button');
    first?.focus();
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onOpenChange]);

  return (
    <div className={`pk ${className}`} ref={ref}>
      <button type="button" className="pkb" aria-haspopup="dialog" aria-expanded={open} aria-controls={panelId} aria-label={`${label}: ${value}`} onClick={() => onOpenChange(!open)}>
        {Icon && <Icon className="i" aria-hidden="true" />}
        <span>{value}</span>
        <ChevronDown className="i" aria-hidden="true" />
      </button>
      <div id={panelId} className={`pkp ${open ? 'on' : ''}`} role="dialog" aria-label={label} hidden={!open}>
        {open && children}
      </div>
    </div>
  );
}

/** A labelled row of choice chips inside a picker. options: [{ value, label }]. */
export function PickerRow({ title, options, value, onPick }) {
  return (
    <div className="pkq">
      <small>{title}</small>
      <div className="chips" role="group" aria-label={title}>
        {options.map(o => (
          <button key={o.value || 'all'} type="button" className={`ch ${value === o.value ? 'on' : ''}`} aria-pressed={value === o.value} onClick={() => onPick(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
