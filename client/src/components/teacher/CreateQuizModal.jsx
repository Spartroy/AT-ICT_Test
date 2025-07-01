import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import API_ENDPOINTS from '../../config/api';
import {
  XMarkIcon,
  QuestionMarkCircleIcon,
  ClockIcon,
  TrophyIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const CreateQuizModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'theory',
    section: 'theory',
    startDate: '',
    startTime: '',
    duration: '',
    maxScore: '',
    difficulty: 'medium',
    instructions: '',
    assignToAll: true,
    selectedStudents: []
  });
  
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  const difficulties = [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' }
  ];

  const types = [
    { value: 'theory', label: 'Theory' },
    { value: 'practical', label: 'Practical' }
  ];

  const sections = [
    { value: 'theory', label: 'Theory' },
    { value: 'practical', label: 'Practical' }
  ];

  // Fetch students when modal opens
  useEffect(() => {
    if (isOpen && !formData.assignToAll) {
      fetchStudents();
    }
  }, [isOpen, formData.assignToAll]);

  const fetchStudents = async () => {
    setStudentsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.TEACHER.STUDENTS, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStudents(data.data.students || []);
      } else {
        console.error('Failed to fetch students');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.assignToAll && formData.selectedStudents.length === 0) {
      alert('⚠️ Please select at least one student or choose "Assign to all students"');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      console.log('📝 Submitting quiz data:', formData);
      
      const response = await fetch(API_ENDPOINTS.QUIZZES, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        alert('✅ Quiz created successfully!');
        onSuccess && onSuccess(data.data.quiz);
        handleClose();
      } else {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert('❌ Error creating quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      type: 'theory',
      section: 'theory',
      startDate: '',
      startTime: '',
      duration: '',
      maxScore: '',
      difficulty: 'medium',
      instructions: '',
      assignToAll: true,
      selectedStudents: []
    });
    setShowStudentDropdown(false);
    onClose();
  };

  const handleStudentToggle = (studentId) => {
    setFormData(prev => ({
      ...prev,
      selectedStudents: prev.selectedStudents.includes(studentId)
        ? prev.selectedStudents.filter(id => id !== studentId)
        : [...prev.selectedStudents, studentId]
    }));
  };

  const handleSelectAll = () => {
    if (formData.selectedStudents.length === students.length) {
      // Deselect all
      setFormData(prev => ({ ...prev, selectedStudents: [] }));
    } else {
      // Select all
      setFormData(prev => ({ 
        ...prev, 
        selectedStudents: students.map(student => student._id) 
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gray-900/90 border border-gray-700 text-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col"
      >
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold flex items-center">
              <QuestionMarkCircleIcon className="h-6 w-6 mr-2 text-purple-400" />
              Create New Quiz
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Quiz Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-800/90 text-white"
              placeholder="Enter quiz title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-800/90 text-white"
              placeholder="Brief description of the quiz"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Type *
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-800/90 text-white"
              >
                {types.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Section *
              </label>
              <select
                required
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                className="w-full px-3 py-2 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-800/90 text-white"
              >
                {sections.map(section => (
                  <option key={section.value} value={section.value}>{section.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Quiz Date *
            </label>
            <input
              type="date"
              required
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-800/90 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Start Time *
              </label>
              <input
                type="time"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-800/90 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Duration (minutes) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-3 py-2 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-800/90 text-white"
                placeholder="30"
              />
              <p className="text-xs text-gray-400 mt-1">
                End time will be calculated automatically
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Max Score *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.maxScore}
                onChange={(e) => setFormData({ ...formData, maxScore: e.target.value })}
                className="w-full px-3 py-2 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-800/90 text-white"
                placeholder="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Difficulty
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="w-full px-3 py-2 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-800/90 text-white"
              >
                {difficulties.map(diff => (
                  <option key={diff.value} value={diff.value}>{diff.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Instructions (Optional)
            </label>
            <textarea
              rows={3}
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              className="w-full px-3 py-2 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-800/90 text-white"
              placeholder="Instructions for students taking the quiz"
            />
          </div>

          {/* Student Assignment Section */}
          <div className="border border-gray-600 rounded-xl p-4 bg-gray-800/50">
            <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
              <UserGroupIcon className="h-4 w-4 mr-2" />
              Student Assignment
            </h4>

            <div className="flex items-center mb-3">
              <input
                type="checkbox"
                id="assignToAll"
                checked={formData.assignToAll}
                onChange={(e) => {
                  setFormData({ 
                    ...formData, 
                    assignToAll: e.target.checked,
                    selectedStudents: e.target.checked ? [] : formData.selectedStudents
                  });
                  if (e.target.checked) {
                    setShowStudentDropdown(false);
                  }
                }}
                className="h-4 w-4 text-purple-500 focus:ring-purple-500 border-gray-600 rounded bg-gray-800/90"
              />
              <label htmlFor="assignToAll" className="ml-2 block text-sm text-gray-300">
                Assign to all active students
              </label>
            </div>

            {!formData.assignToAll && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-300">
                    Select Students
                  </label>
                  <span className="text-xs text-gray-400">
                    {formData.selectedStudents.length} selected
                  </span>
                </div>
                
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowStudentDropdown(!showStudentDropdown);
                      if (!showStudentDropdown && students.length === 0) {
                        fetchStudents();
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-800/90 text-white text-left flex items-center justify-between"
                  >
                    <span className="text-gray-300">
                      {formData.selectedStudents.length === 0 
                        ? 'Choose students...' 
                        : `${formData.selectedStudents.length} student(s) selected`
                      }
                    </span>
                    {showStudentDropdown ? (
                      <ChevronUpIcon className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </button>

                  {showStudentDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-600 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {studentsLoading ? (
                        <div className="px-3 py-2 text-gray-400 text-center">
                          Loading students...
                        </div>
                      ) : students.length === 0 ? (
                        <div className="px-3 py-2 text-gray-400 text-center">
                          No students found
                        </div>
                      ) : (
                        <>
                          <div className="border-b border-gray-600">
                            <button
                              type="button"
                              onClick={handleSelectAll}
                              className="w-full px-3 py-2 text-left hover:bg-gray-700 text-purple-400 font-medium"
                            >
                              {formData.selectedStudents.length === students.length ? 'Deselect All' : 'Select All'}
                            </button>
                          </div>
                          {students.map((student) => (
                            <div key={student._id} className="px-3 py-2 hover:bg-gray-700">
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.selectedStudents.includes(student._id)}
                                  onChange={() => handleStudentToggle(student._id)}
                                  className="h-4 w-4 text-purple-500 focus:ring-purple-500 border-gray-600 rounded bg-gray-800/90"
                                />
                                <div className="ml-2 flex-1">
                                  <div className="text-white text-sm">
                                    {student.firstName} {student.lastName}
                                  </div>
                                  <div className="text-gray-400 text-xs">
                                    {student.email} {student.studentInfo?.studentId && `• ${student.studentInfo.studentId}`}
                                  </div>
                                </div>
                              </label>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="bg-blue-900/40 p-4 rounded-xl border border-blue-700/50">
            <p className="text-sm text-blue-300">
              <strong>Note:</strong> Students will be able to take this quiz during the specified time window. You can upload files and grade submissions after the quiz period ends.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-300 bg-gray-700/80 rounded-xl hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                'Create Quiz'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateQuizModal; 