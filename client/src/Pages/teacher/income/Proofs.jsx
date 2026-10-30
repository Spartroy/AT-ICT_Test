import React, { useState } from 'react';
import { CheckCircle2, FileImage, ShieldCheck, X } from 'lucide-react';
import useApi from '../../../hooks/useApi';
import { api } from '../../../lib/api';
import { API_ENDPOINTS } from '../../../config/api';
import { Empty, ErrorNote, Ic, Loading, initials, fmtDateTime } from '../../../components/portal/kit';
import { useToast } from '../../../components/portal/PortalUI';
import { proofUrl, PLAN_LABEL } from '../../../lib/payments';
import { useTeacher } from '../TeacherPortal';
import { apiError } from '../modals/form';
import { fmtMoney } from './incomeFormat';

function ProofCard({ p, onDone }) {
  const toast = useToast();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState('');
  const url = proofUrl(p.proofPath);

  const decide = async (decision) => {
    setBusy(decision);
    try {
      await api.post(API_ENDPOINTS.TEACHER.PAYMENT_REVIEW(p.id), { decision, reason: reason.trim() });
      toast(decision === 'confirm' ? `${fmtMoney(p.amount, p.currency)} confirmed. It now counts as income.` : 'Sent back to the parent with your reason');
      onDone();
    } catch (err) {
      toast(apiError(err));
    } finally {
      setBusy('');
    }
  };

  return (
    <article className="card prf">
      {url ? (
        <a className="prf-img" href={url} target="_blank" rel="noreferrer" aria-label="Open the transfer screenshot in a new tab"><img src={url} alt={`Transfer screenshot from ${p.student.name}`} loading="lazy" /></a>
      ) : <div className="prf-img none"><Ic as={FileImage} /></div>}
      <div className="prf-main">
        <div className="prf-top">
          <span className="av" aria-hidden="true">{initials(p.student.name)}</span>
          <div><b>{p.student.name}</b><small>{p.description || 'Payment plan'} · <span className="chip c-gy">{PLAN_LABEL[p.planType] || p.planType}</span></small></div>
          <b className="prf-amt">{fmtMoney(p.amount, p.currency)}</b>
        </div>
        <p className="sub">Sent {fmtDateTime(p.uploadedAt)}{p.dueDate ? ` · due ${new Date(p.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''}</p>
        {p.earlierRejection && <p className="prf-earlier">Sent back before: {p.earlierRejection}</p>}
        <p className="prf-check">Check the amount ({fmtMoney(p.amount, p.currency)}), the date and that the money reached you before you confirm.</p>
        {rejecting ? (
          <div className="pay-reject">
            <input className="inp" value={reason} onChange={e => setReason(e.target.value)} maxLength={300} autoFocus placeholder="Tell the parent why, e.g. the amount does not match" aria-label="Reason" />
            <button type="button" className="btn p sm" disabled={!reason.trim() || !!busy} onClick={() => decide('reject')}>{busy === 'reject' ? 'Sending…' : 'Send back'}</button>
            <button type="button" className="btn o sm" onClick={() => { setRejecting(false); setReason(''); }}>Cancel</button>
          </div>
        ) : (
          <div className="prf-acts">
            <button type="button" className="btn g" disabled={!!busy} onClick={() => decide('confirm')}><Ic as={CheckCircle2} />{busy === 'confirm' ? 'Confirming…' : 'Confirm payment'}</button>
            <button type="button" className="btn o dng" disabled={!!busy} onClick={() => setRejecting(true)}><Ic as={X} />Reject proof</button>
          </div>
        )}
      </div>
    </article>
  );
}

/** Income › Payment proofs: transfer screenshots parents sent. A payment is only paid once you confirm it here. */
export default function Proofs() {
  const { refreshBadges } = useTeacher();
  const list = useApi(`${API_ENDPOINTS.TEACHER_INCOME}/proofs`, b => b.data?.proofs || []);
  if (list.loading && !list.data) return <Loading label="Loading payment proofs…" />;
  if (list.error) return <ErrorNote error={list.error} onRetry={list.reload} />;
  const proofs = list.data || [];
  return (
    <>
      <p className="sub inc-lead"><Ic as={ShieldCheck} /> Parents send a screenshot of their transfer. Nothing counts as paid until you confirm it here.</p>
      {!proofs.length && <div className="card"><Empty icon={CheckCircle2}>No proofs waiting. You're all caught up.</Empty></div>}
      {proofs.map(p => <ProofCard key={p.id} p={p} onDone={() => { list.reload(); refreshBadges(); }} />)}
    </>
  );
}
