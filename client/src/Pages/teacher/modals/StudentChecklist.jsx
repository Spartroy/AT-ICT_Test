import React, { useState } from 'react';
import useApi from '../../../hooks/useApi';
import { API_ENDPOINTS } from '../../../config/api';
import { SearchBox } from '../../../components/portal/kit';

/** Searchable checkbox list of approved students with "Select all" and a live count. */
export default function StudentChecklist({ chosen, onChange, error, height = 260 }) {
  const students = useApi(`${API_ENDPOINTS.TEACHER.STUDENTS}?all=true&status=approved`, b => b.data?.students || []);
  const [q, setQ] = useState('');
  const all = students.data || [];
  const shown = all.filter(s => `${s.fullName} ${s.email}`.toLowerCase().includes(q.trim().toLowerCase()));

  const toggle = (id) => {
    const next = new Set(chosen);
    next.has(id) ? next.delete(id) : next.add(id);
    onChange(next);
  };

  return (
    <div className="stu-check">
      <SearchBox value={q} onChange={setQ} placeholder="Search students…" style={{ margin: '0 0 10px' }} />
      <div className="stu-check__bar">
        <span className="sub" aria-live="polite">{chosen.size} selected out of {all.length}</span>
        <button type="button" className="lk" onClick={() => onChange(new Set([...chosen, ...shown.map(s => String(s._id))]))}>Select all{q ? ' shown' : ''}</button>
        {chosen.size > 0 && <button type="button" className="lk" style={{ marginLeft: 12 }} onClick={() => onChange(new Set())}>Clear</button>}
      </div>
      <div className="asl" style={{ maxHeight: height }}>
        {students.loading && !students.data && <p className="sub">Loading students…</p>}
        {shown.map(s => {
          const id = String(s._id);
          return (
            <label className="asr" key={id}>
              <span className="cb"><input type="checkbox" checked={chosen.has(id)} onChange={() => toggle(id)} /><span /></span>
              <b>{s.fullName}</b>
              <small className="asr-sub">{s.studentId !== 'Not assigned' ? s.studentId : s.email}</small>
            </label>
          );
        })}
        {!students.loading && !shown.length && <p className="sub">No students match.</p>}
      </div>
      {error && <span className="fld-err">{error}</span>}
    </div>
  );
}
