import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ENDPOINTS } from '../../config/api';
import { getValidToken, clearAuth, redirectToLogin, setAuthHeaders } from '../../utils/auth';
import { showSuccess, showError, showWarning } from '../../utils/toast';
import ScheduleDetails from './ScheduleDetails';
import {
  CalendarDaysIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  UsersIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  ClockIcon,
  ChevronRightIcon,
  EyeIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';

const ScheduleManager = () => {
  // State declarations
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [students, setStudents] = useState({});
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', '9H', '9J', 'custom'
  const [showScheduleDetails, setShowScheduleDetails] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState(null);

  // Form data for creating new schedule
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduleType: 'main',
    targetStudentGroups: [],
    startDate: '',
    endDate: '',
    notes: ''
  });

  const scheduleTypes = [
    { value: 'main', label: 'Main Schedule', color: 'blue' },
    { value: 'special', label: 'Special Schedule', color: 'purple' },
    { value: 'remedial', label: 'Remedial Schedule', color: 'orange' },
    { value: 'advanced', label: 'Advanced Schedule', color: 'green' }
  ];

  const studentGroups = [
    { value: '9H', label: 'Royal College 9H', icon: AcademicCapIcon, color: 'red' },
    { value: '9J', label: 'Royal College 9J', icon: AcademicCapIcon, color: 'blue' },
    { value: 'custom', label: 'Center/Other Schools', icon: BuildingOfficeIcon, color: 'green' }
  ];

  useEffect(() => {
    fetchSchedules();
    fetchStudentsByClassification();
  }, []);

  const fetchSchedules = async () => {
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
      
      const response = await fetch(API_ENDPOINTS.TEACHER.SCHEDULES, {
        headers: setAuthHeaders({
          'Content-Type': 'application/json'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSchedules(data.data.schedules || []);
      } else {
        console.error('Failed to fetch schedules');
        showError('Failed to fetch schedules');
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
      showError('Error fetching schedules');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsByClassification = async () => {
    try {
      const token = getValidToken();
      
      if (!token) {
        console.error('Authentication token is missing or invalid');
        return;
      }
      
      const response = await fetch(API_ENDPOINTS.TEACHER.SCHEDULES_STUDENTS, {
        headers: setAuthHeaders({
          'Content-Type': 'application/json'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setStudents(data.data.students || {});
      } else {
        console.error('Failed to fetch student classifications');
      }
    } catch (error) {
      console.error('Error fetching student classifications:', error);
    }
  };

  const handleCreateSchedule = async () => {
    try {
      setSaving(true);
      const token = getValidToken();
      
      if (!token) {
        showWarning('Authentication token is missing or invalid. Please log in again.');
        clearAuth();
        redirectToLogin('invalid_token');
        return;
      }
      
      if (!formData.title.trim()) {
        showError('Schedule title is required');
        return;
      }

      const response = await fetch(API_ENDPOINTS.TEACHER.SCHEDULES, {
        method: 'POST',
        headers: setAuthHeaders({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        showSuccess('Schedule created successfully!');
        setShowCreateModal(false);
        setFormData({
          title: '',
          description: '',
          scheduleType: 'main',
          targetStudentGroups: [],
          startDate: '',
          endDate: '',
          notes: ''
        });
        await fetchSchedules();
      } else {
        const errorData = await response.json();
        showError(errorData.message || 'Failed to create schedule');
      }
    } catch (error) {
      console.error('Error creating schedule:', error);
      showError('Error creating schedule');
    } finally {
      setSaving(false);
    }
  };

  const handleAssignStudents = async () => {
    try {
      setSaving(true);
      const token = getValidToken();
      
      if (!token) {
        showWarning('Authentication token is missing or invalid. Please log in again.');
        clearAuth();
        redirectToLogin('invalid_token');
        return;
      }
      
      if (selectedStudents.length === 0) {
        showError('Please select at least one student');
        return;
      }

      const response = await fetch(`${API_ENDPOINTS.TEACHER.SCHEDULES}/${selectedSchedule._id}/assign-students`, {
        method: 'POST',
        headers: setAuthHeaders({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({ 
          studentIds: selectedStudents,
          groupType: activeTab
        })
      });

      if (response.ok) {
        const data = await response.json();
        showSuccess(data.message);
        setShowAssignModal(false);
        setSelectedStudents([]);
        await fetchSchedules();
      } else {
        const errorData = await response.json();
        showError(errorData.message || 'Failed to assign students');
      }
    } catch (error) {
      console.error('Error assigning students:', error);
      showError('Error assigning students');
    } finally {
      setSaving(false);
    }
  };

  const getScheduleTypeConfig = (type) => {
    return scheduleTypes.find(t => t.value === type) || scheduleTypes[0];
  };

  const getStudentGroupConfig = (group) => {
    return studentGroups.find(g => g.value === group) || studentGroups[0];
  };

  const filteredSchedules = schedules.filter(schedule => {
    if (activeTab === 'all') return true;
    return schedule.targetStudentGroups.some(group => group.groupType === activeTab);
  });

  const getStudentCount = (schedule) => {
    return schedule.assignedStudents ? schedule.assignedStudents.length : 0;
  };

  const getStudentGroupCount = (groupType) => {
    return students[groupType] ? students[groupType].length : 0;
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
            Schedule Manager
          </h2>
          <p className="text-sm lg:text-[14pt] text-gray-300 mt-2">Create and manage multiple schedules for different student groups</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center space-x-2 lg:space-x-3 bg-[#CA133E] text-white px-4 lg:px-6 py-2 lg:py-3 rounded-xl hover:bg-[#A01030] transition-colors font-bold text-sm lg:text-lg shadow-lg"
        >
          <PlusIcon className="h-5 w-5 lg:h-6 lg:w-6" />
          <span>Create Schedule</span>
        </button>
      </div>

      {/* Student Classification Summary */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <UsersIcon className="h-6 w-6 mr-2 text-[#CA133E]" />
          Student Classifications
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {studentGroups.map((group) => {
            const count = getStudentGroupCount(group.value);
            const Icon = group.icon;
            return (
              <div key={group.value} className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-xl bg-${group.color}-600/20`}>
                      <Icon className={`h-6 w-6 text-${group.color}-400`} />
                    </div>
                    <div>
                      <p className="text-white font-semibold">{group.label}</p>
                      <p className="text-gray-300 text-sm">{count} students</p>
                    </div>
                  </div>
                  <div className={`text-2xl font-bold text-${group.color}-400`}>
                    {count}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Schedule Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: 'all', label: 'All Schedules', count: schedules.length },
          { value: '9H', label: '9H Schedules', count: schedules.filter(s => s.targetStudentGroups.some(g => g.groupType === '9H')).length },
          { value: '9J', label: '9J Schedules', count: schedules.filter(s => s.targetStudentGroups.some(g => g.groupType === '9J')).length },
          { value: 'custom', label: 'Custom Schedules', count: schedules.filter(s => s.targetStudentGroups.some(g => g.groupType === 'custom')).length }
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 rounded-xl font-semibold transition-colors ${
              activeTab === tab.value
                ? 'bg-[#CA133E] text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Schedules List */}
      <div className="space-y-4">
        {filteredSchedules.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl shadow-xl p-12 text-center border border-white/20">
            <CalendarDaysIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Schedules Found</h3>
            <p className="text-gray-300 mb-6">
              {activeTab === 'all' 
                ? 'Create your first schedule to get started.'
                : `No schedules found for ${activeTab} students.`
              }
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-[#CA133E] text-white px-6 py-3 rounded-xl hover:bg-[#A01030] font-bold shadow-lg"
            >
              Create Schedule
            </button>
          </div>
        ) : (
          filteredSchedules.map((schedule) => {
            const typeConfig = getScheduleTypeConfig(schedule.scheduleType);
            const studentCount = getStudentCount(schedule);
            
            return (
              <motion.div
                key={schedule._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{schedule.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold bg-${typeConfig.color}-600 text-white`}>
                        {typeConfig.label}
                      </span>
                    </div>
                    
                    {schedule.description && (
                      <p className="text-gray-300 mb-3">{schedule.description}</p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-300">
                      <div className="flex items-center gap-2">
                        <UsersIcon className="h-4 w-4" />
                        <span>{studentCount} students assigned</span>
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

                    {/* Target Student Groups */}
                    {schedule.targetStudentGroups.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-400 mb-2">Target Groups:</p>
                        <div className="flex flex-wrap gap-2">
                          {schedule.targetStudentGroups.map((group, index) => {
                            const groupConfig = getStudentGroupConfig(group.groupType);
                            const Icon = groupConfig.icon;
                            return (
                              <div key={index} className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-xl">
                                <Icon className={`h-4 w-4 text-${groupConfig.color}-400`} />
                                <span className="text-sm text-white">{group.groupName}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => {
                        setSelectedSchedule(schedule);
                        setShowAssignModal(true);
                      }}
                      className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors font-semibold text-sm"
                    >
                      <UserPlusIcon className="h-4 w-4" />
                      <span>Assign Students</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedScheduleId(schedule._id);
                        setShowScheduleDetails(true);
                      }}
                      className="flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-colors font-semibold text-sm"
                    >
                      <EyeIcon className="h-4 w-4" />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Create Schedule Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 50 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-[#2a1a1a] rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#CA133E]/30"
            >
              <div className="p-6 border-b border-[#CA133E]/30">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white">Create New Schedule</h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/10"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">Schedule Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3 border border-white/20 rounded-xl focus:ring-2 focus:ring-[#CA133E] focus:border-transparent bg-white/10 text-white placeholder-gray-400"
                      placeholder="e.g., 9H Advanced Schedule"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-white mb-2">Schedule Type</label>
                    <select
                      value={formData.scheduleType}
                      onChange={(e) => setFormData({ ...formData, scheduleType: e.target.value })}
                      className="w-full px-4 py-3 border border-white/20 rounded-xl focus:ring-2 focus:ring-[#CA133E] focus:border-transparent bg-white/10 text-white"
                    >
                      {scheduleTypes.map(type => (
                        <option key={type.value} value={type.value} className="bg-[#2a1a1a] text-white">
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-white/20 rounded-xl focus:ring-2 focus:ring-[#CA133E] focus:border-transparent bg-white/10 text-white placeholder-gray-400"
                    placeholder="Describe the purpose of this schedule..."
                    rows="3"
                  />
                </div>

                {/* Target Student Groups */}
                <div>
                  <label className="block text-sm font-bold text-white mb-3">Target Student Groups</label>
                  <div className="space-y-3">
                    {studentGroups.map((group) => {
                      const Icon = group.icon;
                      const isSelected = formData.targetStudentGroups.some(g => g.groupType === group.value);
                      
                      return (
                        <label
                          key={group.value}
                          className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-[#CA133E] bg-[#CA133E]/20'
                              : 'border-white/20 bg-white/10 hover:bg-white/20'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  targetStudentGroups: [
                                    ...formData.targetStudentGroups,
                                    {
                                      groupType: group.value,
                                      groupName: group.label,
                                      description: `Students from ${group.label}`
                                    }
                                  ]
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  targetStudentGroups: formData.targetStudentGroups.filter(g => g.groupType !== group.value)
                                });
                              }
                            }}
                            className="sr-only"
                          />
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-xl bg-${group.color}-600/20`}>
                              <Icon className={`h-5 w-5 text-${group.color}-400`} />
                            </div>
                            <div>
                              <p className="text-white font-semibold">{group.label}</p>
                              <p className="text-gray-300 text-sm">{getStudentGroupCount(group.value)} students available</p>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">Start Date</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-4 py-3 border border-white/20 rounded-xl focus:ring-2 focus:ring-[#CA133E] focus:border-transparent bg-white/10 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-white mb-2">End Date</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-4 py-3 border border-white/20 rounded-xl focus:ring-2 focus:ring-[#CA133E] focus:border-transparent bg-white/10 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-3 border border-white/20 rounded-xl focus:ring-2 focus:ring-[#CA133E] focus:border-transparent bg-white/10 text-white placeholder-gray-400"
                    placeholder="Additional notes about this schedule..."
                    rows="2"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4 pt-6 border-t border-white/20">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-6 py-3 text-white bg-white/10 rounded-xl hover:bg-white/20 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateSchedule}
                    disabled={saving || !formData.title.trim()}
                    className="px-8 py-3 bg-[#CA133E] text-white rounded-xl hover:bg-[#A01030] transition-colors disabled:opacity-50 font-semibold shadow-lg"
                  >
                    {saving ? 'Creating...' : 'Create Schedule'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Assign Students Modal */}
      <AnimatePresence>
        {showAssignModal && selectedSchedule && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#2a1a1a] rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto border border-[#CA133E]/30"
            >
              <div className="p-6 border-b border-[#CA133E]/30">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-white">Assign Students to Schedule</h3>
                    <p className="text-gray-300 mt-1">{selectedSchedule.title}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowAssignModal(false);
                      setSelectedStudents([]);
                    }}
                    className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/10"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Student Group Tabs */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {studentGroups.map((group) => {
                    const count = getStudentGroupCount(group.value);
                    const Icon = group.icon;
                    return (
                      <button
                        key={group.value}
                        onClick={() => setActiveTab(group.value)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-colors ${
                          activeTab === group.value
                            ? 'bg-[#CA133E] text-white'
                            : 'bg-white/10 text-gray-300 hover:bg-white/20'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{group.label} ({count})</span>
                      </button>
                    );
                  })}
                </div>

                {/* Students List */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                    {students[activeTab]?.map((student) => (
                      <label
                        key={student._id}
                        className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                          selectedStudents.includes(student._id)
                            ? 'border-[#CA133E] bg-[#CA133E]/20'
                            : 'border-white/20 bg-white/10 hover:bg-white/20'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudents([...selectedStudents, student._id]);
                            } else {
                              setSelectedStudents(selectedStudents.filter(id => id !== student._id));
                            }
                          }}
                          className="sr-only"
                        />
                        <div className="flex-1">
                          <p className="text-white font-semibold">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-gray-300 text-sm">
                            {student.email}
                          </p>
                          {student.studentInfo?.studentId && (
                            <p className="text-gray-400 text-xs">
                              ID: {student.studentInfo.studentId}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>

                  {(!students[activeTab] || students[activeTab].length === 0) && (
                    <div className="text-center py-8">
                      <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-300">No students found in this group</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t border-white/20">
                    <p className="text-gray-300 text-sm">
                      {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowAssignModal(false);
                          setSelectedStudents([]);
                        }}
                        className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAssignStudents}
                        disabled={selectedStudents.length === 0 || saving}
                        className="bg-[#CA133E] text-white px-6 py-2 rounded-xl hover:bg-[#A01030] font-semibold shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? 'Assigning...' : 'Assign Students'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Schedule Details Modal */}
      <AnimatePresence>
        {showScheduleDetails && selectedScheduleId && (
          <ScheduleDetails
            scheduleId={selectedScheduleId}
            onClose={() => {
              setShowScheduleDetails(false);
              setSelectedScheduleId(null);
              fetchSchedules(); // Refresh schedules after closing details
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ScheduleManager;
