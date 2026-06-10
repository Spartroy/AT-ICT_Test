import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ENDPOINTS } from '../../config/api';
import { showSuccess, showError, showWarning } from '../../utils/toast';
import {
  AcademicCapIcon, ClockIcon, PaperClipIcon, ArrowPathIcon,
  CloudArrowUpIcon, CheckCircleIcon, XCircleIcon, PlayIcon,
  ChevronDownIcon, ChevronUpIcon, ExclamationTriangleIcon, TrophyIcon
} from '@heroicons/react/24/outline';

const statusBadge = {
  graded:      'bg-green-500/15 text-green-400',
  submitted:   'bg-blue-500/15 text-blue-400',
  in_progress: 'bg-yellow-500/15 text-yellow-400',
  assigned:    'bg-red-500/15 text-red-400'
};
const statusLabel = { graded: 'Graded', submitted: 'Submitted', in_progress: 'In Progress', assigned: 'Not Started' };

const scoreColor = (s, max) => {
  if (s == null) return 'text-gray-500';
  const p = (s / max) * 100;
  return p >= 80 ? 'text-green-400' : p >= 60 ? 'text-yellow-400' : 'text-red-400';
};

const QuizzesTab = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(new Set());
  const [files, setFiles] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [countdowns, setCountdowns] = useState({});

  useEffect(() => {
    fetch_();
    const interval = setInterval(() => fetch_(true), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const t = setInterval(() => updateCountdowns(), 1000);
    return () => clearInterval(t);
  }, [quizzes]);

  const fetch_ = async (silent = false) => {
    if (!silent) { setLoading(true); setRefreshing(true); }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_ENDPOINTS.STUDENT.QUIZZES, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
      if (res.ok) { setQuizzes((await res.json()).data.quizzes); setError(''); }
      else throw new Error();
    } catch { setError('Failed to load quizzes'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const updateCountdowns = () => {
    const c = {};
    quizzes.forEach(q => {
      if (!q.startDate || !q.startTime || !q.duration) return;
      const now = Date.now();
      const date = q.startDate.includes('T') ? q.startDate.split('T')[0] : q.startDate;
      const start = new Date(`${date}T${q.startTime}`).getTime();
      const end = start + parseInt(q.duration) * 60000;
      if (now < start) c[q._id] = { type: 'until_start', text: fmtMs(start - now) };
      else if (now <= end) c[q._id] = { type: 'remaining', text: fmtMs(end - now) };
      else c[q._id] = { type: 'ended', text: 'Quiz has ended' };
    });
    setCountdowns(c);
  };

  const fmtMs = (ms) => {
    if (ms <= 0) return '00:00:00';
    const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000);
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  const toggle = (id) => setExpanded(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const getAvail = (q) => {
    if (!q.startDate || !q.startTime || !q.duration) return 'ended';
    const now = Date.now();
    const date = q.startDate.includes('T') ? q.startDate.split('T')[0] : q.startDate;
    const start = new Date(`${date}T${q.startTime}`).getTime();
    const end = start + parseInt(q.duration) * 60000;
    if (now < start) return 'upcoming';
    if (now <= end) return 'active';
    return 'ended';
  };

  const startQuiz = async (id) => {
    setStarting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_ENDPOINTS.STUDENT.QUIZZES}/${id}/start`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
      if (res.ok) { showSuccess('Quiz started!'); fetch_(); }
      else showError((await res.json()).message || 'Failed to start');
    } catch { showError('Error starting quiz'); }
    finally { setStarting(false); }
  };

  const submitQuiz = async (id) => {
    const f = files[id] || [];
    if (!f.length) return showWarning('Please select files to submit');
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const fd = new FormData(); f.forEach(file => fd.append('files', file));
      const res = await fetch(`${API_ENDPOINTS.STUDENT.QUIZZES}/${id}/submit`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
      if (res.ok) { showSuccess('Quiz submitted!'); setFiles(p => ({...p,[id]:[]})); fetch_(); }
      else showError((await res.json()).message || 'Failed to submit');
    } catch { showError('Error submitting quiz'); }
    finally { setSubmitting(false); }
  };

  const completed = quizzes.filter(q => ['submitted','graded'].includes(q.studentData?.status)).length;
  const pending   = quizzes.filter(q => ['assigned','in_progress'].includes(q.studentData?.status)).length;

  if (loading && !quizzes.length) return (
    <div className="space-y-3">{[...Array(3)].map((_,i)=><div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse"/>)}</div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#161616] border border-white/5 rounded-xl p-4 sm:p-5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><AcademicCapIcon className="h-5 w-5 text-[#CA133E]" />Quizzes</h2>
          <div className="flex items-center gap-4 mt-1.5 text-sm">
            <span className="flex items-center gap-1.5 text-green-400"><CheckCircleIcon className="h-4 w-4" />{completed} Completed</span>
            <span className="flex items-center gap-1.5 text-red-400"><XCircleIcon className="h-4 w-4" />{pending} Pending</span>
          </div>
        </div>
        <button onClick={() => fetch_()} disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-[#CA133E] text-white rounded-xl hover:bg-[#A01030] disabled:opacity-50 transition-colors text-sm font-medium">
          <ArrowPathIcon className={`h-4 w-4 ${refreshing?'animate-spin':''}`} />Refresh
        </button>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>}

      {quizzes.length === 0 ? (
        <div className="bg-[#161616] border border-dashed border-white/10 rounded-xl p-10 text-center">
          <AcademicCapIcon className="h-10 w-10 text-gray-700 mx-auto mb-3" />
          <p className="text-white font-medium text-sm">No Quizzes</p>
          <p className="text-gray-600 text-xs mt-1">Your quizzes will appear here once assigned.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {quizzes.map((q) => {
            const isExp = expanded.has(q._id);
            const s = q.studentData?.status || 'assigned';
            const avail = getAvail(q);
            const cd = countdowns[q._id];
            const pct = q.studentData?.score != null ? Math.round((q.studentData.score / q.maxScore) * 100) : null;

            return (
              <motion.div key={q._id} layout className="bg-[#161616] border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-colors">
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <h3 className="text-white font-semibold text-sm sm:text-base">{q.title}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusBadge[s]}`}>{statusLabel[s]}</span>
                        {cd && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                            cd.type==='until_start'?'bg-blue-500/15 text-blue-400':cd.type==='remaining'?'bg-yellow-500/15 text-yellow-400':'bg-red-500/15 text-red-400'
                          }`}>
                            {cd.type==='until_start'?'⏰ ':'⏱️ '}{cd.text}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span>Date: <span className="text-gray-300">{q.startDate?new Date(q.startDate).toLocaleDateString('en-US',{month:'numeric',day:'numeric'}):'TBD'}</span></span>
                        <span>Time: <span className="text-gray-300">{q.startTime||'TBD'}</span></span>
                        <span>Duration: <span className="text-gray-300">{q.duration||0}min</span></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-[10px] text-gray-600 mb-0.5">Score</p>
                        <p className={`text-base font-bold ${scoreColor(q.studentData?.score, q.maxScore)}`}>
                          {s==='graded'&&q.studentData?.score!=null?`${q.studentData.score}/${q.maxScore}`:`—/${q.maxScore}`}
                        </p>
                        {pct!=null&&<p className={`text-[10px] ${scoreColor(q.studentData?.score,q.maxScore)}`}>{pct}%</p>}
                      </div>
                      {s==='assigned'&&avail==='active'&&(
                        <button onClick={()=>startQuiz(q._id)} disabled={starting}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors text-xs font-medium">
                          <PlayIcon className="h-3.5 w-3.5"/>{starting?'Starting…':'Start Quiz'}
                        </button>
                      )}
                      {s==='in_progress'&&avail==='active'&&(
                        <span className="px-3 py-1.5 bg-yellow-500/15 text-yellow-400 rounded-xl text-xs font-medium">In Progress</span>
                      )}
                      <button onClick={()=>toggle(q._id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white/5 text-gray-400 rounded-xl hover:bg-white/10 hover:text-white transition-colors text-xs">
                        {isExp?'Hide':'Details'}
                        {isExp?<ChevronUpIcon className="h-3.5 w-3.5"/>:<ChevronDownIcon className="h-3.5 w-3.5"/>}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExp && (
                      <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} transition={{duration:0.25}}
                        className="border-t border-white/8 pt-4 mt-4 overflow-hidden">
                        {q.description && <p className="text-gray-400 text-sm mb-4">{q.description}</p>}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 mb-4 text-xs text-gray-500">
                          {[['Type',q.type||'N/A'],['Section',q.section||'N/A'],['Difficulty',q.difficulty||'N/A'],['Max Score',q.maxScore||0]].map(([k,v])=>(
                            <span key={k}>{k}: <span className="text-gray-300">{v}</span></span>
                          ))}
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Instructions</h4>
                            <div className="bg-[#1A1A1A] p-3 rounded-xl max-h-28 overflow-y-auto">
                              <p className="text-gray-300 text-xs leading-relaxed">{q.instructions||'No instructions provided.'}</p>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                              {s==='graded'?'Results':s==='submitted'?'Submitted':s==='in_progress'?'In Progress':'Quiz Status'}
                            </h4>
                            {s==='graded'?(
                              <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-xl">
                                <div className="flex items-center gap-2 mb-2"><TrophyIcon className="h-4 w-4 text-green-400"/><span className="text-green-400 font-medium text-sm">Graded</span></div>
                                <p className="text-xs text-gray-300">Score: <span className="text-white font-bold">{q.studentData?.score}/{q.maxScore} ({pct}%)</span></p>
                                {q.studentData?.feedback&&<p className="text-xs text-gray-400 mt-1 bg-white/4 p-2 rounded-lg">{q.studentData.feedback}</p>}
                              </div>
                            ):s==='submitted'?(
                              <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl">
                                <div className="flex items-center gap-2 mb-1"><ClockIcon className="h-4 w-4 text-blue-400"/><span className="text-blue-400 font-medium text-sm">Awaiting Grade</span></div>
                                <p className="text-xs text-gray-400">Submitted {new Date(q.studentData.submissionDate).toLocaleDateString()}{q.studentData?.isLate&&<span className="text-red-400 ml-1">(Late)</span>}</p>
                              </div>
                            ):s==='in_progress'&&avail==='active'?(
                              <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-xl space-y-3">
                                <div className="flex items-center gap-2"><ExclamationTriangleIcon className="h-4 w-4 text-yellow-400"/><span className="text-yellow-400 font-medium text-sm">In Progress — Upload files to submit</span></div>
                                <div className="border-2 border-dashed border-yellow-500/30 rounded-xl p-3 text-center">
                                  <input type="file" multiple onChange={e=>setFiles(p=>({...p,[q._id]:Array.from(e.target.files)}))}
                                    className="hidden" id={`qf-${q._id}`} accept=".pdf,.doc,.docx,.txt,.jpg,.png"/>
                                  <label htmlFor={`qf-${q._id}`}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/15 text-yellow-400 border border-yellow-500/25 rounded-xl cursor-pointer text-xs">
                                    <PaperClipIcon className="h-3.5 w-3.5"/>Choose Files
                                  </label>
                                  {files[q._id]?.length>0&&(
                                    <div className="mt-2 space-y-1">
                                      {files[q._id].map((f,i)=><div key={i} className="text-[10px] text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded">{f.name}</div>)}
                                      <button onClick={()=>submitQuiz(q._id)} disabled={submitting}
                                        className="mt-1 w-full py-1.5 bg-[#CA133E] text-white rounded-xl text-xs font-medium hover:bg-[#A01030] disabled:opacity-50">
                                        {submitting?'Submitting…':'Submit Quiz'}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ):(
                              <div className={`p-3 rounded-xl border ${avail==='upcoming'?'bg-blue-500/10 border-blue-500/20':avail==='active'?'bg-green-500/10 border-green-500/20':'bg-white/4 border-white/8'}`}>
                                {avail==='upcoming'&&<p className="text-blue-400 text-sm font-medium">⏰ Starts in <span className="font-mono">{cd?.text}</span></p>}
                                {avail==='active'&&<p className="text-green-400 text-sm font-medium">✅ Ready — click "Start Quiz" to begin</p>}
                                {avail==='ended'&&<p className="text-gray-500 text-sm">This quiz has ended.</p>}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default QuizzesTab;
