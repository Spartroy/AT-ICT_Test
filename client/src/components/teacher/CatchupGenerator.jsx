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
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold ${c.pill}`}>
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
  const [step, setStep] = useState(1); // 1 = input, 2 = results

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
  const pct   = R && !R.error ? Math.round((R.progress / TOTAL) * 100) : 0;

  const inputCls = "w-full px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:border-[#CA133E] focus:outline-none text-sm transition-colors";
  const labelCls = "block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2";

  return (
    <div className="space-y-6 max-w-4xl">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-[#CA133E]/15 border border-[#CA133E]/30 flex items-center justify-center flex-shrink-0">
              <SparklesIcon className="h-5 w-5 text-[#CA133E]" />
            </div>
            <h2 className="text-xl font-bold text-white">Late-Joiner Catch-Up Planner</h2>
          </div>
          <p className="text-gray-500 text-sm ml-12">
            Enter three dates and get a day-by-day catch-up schedule built against the full ICT curriculum.
          </p>
        </div>
        {/* legend */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {['chapter', 'lab', 'quiz'].map(t => {
            const c = TYPE_CFG[t];
            return (
              <span key={t} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold ${c.pill}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                {c.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* ── Step indicator ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {[{ n: 1, label: 'Enter Details' }, { n: 2, label: 'View Plan' }].map(({ n, label }) => (
          <React.Fragment key={n}>
            <div className={`flex items-center gap-2 ${step === n ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${step === n ? 'bg-[#CA133E] text-white' : 'bg-white/10 text-gray-400'}`}>{n}</div>
              <span className="text-sm font-medium text-gray-300 hidden sm:inline">{label}</span>
            </div>
            {n < 2 && <div className="flex-1 h-px bg-white/10 max-w-[60px]" />}
          </React.Fragment>
        ))}
      </div>

      {/* ── Step 1: Input ───────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22 }}
            className="space-y-5"
          >
            <div className="bg-[#161616] border border-white/8 rounded-2xl p-5 sm:p-7 space-y-6">

              {/* Three date inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className={labelCls}>Course Start</label>
                  <input type="date" value={cs} onChange={e => setCs(e.target.value)} className={inputCls} />
                  <p className="text-gray-600 text-xs mt-1.5">When the group first met</p>
                </div>
                <div>
                  <label className={labelCls}>Exam Date</label>
                  <input type="date" value={ed} onChange={e => setEd(e.target.value)} className={inputCls} />
                  <p className="text-gray-600 text-xs mt-1.5">Final exam / deadline</p>
                </div>
                <div>
                  <label className={labelCls}>Student Joins</label>
                  <input type="date" value={jd} onChange={e => setJd(e.target.value)} className={inputCls} />
                  <p className="text-gray-600 text-xs mt-1.5">Late joiner's start date</p>
                </div>
              </div>

              {/* Sessions per day picker */}
              <div>
                <label className={labelCls}>Catch-Up Sessions Per Day</label>
                <div className="flex gap-2 max-w-[260px]">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setSpd(n)}
                      className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all border ${
                        spd === n
                          ? 'bg-[#CA133E] border-[#CA133E] text-white shadow-lg shadow-[#CA133E]/20'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <p className="text-gray-600 text-xs mt-1.5">Sessions covered per catch-up study day</p>
              </div>

              {/* Error */}
              {R?.error && (
                <div className="flex items-center gap-3 bg-red-900/15 border border-red-500/30 rounded-xl px-4 py-3">
                  <ExclamationTriangleIcon className="h-4 w-4 text-red-400 flex-shrink-0" />
                  <p className="text-red-300 text-sm">{R.error}</p>
                </div>
              )}

              {/* Generate button */}
              <button
                type="button"
                disabled={!ready || !!R?.error}
                onClick={() => setStep(2)}
                className="w-full py-3 bg-[#CA133E] hover:bg-[#A01030] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors shadow-lg shadow-[#CA133E]/20 flex items-center justify-center gap-2"
              >
                <CalendarDaysIcon className="h-5 w-5" />
                Generate Catch-Up Plan
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Results ───────────────────────────────────────────── */}
        {step === 2 && R && !R.error && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.22 }}
            className="space-y-4"
          >
            {/* Back + verdict banner */}
            <div className="flex items-start gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/8 rounded-xl transition-all flex-shrink-0"
              >
                <ChevronUpIcon className="h-4 w-4 rotate-[-90deg]" />
                Edit
              </button>
              <div className={`flex-1 rounded-2xl p-4 border flex flex-wrap items-center gap-3 ${
                R.canMerge ? 'bg-green-900/12 border-green-500/35' : 'bg-[#CA133E]/8 border-[#CA133E]/35'
              }`}>
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                  R.canMerge ? 'bg-green-900/30' : 'bg-[#CA133E]/20'
                }`}>
                  {R.canMerge ? '✅' : '🔀'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-base">
                    {R.canMerge
                      ? `Can merge with group — ${R.daysNeeded} catch-up day${R.daysNeeded !== 1 ? 's' : ''}`
                      : 'Recommend a parallel track / new group'}
                  </p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {R.canMerge
                      ? `Finishes on ${fmt(R.rejoin)} · exam on ${fmt(ed)}`
                      : `${R.daysNeeded} days needed, ${R.daysLeft} available · min ${R.minSpd} sessions/day`}
                  </p>
                </div>
              </div>
            </div>

            {/* 4 stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Group Progress"  value={`${R.progress}/${TOTAL}`} sub="sessions done"     color="text-[#CA133E]" />
              <StatCard label="To Catch Up"     value={R.missed.length}          sub="sessions"           color="text-orange-400" />
              <StatCard label="Days Until Exam" value={R.daysLeft}               sub="days left"          color="text-violet-400" />
              <StatCard label="Catch-Up Days"   value={R.daysNeeded}             sub="needed"             color={R.canMerge ? 'text-green-400' : 'text-[#CA133E]'} />
            </div>

            {/* Timeline bar */}
            <div className="bg-[#161616] border border-white/8 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-300">Group progress when student joins</span>
                <span className="text-sm font-black text-[#CA133E]">{pct}%</span>
              </div>
              <div className="relative h-3 bg-white/8 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg,#CA133E,#ff6b8a)' }}
                />
              </div>
              <div className="flex justify-between mt-1.5 text-[10px] text-gray-600">
                <span>{fmt(cs)}</span>
                <span className="text-[#CA133E] font-semibold">↑ {fmt(jd)}</span>
                <span>{fmt(ed)}</span>
              </div>
            </div>

            {/* Pace tip */}
            {!R.canMerge && R.minSpd <= 5 && (
              <div className="flex items-center gap-3 bg-orange-900/15 border border-orange-500/25 rounded-xl px-4 py-3">
                <LightBulbIcon className="h-5 w-5 text-orange-400 flex-shrink-0" />
                <p className="text-sm text-orange-300">
                  Set pace to <strong>{R.minSpd} sessions/day</strong> to finish before the exam.{' '}
                  <button onClick={() => { setSpd(R.minSpd); setStep(1); }} className="underline hover:text-orange-200 transition-colors">
                    Adjust &amp; recalculate
                  </button>
                </p>
              </div>
            )}

            {/* Day-by-day schedule toggle */}
            {R.sched.length > 0 && (
              <div className="bg-[#161616] border border-white/8 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setShow(s => !s)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/3 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <CalendarDaysIcon className="h-4 w-4 text-[#CA133E]" />
                    <span className="text-sm font-semibold text-white">Day-by-Day Catch-Up Schedule</span>
                    <span className="text-xs text-gray-500">{R.sched.length} days · {R.missed.length} sessions</span>
                  </div>
                  <ChevronDownIcon className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${show ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence initial={false}>
                  {show && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-white/6 divide-y divide-white/5 max-h-80 overflow-y-auto">
                        {R.sched.map((day, di) => (
                          <div key={di} className="flex gap-4 px-5 py-2.5 items-start">
                            <div className="min-w-[90px] text-xs font-semibold text-gray-500 pt-0.5">{fmt(day.date)}</div>
                            <div className="flex flex-wrap gap-1.5">
                              {day.sessions.map((sess, si) => <SessionPill key={si} session={sess} />)}
                            </div>
                          </div>
                        ))}
                      </div>
                      {R.canMerge && R.rejoin && (
                        <div className="mx-5 mb-4 mt-2 flex items-center gap-2 bg-green-900/15 border border-green-500/25 rounded-xl px-4 py-2.5">
                          <CheckCircleIcon className="h-4 w-4 text-green-400 flex-shrink-0" />
                          <p className="text-green-300 text-xs font-semibold">
                            Rejoins group on <strong>{fmt(R.rejoin)}</strong>
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Remaining sessions */}
            {R.remaining.length > 0 && (
              <div className="bg-[#161616] border border-white/8 rounded-2xl p-5">
                <p className="text-xs font-bold text-[#CA133E] uppercase tracking-widest mb-3">
                  Remaining Group Sessions ({R.remaining.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {R.remaining.map(sess => <SessionPill key={sess.id} session={sess} />)}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CatchupGenerator;
