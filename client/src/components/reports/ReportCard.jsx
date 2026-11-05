import React from 'react';
import { Award, CheckCircle2, Clock, GraduationCap, ClipboardCheck, MinusCircle, MessageSquareQuote, Sparkles, Star, TrendingDown, TrendingUp, XCircle } from 'lucide-react';
import { Ring } from '../portal/kit';
import { badgesFor, lessonPoints, previousOf, ratingAverage, tierFor, weekPercent, weekRange, weekTotals } from './reportLogic';
import './reports.css';

const plain = (text, params) => String(text).replace(/\{(\w+)\}/g, (_, k) => (params && params[k] !== undefined ? params[k] : `{${k}}`));
const RING = { top: 'var(--dark-warn)', great: 'var(--dark-ok)', good: 'var(--phase-1)', ok: 'var(--phase-3)', low: 'var(--crimson-glow)', none: 'var(--p-bd2)' };
const STATE = {
  done: { icon: CheckCircle2, label: 'Done', cls: 'ok' },
  late: { icon: Clock, label: 'Handed in late', cls: 'warn' },
  missed: { icon: XCircle, label: 'Missed', cls: 'bad' },
  none: { icon: MinusCircle, label: 'Nothing this lesson', cls: 'idle' }
};

/** Five stars, filled up to `value`. Read-only. */
export function Stars({ value = 0, label }) {
  return (
    <span className="rp-stars" role="img" aria-label={label || `${value} / 5`}>
      {[1, 2, 3, 4, 5].map(n => <Star key={n} className={`i ${n <= value ? 'on' : ''}`} aria-hidden="true" />)}
    </span>
  );
}

function MarkRow({ kind, row, t }) {
  const empty = !row || (!row.title && row.state === 'none' && (row.mark === null || row.mark === undefined));
  const st = STATE[row?.state] || STATE.none;
  const hasMark = row && row.mark !== null && row.mark !== undefined;
  const pct = hasMark && row.max ? Math.round((row.mark / row.max) * 100) : 0;
  const Icon = kind === 'quiz' ? GraduationCap : ClipboardCheck;
  return (
    <div className={`rp-mark ${empty ? 'empty' : st.cls}`}>
      <span className="rp-mark-ic"><Icon className="i" aria-hidden="true" /></span>
      <div className="rp-mark-main">
        <b dir="auto">{row?.title || (kind === 'quiz' ? t('Quiz') : t('Homework'))}</b>
        <small>
          {empty ? t('Nothing set') : (
            <><st.icon className="i" aria-hidden="true" />{kind === 'quiz' && row.state === 'missed' ? t('Not taken') : t(st.label)}</>
          )}
        </small>
        {hasMark && row.max > 0 && <span className="rp-bar" aria-hidden="true"><i style={{ width: `${Math.min(100, pct)}%` }} /></span>}
      </div>
      <div className="rp-mark-score">{hasMark ? <><b>{row.mark}</b><small>/ {row.max ?? '—'}</small></> : <small>{row.state === 'missed' && row.max ? `0 / ${row.max}` : '—'}</small>}</div>
    </div>
  );
}

/**
 * The family-facing weekly report: a score ring, badges, a card per lesson, communication stars and the teacher's note.
 * `t` translates (the parent portal passes its own); `reports` is the newest-first list so the trend can be shown.
 */
export default function ReportCard({ report, reports = [], name, t = plain, locale = 'en-GB' }) {
  if (!report) return null;
  const totals = weekTotals(report.lessons);
  const percent = weekPercent(report);
  const gained = report.possible ? report.gained : totals.gained;
  const possible = report.possible ? report.possible : totals.possible;
  const previous = previousOf(reports, report);
  const before = previous ? weekPercent(previous) : null;
  const diff = percent !== null && before !== null ? percent - before : null;
  const tier = tierFor(percent);
  const badges = badgesFor(report, previous);
  const rated = (report.lessons || []).some(l => l.contribution > 0) || (report.attitude || []).some(a => a.rating > 0);
  const avg = ratingAverage(report);
  const firstName = (name || '').split(' ')[0];

  return (
    <article className="rp-card" aria-label={t('Week {n} report', { n: report.weekNumber })}>
      <header className={`rp-hero tier-${tier.id}`}>
        <div className="rp-hero-text">
          <span className="rp-pill"><Sparkles className="i" aria-hidden="true" />{t('Week {n}', { n: report.weekNumber })}</span>
          <h2 dir="auto">{firstName ? t('{name}’s week', { name: firstName }) : t('Weekly report')}</h2>
          <p className="rp-sub">{weekRange(report.weekStart, locale)}{report.session ? ` · ${report.session}` : ''}</p>
          <p className="rp-tier"><b>{t(tier.title)}</b> {t(tier.line)}</p>
          {diff !== null && (
            <span className={`rp-trend ${diff >= 0 ? 'up' : 'down'}`}>
              {diff >= 0 ? <TrendingUp className="i" aria-hidden="true" /> : <TrendingDown className="i" aria-hidden="true" />}
              {diff === 0 ? t('Same as last week') : t(diff > 0 ? '{n}% up on last week' : '{n}% down on last week', { n: Math.abs(diff) })}
            </span>
          )}
        </div>
        <div className="rp-hero-score">
          <Ring p={percent || 0} size={132} w={12} fs="1.6rem" color={RING[tier.id]} label={percent === null ? t('No marks yet') : `${percent}%`} />
          <div className="rp-points"><b>{gained}</b><span>/ {possible} {t('points')}</span></div>
        </div>
      </header>

      {badges.length > 0 && (
        <ul className="rp-badges" aria-label={t('Badges earned')}>
          {badges.map(b => <li key={b.id} title={t(b.hint)}><Award className="i" aria-hidden="true" />{t(b.label)}</li>)}
        </ul>
      )}

      <section className="rp-section" aria-labelledby="rp-acad">
        <h3 id="rp-acad">{t('Academic performance')}</h3>
        <div className="rp-lessons">
          {(report.lessons || []).filter(l => l.hw?.title || l.quiz?.title || l.hw?.state !== 'none' || l.quiz?.state !== 'none' || l.hw?.mark !== null || l.quiz?.mark !== null || l.contribution > 0).map(l => {
            const p = lessonPoints(l);
            return (
              <div className="rp-lesson" key={l.number}>
                <div className="rp-lesson-head">
                  <span className="rp-num">{l.number}</span>
                  <b>{t('Lesson {n}', { n: l.number })}</b>
                  <span className="rp-gain">{p.possible ? `${p.gained} / ${p.possible}` : '—'}<small>{t('gained')}</small></span>
                </div>
                <MarkRow kind="hw" row={l.hw} t={t} />
                <MarkRow kind="quiz" row={l.quiz} t={t} />
              </div>
            );
          })}
        </div>
      </section>

      {rated && (
        <section className="rp-section" aria-labelledby="rp-comm">
          <h3 id="rp-comm">{t('Communication performance')}</h3>
          <div className="rp-comm">
            <div className="rp-comm-col">
              <h4>{t('Session contribution')}</h4>
              {(report.lessons || []).filter(l => l.contribution > 0).map(l => (
                <div className="rp-rate" key={l.number}><span>{t('Lesson {n}', { n: l.number })}</span><Stars value={l.contribution} label={`${t('Lesson {n}', { n: l.number })}: ${l.contribution} / 5`} /></div>
              ))}
            </div>
            <div className="rp-comm-col">
              <h4>{t('Attitude')}</h4>
              {(report.attitude || []).filter(a => a.rating > 0).map(a => (
                <div className="rp-rate" key={a.label}><span dir="auto">{t(a.label)}</span><Stars value={a.rating} label={`${t(a.label)}: ${a.rating} / 5`} /></div>
              ))}
            </div>
          </div>
          {avg > 0 && <p className="rp-avg"><Star className="i on" aria-hidden="true" />{t('Average rating {n} / 5', { n: avg })}</p>}
        </section>
      )}

      {report.comments && (
        <section className="rp-section" aria-labelledby="rp-note">
          <h3 id="rp-note">{t('A note from the teacher')}</h3>
          <blockquote className="rp-note" dir="auto"><MessageSquareQuote className="i" aria-hidden="true" /><p>{report.comments}</p></blockquote>
        </section>
      )}
    </article>
  );
}
