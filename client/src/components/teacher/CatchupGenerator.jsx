import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SparklesIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowPathIcon,
  LightBulbIcon,
  ClockIcon,
  BookOpenIcon,
  AcademicCapIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

// ─── Curriculum ──────────────────────────────────────────────────────────────
const SESSIONS = [
  { id: 1,  label: 'CH 1',          type: 'chapter' },
  { id: 2,  label: 'Word 1',        type: 'lab'     },
  { id: 3,  label: 'Word 2',        type: 'lab'     },
  { id: 4,  label: 'CH 2',          type: 'chapter' },
  { id: 5,  label: 'PowerPoint 1',  type: 'lab'     },
  { id: 6,  label: 'PowerPoint 2',  type: 'lab'     },
  { id: 7,  label: 'Word-PP Quiz',  type: 'quiz'    },
  { id: 8,  label: 'CH 3',          type: 'chapter' },
  { id: 9,  label: 'CH 4',          type: 'chapter' },
  { id: 10, label: 'Phase 1 Quiz',  type: 'quiz'    },
  { id: 11, label: 'Access 1',      type: 'lab'     },
  { id: 12, label: 'Access 2',      type: 'lab'     },
  { id: 13, label: 'Access 3',      type: 'lab'     },
  { id: 14, label: 'Access 4',      type: 'lab'     },
  { id: 15, label: 'CH 6 Part 1',   type: 'chapter' },
  { id: 16, label: 'CH 6 Part 2',   type: 'chapter' },
  { id: 17, label: 'Access Quiz',   type: 'quiz'    },
  { id: 18, label: 'CH 7 Part 1',   type: 'chapter' },
  { id: 19, label: 'CH 7 Part 2',   type: 'chapter' },
  { id: 20, label: 'Phase 2 Quiz',  type: 'quiz'    },
  { id: 21, label: 'Excel 1',       type: 'lab'     },
  { id: 22, label: 'Excel 2',       type: 'lab'     },
  { id: 23, label: 'Excel 3',       type: 'lab'     },
  { id: 24, label: 'Excel 4',       type: 'lab'     },
  { id: 25, label: 'CH 8 Part 1',   type: 'chapter' },
  { id: 26, label: 'CH 8 Part 2',   type: 'chapter' },
  { id: 27, label: 'Excel Quiz',    type: 'quiz'    },
  { id: 28, label: 'CH 9 Part 1',   type: 'chapter' },
  { id: 29, label: 'CH 9 Part 2',   type: 'chapter' },
  { id: 30, label: 'SharePoint 1',  type: 'lab'     },
  { id: 31, label: 'SharePoint 2',  type: 'lab'     },
  { id: 32, label: 'SharePoint 3',  type: 'lab'     },
  { id: 33, label: 'SharePoint 4',  type: 'lab'     },
  { id: 34, label: 'CH 11 Part 1',  type: 'chapter' },
  { id: 35, label: 'CH 11 Part 2',  type: 'chapter' },
  { id: 36, label: 'CH 12',         type: 'chapter' },
  { id: 37, label: 'CH 13',         type: 'chapter' },
];
const TOTAL = SESSIONS.length;

// ─── Type config ──────────────────────────────────────────────────────────────
const TYPE_CFG = {
  chapter: {
    label: 'Chapter',
    icon: BookOpenIcon,
    pill: 'bg-[#CA133E]/20 text-red-300 border border-[#CA133E]/40',
    dot:  'bg-[#CA133E]',
  },
  lab: {
    label: 'Lab',
    icon: AcademicCapIcon,
    pill: 'bg-orange-900/30 text-orange-300 border border-orange-500/40',
    dot:  'bg-orange-400',
  },
  quiz: {
    label: 'Quiz',
    icon: DocumentTextIcon,
    pill: 'bg-green-900/30 text-green-300 border border-green-500/40',
    dot:  'bg-green-400',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86_400_000);
}
function addDays(ds, n) {
  const d = new Date(ds);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}
function fmt(ds) {
  if (!ds) return '';
  return new Date(ds).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function buildSched(missed, spd, start) {
  const out = [];
  let off = 0, i = 0;
  while (i < missed.length) {
    const sess = [];
    for (let s = 0; s < spd && i < missed.length; s++) sess.push(missed[i++]);
    out.push({ date: addDays(start, off++), sessions: sess });
  }
  return out;
}

// ─── Session pill ──────────────────────────────────────────────────────────────
function SessionPill({ session }) {
  const c = TYPE_CFG[session.type] || TYPE_CFG.chapter;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${c.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
      {session.label}
    </span>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
      <div className={`text-3xl font-black mb-0.5 ${color}`}>{value}</div>
      <div className="text-gray-400 text-xs mb-1">{sub}</div>
      <div className="text-gray-500 text-xs font-semibold">{label}</div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
const CatchupGenerator = () => {
  const [cs,   setCs]   = useState('');
  const [ed,   setEd]   = useState('');
  const [jd,   setJd]   = useState('');
  const [spd,  setSpd]  = useState(2);
  const [show, setShow] = useState(false);

  const R = useMemo(() => {
    if (!cs || !ed || !jd) return null;
    if (new Date(jd) < new Date(cs))  return { error: 'Join date cannot be before course start.' };
    if (new Date(jd) >= new Date(ed)) return { error: 'Join date must be before exam date.' };
    const total = daysBetween(cs, ed);
    if (total <= 0) return { error: 'Exam must be after course start.' };
    const elapsed  = daysBetween(cs, jd);
    const progress = Math.min(TOTAL, Math.round((elapsed / total) * TOTAL));
    const missed    = SESSIONS.slice(0, progress);
    const remaining = SESSIONS.slice(progress);
    const daysLeft  = daysBetween(jd, ed);
    if (daysLeft <= 0) return { error: 'No time before the exam.' };
    const daysNeeded = Math.ceil(missed.length / spd);
    const canMerge   = daysNeeded <= daysLeft;
    const minSpd     = missed.length > 0 ? Math.ceil(missed.length / daysLeft) : 0;
    const sched      = buildSched(missed, spd, jd);
    const rejoin     = canMerge && sched.length ? addDays(sched[sched.length - 1].date, 1) : null;
    return { progress, missed, remaining, daysLeft, daysNeeded, canMerge, minSpd, sched, rejoin };
  }, [cs, ed, jd, spd]);

  const ready = cs && ed && jd;
  const inputCls = "w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-[#CA133E] focus:outline-none text-sm";
  const labelCls = "block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <SparklesIcon className="h-7 w-7 text-[#CA133E]" />
            Catchup Generator
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Late-joiner rescheduler — calculates personalised catch-up plans against the full ICT curriculum
          </p>
        </div>
        <div className="flex items-center gap-2">
          {['chapter', 'lab', 'quiz'].map(t => {
            const c = TYPE_CFG[t];
            return (
              <span key={t} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${c.pill}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                {c.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Input card */}
      <div className="bg-white/5 border border-white/15 rounded-2xl p-6 lg:p-8 space-y-6">
        <p className="text-xs font-bold text-[#CA133E] uppercase tracking-widest">Input Parameters</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <label className={labelCls}>Course Start Date</label>
            <input type="date" value={cs} onChange={e => { setCs(e.target.value); setShow(false); }} className={inputCls} />
            <p className="text-gray-500 text-xs mt-1.5">When did the group first meet?</p>
          </div>
          <div>
            <label className={labelCls}>Exam / Final Date</label>
            <input type="date" value={ed} onChange={e => { setEd(e.target.value); setShow(false); }} className={inputCls} />
            <p className="text-gray-500 text-xs mt-1.5">Group exam deadline</p>
          </div>
          <div>
            <label className={labelCls}>Student Join Date</label>
            <input type="date" value={jd} onChange={e => { setJd(e.target.value); setShow(false); }} className={inputCls} />
            <p className="text-gray-500 text-xs mt-1.5">When does the late student join?</p>
          </div>
        </div>

        <div>
          <label className={labelCls}>Catch-Up Sessions Per Day</label>
          <div className="flex gap-2 max-w-xs">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => { setSpd(n); setShow(false); }}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all border ${
                  spd === n
                    ? 'bg-[#CA133E] border-[#CA133E] text-white shadow-lg shadow-[#CA133E]/30'
                    : 'bg-white/10 border-white/20 text-gray-400 hover:bg-white/15 hover:text-white'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="text-gray-500 text-xs mt-1.5">Sessions the student covers per catch-up day</p>
        </div>

        {ready && R && !R.error && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="w-full py-3 bg-[#CA133E] hover:bg-[#A01030] text-white font-bold rounded-xl transition-colors shadow-lg shadow-[#CA133E]/25 flex items-center justify-center gap-2"
          >
            <CalendarDaysIcon className="h-5 w-5" />
            {show ? 'Hide Catch-Up Schedule' : 'Show Full Catch-Up Schedule'}
          </button>
        )}
      </div>

      {/* Error */}
      {R?.error && (
        <div className="flex items-center gap-3 bg-red-900/20 border border-red-500/40 rounded-2xl px-5 py-4">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm font-medium">{R.error}</p>
        </div>
      )}

      {/* Empty state */}
      {!ready && (
        <div className="bg-white/5 border border-dashed border-white/15 rounded-2xl py-16 text-center">
          <CalendarDaysIcon className="h-14 w-14 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 font-semibold mb-1">Fill in the three dates above</p>
          <p className="text-gray-600 text-sm">The algorithm will instantly generate the student catch-up plan.</p>
        </div>
      )}

      {R && !R.error && (
        <div className="space-y-5">
          {/* Verdict */}
          <div className={`rounded-2xl p-5 border flex flex-wrap items-center gap-4 ${
            R.canMerge
              ? 'bg-green-900/15 border-green-500/40'
              : 'bg-[#CA133E]/10 border-[#CA133E]/40'
          }`}>
            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl border ${
              R.canMerge ? 'bg-green-900/30 border-green-500/40' : 'bg-[#CA133E]/20 border-[#CA133E]/40'
            }`}>
              {R.canMerge ? '✅' : '🔀'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-lg">
                {R.canMerge
                  ? `Can Merge With Group — ${R.daysNeeded} catch-up day${R.daysNeeded !== 1 ? 's' : ''} needed`
                  : 'Recommend: New Group / Parallel Track'}
              </p>
              <p className="text-gray-400 text-sm mt-0.5">
                {R.canMerge
                  ? `At ${spd} session${spd > 1 ? 's' : ''}/day, catch-up finishes on ${fmt(R.rejoin)} — before the exam on ${fmt(ed)}.`
                  : `${R.daysNeeded} days needed but only ${R.daysLeft} days until exam. Minimum: ${R.minSpd} sessions/day.${R.minSpd > 5 ? ' A new group is strongly advised.' : ''}`}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Group Progress"  value={`${R.progress}/${TOTAL}`} sub="sessions done"     color="text-[#CA133E]"     />
            <StatCard label="Sessions Missed" value={R.missed.length}          sub="to cover"           color="text-orange-400"    />
            <StatCard label="Days Until Exam" value={R.daysLeft}               sub="days remaining"     color="text-violet-400"    />
            <StatCard label="Catch-Up Days"   value={R.daysNeeded}             sub="days needed"        color={R.canMerge ? 'text-green-400' : 'text-[#CA133E]'} />
          </div>

          {/* Progress bar */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-300">Course Progress at Join Date</span>
              <span className="text-sm font-black text-[#CA133E]">{Math.round((R.progress / TOTAL) * 100)}%</span>
            </div>
            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(R.progress / TOTAL) * 100}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-[#CA133E] to-pink-500 rounded-full"
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-600">
              <span>Course Start</span>
              <span className="text-[#CA133E] font-semibold">Student joins here</span>
              <span>Exam Date</span>
            </div>
          </div>

          {/* Suggestion */}
          {!R.canMerge && R.minSpd <= 5 && (
            <div className="flex items-start gap-4 bg-orange-900/20 border border-orange-500/30 rounded-2xl p-4">
              <LightBulbIcon className="h-6 w-6 text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-semibold text-sm">
                  Increase to <span className="text-orange-300">{R.minSpd} sessions/day</span> to catch up in time
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  Try setting sessions/day to {R.minSpd} above to see the rescheduled plan.
                </p>
              </div>
            </div>
          )}

          {/* Full schedule */}
          <AnimatePresence>
            {show && R.sched.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="bg-white/5 border border-white/15 rounded-2xl overflow-hidden"
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.03]">
                  <span className="text-xs font-bold text-[#CA133E] uppercase tracking-widest">
                    Personalised Catch-Up Schedule
                  </span>
                  <span className="text-xs text-gray-400">{R.sched.length} days · {R.missed.length} sessions</span>
                </div>
                <div className="divide-y divide-white/5">
                  {R.sched.map((day, di) => (
                    <div key={di} className="flex gap-4 px-6 py-3 items-start">
                      <div className="min-w-[100px] text-xs font-semibold text-gray-500 pt-1">{fmt(day.date)}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {day.sessions.map((sess, si) => <SessionPill key={si} session={sess} />)}
                      </div>
                    </div>
                  ))}
                </div>
                {R.canMerge && R.rejoin && (
                  <div className="mx-6 mb-4 mt-2 flex items-center gap-3 bg-green-900/20 border border-green-500/30 rounded-xl px-4 py-3">
                    <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <p className="text-green-300 text-sm font-semibold">
                      Student rejoins group on <strong>{fmt(R.rejoin)}</strong>
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Remaining sessions */}
          {R.remaining.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <p className="text-xs font-bold text-[#CA133E] uppercase tracking-widest mb-3">
                Remaining Group Sessions After Catch-Up ({R.remaining.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {R.remaining.map(sess => <SessionPill key={sess.id} session={sess} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CatchupGenerator;
