import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useTeacher } from './TeacherPortal';
import useTeacherSettings from '../../hooks/useTeacherSettings';
import { QUICK_ACTIONS_CHANGED, resolveQuickActions } from './quickActionCatalog';

/** Offsets for each action: a gently curved column above the button, spaced to fit the viewport. */
function layout(n) {
  const bottomUi = window.innerWidth <= 900 ? 92 : 24;
  const spacing = Math.max(50, Math.min(60, (window.innerHeight - 130 - bottomUi) / (n + 1)));
  return Array.from({ length: n }, (_, i) => ({
    dy: -(i + 1) * spacing,
    dx: -Math.round(44 * Math.sin(((i + 1) / (n + 1)) * Math.PI))
  }));
}

/** Global quick-actions FAB (bottom-right on every teacher page). */
export default function QuickActions() {
  const { base, openModal } = useTeacher();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { settings, reload } = useTeacherSettings();
  const actions = useMemo(() => resolveQuickActions(settings?.quickActions), [settings?.quickActions]);
  const [pos, setPos] = useState(() => layout(actions.length));
  // Recompute straight away when the number of actions changes, so a menu opened right after saving never has stale offsets.
  const offsets = useMemo(() => (pos.length === actions.length ? pos : layout(actions.length)), [pos, actions.length]);
  const mainRef = useRef(null);

  useEffect(() => {
    window.addEventListener(QUICK_ACTIONS_CHANGED, reload);
    return () => window.removeEventListener(QUICK_ACTIONS_CHANGED, reload);
  }, [reload]);

  const close = useCallback((refocus = true) => {
    setOpen(false);
    if (refocus) mainRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    setPos(layout(actions.length));
    const onKey = (e) => e.key === 'Escape' && close();
    const onResize = () => setPos(layout(actions.length));
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [open, close, actions.length]);

  const run = (action) => {
    close(false);
    // Let the fan retract before the dialog opens.
    setTimeout(() => (action.to ? navigate(`${base}${action.to}`) : openModal(action.modal)), 180);
  };

  return (
    <div className={`qfab ${open ? 'open' : ''}`}>
      <div className="qf-bd" onClick={() => close()} aria-hidden="true" />
      {actions.map((a, i) => (
        <button
          key={a.id}
          type="button"
          className="qf-i"
          style={{ '--i': i, '--dx': `${offsets[i]?.dx ?? 0}px`, '--dy': `${offsets[i]?.dy ?? 0}px` }}
          tabIndex={open ? 0 : -1}
          aria-hidden={!open}
          onClick={() => run(a)}
        >
          <span className="qf-l">{a.label}</span>
          <span className="qf-c"><a.icon className="i" aria-hidden="true" /></span>
        </button>
      ))}
      <button ref={mainRef} type="button" className="qf-main" aria-label="Quick actions" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <Plus className="i" aria-hidden="true" />
      </button>
    </div>
  );
}
