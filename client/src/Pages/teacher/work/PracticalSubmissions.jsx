import React, { useMemo, useState } from 'react';
import { FileText, Paperclip, Trophy } from 'lucide-react';
import useApi from '../../../hooks/useApi';
import { API_ENDPOINTS } from '../../../config/api';
import { Chips, Empty, ErrorNote, Ic, Loading, SearchBox, fmtDateTime, initials } from '../../../components/portal/kit';
import { APPS, GUIDES } from '../../student/learn/practicalSkills';
import '../../../styles/quizgen.css';

const GUIDE = new Map(GUIDES.map(g => [g.id, g]));
const fmtSize = (b) => (!b ? '' : b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

/** Work › Practicals: the evidence students hand in for the practical guides (the skill tree's Submissions tab). */
export default function PracticalSubmissions() {
  const [app, setApp] = useState('');
  const [q, setQ] = useState('');
  const list = useApi(`/api/teacher/practical-submissions${app ? `?app=${app}` : ''}`, b => b.data || { submissions: [], total: 0 });
  const rows = useMemo(() => (list.data?.submissions || []).filter(r => !q || `${r.student.name} ${GUIDE.get(r.guide)?.label || ''}`.toLowerCase().includes(q.toLowerCase())), [list.data, q]);

  return (
    <div className="card">
      <h3><Ic as={Trophy} />Practical submissions<small className="sub tcount-h">{list.data?.total ?? 0} handed in</small></h3>
      <p className="sub">Evidence students upload for the practical guides. Students tick their own skills after handing in, so open the files to check their work.</p>
      <Chips items={[{ id: '', label: 'All' }, ...APPS.map(a => ({ id: a.id, label: a.name }))]} value={app} onChange={setApp} label="Application" />
      <SearchBox value={q} onChange={setQ} placeholder="Search a student or guide" style={{ margin: '8px 0' }} />
      {list.loading && !list.data && <Loading label="Loading submissions…" />}
      {list.error && <ErrorNote error={list.error} onRetry={list.reload} />}
      {list.data && !rows.length && <Empty icon={Paperclip}>No practical submissions yet.</Empty>}
      <div className="tbl" role="list">
        {rows.map(r => {
          const g = GUIDE.get(r.guide);
          return (
            <div className="trow qz-prow" role="listitem" key={r.id}>
              <span className="av" aria-hidden="true">{initials(r.student.name)}</span>
              <span className="lmain"><b>{r.student.name}</b><small>{g ? `${APPS.find(a => a.id === g.app)?.name} · ${g.label}` : r.guide}{r.student.group ? ` · Group ${r.student.group}` : ''} · {fmtDateTime(r.updatedAt || r.submittedAt)}</small>
                {r.note && <small className="qz-pnote">“{r.note}”</small>}</span>
              <span className="qz-pfiles">
                {r.files.map(f => <a key={f.url} className="chip c-th" href={`${API_ENDPOINTS.BASE_URL || ''}${f.url}`} target="_blank" rel="noreferrer"><FileText size={11} /> {f.name}{f.size ? ` · ${fmtSize(f.size)}` : ''}</a>)}
                <span className="chip c-gy" title="Skills this student has ticked in total">{r.skillsTicked} skills ticked</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
