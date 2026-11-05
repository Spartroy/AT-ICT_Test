import React, { useState } from 'react';
import { RotateCcw, Trash2, Users } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { api } from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api';
import { Empty, ErrorNote, Ic, Loading, fmtDate, initials } from '../../components/portal/kit';
import { useConfirm, useToast } from '../../components/portal/PortalUI';
import { apiError } from './modals/form';

/** Students removed from the system, with a button to bring each one back (or forget them for good). */
export default function DeletedPanel() {
  const toast = useToast();
  const confirm = useConfirm();
  const [busy, setBusy] = useState('');
  const list = useApi(API_ENDPOINTS.TEACHER.DELETED_STUDENTS, b => b.data?.students || []);

  const restore = async (s) => {
    if (!(await confirm({ title: `Restore ${s.fullName}?`, body: 'Their account, password, homework, quizzes and chats come back as they were.', confirmLabel: 'Restore' }))) return;
    setBusy(s._id);
    try {
      const res = await api.post(`${API_ENDPOINTS.TEACHER.DELETED_STUDENTS}/${s._id}/restore`, {});
      toast(res.data?.skipped ? `${s.fullName} restored (${res.data.skipped} link${res.data.skipped > 1 ? 's' : ''} to deleted items skipped)` : `${s.fullName} restored`);
      window.dispatchEvent(new CustomEvent('teacher:changed', { detail: 'student' }));
      list.reload();
    } catch (err) { toast(apiError(err)); } finally { setBusy(''); }
  };
  const purge = async (s) => {
    if (!(await confirm({ title: `Delete ${s.fullName} for good?`, body: 'This cannot be undone. They can no longer be restored.', confirmLabel: 'Delete forever' }))) return;
    setBusy(s._id);
    try { await api.del(`${API_ENDPOINTS.TEACHER.DELETED_STUDENTS}/${s._id}`); toast('Permanently deleted'); list.reload(); } catch (err) { toast(apiError(err)); } finally { setBusy(''); }
  };

  return (
    <div className="card" style={{ padding: 8 }}>
      {list.loading && !list.data && <Loading label="Loading deleted students…" />}
      {list.error && <ErrorNote error={list.error} onRetry={list.reload} />}
      {list.data && !list.data.length && <Empty icon={Users}>No deleted students.</Empty>}
      {(list.data || []).map(s => (
        <div className="srow2" key={s._id}>
          <span className="av" style={{ width: 42, height: 42 }} aria-hidden="true">{initials(s.fullName)}</span>
          <div className="lmain">
            <b>{s.fullName || 'Unnamed student'}</b>
            <small>{[s.studentId, s.year && `Year ${s.year}`, s.session, `Deleted ${fmtDate(s.deletedAt, { day: 'numeric', month: 'numeric', year: 'numeric' })}`].filter(Boolean).join(' · ')}</small>
          </div>
          <div className="sr-a">
            <button type="button" className="btn p sm" disabled={busy === s._id} onClick={() => restore(s)}><Ic as={RotateCcw} />Restore</button>
            <button type="button" className="btn o sm dng" disabled={busy === s._id} onClick={() => purge(s)}><Ic as={Trash2} />Delete forever</button>
          </div>
        </div>
      ))}
    </div>
  );
}
