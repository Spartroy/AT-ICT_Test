import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ClipboardCheck, GraduationCap, Megaphone, Play, Library, Users, CalendarDays } from 'lucide-react';
import { useTeacher } from './TeacherPortal';

const ACTIONS = [
  { id: 'hw', label: 'Create H.W', icon: ClipboardCheck },
  { id: 'quiz', label: 'Create quiz', icon: GraduationCap },
  { id: 'announcement', label: 'Send announcement', icon: Megaphone },
  { id: 'video', label: 'Add video', icon: Play },
  { id: 'note', label: 'Add interactive note', icon: Library },
  { id: 'regs', label: 'Approve registrations', icon: Users },
  { id: 'schedule', label: 'Create schedule', icon: CalendarDays }
];

/** Offsets for each action: a gently curved column above the button, spaced to fit the viewport. */
function layout() {
  const n = ACTIONS.length;
  const bottomUi = window.innerWidth <= 900 ? 92 : 24;
  const spacing = Math.max(50, Math.min(60, (window.innerHeight - 130 - bottomUi) / (n + 1)));
  return ACTIONS.map((_, i) => ({
    dy: -(i + 1) * spacing,
    dx: -Math.round(44 * Math.sin(((i + 1) / (n + 1)) * Math.PI))
  }));
}

/** Global quick-actions FAB (bottom-right on every teacher page). */
export default function QuickActions() {
  const { base, openModal } = useTeacher();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(layout);
  const mainRef = useRef(null);

  const close = useCallback((refocus = true) => {
    setOpen(false);
    if (refocus) mainRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    setPos(layout());
    const onKey = (e) => e.key === 'Escape' && close();
    const onResize = () => setPos(layout());
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [open, close]);

  const run = (id) => {
    close(false);
    // Let the fan retract before the dialog opens.
    setTimeout(() => (id === 'regs' ? navigate(`${base}/students/registrations`) : openModal(id)), 180);
  };

  return (
    <div className={`qfab ${open ? 'open' : ''}`}>
      <div className="qf-bd" onClick={() => close()} aria-hidden="true" />
      {ACTIONS.map((a, i) => (
        <button
          key={a.id}
          type="button"
          className="qf-i"
          style={{ '--i': i, '--dx': `${pos[i].dx}px`, '--dy': `${pos[i].dy}px` }}
          tabIndex={open ? 0 : -1}
          aria-hidden={!open}
          onClick={() => run(a.id)}
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
