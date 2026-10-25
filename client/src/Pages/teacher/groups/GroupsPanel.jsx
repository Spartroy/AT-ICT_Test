import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Layers, Plus, Shuffle, Sparkles, Video } from 'lucide-react';
import { api } from '../../../lib/api';
import { API_ENDPOINTS } from '../../../config/api';
import { Empty, ErrorNote, Ic, Loading } from '../../../components/portal/kit';
import { useConfirm, useToast } from '../../../components/portal/PortalUI';
import useApi from '../../../hooks/useApi';
import { nextGroupCode } from '../../../lib/groups';
import { FormDialog, Fld, announceChange, apiError } from '../modals/form';
import GroupsBoard from './GroupsBoard';
import '../../../styles/groups.css';

const LIVE_MODES = [
  { id: 'manual', title: 'Paste a link each time', text: 'You type the Zoom / Meet link when you start a class.' },
  { id: 'preset', title: 'Reuse a saved link', text: 'One permanent link (e.g. your Google Meet room) that is filled in for you. A group can have its own.' },
  { id: 'auto', title: 'Make a new room automatically', text: 'Every class gets a fresh, private video room. Nothing to create or paste.' }
];

/** "Divide students": how many groups, and whether to touch students who already have one. */
function DivideDialog({ open, onClose, total, unassigned, onDone }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [count, setCount] = useState(2);
  const [scope, setScope] = useState('all');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setCount(Math.min(26, Math.max(2, Math.round(total / 15) || 2)));
    setScope(unassigned && unassigned < total ? 'unassigned' : 'all');
    setError('');
  }, [open, total, unassigned]);

  const pool = scope === 'all' ? total : unassigned;
  const per = count >= 1 ? Math.ceil(pool / count) : 0;

  const submit = async () => {
    if (!(count >= 1 && count <= 26)) return setError('Choose between 1 and 26 groups');
    if (!pool) return setError('There are no students to divide');
    if (scope === 'all' && total !== unassigned && !(await confirm({ title: 'Re-divide everyone?', body: 'Every student is placed again from scratch. Anyone you moved by hand goes back into the alphabetical split.', confirmLabel: 'Re-divide' }))) return;
    setBusy(true);
    try {
      const res = await api.post(`${API_ENDPOINTS.TEACHER_GROUPS}/divide`, { count: Number(count), scope });
      toast(`${res.data.moved} students divided into ${count} group${count === 1 ? '' : 's'}`);
      announceChange('group');
      onDone(res.data);
      onClose();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormDialog open={open} onClose={onClose} icon={Shuffle} title="Divide students into groups" sub="Alphabetical by name: GRP A gets the first names, GRP B the next…" submitLabel={`Divide ${pool} student${pool === 1 ? '' : 's'}`} busy={busy} disabled={!pool} error={error} onSubmit={submit}>
      <Fld label="How many groups?"><input className="inp" type="number" min="1" max="26" value={count} onChange={e => setCount(e.target.value)} style={{ maxWidth: 140 }} /></Fld>
      <div className="hwq">
        <small>Who to place</small>
        <div className="chips" role="group" aria-label="Who to place">
          <button type="button" className={`ch ${scope === 'all' ? 'on' : ''}`} aria-pressed={scope === 'all'} onClick={() => setScope('all')}>All {total} students</button>
          <button type="button" className={`ch ${scope === 'unassigned' ? 'on' : ''}`} aria-pressed={scope === 'unassigned'} disabled={!unassigned} onClick={() => setScope('unassigned')}>Only the {unassigned} without a group</button>
        </div>
      </div>
      {pool > 0 && count >= 1 && <p className="sub" style={{ margin: '4px 0 0' }}>About <b>{per}</b> students per group. You can drag anyone to a different group afterwards.</p>}
    </FormDialog>
  );
}

/** How a new live class gets its meeting link. */
function LiveLinkCard({ live, onSave, saving }) {
  const [mode, setMode] = useState(live.mode);
  const [url, setUrl] = useState(live.url);
  useEffect(() => { setMode(live.mode); setUrl(live.url); }, [live.mode, live.url]);
  const dirty = mode !== live.mode || url.trim() !== live.url;
  return (
    <section className="card set-card glive" aria-labelledby="glive-title">
      <h3 id="glive-title"><Ic as={Video} />Live class links</h3>
      <p className="sub set-note">Choose how the meeting link is filled in when you start or schedule a live class.</p>
      <div className="glive-modes" role="radiogroup" aria-label="Live class links">
        {LIVE_MODES.map(m => (
          <label key={m.id} className={`glive-mode ${mode === m.id ? 'on' : ''}`}>
            <input type="radio" name="live-mode" checked={mode === m.id} onChange={() => setMode(m.id)} />
            <span><b>{m.title}</b><small>{m.text}</small></span>
          </label>
        ))}
      </div>
      {mode === 'preset' && (
        <Fld label="Your saved meeting link"><input className="inp" type="url" inputMode="url" value={url} placeholder="https://meet.google.com/abc-defg-hij" onChange={e => setUrl(e.target.value)} /></Fld>
      )}
      {mode === 'auto' && (
        <p className="sub glive-note"><Ic as={Sparkles} /> Rooms are made on Jitsi Meet (free, no account for students). The first person in is usually asked to sign in as the host, so open the room yourself before class. Google Meet links can't be created automatically without connecting a Google account; save your own Meet link above if you prefer it.</p>
      )}
      <div className="mfoot" style={{ justifyContent: 'flex-start' }}>
        <button type="button" className="btn p" disabled={!dirty || saving} onClick={() => onSave({ live: { mode, url: url.trim() } })}>{saving === 'live' ? 'Saving…' : 'Save'}</button>
      </div>
    </section>
  );
}

/** Students › Groups: the alphabetical split, drag-and-drop between groups, and each group's meeting link. */
export default function GroupsPanel() {
  const toast = useToast();
  const confirm = useConfirm();
  // Not useGroups(): this page owns the data, and reloading on its own changes would re-sort the board right after a drop.
  const g = useApi(API_ENDPOINTS.TEACHER_GROUPS, b => b.data || {});
  const [snap, setSnap] = useState(null);
  const [dividing, setDividing] = useState(false);
  const [saving, setSaving] = useState('');

  useEffect(() => { if (g.data?.groups) setSnap(g.data); }, [g.data]);

  const groups = useMemo(() => snap?.groups || [], [snap]);
  const students = useMemo(() => snap?.students || [], [snap]);
  const unassigned = useMemo(() => students.filter(s => !s.group).length, [students]);

  const save = useCallback(async (patch, tag = 'config') => {
    setSaving(tag);
    try {
      const res = await api.put(API_ENDPOINTS.TEACHER_GROUPS, patch);
      setSnap(res.data);
      announceChange('group');
      return true;
    } catch (err) {
      toast(apiError(err));
      return false;
    } finally {
      setSaving('');
    }
  }, [toast]);

  const rows = (list) => list.map(({ code, name, meetingUrl }) => ({ code, name, meetingUrl }));

  const addGroup = async () => {
    const code = nextGroupCode(groups);
    if (!code) return toast('You can have up to 26 groups');
    if (await save({ groups: [...rows(groups), { code, name: `GRP ${code}`, meetingUrl: '' }] }, code)) toast(`GRP ${code} added`);
  };

  const saveGroup = async (code, patch) => {
    if (await save({ groups: rows(groups).map(x => (x.code === code ? { ...x, ...patch } : x)) }, code)) toast('Group saved');
  };

  const removeGroup = async (group) => {
    if (!(await confirm({ title: `Delete ${group.name}?`, body: 'It is empty, so no student is affected.', confirmLabel: 'Delete' }))) return;
    if (await save({ groups: rows(groups).filter(x => x.code !== group.code) }, group.code)) toast(`${group.name} deleted`);
  };

  const move = async (moves) => {
    try {
      const res = await api.put(`${API_ENDPOINTS.TEACHER_GROUPS}/assign`, { moves });
      // Counts come from the server; the board keeps the order the teacher just made.
      const byStudent = new Map(moves.map(m => [m.student, m.group || null]));
      setSnap(s => ({ ...s, groups: res.data.groups, students: s.students.map(st => (byStudent.has(st.id) ? { ...st, group: byStudent.get(st.id) } : st)) }));
      announceChange('group');
      return true;
    } catch (err) {
      toast(apiError(err));
      return false;
    }
  };

  if (g.loading && !snap) return <Loading label="Loading groups…" />;
  if (g.error && !snap) return <ErrorNote error={g.error} onRetry={g.reload} />;

  return (
    <>
      <div className="gbar card">
        <div>
          <h3><Ic as={Layers} />Groups</h3>
          <p className="sub">{groups.length ? `${students.length} students in ${groups.length} group${groups.length === 1 ? '' : 's'}${unassigned ? ` · ${unassigned} without a group` : ''}` : 'Split your students into groups, then give homework, quizzes, announcements, timetables and live classes to a group.'}</p>
        </div>
        <div className="gbar-acts">
          <button type="button" className="btn p" onClick={() => setDividing(true)} disabled={!students.length}><Ic as={Shuffle} />Divide alphabetically</button>
          <button type="button" className="btn o" onClick={addGroup} disabled={saving !== ''}><Ic as={Plus} />Add group</button>
        </div>
      </div>

      {!groups.length ? (
        <Empty icon={Layers}>No groups yet. Use <b>Divide alphabetically</b> to create GRP A, GRP B… and place everyone in one step.</Empty>
      ) : (
        <>
          <GroupsBoard groups={groups} students={students} onMove={move} onSaveGroup={saveGroup} onRemoveGroup={removeGroup} savingCode={saving} />
          <label className="cbx gauto">
            <input type="checkbox" checked={snap?.autoAssign !== false} onChange={e => save({ autoAssign: e.target.checked }, 'auto')} />
            <span><b>Put each newly approved student in the smallest group</b><small className="sub"> Keeps the groups balanced.</small></span>
          </label>
        </>
      )}

      <LiveLinkCard live={snap?.live || { mode: 'manual', url: '' }} onSave={(patch) => save(patch, 'live').then(ok => ok && toast('Live class links saved'))} saving={saving} />

      <DivideDialog open={dividing} onClose={() => setDividing(false)} total={students.length} unassigned={unassigned} onDone={setSnap} />
    </>
  );
}
