import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ENDPOINTS } from '../../config/api';
import {
  DocumentTextIcon, PaperClipIcon, CloudArrowUpIcon, CheckCircleIcon,
  ClockIcon, TrophyIcon, ArrowPathIcon, XCircleIcon,
  ChevronDownIcon, ChevronUpIcon
} from '@heroicons/react/24/outline';
import io from 'socket.io-client';

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

const difficultyBadge = {
  easy:   'bg-green-500/15 text-green-400 border-green-500/20',
  medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  hard:   'bg-red-500/15 text-red-400 border-red-500/20'
};

const inputClass = 'bg-[#1A1A1A] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#CA133E] transition-colors text-sm';

const AssignmentsTab = ({ studentData, stats, fetchUrl, readonly = false }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(new Set());
  const [files, setFiles] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState({ open: false, title: '', message: '', isError: false, filesCount: 0 });

  useEffect(() => {
    fetch_();
    const socket = io(API_ENDPOINTS.BASE_URL);
    socket.on('new_assignment', () => fetch_(true));
    const interval = setInterval(() => fetch_(true), 30000);
    return () => { clearInterval(interval); socket.disconnect(); };
  }, []);

  const fetch_ = async (silent = false) => {
    if (!silent) { setLoading(true); setRefreshing(true); }
    try {
      const token = localStorage.getItem('token');
      const url = fetchUrl || API_ENDPOINTS.STUDENT.ASSIGNMENTS;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
      if (res.ok) {
        let list = (await res.json())?.data?.assignments || [];
        if (fetchUrl && url.includes('/api/parent/child/')) {
          list = list.map(a => ({ ...a, studentData: { status: a.status, submissionDate: a.submissionDate, isLate: a.isLate, feedback: a.feedback, score: a.score, gradedDate: a.gradedDate } }));
        }
        setAssignments(list); setError('');
      } else throw new Error();
    } catch { setError('Failed to load assignments'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const toggle = (id) => setExpanded(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const submit = async (assignmentId) => {
    if (readonly) return;
    const f = files[assignmentId] || [];
    if (!f.length) return setModal({ open: true, isError: true, title: 'No Files', message: 'Please select at least one file.' });
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const fd = new FormData(); f.forEach(f => fd.append('files', f));
      const res = await fetch(`${API_ENDPOINTS.STUDENT.ASSIGNMENTS}/${assignmentId}/submit`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
      if (res.ok) {
        const title = assignments.find(a => a._id === assignmentId)?.title || 'Your assignment';
        setFiles(p => ({ ...p, [assignmentId]: [] }));
        setExpanded(p => { const s = new Set(p); s.delete(assignmentId); return s; });
        fetch_();
        setModal({ open: true, isError: false, title: 'Submitted!', message: `"${title}" submitted successfully.`, filesCount: f.length });
      } else {
        const d = await res.json();
        setModal({ open: true, isError: true, title: 'Failed', message: d.message || 'An error occurred.' });
      }
    } catch { setModal({ open: true, isError: true, title: 'Error', message: 'Could not connect. Check your connection.' }); }
    finally { setSubmitting(false); }
  };

  const completedCount = assignments.filter(a => ['submitted','graded'].includes(a.studentData?.status)).length;
  const pendingCount   = assignments.filter(a => ['assigned','in_progress'].includes(a.studentData?.status)).length;

  if (loading && !assignments.length) return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />)}
    </div>
  );

  return (
    <>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#161616] border border-white/5 rounded-xl p-4 sm:p-5">
          <div>
            <h2 className="text-xl font-bold text-white">Assignments</h2>
            <div className="flex items-center gap-4 mt-1.5 text-sm">
              <span className="flex items-center gap-1.5 text-green-400"><CheckCircleIcon className="h-4 w-4" />{completedCount} Completed</span>
              <span className="flex items-center gap-1.5 text-red-400"><XCircleIcon className="h-4 w-4" />{pendingCount} Pending</span>
            </div>
          </div>
          <button onClick={() => fetch_()} disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-[#CA133E] text-white rounded-xl hover:bg-[#A01030] disabled:opacity-50 transition-colors text-sm font-medium">
            <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>}

        {/* List */}
        {assignments.length === 0 ? (
          <div className="bg-[#161616] border border-dashed border-white/10 rounded-xl p-10 text-center">
            <DocumentTextIcon className="h-10 w-10 text-gray-700 mx-auto mb-3" />
            <p className="text-white font-medium text-sm">No Assignments</p>
            <p className="text-gray-600 text-xs mt-1">Your assignments will appear here once assigned.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {assignments.map((a) => {
              const isExp = expanded.has(a._id);
              const s = a.studentData?.status || 'assigned';
              const pct = a.studentData?.score != null ? Math.round((a.studentData.score / a.maxScore) * 100) : null;

              return (
                <motion.div key={a._id} layout className="bg-[#161616] border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-colors">
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <DocumentTextIcon className="h-5 w-5 text-[#CA133E] flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <h3 className="text-white font-semibold text-sm sm:text-base truncate">{a.title}</h3>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusBadge[s]}`}>{statusLabel[s]}</span>
                            {a.difficulty && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${difficultyBadge[a.difficulty]}`}>
                                {a.difficulty[0].toUpperCase() + a.difficulty.slice(1)}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                            <span>Due: <span className="text-red-400">{new Date(a.dueDate).toLocaleDateString('en-US',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span></span>
                            <span>Type: <span className="text-gray-300">{a.type}</span></span>
                            <span className="hidden sm:inline">Section: <span className="text-gray-300">{a.section}</span></span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-[10px] text-gray-600 mb-0.5">Score</p>
                          <p className={`text-base font-bold ${scoreColor(a.studentData?.score, a.maxScore)}`}>
                            {s === 'graded' && a.studentData?.score != null ? `${a.studentData.score}/${a.maxScore}` : `—/${a.maxScore}`}
                          </p>
                          {pct != null && <p className={`text-[10px] font-medium ${scoreColor(a.studentData?.score, a.maxScore)}`}>{pct}%</p>}
                        </div>
                        <button onClick={() => toggle(a._id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-white/5 text-gray-400 rounded-xl hover:bg-white/10 hover:text-white transition-colors text-xs">
                          {isExp ? 'Hide' : 'Details'}
                          {isExp ? <ChevronUpIcon className="h-3.5 w-3.5" /> : <ChevronDownIcon className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExp && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}
                          className="border-t border-white/8 pt-4 mt-4 overflow-hidden">
                          {a.description && <p className="text-gray-400 text-sm mb-4">{a.description}</p>}

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 mb-4 text-xs text-gray-500">
                            <span>Max Score: <span className="text-gray-300">{a.maxScore}</span></span>
                            <span>Type: <span className="text-gray-300">{a.type}</span></span>
                            <span>Section: <span className="text-gray-300">{a.section}</span></span>
                            <span>Created: <span className="text-gray-300">{new Date(a.createdAt).toLocaleDateString()}</span></span>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Instructions</h4>
                              <div className="bg-[#1A1A1A] p-3 rounded-xl max-h-32 overflow-y-auto">
                                <p className="text-gray-300 text-xs leading-relaxed">{a.instructions || 'No instructions provided.'}</p>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Submission</h4>
                              {s === 'graded' ? (
                                <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-xl">
                                  <div className="flex items-center gap-2 mb-2"><CheckCircleIcon className="h-4 w-4 text-green-400" /><span className="text-green-400 font-medium text-sm">Graded</span></div>
                                  <p className="text-xs text-gray-300">Score: <span className="text-white font-bold">{a.studentData?.score}/{a.maxScore} ({pct}%)</span></p>
                                  {a.studentData?.feedback && <p className="text-xs text-gray-400 mt-1 bg-white/4 p-2 rounded-lg">{a.studentData.feedback}</p>}
                                </div>
                              ) : s === 'submitted' ? (
                                <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl">
                                  <div className="flex items-center gap-2 mb-1"><ClockIcon className="h-4 w-4 text-blue-400" /><span className="text-blue-400 font-medium text-sm">Awaiting Grade</span></div>
                                  <p className="text-xs text-gray-400">Submitted {new Date(a.studentData.submissionDate).toLocaleDateString()}{a.studentData?.isLate && <span className="text-red-400 ml-1">(Late)</span>}</p>
                                </div>
                              ) : readonly ? (
                                <div className="bg-white/4 border border-white/8 p-3 rounded-xl text-xs text-gray-500">Not submitted yet.</div>
                              ) : (
                                <div className="border-2 border-dashed border-white/10 rounded-xl p-4 text-center">
                                  <CloudArrowUpIcon className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                                  <p className="text-gray-500 text-xs mb-3">Upload your assignment files</p>
                                  <input type="file" multiple onChange={e => setFiles(p => ({...p,[a._id]:Array.from(e.target.files)}))}
                                    className="hidden" id={`file-${a._id}`} accept=".pdf,.doc,.docx,.txt,.jpg,.png" />
                                  <label htmlFor={`file-${a._id}`}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/8 text-gray-300 border border-white/10 rounded-xl cursor-pointer hover:bg-white/15 transition-colors text-xs">
                                    <PaperClipIcon className="h-3.5 w-3.5" />Choose Files
                                  </label>
                                  {files[a._id]?.length > 0 && (
                                    <div className="mt-3 space-y-1">
                                      {files[a._id].map((f, i) => (
                                        <div key={i} className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-1 rounded-lg">{f.name}</div>
                                      ))}
                                      <button onClick={() => submit(a._id)} disabled={submitting}
                                        className="mt-2 w-full py-1.5 bg-[#CA133E] text-white rounded-xl text-xs font-medium hover:bg-[#A01030] disabled:opacity-50 transition-colors">
                                        {submitting ? 'Submitting…' : 'Submit Assignment'}
                                      </button>
                                    </div>
                                  )}
                                  <p className="text-[10px] text-gray-700 mt-2">PDF, DOC, DOCX, TXT, JPG, PNG</p>
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

      {/* Result modal */}
      <AnimatePresence>
        {modal.open && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#161616] border border-white/10 rounded-xl shadow-2xl max-w-sm w-full p-6 text-center">
              <div className={`w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center ${modal.isError ? 'bg-red-500/15' : 'bg-green-500/15'}`}>
                {modal.isError ? <XCircleIcon className="h-8 w-8 text-red-400" /> : <CheckCircleIcon className="h-8 w-8 text-green-400" />}
              </div>
              <h3 className={`text-lg font-bold mb-2 ${modal.isError ? 'text-red-400' : 'text-green-400'}`}>{modal.title}</h3>
              <p className="text-gray-400 text-sm mb-1">{modal.message}</p>
              {!modal.isError && modal.filesCount > 0 && <p className="text-gray-600 text-xs">{modal.filesCount} file{modal.filesCount > 1 ? 's' : ''} uploaded</p>}
              <button onClick={() => setModal({ open: false, title: '', message: '' })}
                className={`mt-5 w-full py-2.5 rounded-xl font-semibold text-white text-sm transition-colors ${modal.isError ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
                {modal.isError ? 'Try Again' : 'Done'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AssignmentsTab;
