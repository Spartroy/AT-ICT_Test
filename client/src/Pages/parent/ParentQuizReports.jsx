import React from 'react';
import { GraduationCap, Target, ThumbsUp } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { API_ENDPOINTS } from '../../config/api';
import { Empty, ErrorNote, Ic, Loading, Ring } from '../../components/portal/kit';
import { useLang } from '../../i18n/context';

/** The short quiz reports the teacher sent: the mark, what went well, and the weak points to work on. */
export default function ParentQuizReports({ child }) {
  const { t, fmtDate } = useLang();
  const state = useApi(child?._id ? `${API_ENDPOINTS.PARENT.BASE}/child/${child._id}/quiz-reports` : null, b => b.data?.reports || []);
  if (state.loading && !state.data) return <Loading />;
  if (state.error) return <ErrorNote error={state.error} onRetry={state.reload} />;
  const reports = state.data || [];
  return (
    <div className="card" style={{ marginTop: 18 }}>
      <h3><Ic as={GraduationCap} />{t('Quiz reports')}</h3>
      {!reports.length && <Empty icon={GraduationCap}>{t('No quiz reports yet. When a quiz is marked your child’s teacher can send the result here.')}</Empty>}
      {reports.map(r => (
        <article className="qz-preport" key={r._id}>
          <Ring p={r.percent} size={84} fs="1.1rem" w={8} label={`${r.percent}%`} />
          <div>
            <h4 dir="auto">{r.title}</h4>
            <p className="qz-pr-meta">{r.score}/{r.max} marks · {r.takenAt ? fmtDate(r.takenAt) : ''} · <b>{r.headline}</b></p>
            {r.strong?.length > 0 && <p className="qz-pr-good"><Ic as={ThumbsUp} /> {t('Doing well in')} {r.strong.map(s => s.topic).join(', ')}</p>}
            {r.weak?.length > 0 && (
              <div className="qz-pr-weak"><b><Ic as={Target} /> {t('Weak points')}</b>
                <ul>{r.weak.map(w => <li key={w.topic}><span>{w.topic}</span><em>{w.percent}%</em><small>{w.advice}</small></li>)}</ul>
              </div>
            )}
            {r.conduct && <p className="qz-pr-conduct">{r.conduct}</p>}
            <p className="qz-pr-next">{r.next}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
