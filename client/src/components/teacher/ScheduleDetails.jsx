import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ENDPOINTS } from '../../config/api';
import { getValidToken, clearAuth, redirectToLogin, setAuthHeaders } from '../../utils/auth';
import { showSuccess, showError, showWarning } from '../../utils/toast';
import {
  CalendarDaysIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  UsersIcon,
  ClockIcon,
  PlusIcon,
  QrCodeIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  BookOpenIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';

const ScheduleDetails = ({ scheduleId, onClose }) => {
  // Constants
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const sessionTypes = [
    { value: 'theory', label: 'Theory', icon: BookOpenIcon, color: 'blue' },
    { value: 'practical', label: 'Practical', icon: ComputerDesktopIcon, color: 'green' },
    { value: 'revision', label: 'Revision', icon: AcademicCapIcon, color: 'purple' },
    { value: 'quiz', label: 'Quiz', icon: DocumentTextIcon, color: 'red' }
  ];

  // State declarations
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [qrToken, setQrToken] = useState('');
  const [showQr, setShowQr] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    notes: '',
    schedule: days.map(day => ({ day, sessions: [] }))
  });

  useEffect(() => {
    if (scheduleId) {
      fetchScheduleDetails();
    }
  }, [scheduleId]);

  const fetchScheduleDetails = async () => {
    try {
      setLoading(true);
      const token = getValidToken();
      
      if (!token) {
        console.error('Authentication token is missing or invalid');
        setLoading(false);
        clearAuth();
        setTimeout(() => {
          redirectToLogin('invalid_token');
        }, 100);
        return;
      }
      
      const response = await fetch(`${API_ENDPOINTS.TEACHER.SCHEDULES}/${scheduleId}`, {
        headers: setAuthHeaders({
          'Content-Type': 'application/json'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSchedule(data.data.schedule);
        
        // Initialize form data
        setFormData({
          title: data.data.schedule.title || '',
          description: data.data.schedule.description || '',
          notes: data.data.schedule.notes || '',
          schedule: data.data.schedule.schedule || days.map(day => ({ day, sessions: [] }))
        });
      } else {
        console.error('Failed to fetch schedule details');
        showError('Failed to fetch schedule details');
      }
    } catch (error) {
      console.error('Error fetching schedule details:', error);
      showError('Error fetching schedule details');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSchedule = async () => {
    try {
      setSaving(true);
      const token = getValidToken();
      
      if (!token) {
        showWarning('Authentication token is missing or invalid. Please log in again.');
        clearAuth();
        redirectToLogin('invalid_token');
        return;
      }
      
      const response = await fetch(`${API_ENDPOINTS.TEACHER.SCHEDULES}/${scheduleId}`, {
        method: 'PUT',
        headers: setAuthHeaders({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          notes: formData.notes,
          schedule: formData.schedule
        })
      });

      if (response.ok) {
        const data = await response.json();
        showSuccess('Schedule updated successfully!');
        setSchedule(data.data.schedule);
        setShowEditModal(false);
      } else {
        const errorData = await response.json();
        showError(errorData.message || 'Failed to update schedule');
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      showError('Error updating schedule');
    } finally {
      setSaving(false);
    }
  };

  const addSession = (dayIndex) => {
    const newSchedule = [...formData.schedule];
    
    // Find the last session of the day to suggest a better start time
    const daySessions = newSchedule[dayIndex].sessions;
    let suggestedStartTime = '09:00';
    let suggestedEndTime = '10:30';
    
    if (daySessions.length > 0) {
      // Get the end time of the last session and add 30 minutes
      const lastSession = daySessions[daySessions.length - 1];
      const lastEndTime = new Date(`2000-01-01T${lastSession.endTime}`);
      const suggestedStart = new Date(lastEndTime.getTime() + 30 * 60000); // Add 30 minutes
      suggestedStartTime = suggestedStart.toTimeString().slice(0, 5);
      
      // Set end time to 1.5 hours after start time
      const suggestedEnd = new Date(suggestedStart.getTime() + 90 * 60000); // Add 1.5 hours
      suggestedEndTime = suggestedEnd.toTimeString().slice(0, 5);
    }
    
    newSchedule[dayIndex].sessions.push({
      startTime: suggestedStartTime,
      endTime: suggestedEndTime,
      type: 'theory',
      topic: '',
      isActive: true
    });
    setFormData({ ...formData, schedule: newSchedule });
  };

  const removeSession = (dayIndex, sessionIndex) => {
    const newSchedule = [...formData.schedule];
    newSchedule[dayIndex].sessions.splice(sessionIndex, 1);
    setFormData({ ...formData, schedule: newSchedule });
  };

  const updateSession = (dayIndex, sessionIndex, field, value) => {
    const newSchedule = [...formData.schedule];
    const session = newSchedule[dayIndex].sessions[sessionIndex];
    
    // Update the field
    session[field] = value;
    
    // If updating start time, ensure end time is after start time
    if (field === 'startTime' && session.endTime) {
      const startTime = new Date(`2000-01-01T${value}`);
      const endTime = new Date(`2000-01-01T${session.endTime}`);
      
      if (endTime <= startTime) {
        // Set end time to 1.5 hours after start time
        const newEndTime = new Date(startTime.getTime() + 90 * 60000);
        session.endTime = newEndTime.toTimeString().slice(0, 5);
      }
    }
    
    // If updating end time, ensure it's after start time
    if (field === 'endTime' && session.startTime) {
      const startTime = new Date(`2000-01-01T${session.startTime}`);
      const endTime = new Date(`2000-01-01T${value}`);
      
      if (endTime <= startTime) {
        // Set end time to 1.5 hours after start time
        const newEndTime = new Date(startTime.getTime() + 90 * 60000);
        session.endTime = newEndTime.toTimeString().slice(0, 5);
        return; // Don't update with invalid time
      }
    }
    
    setFormData({ ...formData, schedule: newSchedule });
  };

  const getSessionTypeConfig = (type) => {
    return sessionTypes.find(t => t.value === type) || sessionTypes[0];
  };

  const viewAttendanceQr = async (dayName, session) => {
    try {
      const url = `${API_ENDPOINTS.SCHEDULE.QR}?day=${encodeURIComponent(dayName)}&start=${encodeURIComponent(session.startTime)}&end=${encodeURIComponent(session.endTime)}`;
      const res = await fetch(url, { headers: setAuthHeaders() });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showError(err.message || 'Failed to get QR');
        return;
      }
      const data = await res.json();
      setQrToken(data?.data?.token || '');
      setShowQr(true);
    } catch (e) {
      showError('Failed to get QR');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-[#2a1a1a] rounded-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CA133E] mx-auto mb-4"></div>
          <p className="text-white">Loading schedule details...</p>
        </div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-[#2a1a1a] rounded-xl p-8 text-center">
          <p className="text-white mb-4">Schedule not found</p>
          <button
            onClick={onClose}
            className="bg-[#CA133E] text-white px-6 py-2 rounded-xl hover:bg-[#A01030] font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 50 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-[#2a1a1a] rounded-xl max-w-6xl w-full max-h-[95vh] overflow-y-auto border border-[#CA133E]/30 mt-4"
      >
        {/* Header */}
        <div className="p-6 border-b border-[#CA133E]/30">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-white">{schedule.title}</h3>
              {schedule.description && (
                <p className="text-gray-400 mt-2">{schedule.description}</p>
              )}
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <UsersIcon className="h-4 w-4" />
                  <span>{schedule.assignedStudents?.length || 0} students assigned</span>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4" />
                  <span>Created {new Date(schedule.createdAt).toLocaleDateString()}</span>
                </div>
                {schedule.startDate && (
                  <div className="flex items-center gap-2">
                    <CalendarDaysIcon className="h-4 w-4" />
                    <span>Starts {new Date(schedule.startDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-2 bg-[#CA133E] text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors font-semibold"
              >
                <PencilIcon className="h-4 w-4" />
                Edit Schedule
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/10"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Schedule Content */}
        <div className="p-6">
          {/* Assigned Students */}
          {schedule.assignedStudents && schedule.assignedStudents.length > 0 && (
            <div className="mb-8 bg-white/5 rounded-xl p-6">
              <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                <UsersIcon className="h-5 w-5 mr-2 text-[#CA133E]" />
                Assigned Students ({schedule.assignedStudents.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {schedule.assignedStudents.map((assignment) => (
                  <div key={assignment.student._id} className="bg-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-semibold">
                          {assignment.student.firstName} {assignment.student.lastName}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {assignment.student.email}
                        </p>
                        {assignment.student.studentInfo?.studentId && (
                          <p className="text-gray-400 text-xs">
                            ID: {assignment.student.studentInfo.studentId}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weekly Schedule */}
          <div className="space-y-6">
            <h4 className="text-lg font-bold text-white flex items-center">
              <CalendarDaysIcon className="h-5 w-5 mr-2 text-[#CA133E]" />
              Weekly Schedule
            </h4>
            
            {schedule.schedule?.map((day, dayIndex) => (
              <div key={day.day} className="border border-white/20 rounded-xl p-6 bg-white/5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <h5 className="text-xl font-bold text-white">{day.day}</h5>
                  <span className="text-sm text-gray-400 bg-white/10 px-3 py-1 rounded-xl">
                    {day.sessions?.length || 0} session{(day.sessions?.length || 0) !== 1 ? 's' : ''}
                  </span>
                </div>

                {(!day.sessions || day.sessions.length === 0) ? (
                  <p className="text-gray-400 text-center py-8">No sessions scheduled</p>
                ) : (
                  <div className="space-y-4">
                    {day.sessions.map((session, sessionIndex) => {
                      const config = getSessionTypeConfig(session.type);
                      return (
                        <div
                          key={sessionIndex}
                          className={`p-4 rounded-xl border-l-4 border-${config.color}-500 bg-${config.color}-900/20`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                <span className="font-bold text-white text-lg">
                                  {session.startTime} - {session.endTime}
                                </span>
                                <span className={`px-3 py-1 rounded-xl text-sm font-bold bg-${config.color}-600 text-white`}>
                                  {config.label}
                                </span>
                              </div>
                              <p className="text-white font-bold mt-2 text-lg">{session.topic}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => viewAttendanceQr(day.day, session)}
                                className="flex items-center space-x-2 px-3 py-2 bg-white/15 text-white rounded-xl hover:bg-white/25 transition-colors text-sm"
                                title="View Attendance QR Code"
                              >
                                <QrCodeIcon className="h-4 w-4" />
                                <span className="hidden sm:inline">QR</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Edit Schedule Modal */}
        <AnimatePresence>
          {showEditModal && (
            <div className="fixed inset-0 bg-black/80 flex items-start justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 50 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="bg-[#2a1a1a] rounded-xl max-w-7xl w-full max-h-[95vh] overflow-y-auto border border-[#CA133E]/30 mt-4"
              >
                <div className="p-6 border-b border-[#CA133E]/30">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">Edit Schedule</h3>
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/10"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-bold text-white mb-2">Schedule Title</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-3 border border-white/20 rounded-xl focus:outline-none focus:border-[#CA133E] transition-colors focus:border-transparent bg-white/10 text-white placeholder-gray-400"
                        placeholder="Schedule Title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-white mb-2">Description</label>
                      <input
                        type="text"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-3 border border-white/20 rounded-xl focus:outline-none focus:border-[#CA133E] transition-colors focus:border-transparent bg-white/10 text-white placeholder-gray-400"
                        placeholder="Schedule Description"
                      />
                    </div>
                  </div>

                  {/* Schedule Builder */}
                  <div className="space-y-6">
                    {formData.schedule.map((day, dayIndex) => (
                      <div key={day.day} className="border border-white/20 rounded-xl p-4 bg-white/5">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                          <h4 className="text-lg font-bold text-white">{day.day}</h4>
                          <button
                            type="button"
                            onClick={() => addSession(dayIndex)}
                            className="flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-colors font-semibold"
                          >
                            <PlusIcon className="h-4 w-4" />
                            <span>Add Session</span>
                          </button>
                        </div>

                        <div className="space-y-3">
                          {day.sessions.map((session, sessionIndex) => (
                            <div key={sessionIndex} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 bg-white/10 rounded-xl">
                              <div>
                                <label className="block text-xs font-bold text-white mb-1">Start Time</label>
                                <input
                                  type="time"
                                  value={session.startTime}
                                  onChange={(e) => updateSession(dayIndex, sessionIndex, 'startTime', e.target.value)}
                                  className="w-full px-3 py-2 border border-white/20 rounded-xl focus:ring-1 focus:ring-[#CA133E] bg-white/10 text-white"
                                  required
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-white mb-1">End Time</label>
                                <input
                                  type="time"
                                  value={session.endTime}
                                  onChange={(e) => updateSession(dayIndex, sessionIndex, 'endTime', e.target.value)}
                                  className="w-full px-3 py-2 border border-white/20 rounded-xl focus:ring-1 focus:ring-[#CA133E] bg-white/10 text-white"
                                  required
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-white mb-1">Type</label>
                                <select
                                  value={session.type}
                                  onChange={(e) => updateSession(dayIndex, sessionIndex, 'type', e.target.value)}
                                  className="w-full px-3 py-2 border border-white/20 rounded-xl focus:ring-1 focus:ring-[#CA133E] bg-white/10 text-white"
                                  required
                                >
                                  {sessionTypes.map(type => (
                                    <option key={type.value} value={type.value} className="bg-[#2a1a1a] text-white">
                                      {type.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-white mb-1">Topic</label>
                                <input
                                  type="text"
                                  value={session.topic}
                                  onChange={(e) => updateSession(dayIndex, sessionIndex, 'topic', e.target.value)}
                                  className="w-full px-3 py-2 border border-white/20 rounded-xl focus:ring-1 focus:ring-[#CA133E] bg-white/10 text-white placeholder-gray-400"
                                  placeholder="Topic"
                                  required
                                />
                              </div>

                              <div className="flex items-end">
                                <button
                                  type="button"
                                  onClick={() => removeSession(dayIndex, sessionIndex)}
                                  className="w-full px-3 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))}

                          {day.sessions.length === 0 && (
                            <p className="text-gray-400 text-center py-6">No sessions for {day.day}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-white/20">
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="px-6 py-3 text-white bg-white/10 rounded-xl hover:bg-white/20 transition-colors font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveSchedule}
                      disabled={saving}
                      className="px-8 py-3 bg-[#CA133E] text-white rounded-xl hover:bg-[#A01030] transition-colors disabled:opacity-50 font-semibold shadow-lg"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* QR Modal */}
        <AnimatePresence>
          {showQr && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#2a1a1a] rounded-xl p-6 border border-white/20 max-w-lg w-full"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white font-bold text-lg">Attendance QR Code</h3>
                  <button onClick={() => setShowQr(false)} className="text-gray-400 hover:text-white">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                {qrToken ? (
                  <div className="space-y-4">
                    <div className="bg-white/5 rounded-xl p-4 flex items-center justify-center">
                      <div className="bg-white p-3 rounded">
                        <div className="w-48 h-48 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-gray-500">QR Code would appear here</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-3 text-black text-xs break-all select-all">{qrToken}</div>
                    <p className="text-gray-400 text-sm">Students can scan this code from their Attendance tab to check in.</p>
                  </div>
                ) : (
                  <p className="text-gray-300">No token</p>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ScheduleDetails;
