import React, { useEffect, useRef, useState } from 'react';
import { Award, BookOpen, CalendarCheck, ClipboardCheck, FileClock, Flame, GraduationCap, Lightbulb, Play, Sparkles, Video } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { Dialog, DialogHeader } from '../../components/portal/PortalUI';
import { Ic, Loading, fmtDate } from '../../components/portal/kit';
import { fireConfetti } from '../../components/auth/confetti';
import { LEVELS, levelFor, homeworkPoints } from './gamify';

// Used while the rules load, and if the request fails. The server's numbers replace these (they are the same today).
const DEFAULT_RULES = {
  assignment: { gradeMax: 70, onTime: 20, early: 10, earlyHours: 24, lateGradeFactor: 0.5 },
  quiz: { gradeMax: 100 },
  effort: { video: 2, note: 3, pastpaper: 5, live: 5, dailyCap: 20 },
  streak: { length: 3, bonus: 10 }
};

const SOURCE_ICON = { assignment: ClipboardCheck, quiz: GraduationCap, video: Play, note: BookOpen, pastpaper: FileClock, live: Video, streak: Flame };
const TIMINGS = [
  { id: 'early', label: '🚀 Early' },
  { id: 'ontime', label: '✅ On time' },
  { id: 'late', label: '🐢 Late' }
];

/** Counts up to `value` so numbers feel alive. Jumps straight there for reduced motion. */
function CountUp({ value }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const reduce = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !value) { setShown(value || 0); return undefined; }
    let frame;
    const t0 = performance.now();
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / 900);
      setShown(Math.round(value * (1 - (1 - k) ** 3)));
      if (k < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <>{shown}</>;
}

const Earn = ({ icon, title, pts, tone, i, children }) => (
  <div className={`pg-earn tone-${tone}`} style={{ '--i': i }}>
    <span className="pg-ic"><Ic as={icon} /></span>
    <div>
      <h4>{title}<b>{pts}</b></h4>
      <p>{children}</p>
    </div>
  </div>
);

/** "How points work", as a game: your level, every way to earn, a live points calculator, daily quest and your recent wins. */
export default function PointsGuide({ open, onClose }) {
  const pts = useApi(open ? '/api/student/points' : null, b => b.data || {});
  const r = { ...DEFAULT_RULES, ...(pts.data?.rules || {}) };
  const a = r.assignment;
  const e = r.effort;
  const best = a.gradeMax + a.onTime + a.early;

  const [gradePct, setGradePct] = useState(80);
  const [timing, setTiming] = useState('early');
  const calc = homeworkPoints({ gradePct, timing }, a);
  const celebrated = useRef(false);
  const calcRef = useRef(null);
  useEffect(() => {
    if (!open) { celebrated.current = false; return; }
    if (calc.total === best && !celebrated.current) {
      celebrated.current = true;
      fireConfetti(calcRef.current?.getBoundingClientRect(), { scale: 0.5 });
    }
    if (calc.total !== best) celebrated.current = false;
  }, [open, calc.total, best]);

  const session = pts.data?.currentSession || 0;
  const lv = levelFor(session);

  return (
    <Dialog open={open} onClose={onClose} size="wide" labelledBy="pg-title">
      <DialogHeader id="pg-title" icon={Award} title="Points Playbook" sub="Level up by doing good work, on time, a little every day" onClose={onClose} />
      <div className="mbody pg">
        <div className="pg-hero">
          <div className="pg-lvl-emoji" aria-hidden="true">{lv.level.emoji}</div>
          <div className="pg-hero-main">
            <small>Your level{pts.data?.sessionLabel ? ` · ${pts.data.sessionLabel}` : ''}</small>
            <h3>{lv.level.name}</h3>
            <div className="pg-xp" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={lv.pct} aria-label="Progress to next level"><i style={{ width: `${Math.max(4, lv.pct)}%` }} /></div>
            <p>{lv.next ? <><b>{lv.toNext} pts</b> to reach {lv.next.emoji} {lv.next.name}</> : 'You reached the top level. Defend your crown! 👑'}</p>
          </div>
          <div className="pg-hero-pts">
            <b><CountUp value={session} /></b><span>pts this session</span>
            {pts.data && <em>{pts.data.total} all time</em>}
          </div>
        </div>
        <ol className="pg-ladder" aria-label="Levels">
          {LEVELS.map(l => (
            <li key={l.id} className={session >= l.min ? 'got' : ''}><span aria-hidden="true">{l.emoji}</span>{l.name}<small>{l.min}+</small></li>
          ))}
        </ol>

        <h3 className="pg-h"><Ic as={Sparkles} />Power-ups: ways to earn</h3>
        <div className="pg-grid">
          <Earn i={0} tone="red" icon={ClipboardCheck} title="Homework" pts={`up to ${best}`}>
            <b>Up to {a.gradeMax}</b> for your grade, <b>+{a.onTime}</b> for handing in on time, <b>+{a.early}</b> more if you hand in {a.earlyHours} hours or more before the deadline.
            Late homework still earns <b>half</b> of the grade part, but no bonus.
          </Earn>
          <Earn i={1} tone="gold" icon={GraduationCap} title="Quizzes" pts={`up to ${r.quiz.gradeMax}`}>
            Your mark out of {r.quiz.gradeMax}. A 15/30 quiz is 50 points.
          </Earn>
          <Earn i={2} tone="blue" icon={Play} title="Videos" pts={`+${e.video} each`}>Mark a video lesson as done.</Earn>
          <Earn i={3} tone="green" icon={BookOpen} title="Notes" pts={`+${e.note} each`}>Mark a notes chapter as read.</Earn>
          <Earn i={4} tone="purple" icon={FileClock} title="Past papers" pts={`+${e.pastpaper} each`}>Mark a past paper variant as practised.</Earn>
          <Earn i={5} tone="blue" icon={Video} title="Live classes" pts={`+${e.live} each`}>Join a live class (rejoining doesn&apos;t add more).</Earn>
          <Earn i={6} tone="orange" icon={Flame} title="On-time streak" pts={`+${r.streak.bonus}`}>
            Hand in {r.streak.length} homeworks in a row on time and the bonus is yours. Keep the fire going!
            <span className="pg-flames" aria-hidden="true">{Array.from({ length: r.streak.length }, (_, i) => <Flame key={i} />)}</span>
          </Earn>
        </div>

        <div className="pg-quest">
          <div className="pg-quest-h"><Ic as={CalendarCheck} /><h4>Daily quest</h4><b>{e.dailyCap} pts</b></div>
          <p>Watch a video, read a notes chapter and practise a past paper today. Together they can earn up to <b>{e.dailyCap} points a day</b>. Each item pays once, so a little every day beats a big rush.</p>
          <div className="pg-quest-row" aria-hidden="true">
            <span>▶ Video <b>+{e.video}</b></span><span>📖 Notes <b>+{e.note}</b></span><span>📝 Past paper <b>+{e.pastpaper}</b></span>
          </div>
          <small>Points reset for the leaderboard each exam session. Your all-time total is always kept.</small>
        </div>

        <h3 className="pg-h">Try it: homework points calculator</h3>
        <div className="pg-calc" ref={calcRef}>
          <label>
            <span>Your grade <b>{gradePct}%</b></span>
            <input type="range" min="0" max="100" step="5" value={gradePct} onChange={ev => setGradePct(Number(ev.target.value))} aria-label="Homework grade percent" />
          </label>
          <div className="seg" role="radiogroup" aria-label="When you hand in">
            {TIMINGS.map(t => (
              <button key={t.id} type="button" role="radio" aria-checked={timing === t.id} className={timing === t.id ? 'on' : ''} onClick={() => setTiming(t.id)}>{t.label}</button>
            ))}
          </div>
          <div className="pg-calc-out">
            <span>{calc.grade} grade</span><i>+</i><span>{calc.onTime} on time</span><i>+</i><span>{calc.early} early</span><i>=</i>
            <b className={calc.total === best ? 'max' : ''}>{calc.total} pts{calc.total === best ? ' 🎉' : ''}</b>
          </div>
          <small>{calc.total === best ? 'Perfect run! This is the most one homework can earn.' : `The maximum is ${best}. Slide and tap to see how to get there.`}</small>
        </div>

        <h3 className="pg-h"><Ic as={Lightbulb} />Pro tips</h3>
        <ul className="pg-tips">
          <li>Start homework the day you get it: handing in early is worth {a.early} extra points.</li>
          <li>Never let a deadline pass if you can help it. On time is {a.onTime} points and keeps your streak alive.</li>
          <li>Hand in something rather than nothing. Late work still earns half of the grade part.</li>
          <li>Study a little every day: videos, notes and a past paper add up to {e.dailyCap} points a day.</li>
          <li>Join the live classes. They are {e.live} points and the best time to ask questions.</li>
        </ul>

        {pts.loading && !pts.data && <Loading label="Loading your points…" />}
        {!!pts.data?.history?.length && (
          <>
            <h3 className="pg-h">Your recent wins</h3>
            <ul className="pg-hist">
              {pts.data.history.slice(0, 8).map((h, i) => (
                <li key={`${h.title}-${i}`}>
                  <Ic as={SOURCE_ICON[h.source] || Award} />
                  <span>{h.title}<small>{fmtDate(h.awardedAt, { day: 'numeric', month: 'short' })}</small></span>
                  <b>{h.total > 0 ? `+${h.total}` : h.total}</b>
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="mfoot"><button type="button" className="btn p" onClick={onClose}>Let&apos;s go! 💪</button></div>
      </div>
    </Dialog>
  );
}
