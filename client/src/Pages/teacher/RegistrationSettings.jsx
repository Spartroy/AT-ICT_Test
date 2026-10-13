import React, { useEffect, useState } from 'react';
import { CalendarDays, GraduationCap, Plus, Trash2 } from 'lucide-react';
import { Ic } from '../../components/portal/kit';
import { useToast } from '../../components/portal/PortalUI';
import { FormDialog } from './modals/form';

const MONTHS = { JAN: 'January', FEB: 'February', MAR: 'March', APR: 'April', MAY: 'May', JUN: 'June', JUL: 'July', AUG: 'August', SEP: 'September', OCT: 'October', NOV: 'November', DEC: 'December' };
const SESSION_CODE = /^[A-Z]{3} \d{2}$/;

/** "JUN 28" → "June 2028" (prefills the label of a new session). */
export const labelFromCode = (code) => {
  const m = code.trim().toUpperCase().match(/^([A-Z]{3}) (\d{2})$/);
  return m && MONTHS[m[1]] ? `${MONTHS[m[1]]} 20${m[2]}` : '';
};

const fromSaved = (list) => list.map(s => ({ ...s, saved: true }));

/** What the registration form offers: exam sessions (with moving students when one is removed) and Royal College classes. */
export default function RegistrationSettings({ settings, save, reload }) {
  const toast = useToast();
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [newClass, setNewClass] = useState('');
  const [problems, setProblems] = useState({});
  const [saving, setSaving] = useState('');
  const [moves, setMoves] = useState({}); // { 'JUN 26': 'JUN 27' }: removed sessions and where their students go on save
  const [removing, setRemoving] = useState(null); // { code, count, target } while the "move students" dialog is open

  // Follow the server only when these lists change, so saving other settings never wipes edits in progress here.
  const sessionsKey = JSON.stringify(settings?.examSessions || []);
  const classesKey = JSON.stringify(settings?.royalClasses || []);
  useEffect(() => { setSessions(fromSaved(JSON.parse(sessionsKey))); setMoves({}); }, [sessionsKey]);
  useEffect(() => { setClasses(JSON.parse(classesKey)); }, [classesKey]);

  const usage = settings?.usage || { examSessions: {}, royalClasses: {} };
  const update = (i, patch) => setSessions(list => list.map((s, k) => (k === i ? { ...s, ...patch } : s)));

  const saveSessions = async () => {
    const codes = sessions.map(s => s.code.trim().toUpperCase());
    const problem = sessions.some(s => !SESSION_CODE.test(s.code.trim().toUpperCase())) ? 'Session codes must look like "JUN 27".'
      : sessions.some(s => s.label.trim().length < 2) ? 'Every session needs a label, e.g. "June 2027".'
        : new Set(codes).size !== codes.length ? 'Each session code can only appear once.'
          : !sessions.some(s => s.open) ? 'Keep at least one session open for registration.' : '';
    setProblems(p => ({ ...p, sessions: problem }));
    if (problem) return;
    const moveStudents = Object.fromEntries(Object.entries(moves).filter(([from, to]) => !codes.includes(from) && codes.includes(to)));
    setSaving('sessions');
    const res = await save({ examSessions: sessions.map(s => ({ code: s.code.trim().toUpperCase(), label: s.label.trim(), open: s.open })), moveStudents });
    setSaving('');
    if (res.ok) { toast(Object.keys(moveStudents).length ? 'Students moved and exam sessions saved' : 'Exam sessions saved'); reload(); } else setProblems(p => ({ ...p, sessions: res.errors?.[0]?.msg || res.message }));
  };

  // A session with students asks where they should go; one without is simply removed.
  const askRemove = (i) => {
    const s = sessions[i];
    const count = usage.examSessions[s.code] || 0;
    if (!s.saved || !count) return setSessions(l => l.filter((_, k) => k !== i));
    const others = sessions.filter((x, k) => k !== i && x.saved && !moves[x.code]);
    setRemoving({ code: s.code, count, target: (others.find(x => x.open) || others[0])?.code || '' });
  };
  const confirmRemove = () => {
    if (!removing.target) return;
    setMoves(m => ({ ...m, [removing.code]: removing.target }));
    setSessions(l => l.filter(x => x.code !== removing.code));
    setRemoving(null);
  };
  const undoRemovals = () => { setMoves({}); setSessions(fromSaved(settings.examSessions)); };

  const addClass = (e) => {
    e.preventDefault();
    const value = newClass.trim().toUpperCase();
    if (!/^[A-Z0-9]{1,20}$/.test(value)) return setProblems(p => ({ ...p, classes: 'Class names can only contain letters and numbers, e.g. 9H.' }));
    if (classes.includes(value)) return setProblems(p => ({ ...p, classes: `${value} is already in the list.` }));
    setClasses(c => [...c, value]);
    setNewClass('');
    setProblems(p => ({ ...p, classes: '' }));
  };

  const saveClasses = async () => {
    if (!classes.length) return setProblems(p => ({ ...p, classes: 'Add at least one class.' }));
    setSaving('classes');
    const res = await save({ royalClasses: classes });
    setSaving('');
    if (res.ok) { toast('Royal College classes saved'); reload(); } else setProblems(p => ({ ...p, classes: res.errors?.[0]?.msg || res.message }));
  };

  return (
    <>
      <section className="card set-card" aria-labelledby="set-sessions">
        <h3 id="set-sessions"><Ic as={CalendarDays} />Exam sessions</h3>
        <p className="sub set-note">Open sessions appear on the registration form for centre students. Royal College students don't pick a session. To remove a session that still has students, you choose another session to move them to first.</p>
        {sessions.map((s, i) => {
          const count = usage.examSessions[s.code] || 0;
          return (
            <div className="set-row" key={i}>
              <label className="fld"><span>Code</span>
                <input className="inp" value={s.code} disabled={s.saved} placeholder="JUN 28" onChange={e => { const code = e.target.value.toUpperCase(); update(i, { code, label: s.labelTouched ? s.label : labelFromCode(code) }); }} />
              </label>
              <label className="fld"><span>Label shown to students</span>
                <input className="inp" value={s.label} placeholder="June 2028" onChange={e => update(i, { label: e.target.value, labelTouched: true })} />
              </label>
              <label className="cbx"><input type="checkbox" checked={s.open} onChange={e => update(i, { open: e.target.checked })} />Open for registration</label>
              <span className="sub set-count">{count} student{count === 1 ? '' : 's'}</span>
              <button type="button" className="ib sm dng" title={count > 0 ? `Remove and move its ${count} student${count === 1 ? '' : 's'}` : 'Remove session'} aria-label={`Remove session ${s.code || 'new'}`} onClick={() => askRemove(i)}><Ic as={Trash2} /></button>
            </div>
          );
        })}
        {Object.keys(moves).length > 0 && (
          <div className="set-pending" role="status">
            <div>
              {Object.entries(moves).map(([from, to]) => <p key={from}><b>{from}</b> will be removed and its {usage.examSessions[from] || 0} student(s) moved to <b>{to}</b>. Press Save sessions to apply.</p>)}
            </div>
            <button type="button" className="btn o sm" onClick={undoRemovals}>Undo</button>
          </div>
        )}
        {problems.sessions && <p className="fld-err" role="alert">{problems.sessions}</p>}
        <div className="mfoot" style={{ justifyContent: 'flex-start' }}>
          <button type="button" className="btn o" onClick={() => setSessions(l => [...l, { code: '', label: '', open: true }])}><Ic as={Plus} />Add session</button>
          <button type="button" className="btn p" onClick={saveSessions} disabled={saving === 'sessions'}>{saving === 'sessions' ? 'Saving…' : 'Save sessions'}</button>
        </div>
      </section>

      <FormDialog open={!!removing} onClose={() => setRemoving(null)} icon={Trash2} title={removing ? `Remove ${removing.code}?` : ''} sub="Its students are moved first" submitLabel="Move students & remove" disabled={!removing?.target} onSubmit={confirmRemove}>
        {removing && (
          <>
            <p className="sub">{removing.count} student{removing.count === 1 ? ' is' : 's are'} in <b>{removing.code}</b>. Pending registrations for it move too. Pick the session they should be in, then press <b>Save sessions</b> to apply it.</p>
            <label className="fld"><span>Move them to</span>
              <select className="inp" value={removing.target} onChange={e => setRemoving(r => ({ ...r, target: e.target.value }))}>
                {sessions.filter(x => x.saved && x.code !== removing.code && !moves[x.code]).map(x => <option key={x.code} value={x.code}>{x.code} — {x.label}{x.open ? '' : ' (closed)'}</option>)}
              </select>
            </label>
          </>
        )}
      </FormDialog>

      <section className="card set-card" aria-labelledby="set-classes">
        <h3 id="set-classes"><Ic as={GraduationCap} />Royal College classes</h3>
        <p className="sub set-note">Royal College students pick one of these when they register. Classes that still have students can't be removed.</p>
        <ul className="set-chips">
          {classes.map(c => {
            const count = usage.royalClasses[c] || 0;
            return (
              <li key={c}>
                Class {c}<span className="sub">· {count}</span>
                <button type="button" className="ib sm dng" disabled={count > 0} title={count > 0 ? 'This class still has students' : `Remove class ${c}`} aria-label={`Remove class ${c}`} onClick={() => setClasses(l => l.filter(x => x !== c))}><Ic as={Trash2} /></button>
              </li>
            );
          })}
        </ul>
        <form className="inl" onSubmit={addClass}>
          <input className="inp" value={newClass} onChange={e => setNewClass(e.target.value)} placeholder="e.g. 9K" aria-label="New class" style={{ maxWidth: 180 }} />
          <button type="submit" className="btn o sm"><Ic as={Plus} />Add class</button>
          <button type="button" className="btn p sm" onClick={saveClasses} disabled={saving === 'classes'}>{saving === 'classes' ? 'Saving…' : 'Save classes'}</button>
        </form>
        {problems.classes && <p className="fld-err" role="alert">{problems.classes}</p>}
      </section>
    </>
  );
}
