import React, { useMemo, useState } from 'react';
import { AlertTriangle, CalendarClock, Check, CircleDollarSign, Clock, CreditCard, ExternalLink, FileImage, Hourglass, Landmark, Layers, Receipt, ShieldCheck, Upload, Wallet } from 'lucide-react';
import { Empty, ErrorNote, Ic, Loading, PageHead } from '../../components/portal/kit';
import { useToast } from '../../components/portal/PortalUI';
import { api } from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api';
import { useLang } from '../../i18n/context';
import { PLAN_LABEL, STATUS_META, daysFromNow, effectiveStatus, paymentSteps, paymentTotals, proofUrl } from '../../lib/payments';

const INSTAPAY_LINK = 'https://ipn.eg/S/spartroy/instapay/2BjJKk';
const amountText = (n) => Number(n || 0).toLocaleString('en-US');

/** Amount with its currency; the number stays left-to-right inside Arabic text. */
function Money({ n, currency }) {
  const { t } = useLang();
  return <><bdi dir="ltr">{amountText(n)}</bdi> {t(currency || 'EGP')}</>;
}

function Summary({ totals }) {
  const { t } = useLang();
  const tiles = [
    { id: 'due', icon: Wallet, label: 'To pay', value: totals.due, tone: totals.due ? 'warn' : '', note: totals.overdue ? <>{t('Overdue')}: <Money n={totals.overdue} currency={totals.currency} /></> : '' },
    { id: 'review', icon: Hourglass, label: 'Waiting for the teacher', value: totals.review, tone: totals.review ? 'info' : '' },
    { id: 'paid', icon: ShieldCheck, label: 'Confirmed paid', value: totals.paid, tone: 'ok' }
  ];
  return (
    <div className="pay-sum" role="list">
      {tiles.map(x => (
        <div className={`pay-tile ${x.tone}`} key={x.id} role="listitem">
          <span className="pay-tile-ic"><Ic as={x.icon} /></span>
          <div>
            <small>{t(x.label)}</small>
            <b><Money n={x.value} currency={totals.currency} /></b>
            {x.note && <em>{x.note}</em>}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Issued → Proof sent → Confirmed by teacher. */
function Steps({ payment }) {
  const { t } = useLang();
  const steps = paymentSteps(payment);
  const current = steps.findIndex(s => !s.done);
  return (
    <ol className="pay-steps" aria-label={t('Payment progress')}>
      {steps.map((s, i) => (
        <li key={s.id} className={`${s.done ? 'done' : ''} ${i === current ? 'now' : ''}`} aria-current={i === current ? 'step' : undefined}>
          <span className="pay-dot">{s.done ? <Ic as={Check} /> : i + 1}</span>
          <span>{t(s.label)}</span>
        </li>
      ))}
    </ol>
  );
}

function Fact({ icon, label, value, tone }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className={`pay-fact ${tone || ''}`}>
      <dt><Ic as={icon} />{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function PaymentCard({ p, onChanged }) {
  const { t, fmtDate } = useLang();
  const toast = useToast();
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const status = effectiveStatus(p);
  const meta = STATUS_META[status] || STATUS_META.pending;
  const days = p.dueDate ? daysFromNow(p.dueDate) : null;
  const open = ['pending', 'overdue'].includes(status);
  const long = { day: 'numeric', month: 'short', year: 'numeric' };

  const dueNote = days === null || status === 'paid' || status === 'cancelled' ? '' : days < 0 ? t('{n} days late', { n: -days }) : days === 0 ? t('Due today') : t('in {n} days', { n: days });

  const send = async () => {
    if (!file) return toast(t('Attach a screenshot of your InstaPay transfer first'));
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('paymentProof', file);
      await api.post(API_ENDPOINTS.PARENT.PAY_INSTAPAY(p._id), fd);
      toast(t('Proof sent to the teacher. It counts as paid once they confirm it.'));
      setFile(null);
      onChanged();
    } catch (err) {
      toast(t(err.message || "Couldn't upload the proof"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className={`card pay-card st-${status}`}>
      <header className="pay-top">
        <span className="pay-ic"><Ic as={p.planType === 'package' ? Layers : Receipt} /></span>
        <div className="pay-title">
          <h3 dir="auto">{p.description || t('Payment')}</h3>
          <div className="pay-chips">
            <span className="chip c-gy">{t(PLAN_LABEL[p.planType] || p.planType)}</span>
            <span className={`chip ${meta.chip}`}>{t(meta.label)}</span>
          </div>
        </div>
        <div className="pay-amount">
          <small>{t('Amount')}</small>
          <b className="pay-total"><Money n={p.amount} currency={p.currency} /></b>
        </div>
      </header>

      <dl className="pay-facts">
        <Fact icon={CalendarClock} label={t('Due date')} value={p.dueDate ? <>{fmtDate(p.dueDate, long)}{dueNote && <em className={status === 'overdue' ? 'bad' : ''}> · {dueNote}</em>}</> : t('No due date')} tone={status === 'overdue' ? 'bad' : ''} />
        <Fact icon={Layers} label={t('Sessions')} value={p.sessions ? t('{n} sessions', { n: p.sessions }) : ''} />
        <Fact icon={CircleDollarSign} label={t('Rate per session')} value={p.sessions ? <Money n={p.perSessionRate} currency={p.currency} /> : ''} />
        <Fact icon={Receipt} label={t('Calculation')} value={p.sessions ? <bdi dir="ltr">{amountText(p.perSessionRate)} × {p.sessions} = {amountText(p.amount)}</bdi> : ''} />
        <Fact icon={Clock} label={t('Issued on')} value={p.createdAt ? fmtDate(p.createdAt, long) : ''} />
        <Fact icon={Landmark} label={t('Method')} value={p.paymentMethod === 'instapay' ? 'InstaPay' : ''} />
        <Fact icon={ShieldCheck} label={t('Paid on')} value={status === 'paid' && p.paidDate ? fmtDate(p.paidDate, long) : ''} tone="ok" />
      </dl>

      {p.notes && <p className="pay-note"><b>{t('Note from the teacher')}:</b> <span dir="auto">{p.notes}</span></p>}

      {status !== 'cancelled' && <Steps payment={p} />}

      {p.lastRejection?.reason && open && (
        <div className="pay-alert bad" role="alert">
          <Ic as={AlertTriangle} />
          <div>
            <b>{t('Your last proof was not accepted')}</b>
            <p dir="auto">{p.lastRejection.reason}</p>
            <small>{fmtDate(p.lastRejection.rejectedAt, long)}. {t('Please send a new screenshot.')}</small>
          </div>
        </div>
      )}

      {status === 'review' && (
        <div className="pay-alert info">
          <Ic as={Hourglass} />
          <div>
            <b>{t('Waiting for the teacher to confirm')}</b>
            <p>{t('Proof sent on {date}. The payment is marked paid only after the teacher checks it.', { date: fmtDate(p.paymentProof?.uploadedAt, long) })}</p>
            {p.paymentProof?.path && <a className="pay-proof" href={proofUrl(p.paymentProof.path)} target="_blank" rel="noreferrer"><Ic as={FileImage} />{t('View the screenshot you sent')}</a>}
          </div>
        </div>
      )}

      {status === 'paid' && (
        <div className="pay-alert ok">
          <Ic as={ShieldCheck} />
          <div><b>{t('Payment confirmed')}</b><p>{t('The teacher confirmed this payment. Nothing more to do.')}</p></div>
        </div>
      )}

      {open && (
        <div className="pay-actions">
          <ol className="pay-how">
            <li>{t('Pay the amount with InstaPay')}</li>
            <li>{t('Attach the transfer screenshot')}</li>
            <li>{t('Send it to the teacher to confirm')}</li>
          </ol>
          <div className="pay-btns">
            <a className="btn o sm" href={INSTAPAY_LINK} target="_blank" rel="noreferrer"><Ic as={ExternalLink} />{t('Pay with InstaPay')}</a>
            <label className="btn o sm pay-file"><Ic as={Upload} />{file ? file.name : t('Attach transfer screenshot')}
              <input type="file" accept="image/*" className="sr-only" onChange={e => setFile(e.target.files[0] || null)} />
            </label>
            <button type="button" className="btn p sm" disabled={busy || !file} onClick={send}>{busy ? t('Sending…') : t('Send to teacher')}</button>
          </div>
        </div>
      )}
    </article>
  );
}

/** Parent › Payments: every plan with its amount, due date, calculation, progress and what to do next. */
export default function Payments({ payments }) {
  const { t } = useLang();
  const list = useMemo(() => payments.data || [], [payments.data]);
  const totals = useMemo(() => paymentTotals(list), [list]);
  const ordered = useMemo(() => {
    const rank = { overdue: 0, pending: 1, review: 2, paid: 3, cancelled: 4 };
    return [...list].sort((a, b) => (rank[effectiveStatus(a)] - rank[effectiveStatus(b)]) || (new Date(a.dueDate || 0) - new Date(b.dueDate || 0)));
  }, [list]);

  return (
    <>
      <PageHead title={t('Payments')} />
      {payments.loading && !payments.data && <Loading />}
      {payments.error && <ErrorNote error={payments.error} onRetry={payments.reload} />}
      {payments.data && !!list.length && <Summary totals={totals} />}
      {payments.data && !list.length && <div className="card"><Empty icon={CreditCard}>{t('No payment plans yet.')}</Empty></div>}
      {ordered.map(p => <PaymentCard key={p._id} p={p} onChanged={payments.reload} />)}
    </>
  );
}
