import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ENDPOINTS } from '../../config/api';
import { showSuccess, showError } from '../../utils/toast';
import {
  UserIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  XMarkIcon,
  PhoneIcon,
  EnvelopeIcon,
  XCircleIcon,
  PaperClipIcon,
  CalendarIcon,
  ChartBarIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

// ─── Registration Action Modal ──────────────────────────────────────────────
const RegistrationActionModal = ({ activity, onClose, onApproved, onRejected }) => {
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchRegistration();
  }, []);

  const fetchRegistration = async () => {
    try {
      const token = localStorage.getItem('token');
      // The activity's relatedItem is the User _id — use the teacher/students endpoint
      const studentId = activity.student?._id || activity.student || activity.relatedItem;
      if (!studentId) { setLoading(false); return; }

      const response = await fetch(`${API_ENDPOINTS.TEACHER.STUDENTS}/${studentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const user = data.data?.student;
        if (user) {
          // Map teacher/students response → registration shape
          setRegistration({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            contactNumber: user.contactNumber,
            parentNumber: user.studentInfo?.parentContactNumber,
            year: user.studentInfo?.year,
            nationality: user.studentInfo?.nationality,
            city: user.address?.city,
            school: user.studentInfo?.school,
            session: user.studentInfo?.session,
            isRetaker: user.studentInfo?.isRetaker,
            techKnowledge: user.studentInfo?.techKnowledge,
            englishLevel: user.studentInfo?.englishLevel,
            schoolType: user.studentInfo?.schoolType,
            royalClass: user.studentInfo?.royalClass,
            royalNationality: user.studentInfo?.royalNationality,
            status: user.registrationStatus,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching registration:', error);
    } finally {
      setLoading(false);
    }
  };

  const registrationId = activity.student?._id || activity.student || activity.relatedItem;

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.REGISTRATION.BASE}/${registrationId}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ feeAmount: 499, notes: 'Registration approved by teacher' })
      });
      if (response.ok) {
        showSuccess('Registration approved successfully!');
        if (onApproved) onApproved();
        onClose();
      } else {
        const err = await response.json();
        showError(err.message || 'Failed to approve registration');
      }
    } catch {
      showError('Network error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim() || rejectReason.trim().length < 5) {
      showError('Please provide a reason (at least 5 characters)');
      return;
    }
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.REGISTRATION.BASE}/${registrationId}/reject`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason })
      });
      if (response.ok) {
        showSuccess('Registration rejected.');
        if (onRejected) onRejected();
        onClose();
      } else {
        const err = await response.json();
        showError(err.message || 'Failed to reject registration');
      }
    } catch {
      showError('Network error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const isPending = registration?.status === 'pending';
  const statusLabel = registration?.status === 'approved'
    ? { text: 'Approved', cls: 'bg-green-500/20 text-green-300 border-green-500/30' }
    : registration?.status === 'rejected'
    ? { text: 'Rejected', cls: 'bg-red-500/20 text-red-300 border-red-500/30' }
    : null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gray-900/95 border border-gray-700 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
              <UserIcon className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Student Application</h3>
              <p className="text-sm text-gray-400">Review and decide on this registration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-700/50 rounded-xl" />)}
            </div>
          ) : registration ? (
            <>
              {/* Identity */}
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center ring-2 ring-orange-500/30 flex-shrink-0">
                  <span className="text-white font-bold text-xl">
                    {registration.firstName?.[0]}{registration.lastName?.[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xl font-bold text-white">
                      {registration.firstName} {registration.lastName}
                    </h4>
                    {statusLabel && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${statusLabel.cls}`}>
                        {statusLabel.text}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm mt-0.5">{registration.email}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                    registration.schoolType === 'royal'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                      : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                  }`}>
                    {registration.schoolType === 'royal' ? '🏫 Royal College' : '🎓 Center Student'}
                  </span>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Year / Class', value: registration.year ? `Year ${registration.year}` : (registration.royalClass || 'N/A') },
                  { label: 'Nationality', value: registration.nationality || registration.royalNationality || 'N/A' },
                  { label: 'City', value: registration.city || 'N/A' },
                  { label: 'School', value: registration.school || 'N/A' },
                  { label: 'Session', value: registration.session || 'N/A' },
                  { label: 'Retaker', value: registration.isRetaker ? 'Yes' : 'No' },
                  { label: 'Tech Knowledge', value: registration.techKnowledge != null ? `${registration.techKnowledge}/10` : 'N/A' },
                  { label: 'English Level', value: registration.englishLevel != null ? `${registration.englishLevel}/10` : 'N/A' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-800/60 rounded-xl p-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
                    <p className="text-sm font-semibold text-white">{value}</p>
                  </div>
                ))}
              </div>

              {/* Contact */}
              <div className="bg-gray-800/60 rounded-xl p-4 space-y-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Contact Information</p>
                <div className="flex items-center space-x-3">
                  <EnvelopeIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="text-white text-sm">{registration.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <PhoneIcon className="h-4 w-4 text-blue-400 flex-shrink-0" />
                  <span className="text-white text-sm">{registration.contactNumber} <span className="text-gray-500">(Student)</span></span>
                </div>
                {registration.parentNumber && (
                  <div className="flex items-center space-x-3">
                    <PhoneIcon className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <span className="text-white text-sm">{registration.parentNumber} <span className="text-gray-500">(Parent)</span></span>
                  </div>
                )}
              </div>

              {/* Reject form */}
              {showRejectForm && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-semibold text-red-400">Rejection Reason</p>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Provide a reason for rejection (minimum 5 characters)..."
                    className="w-full bg-gray-800 border border-gray-600 text-white placeholder-gray-500 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500 resize-none h-24"
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <UserIcon className="h-12 w-12 mx-auto mb-3 text-gray-600" />
              <p className="font-medium text-white">
                {activity.student ? `${activity.student.firstName} ${activity.student.lastName}` : 'Unknown Student'}
              </p>
              <p className="text-sm mt-1">{activity.description}</p>
              <p className="text-xs text-gray-500 mt-2">Could not load full registration details.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-700 flex items-center justify-end space-x-3">
          {showRejectForm ? (
            <>
              <button
                onClick={() => setShowRejectForm(false)}
                className="px-4 py-2 text-gray-300 bg-gray-700/80 rounded-xl hover:bg-gray-700 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors font-semibold text-sm flex items-center space-x-2 disabled:opacity-50"
              >
                <XCircleIcon className="h-4 w-4" />
                <span>{actionLoading ? 'Rejecting...' : 'Confirm Reject'}</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-300 bg-gray-700/80 rounded-xl hover:bg-gray-700 transition-colors text-sm"
              >
                Close
              </button>
              {isPending && (
                <>
                  <button
                    onClick={() => setShowRejectForm(true)}
                    className="px-5 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-xl transition-colors font-semibold text-sm flex items-center space-x-2"
                  >
                    <XCircleIcon className="h-4 w-4" />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors font-semibold text-sm flex items-center space-x-2 disabled:opacity-50"
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    <span>{actionLoading ? 'Approving...' : 'Approve'}</span>
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// ─── Submission Modal (Assignment & Quiz) ────────────────────────────────────
const SubmissionModal = ({ activity, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingFile, setDownloadingFile] = useState(null);

  const isQuiz = activity.type === 'quiz_submission';
  const student = activity.student;
  const isLate = activity.metadata?.isLate;
  const attachmentsCount = activity.metadata?.attachmentsCount || 0;

  useEffect(() => {
    fetchSubmissionData();
  }, []);

  const fetchSubmissionData = async () => {
    try {
      const token = localStorage.getItem('token');
      const itemId = activity.relatedItem;
      const studentId = student?._id || student;

      if (!itemId || !studentId) { setLoading(false); return; }

      if (isQuiz) {
        const response = await fetch(`${API_ENDPOINTS.QUIZZES}/${itemId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const result = await response.json();
          const quiz = result.data?.quiz || result.data;
          const submission = quiz?.assignedTo?.find(
            s => (s.student?._id || s.student)?.toString() === studentId?.toString()
          );
          setData({ item: quiz, submission });
        }
      } else {
        const response = await fetch(`${API_ENDPOINTS.ASSIGNMENTS}/${itemId}/submissions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const result = await response.json();
          const submissions = result.data?.submissions || [];
          const submission = submissions.find(
            s => (s.student?._id || s.student)?.toString() === studentId?.toString()
          );
          setData({ item: result.data?.assignment, submission });
        }
      }
    } catch (error) {
      console.error('Error fetching submission data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (filename) => {
    setDownloadingFile(filename);
    try {
      const token = localStorage.getItem('token');
      const assignmentId = activity.relatedItem;
      const studentId = student?._id || student;
      const url = `${API_ENDPOINTS.ASSIGNMENTS}/${assignmentId}/submissions/${studentId}/download/${encodeURIComponent(filename)}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        showError('Failed to download file');
        return;
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch {
      showError('Failed to download file');
    } finally {
      setDownloadingFile(null);
    }
  };

  const accentColor = isQuiz ? 'purple' : 'blue';
  const Icon = isQuiz ? QuestionMarkCircleIcon : DocumentTextIcon;
  const title = isQuiz ? 'Quiz Submission' : 'Assignment Submission';

  const attachments = data?.submission?.submission?.attachments || [];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gray-900/95 border border-gray-700 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
              isQuiz ? 'bg-purple-500/20 border-purple-500/30' : 'bg-blue-500/20 border-blue-500/30'
            }`}>
              <Icon className={`h-5 w-5 ${isQuiz ? 'text-purple-400' : 'text-blue-400'}`} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{title}</h3>
              <p className="text-sm text-gray-400">
                {student ? `${student.firstName} ${student.lastName}` : 'Unknown Student'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Student Card */}
          <div className="flex items-center space-x-4 bg-gray-800/60 rounded-xl p-4">
            <div className={`h-14 w-14 rounded-xl flex items-center justify-center ring-2 flex-shrink-0 ${
              isQuiz
                ? 'bg-gradient-to-br from-purple-500 to-purple-700 ring-purple-500/30'
                : 'bg-gradient-to-br from-blue-500 to-blue-700 ring-blue-500/30'
            }`}>
              {student?.profileImage ? (
                <img src={student.profileImage} alt="Profile" className="h-full w-full rounded-xl object-cover" />
              ) : (
                <span className="text-white font-bold text-lg">
                  {student?.firstName?.[0]}{student?.lastName?.[0]}
                </span>
              )}
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">
                {student ? `${student.firstName} ${student.lastName}` : 'Unknown Student'}
              </h4>
              <p className="text-gray-400 text-sm">{student?.email}</p>
            </div>
          </div>

          {/* Metadata Badges */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-800/60 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Status</p>
              <p className={`text-sm font-bold ${isLate ? 'text-red-400' : 'text-green-400'}`}>
                {isLate ? '⚠️ Late' : '✓ On Time'}
              </p>
            </div>
            <div className="bg-gray-800/60 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                {isQuiz ? 'Questions' : 'Attachments'}
              </p>
              <p className={`text-sm font-bold ${isQuiz ? 'text-purple-400' : 'text-blue-400'}`}>
                {isQuiz ? (data?.item?.questions?.length ?? '—') : `${attachmentsCount} file(s)`}
              </p>
            </div>
            <div className="bg-gray-800/60 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Submitted</p>
              <p className="text-sm font-bold text-white">
                {new Date(activity.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Activity description */}
          <div className={`rounded-xl p-4 border ${
            isQuiz ? 'bg-purple-500/10 border-purple-500/20' : 'bg-blue-500/10 border-blue-500/20'
          }`}>
            <p className={`text-sm ${isQuiz ? 'text-purple-200' : 'text-blue-200'}`}>{activity.description}</p>
          </div>

          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-32 bg-gray-700/50 rounded-xl" />
            </div>
          ) : data?.item ? (
            <>
              {/* Assignment / Quiz details */}
              <div className="bg-gray-800/60 rounded-xl p-4 space-y-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                  {isQuiz ? 'Quiz Details' : 'Assignment Details'}
                </p>
                <p className="text-xl font-bold text-white">{data.item.title}</p>
                {data.item.description && (
                  <p className="text-sm text-gray-400">{data.item.description}</p>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                  {!isQuiz && data.item.dueDate && (
                    <div className="flex items-start space-x-2">
                      <CalendarIcon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Due Date</p>
                        <p className="text-sm text-white font-medium">
                          {new Date(data.item.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                  {data.item.maxScore !== undefined && (
                    <div className="flex items-start space-x-2">
                      <ChartBarIcon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Max Score</p>
                        <p className="text-sm text-white font-medium">{data.item.maxScore}</p>
                      </div>
                    </div>
                  )}
                  {!isQuiz && data.item.type && (
                    <div className="flex items-start space-x-2">
                      <DocumentTextIcon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Type</p>
                        <p className="text-sm text-white font-medium capitalize">{data.item.type}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Student result */}
                {data.submission && (
                  <div className="pt-3 border-t border-gray-700 space-y-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Student's Result</p>
                    {data.submission.score !== undefined && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-300">Score:</span>
                        <span className="text-lg font-bold text-green-400">
                          {data.submission.score}
                          {data.item.maxScore ? `/${data.item.maxScore}` : ''}
                        </span>
                      </div>
                    )}
                    {data.submission.feedback && (
                      <p className="text-sm text-gray-400 italic">"{data.submission.feedback}"</p>
                    )}
                    {data.submission.submissionDate && (
                      <p className="text-xs text-gray-500">
                        Submitted: {new Date(data.submission.submissionDate).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Attachments */}
              {!isQuiz && attachments.length > 0 && (
                <div className="bg-gray-800/60 rounded-xl p-4 space-y-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold flex items-center gap-2">
                    <PaperClipIcon className="h-4 w-4" />
                    Submitted Files ({attachments.length})
                  </p>
                  <div className="space-y-2">
                    {attachments.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-gray-900/60 rounded-xl px-4 py-3 border border-gray-700/50"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <PaperClipIcon className="h-4 w-4 text-blue-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm text-white truncate font-medium">
                              {file.originalName || file.filename}
                            </p>
                            {file.size && (
                              <p className="text-xs text-gray-500">
                                {(file.size / 1024).toFixed(1)} KB
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownload(file.filename)}
                          disabled={downloadingFile === file.filename}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg text-xs font-semibold border border-blue-500/30 transition-all disabled:opacity-50 flex-shrink-0 ml-3"
                        >
                          <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                          <span>{downloadingFile === file.filename ? 'Downloading...' : 'Download'}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-gray-300 bg-gray-700/80 rounded-xl hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Activity action button (type-specific) ──────────────────────────────────
const ActivityActionButton = ({ activity, onOpenRegistration, onOpenSubmission }) => {
  if (activity.type === 'registration') {
    // Only show Review for pending registrations
    // metadata.registrationStatus is set by backend; undefined = old activity (show anyway)
    const status = activity.metadata?.registrationStatus;
    if (status === 'approved' || status === 'rejected') return null;

    return (
      <button
        onClick={(e) => { e.stopPropagation(); onOpenRegistration(activity); }}
        className="flex-shrink-0 flex items-center space-x-1.5 px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 hover:text-orange-200 rounded-lg transition-all text-xs font-semibold border border-orange-500/30 hover:border-orange-500/50"
        title="Review application"
      >
        <UserIcon className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Review</span>
      </button>
    );
  }

  if (activity.type === 'assignment_submission' || activity.type === 'quiz_submission') {
    const isQuiz = activity.type === 'quiz_submission';
    return (
      <button
        onClick={(e) => { e.stopPropagation(); onOpenSubmission(activity); }}
        className={`flex-shrink-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all text-xs font-semibold border ${
          isQuiz
            ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 hover:text-purple-200 border-purple-500/30'
            : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 hover:text-blue-200 border-blue-500/30'
        }`}
        title={isQuiz ? 'View quiz submission' : 'View assignment submission'}
      >
        <EyeIcon className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">View</span>
      </button>
    );
  }

  return null;
};

// ─── Main Component ──────────────────────────────────────────────────────────
const RecentActivities = ({ onStudentClick, onRegistrationUpdate }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const [registrationModal, setRegistrationModal] = useState(null);
  const [submissionModal, setSubmissionModal] = useState(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.TEACHER.ACTIVITIES, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setActivities(data.data.activities || []);
        setUnreadCount(data.data.unreadCount || 0);
      } else {
        setActivities([]);
        setUnreadCount(0);
      }
    } catch {
      setActivities([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (activityIds) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.TEACHER.ACTIVITIES}/mark-read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityIds })
      });
      if (response.ok) {
        setActivities(prev =>
          prev.map(a => activityIds.includes(a._id) ? { ...a, isRead: true } : a)
        );
        setUnreadCount(prev => Math.max(0, prev - activityIds.length));
        showSuccess('Activities marked as read');
      }
    } catch {
      showError('Failed to mark activities as read');
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'registration':          return <UserIcon className="h-5 w-5" />;
      case 'assignment_submission': return <DocumentTextIcon className="h-5 w-5" />;
      case 'quiz_submission':       return <QuestionMarkCircleIcon className="h-5 w-5" />;
      case 'message':               return <ChatBubbleLeftRightIcon className="h-5 w-5" />;
      default:                      return <ClockIcon className="h-5 w-5" />;
    }
  };

  const getActivityColor = (type, priority) => {
    if (priority === 'urgent') return 'text-red-400 bg-red-500/20 border-red-500/30';
    if (priority === 'high')   return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
    if (priority === 'medium') return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((Date.now() - date) / 60000);
    if (diffInMinutes < 1)  return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const h = Math.floor(diffInMinutes / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7)  return `${d}d ago`;
    return date.toLocaleDateString();
  };

  const getStudentInitials = (student) => {
    if (!student) return '?';
    return `${student.firstName?.[0] || ''}${student.lastName?.[0] || ''}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl shadow-xl p-6 lg:p-8 border border-white/20">
        <h3 className="text-xl lg:text-2xl font-bold text-white mb-6">Recent Activity</h3>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-3 animate-pulse">
              <div className="h-10 w-10 rounded-xl bg-gray-300/20" />
              <div className="flex-1">
                <div className="h-4 bg-gray-300/20 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-300/20 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white/10 backdrop-blur-sm rounded-xl shadow-xl p-6 lg:p-8 border border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 lg:mb-8">
          <h3 className="text-xl lg:text-2xl font-bold text-white">Recent Activity</h3>
          {unreadCount > 0 && (
            <div className="flex items-center space-x-3">
              <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                {unreadCount} unread
              </span>
              <button
                onClick={() => {
                  const ids = activities.filter(a => !a.isRead).map(a => a._id);
                  if (ids.length > 0) markAsRead(ids);
                }}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
              >
                Mark all as read
              </button>
            </div>
          )}
        </div>

        {/* List */}
        <div className="space-y-3 lg:space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <ClockIcon className="h-12 w-12 mx-auto mb-4 text-gray-600" />
              <p className="text-lg font-medium">No recent activities</p>
              <p className="text-sm">Student activities will appear here</p>
            </div>
          ) : (
            activities.map((activity, index) => (
              <motion.div
                key={activity._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-3 lg:gap-4 p-3 lg:p-4 rounded-xl transition-all duration-300 hover:bg-white/10 ${
                  !activity.isRead ? 'bg-blue-500/10 border border-blue-500/20' : ''
                }`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className={`h-10 w-10 lg:h-12 lg:w-12 rounded-xl flex items-center justify-center border ${getActivityColor(activity.type, activity.priority)}`}>
                    {activity.student?.profileImage ? (
                      <img
                        src={activity.student.profileImage}
                        alt="Profile"
                        className="h-8 w-8 lg:h-10 lg:w-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm lg:text-base font-bold">
                        {getStudentInitials(activity.student)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm lg:text-base text-white truncate">{activity.description}</p>
                    {!activity.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs text-gray-400">{formatTimeAgo(activity.createdAt)}</span>
                    <div className="flex items-center gap-1 text-gray-500">
                      {getActivityIcon(activity.type)}
                      <span className="text-xs capitalize">{activity.type.replace(/_/g, ' ')}</span>
                    </div>
                    {activity.priority === 'urgent' && (
                      <ExclamationTriangleIcon className="h-4 w-4 text-red-400 flex-shrink-0" />
                    )}
                  </div>
                  {activity.metadata && (activity.metadata.isLate || activity.metadata.attachmentsCount > 0) && (
                    <div className="mt-1.5 flex items-center gap-3 flex-wrap">
                      {activity.metadata.isLate && (
                        <span className="text-xs text-red-400">⚠️ Late submission</span>
                      )}
                      {activity.metadata.attachmentsCount > 0 && (
                        <span className="text-xs text-blue-400 flex items-center gap-1">
                          <PaperClipIcon className="h-3 w-3" />
                          {activity.metadata.attachmentsCount} attachment(s)
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <ActivityActionButton
                    activity={activity}
                    onOpenRegistration={setRegistrationModal}
                    onOpenSubmission={setSubmissionModal}
                  />
                  {!activity.isRead && (
                    <button
                      onClick={(e) => { e.stopPropagation(); markAsRead([activity._id]); }}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-blue-400 transition-colors"
                      title="Mark as read"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {registrationModal && (
          <RegistrationActionModal
            key="reg-modal"
            activity={registrationModal}
            onClose={() => setRegistrationModal(null)}
            onApproved={() => {
              // Optimistically hide the Review button for this activity
              setActivities(prev => prev.map(a =>
                a._id === registrationModal._id
                  ? { ...a, metadata: { ...a.metadata, registrationStatus: 'approved' } }
                  : a
              ));
              fetchActivities();
              if (onRegistrationUpdate) onRegistrationUpdate();
            }}
            onRejected={() => {
              setActivities(prev => prev.map(a =>
                a._id === registrationModal._id
                  ? { ...a, metadata: { ...a.metadata, registrationStatus: 'rejected' } }
                  : a
              ));
              fetchActivities();
              if (onRegistrationUpdate) onRegistrationUpdate();
            }}
          />
        )}
        {submissionModal && (
          <SubmissionModal
            key="sub-modal"
            activity={submissionModal}
            onClose={() => setSubmissionModal(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default RecentActivities;
