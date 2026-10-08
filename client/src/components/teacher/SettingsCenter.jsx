import React, { useEffect, useState } from 'react';
import { CalendarDaysIcon, AcademicCapIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import useTeacherSettings from '../../hooks/useTeacherSettings';
import { showSuccess, showError } from '../../utils/toast';

const MONTHS = { JAN: 'January', FEB: 'February', MAR: 'March', APR: 'April', MAY: 'May', JUN: 'June', JUL: 'July', AUG: 'August', SEP: 'September', OCT: 'October', NOV: 'November', DEC: 'December' };
const SESSION_CODE = /^[A-Z]{3} \d{2}$/;

/** "JUN 28" → "June 2028" (used to prefill the label of a new session). */
export const labelFromCode = (code) => {
  const m = code.trim().toUpperCase().match(/^([A-Z]{3}) (\d{2})$/);
  return m && MONTHS[m[1]] ? `${MONTHS[m[1]]} 20${m[2]}` : '';
};

const card = 'bg-[#161616] rounded-xl border border-white/10 p-4 sm:p-6';
const input = 'w-full px-3 py-2 rounded-lg bg-[#0F0F0F] border border-white/10 text-white focus:outline-none focus:border-[#CA133E] disabled:opacity-60';
const primary = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#CA133E] text-white font-semibold hover:bg-[#A01030] disabled:opacity-50 disabled:cursor-not-allowed';
const ghost = 'inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/15 text-gray-200 hover:border-[#CA133E]';

/**
 * Settings: exam sessions offered on the registration form and Royal College classes.
 * Values held by existing students can be closed or relabelled but not removed.
 */
export default function SettingsCenter() {
  const { settings, loading, error, reload, save } = useTeacherSettings();
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [newClass, setNewClass] = useState('');
  const [saving, setSaving] = useState('');
  const [problems, setProblems] = useState({ sessions: '', classes: '' });

  useEffect(() => {
    if (!settings) return;
    setSessions(settings.examSessions.map(s => ({ ...s, saved: true })));
    setClasses(settings.royalClasses);
  }, [settings]);

  if (loading && !settings) return <p className="text-gray-400 p-6">Loading settings…</p>;
  if (error && !settings) {
    return (
      <div className={card}>
        <p className="text-red-300 mb-3">{error}</p>
        <button type="button" className={ghost} onClick={reload}>Try again</button>
      </div>
    );
  }

  const usage = settings?.usage || { examSessions: {}, royalClasses: {} };
  const updateSession = (i, patch) => setSessions(list => list.map((s, k) => (k === i ? { ...s, ...patch } : s)));

  const validateSessions = () => {
    const codes = sessions.map(s => s.code.trim().toUpperCase());
    if (sessions.some(s => !SESSION_CODE.test(s.code.trim().toUpperCase()))) return 'Session codes must look like "JUN 27".';
    if (sessions.some(s => s.label.trim().length < 2)) return 'Every session needs a label, e.g. "June 2027".';
    if (new Set(codes).size !== codes.length) return 'Each session code can only appear once.';
    if (!sessions.some(s => s.open)) return 'Keep at least one session open for registration.';
    return '';
  };

  const saveSessions = async () => {
    const problem = validateSessions();
    setProblems(p => ({ ...p, sessions: problem }));
    if (problem) return;
    setSaving('sessions');
    const res = await save({ examSessions: sessions.map(s => ({ code: s.code.trim().toUpperCase(), label: s.label.trim(), open: s.open })) });
    setSaving('');
    if (res.ok) {
      showSuccess('Exam sessions saved');
      reload();
    } else {
      setProblems(p => ({ ...p, sessions: res.errors?.[0]?.msg || res.message || 'Could not save sessions' }));
      showError(res.message || 'Could not save sessions');
    }
  };

  const addClass = () => {
    const value = newClass.trim().toUpperCase();
    if (!/^[A-Z0-9]{1,20}$/.test(value)) {
      setProblems(p => ({ ...p, classes: 'Class names can only contain letters and numbers, e.g. 9H.' }));
      return;
    }
    if (classes.includes(value)) {
      setProblems(p => ({ ...p, classes: `${value} is already in the list.` }));
      return;
    }
    setClasses(c => [...c, value]);
    setNewClass('');
    setProblems(p => ({ ...p, classes: '' }));
  };

  const saveClasses = async () => {
    if (!classes.length) {
      setProblems(p => ({ ...p, classes: 'Add at least one class.' }));
      return;
    }
    setSaving('classes');
    const res = await save({ royalClasses: classes });
    setSaving('');
    if (res.ok) {
      showSuccess('Royal College classes saved');
      reload();
    } else {
      setProblems(p => ({ ...p, classes: res.errors?.[0]?.msg || res.message || 'Could not save classes' }));
      showError(res.message || 'Could not save classes');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">Settings</h2>
        <p className="text-gray-400 text-sm">Options students see on the registration form.</p>
      </div>

      <section className={card} aria-labelledby="sessions-heading">
        <h3 id="sessions-heading" className="text-lg font-semibold text-white flex items-center gap-2 mb-1">
          <CalendarDaysIcon className="h-5 w-5 text-[#CA133E]" aria-hidden="true" />Exam sessions
        </h3>
        <p className="text-gray-400 text-sm mb-4">
          Open sessions appear on the registration form for center students. Royal College students don't pick a session.
          Sessions that still have students can be closed or relabelled, not removed.
        </p>
        <div className="space-y-3">
          {sessions.map((s, i) => {
            const count = usage.examSessions[s.code] || 0;
            return (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-[120px_1fr_auto_auto] gap-3 items-center bg-[#0F0F0F]/60 rounded-lg p-3">
                <label className="text-xs text-gray-400">
                  Code
                  <input
                    className={input}
                    value={s.code}
                    disabled={s.saved}
                    placeholder="JUN 28"
                    onChange={e => {
                      const code = e.target.value.toUpperCase();
                      updateSession(i, { code, label: s.labelTouched ? s.label : labelFromCode(code) });
                    }}
                  />
                </label>
                <label className="text-xs text-gray-400">
                  Label shown to students
                  <input className={input} value={s.label} placeholder="June 2028" onChange={e => updateSession(i, { label: e.target.value, labelTouched: true })} />
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-200 sm:mt-4 min-h-[44px]">
                  <input type="checkbox" className="h-5 w-5 accent-[#CA133E]" checked={s.open} onChange={e => updateSession(i, { open: e.target.checked })} />
                  Open for registration
                </label>
                <div className="flex items-center gap-2 sm:mt-4">
                  <span className="text-xs text-gray-400 whitespace-nowrap">{count} student{count === 1 ? '' : 's'}</span>
                  <button
                    type="button"
                    className="p-2 rounded-lg border border-white/10 text-gray-300 hover:text-red-300 hover:border-red-400 disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={count > 0}
                    title={count > 0 ? 'This session still has students. Close it instead.' : 'Remove session'}
                    aria-label={`Remove session ${s.code || 'new'}`}
                    onClick={() => setSessions(list => list.filter((_, k) => k !== i))}
                  >
                    <TrashIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {problems.sessions && <p className="text-red-300 text-sm mt-3" role="alert">{problems.sessions}</p>}
        <div className="flex flex-wrap gap-3 mt-4">
          <button type="button" className={ghost} onClick={() => setSessions(list => [...list, { code: '', label: '', open: true }])}>
            <PlusIcon className="h-4 w-4" aria-hidden="true" />Add session
          </button>
          <button type="button" className={primary} onClick={saveSessions} disabled={saving === 'sessions'}>
            {saving === 'sessions' ? 'Saving…' : 'Save sessions'}
          </button>
        </div>
      </section>

      <section className={card} aria-labelledby="classes-heading">
        <h3 id="classes-heading" className="text-lg font-semibold text-white flex items-center gap-2 mb-1">
          <AcademicCapIcon className="h-5 w-5 text-[#CA133E]" aria-hidden="true" />Royal College classes
        </h3>
        <p className="text-gray-400 text-sm mb-4">Royal College students pick one of these when they register. Classes that still have students can't be removed.</p>
        <ul className="flex flex-wrap gap-2 mb-4">
          {classes.map(c => {
            const count = usage.royalClasses[c] || 0;
            return (
              <li key={c} className="flex items-center gap-2 pl-3 pr-1 py-1 rounded-full bg-[#0F0F0F] border border-white/10 text-white text-sm">
                Class {c}
                <span className="text-xs text-gray-400">· {count}</span>
                <button
                  type="button"
                  className="p-1.5 rounded-full text-gray-400 hover:text-red-300 disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={count > 0}
                  title={count > 0 ? 'This class still has students' : `Remove class ${c}`}
                  aria-label={`Remove class ${c}`}
                  onClick={() => setClasses(list => list.filter(x => x !== c))}
                >
                  <TrashIcon className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
        <form
          className="flex flex-wrap gap-3"
          onSubmit={e => {
            e.preventDefault();
            addClass();
          }}
        >
          <label className="sr-only" htmlFor="new-class">New class</label>
          <input id="new-class" className={`${input} max-w-[180px]`} placeholder="e.g. 9K" value={newClass} onChange={e => setNewClass(e.target.value)} />
          <button type="submit" className={ghost}><PlusIcon className="h-4 w-4" aria-hidden="true" />Add class</button>
          <button type="button" className={primary} onClick={saveClasses} disabled={saving === 'classes'}>
            {saving === 'classes' ? 'Saving…' : 'Save classes'}
          </button>
        </form>
        {problems.classes && <p className="text-red-300 text-sm mt-3" role="alert">{problems.classes}</p>}
      </section>
    </div>
  );
}
