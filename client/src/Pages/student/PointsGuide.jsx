import React from 'react';
import { Award, BookOpen, CalendarCheck, ClipboardCheck, FileClock, Flame, GraduationCap, Lightbulb, Play, Video } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { Dialog, DialogHeader } from '../../components/portal/PortalUI';
import { Ic, Loading, fmtDate } from '../../components/portal/kit';

// Used while the rules load, and if the request fails. The server's numbers replace these (they are the same today).
const DEFAULT_RULES = {
  assignment: { gradeMax: 70, onTime: 20, early: 10, earlyHours: 24, lateGradeFactor: 0.5 },
  quiz: { gradeMax: 100 },
  effort: { video: 2, note: 3, pastpaper: 5, live: 5, dailyCap: 20 },
  streak: { length: 3, bonus: 10 }
};

const SOURCE_ICON = { assignment: ClipboardCheck, quiz: GraduationCap, video: Play, note: BookOpen, pastpaper: FileClock, live: Video, streak: Flame };

const Earn = ({ icon, title, pts, children }) => (
  <div className="pg-earn">
    <span className="pg-ic"><Ic as={icon} /></span>
    <div>
      <h4>{title}<b>{pts}</b></h4>
      <p>{children}</p>
    </div>
  </div>
);

/** "How points work": every way to earn points with the real numbers, a worked example, tips and your recent points. */
export default function PointsGuide({ open, onClose }) {
  const pts = useApi(open ? '/api/student/points' : null, b => b.data || {});
  const r = { ...DEFAULT_RULES, ...(pts.data?.rules || {}) };
  const a = r.assignment;
  const e = r.effort;
  const best = a.gradeMax + a.onTime + a.early;

  return (
    <Dialog open={open} onClose={onClose} size="wide" labelledBy="pg-title">
      <DialogHeader id="pg-title" icon={Award} title="How points work" sub="Earn points for good work, being on time and studying a little every day" onClose={onClose} />
      <div className="mbody pg">
        {pts.data && (
          <div className="pg-me">
            <div><small>This session{pts.data.sessionLabel ? ` · ${pts.data.sessionLabel}` : ''}</small><b>{pts.data.currentSession} <span>pts</span></b></div>
            <div><small>All time</small><b>{pts.data.total} <span>pts</span></b></div>
          </div>
        )}

        <h3 className="pg-h">Ways to earn</h3>
        <div className="pg-grid">
          <Earn icon={ClipboardCheck} title="Homework" pts={`up to ${best}`}>
            <b>Up to {a.gradeMax}</b> for your grade, <b>+{a.onTime}</b> for handing in on time, <b>+{a.early}</b> more if you hand in {a.earlyHours} hours or more before the deadline.
            Late homework still earns <b>half</b> of the grade part, but no bonus.
          </Earn>
          <Earn icon={GraduationCap} title="Quizzes" pts={`up to ${r.quiz.gradeMax}`}>
            Your mark out of {r.quiz.gradeMax}. A 15/30 quiz is 50 points.
          </Earn>
          <Earn icon={Play} title="Videos" pts={`+${e.video} each`}>Mark a video lesson as done.</Earn>
          <Earn icon={BookOpen} title="Notes" pts={`+${e.note} each`}>Mark a notes chapter as read.</Earn>
          <Earn icon={FileClock} title="Past papers" pts={`+${e.pastpaper} each`}>Mark a past paper variant as practised.</Earn>
          <Earn icon={Video} title="Live classes" pts={`+${e.live} each`}>Join a live class (rejoining doesn&apos;t add more).</Earn>
          <Earn icon={Flame} title="On-time streak" pts={`+${r.streak.bonus}`}>Hand in {r.streak.length} homeworks in a row on time and you get a bonus. Keep going for the next one.</Earn>
        </div>

        <div className="pg-note">
          <Ic as={CalendarCheck} />
          <p>Videos, notes and past papers together can earn up to <b>{e.dailyCap} points a day</b>. Each item pays once, so a little every day beats a big rush. Points reset for the leaderboard each exam session, your all-time total is kept.</p>
        </div>

        <h3 className="pg-h">Example</h3>
        <div className="pg-ex">
          <span>Full marks, handed in 2 days early</span>
          <b>{a.gradeMax} + {a.onTime} + {a.early} = {best}</b>
          <span>Same work, handed in a day late</span>
          <b>{Math.round(a.gradeMax * a.lateGradeFactor)} + 0 + 0 = {Math.round(a.gradeMax * a.lateGradeFactor)}</b>
        </div>

        <h3 className="pg-h"><Ic as={Lightbulb} />Good habits</h3>
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
            <h3 className="pg-h">Your recent points</h3>
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
        <div className="mfoot"><button type="button" className="btn p" onClick={onClose}>Got it</button></div>
      </div>
    </Dialog>
  );
}
