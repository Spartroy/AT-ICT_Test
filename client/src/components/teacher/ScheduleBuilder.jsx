import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ENDPOINTS } from '../../config/api';
import {
  CalendarDaysIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  BookOpenIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';

const ScheduleBuilder = () => {
  // Constants first
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const sessionTypes = [
    { value: 'theory', label: 'Theory', icon: BookOpenIcon, color: 'blue' },
    { value: 'practical', label: 'Practical', icon: ComputerDesktopIcon, color: 'green' },
    { value: 'revision', label: 'Revision', icon: AcademicCapIcon, color: 'purple' },
    { value: 'quiz', label: 'Quiz', icon: DocumentTextIcon, color: 'red' }
  ];

  // Helper functions
  function initializeWeekSchedule() {
    return days.map(day => ({
      day,
      sessions: []
    }));
  }

  // State declarations
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: 'Class Schedule',
    notes: '',
    schedule: initializeWeekSchedule()
  });

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('Authentication token is missing');
        setLoading(false);
        // Redirect to login page after a short delay
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
        return;
      }
      
      const response = await fetch(API_ENDPOINTS.TEACHER.SCHEDULE, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSchedule(data.data.schedule);
        setFormData({
          title: data.data.schedule?.title || 'Class Schedule',
          notes: data.data.schedule?.notes || '',
          schedule: data.data.schedule?.schedule || initializeWeekSchedule()
        });
      } else {
        console.error('Failed to fetch schedule');
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSchedule = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('⚠️ Authentication token is missing. Please log in again.');
        // Redirect to login page
        window.location.href = '/login';
        return;
      }
      
      const response = await fetch(API_ENDPOINTS.TEACHER.SCHEDULE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        alert('✅ Schedule saved successfully!');
        setSchedule(data.data.schedule);
        setShowEditModal(false);
      } else {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('❌ Error saving schedule');
    } finally {
      setSaving(false);
    }
  };

  const handleResetSchedule = async () => {
    if (!window.confirm('Are you sure you want to reset the entire schedule? This will remove all sessions.')) return;

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(API_ENDPOINTS.TEACHER.SCHEDULE, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('✅ Schedule reset successfully!');
        await fetchSchedule();
      } else {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error resetting schedule:', error);
      alert('❌ Error resetting schedule');
    } finally {
      setSaving(false);
    }
  };

  const addSession = (dayIndex) => {
    const newSchedule = [...formData.schedule];
    newSchedule[dayIndex].sessions.push({
      startTime: '09:00',
      endTime: '10:30',
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
    newSchedule[dayIndex].sessions[sessionIndex][field] = value;
    setFormData({ ...formData, schedule: newSchedule });
  };

  const getSessionTypeConfig = (type) => {
    return sessionTypes.find(t => t.value === type) || sessionTypes[0];
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-10 bg-gray-300/20 rounded-xl w-64 animate-pulse"></div>
          <div className="h-12 bg-gray-300/20 rounded-xl w-32 animate-pulse"></div>
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white/10 rounded-xl shadow-xl p-8 animate-pulse">
            <div className="h-6 bg-gray-300/20 rounded-xl w-3/4 mb-6"></div>
            <div className="h-24 bg-gray-300/20 rounded-xl"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
        <div className="flex-1">
          <h2 className="text-lg sm:text-xl lg:text-[20pt] font-bold text-white flex items-center">
            <CalendarDaysIcon className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 mr-2 sm:mr-4 text-[#CA133E]" />
            Schedule Builder
          </h2>
          <p className="text-sm lg:text-[14pt] text-gray-300 mt-2">Create and manage the class schedule for all students</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 lg:gap-6">
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center justify-center space-x-2 lg:space-x-3 bg-white text-black px-4 lg:px-6 py-2 lg:py-3 rounded-xl hover:bg-[#4A3D3D] transition-colors font-bold text-sm lg:text-lg shadow-lg"
          >
            <PencilIcon className="h-5 w-5 lg:h-6 lg:w-6" />
            <span>Edit Schedule</span>
          </button>
          
          <button
            onClick={handleResetSchedule}
            disabled={saving}
            className="flex items-center justify-center space-x-2 lg:space-x-3 bg-red-600 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 font-bold text-sm lg:text-lg shadow-lg"
          >
            <TrashIcon className="h-5 w-5 lg:h-6 lg:w-6" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Current Schedule Display */}
      {schedule ? (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 lg:gap-0 mb-6 lg:mb-8">
            <div className="flex-1">
              <h3 className="text-xl lg:text-2xl font-bold text-white">{schedule.title}</h3>
              {schedule.notes && (
                <p className="text-sm lg:text-lg text-gray-300 mt-2">{schedule.notes}</p>
              )}
            </div>
            <div className="text-sm lg:text-base text-gray-300">
              <div className="font-bold">Last updated: {new Date(schedule.updatedAt).toLocaleDateString()}</div>
              {schedule.lastUpdatedBy && (
                <div className="mt-1">
                  by {schedule.lastUpdatedBy.firstName} {schedule.lastUpdatedBy.lastName}
                </div>
              )}
            </div>
          </div>

          {/* Weekly Schedule Grid */}
          <div className="space-y-4 lg:space-y-6">
            {schedule.schedule.map((day, dayIndex) => (
              <div key={day.day} className="border border-white/20 rounded-xl p-4 sm:p-6 bg-white/5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4 lg:mb-6">
                  <h4 className="text-lg lg:text-xl font-bold text-white">{day.day}</h4>
                  <span className="text-sm lg:text-base text-gray-300 bg-white/10 px-3 lg:px-4 py-1 lg:py-2 rounded-xl">
                    {day.sessions.length} session{day.sessions.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {day.sessions.length === 0 ? (
                  <p className="text-gray-400 text-center py-6 lg:py-8 text-base lg:text-lg">No sessions scheduled</p>
                ) : (
                  <div className="space-y-3 lg:space-y-4">
                    {day.sessions.map((session, sessionIndex) => {
                      const config = getSessionTypeConfig(session.type);
                      return (
                        <div
                          key={sessionIndex}
                          className={`p-4 sm:p-6 rounded-xl border-l-4 border-${config.color}-500 bg-${config.color}-900/20 backdrop-blur-sm`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                            <div className="flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                <span className="font-bold text-white text-base lg:text-lg">
                                  {session.startTime} - {session.endTime}
                                </span>
                                <span className={`px-3 lg:px-4 py-1 lg:py-2 rounded-xl text-sm lg:text-base font-bold bg-${config.color}-600 text-white`}>
                                  {config.label}
                                </span>
                              </div>
                              <p className="text-white font-bold mt-2 text-base sm:text-lg lg:text-xl">{session.topic}</p>
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
      ) : (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl shadow-xl p-8 sm:p-12 lg:p-16 text-center border border-white/20">
          <CalendarDaysIcon className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4 lg:mb-6" />
          <h3 className="text-xl lg:text-2xl font-bold text-white mb-3 lg:mb-4">No Schedule Created</h3>
          <p className="text-sm lg:text-lg text-gray-300 mb-4 lg:mb-6">Create your first class schedule to get started.</p>
          <button
            onClick={() => setShowEditModal(true)}
            className="bg-[#CA133E] text-white px-4 lg:px-6 py-2 lg:py-3 rounded-xl hover:bg-[#A01030] font-bold text-sm lg:text-lg shadow-lg"
          >
            Create Schedule
          </button>
        </div>
      )}

      {/* Edit Schedule Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-start justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 50 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-[#2a1a1a] rounded-xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-y-auto border border-[#CA133E]/30 mt-4 lg:mt-8"
            >
              <div className="p-4 sm:p-6 border-b border-[#CA133E]/30">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                    Edit Class Schedule
                  </h3>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/10 self-end sm:self-auto"
                  >
                    <XMarkIcon className="h-6 w-6 sm:h-8 sm:w-8" />
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm sm:text-base lg:text-lg font-bold text-white mb-2">Schedule Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-white/20 rounded-xl focus:ring-2 focus:ring-[#CA133E] focus:border-transparent bg-white/10 text-white placeholder-gray-400 text-sm sm:text-base lg:text-lg"
                      placeholder="Class Schedule"
                    />
                  </div>

                  <div>
                    <label className="block text-sm sm:text-base lg:text-lg font-bold text-white mb-2">Notes (Optional)</label>
                    <input
                      type="text"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-white/20 rounded-xl focus:ring-2 focus:ring-[#CA133E] focus:border-transparent bg-white/10 text-white placeholder-gray-400 text-sm sm:text-base lg:text-lg"
                      placeholder="Additional notes about the schedule"
                    />
                  </div>
                </div>

                {/* Schedule Builder */}
                <div className="space-y-4 lg:space-y-6">
                  {formData.schedule.map((day, dayIndex) => (
                    <div key={day.day} className="border border-white/20 rounded-xl p-3 sm:p-4 bg-white/5">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4">
                        <h4 className="text-base sm:text-lg lg:text-xl font-bold text-white">{day.day}</h4>
                        <button
                          type="button"
                          onClick={() => addSession(dayIndex)}
                          className="flex items-center justify-center space-x-2 bg-green-600 text-white px-3 sm:px-4 py-2 rounded-xl hover:bg-green-700 transition-colors font-bold text-sm sm:text-base"
                        >
                          <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span>Add Session</span>
                        </button>
                      </div>

                      <div className="space-y-3">
                        {day.sessions.map((session, sessionIndex) => (
                          <div key={sessionIndex} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-3 bg-white/10 rounded-xl">
                            <div>
                              <label className="block text-xs sm:text-sm font-bold text-white mb-1">Start Time</label>
                              <input
                                type="time"
                                value={session.startTime}
                                onChange={(e) => updateSession(dayIndex, sessionIndex, 'startTime', e.target.value)}
                                className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-white/20 rounded-xl focus:ring-1 focus:ring-[#CA133E] bg-white/10 text-white text-sm sm:text-base"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-xs sm:text-sm font-bold text-white mb-1">End Time</label>
                              <input
                                type="time"
                                value={session.endTime}
                                onChange={(e) => updateSession(dayIndex, sessionIndex, 'endTime', e.target.value)}
                                className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-white/20 rounded-xl focus:ring-1 focus:ring-[#CA133E] bg-white/10 text-white text-sm sm:text-base"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-xs sm:text-sm font-bold text-white mb-1">Type</label>
                              <select
                                value={session.type}
                                onChange={(e) => updateSession(dayIndex, sessionIndex, 'type', e.target.value)}
                                className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-white/20 rounded-xl focus:ring-1 focus:ring-[#CA133E] bg-white/10 text-white text-sm sm:text-base"
                                required
                              >
                                {sessionTypes.map(type => (
                                  <option key={type.value} value={type.value} className="bg-[#2a1a1a] text-white">{type.label}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs sm:text-sm font-bold text-white mb-1">Topic</label>
                              <input
                                type="text"
                                value={session.topic}
                                onChange={(e) => updateSession(dayIndex, sessionIndex, 'topic', e.target.value)}
                                className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-white/20 rounded-xl focus:ring-1 focus:ring-[#CA133E] bg-white/10 text-white placeholder-gray-400 text-sm sm:text-base"
                                placeholder="Topic"
                                required
                              />
                            </div>

                            <div className="flex items-end">
                              <button
                                type="button"
                                onClick={() => removeSession(dayIndex, sessionIndex)}
                                className="w-full px-2 sm:px-3 py-1 sm:py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-bold text-sm sm:text-base"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}

                        {day.sessions.length === 0 && (
                          <p className="text-gray-400 text-center py-4 lg:py-6 text-sm lg:text-lg">No sessions for {day.day}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/20">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="w-full sm:w-auto px-4 lg:px-6 py-2 lg:py-3 text-white bg-white/10 rounded-xl hover:bg-white/20 transition-colors font-bold text-sm lg:text-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSchedule}
                    disabled={saving}
                    className="w-full sm:w-auto px-6 lg:px-8 py-2 lg:py-3 bg-[#CA133E] text-white rounded-xl hover:bg-[#A01030] transition-colors disabled:opacity-50 font-bold text-sm lg:text-lg shadow-lg"
                  >
                    {saving ? 'Saving...' : 'Save Schedule'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ScheduleBuilder; 