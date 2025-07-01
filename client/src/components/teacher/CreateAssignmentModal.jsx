import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { API_ENDPOINTS } from '../../config/api';
import {
  XMarkIcon,
  DocumentArrowUpIcon,
  CalendarIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  ChevronDownIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const CreateAssignmentModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'classified',
    section: 'theory',
    dueDate: '',
    maxScore: '',
    difficulty: 'medium',
    instructions: '',
    assignToAll: true,
    selectedStudents: []
  });
  
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  // Fetch students when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchStudents();
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showStudentDropdown && !event.target.closest('.student-dropdown')) {
        setShowStudentDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showStudentDropdown]);

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.TEACHER.STUDENTS, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
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
      setLoadingStudents(false);
    }
  };

  const handleStudentSelection = (studentId) => {
    setFormData(prev => {
      const isSelected = prev.selectedStudents.includes(studentId);
      const newSelectedStudents = isSelected 
        ? prev.selectedStudents.filter(id => id !== studentId)
        : [...prev.selectedStudents, studentId];
      
      return {
        ...prev,
        selectedStudents: newSelectedStudents,
        assignToAll: newSelectedStudents.length === 0
      };
    });
  };

  const assignmentTypes = [
    { value: 'classified', label: 'Classified' },
    { value: 'task', label: 'Task' },
    { value: 'pastpapers', label: 'Past Papers' }
  ];

  const sectionTypes = [
    { value: 'theory', label: 'Theory' },
    { value: 'practical', label: 'Practical' }
  ];

  const difficulties = [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate maxScore is a positive number
    if (!formData.maxScore || parseInt(formData.maxScore) < 1) {
      alert('Max score must be a positive number');
      return;
    }
    
    // Validate student selection
    if (!formData.assignToAll && formData.selectedStudents.length === 0) {
      alert('Please select at least one student or choose "All Students"');
      return;
    }
    
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      
      // Append form fields with proper data types
      Object.keys(formData).forEach(key => {
        if (key === 'maxScore') {
          // Ensure maxScore is sent as integer
          formDataToSend.append(key, parseInt(formData[key]));
        } else if (key === 'assignToAll') {
          // Ensure boolean is properly converted
          formDataToSend.append(key, formData[key] === true || formData[key] === 'true' ? 'true' : 'false');
        } else if (key === 'selectedStudents') {
          // Send selected students as JSON array if not assigning to all
          if (!formData.assignToAll && formData.selectedStudents.length > 0) {
            formDataToSend.append('selectedStudents', JSON.stringify(formData.selectedStudents));
          }
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      // Append files
      files.forEach(file => {
        formDataToSend.append('attachments', file);
      });

      const response = await fetch(API_ENDPOINTS.ASSIGNMENTS, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        const data = await response.json();
        alert('✅ Assignment created successfully!');
        onSuccess && onSuccess(data.data.assignment);
        handleClose();
      } else {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
      alert('❌ Error creating assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      type: 'classified',
      section: 'theory',
      dueDate: '',
      maxScore: '',
      difficulty: 'medium',
      instructions: '',
      assignToAll: true,
      selectedStudents: []
    });
    setFiles([]);
    setShowStudentDropdown(false);
    onClose();
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles([...files, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gray-900/90 border border-gray-700 text-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col"
      >
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold flex items-center">
              <ClipboardDocumentListIcon className="h-6 w-6 mr-2 text-blue-400" />
              Create New Assignment
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
              Assignment Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800/90 text-white"
              placeholder="Enter assignment title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800/90 text-white"
              placeholder="Describe the assignment (optional)"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800/90 text-white"
              >
                {assignmentTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Section
              </label>
              <select
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                className="w-full px-3 py-2 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800/90 text-white"
              >
                {sectionTypes.map(section => (
                  <option key={section.value} value={section.value}>{section.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Difficulty
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="w-full px-3 py-2 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800/90 text-white"
              >
                {difficulties.map(diff => (
                  <option key={diff.value} value={diff.value}>{diff.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Due Date *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800/90 text-white"
              />
            </div>

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
                className="w-full px-3 py-2 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800/90 text-white"
                placeholder="e.g., 100"
              />
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
              className="w-full px-3 py-2 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800/90 text-white"
              placeholder="Additional instructions for students"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Attachment Files (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-600 rounded-xl p-4 hover:border-gray-500 transition-colors">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="assignment-files"
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
              />
              <label
                htmlFor="assignment-files"
                className="flex flex-col items-center cursor-pointer"
              >
                <DocumentArrowUpIcon className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-400">Click to upload files</span>
                <span className="text-xs text-gray-500">PDF, DOC, Images (Max 5 files)</span>
              </label>
            </div>
            
            {files.length > 0 && (
              <div className="mt-2 space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-800/70 p-2 rounded-xl border border-gray-700">
                    <span className="text-sm text-gray-300">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-400 hover:bg-red-500/20 rounded-full p-1"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Student Assignment
            </label>
            
            {/* Assignment Type Toggle */}
            <div className="flex space-x-3 mb-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, assignToAll: true, selectedStudents: [] })}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  formData.assignToAll 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                All Students
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, assignToAll: false })}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  !formData.assignToAll 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Select Students
              </button>
            </div>

            {/* Student Selection Dropdown */}
            {!formData.assignToAll && (
              <div className="relative student-dropdown">
                <button
                  type="button"
                  onClick={() => setShowStudentDropdown(!showStudentDropdown)}
                  className="w-full px-3 py-2 border border-gray-600 rounded-xl bg-gray-800/90 text-white text-left flex items-center justify-between"
                >
                  <span className="flex items-center">
                    <UserGroupIcon className="h-4 w-4 mr-2 text-gray-400" />
                    {formData.selectedStudents.length === 0
                      ? 'Select students...'
                      : `${formData.selectedStudents.length} student(s) selected`
                    }
                  </span>
                  <ChevronDownIcon 
                    className={`h-4 w-4 text-gray-400 transition-transform ${
                      showStudentDropdown ? 'rotate-180' : ''
                    }`} 
                  />
                </button>

                {/* Dropdown List */}
                {showStudentDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                    {loadingStudents ? (
                      <div className="p-3 text-center text-gray-400">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mx-auto mb-2"></div>
                        Loading students...
                      </div>
                    ) : students.length === 0 ? (
                      <div className="p-3 text-center text-gray-400">
                        No active students found
                      </div>
                    ) : (
                      <>
                        {/* Select All Students Option */}
                        <div className="p-2 border-b border-gray-700">
                          <button
                            type="button"
                            onClick={() => {
                              const allStudentIds = students.map(s => s._id);
                              const allSelected = allStudentIds.every(id => 
                                formData.selectedStudents.includes(id)
                              );
                              
                              if (allSelected) {
                                setFormData({ ...formData, selectedStudents: [] });
                              } else {
                                setFormData({ ...formData, selectedStudents: allStudentIds });
                              }
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-700 rounded-xl transition-colors flex items-center"
                          >
                            <input
                              type="checkbox"
                              checked={students.length > 0 && students.every(s => 
                                formData.selectedStudents.includes(s._id)
                              )}
                              onChange={() => {}} // Handled by button click
                              className="h-4 w-4 text-blue-500 border-gray-600 rounded mr-3"
                            />
                            <span className="font-medium text-blue-400">Select All</span>
                          </button>
                        </div>

                        {/* Individual Student Options */}
                        {students.map((student) => (
                          <div key={student._id} className="p-2">
                            <button
                              type="button"
                              onClick={() => handleStudentSelection(student._id)}
                              className="w-full text-left px-3 py-2 hover:bg-gray-700 rounded-xl transition-colors flex items-center"
                            >
                              <input
                                type="checkbox"
                                checked={formData.selectedStudents.includes(student._id)}
                                onChange={() => {}} // Handled by button click
                                className="h-4 w-4 text-blue-500 border-gray-600 rounded mr-3"
                              />
                              <div className="flex-1">
                                <div className="text-white">
                                  {student.firstName} {student.lastName}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {student.email}
                                  {student.studentInfo?.studentId && 
                                    ` • ID: ${student.studentInfo.studentId}`
                                  }
                                </div>
                              </div>
                            </button>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Selected Students Summary */}
            {!formData.assignToAll && formData.selectedStudents.length > 0 && (
              <div className="mt-2 text-sm text-gray-400">
                Assignment will be sent to {formData.selectedStudents.length} selected student(s)
              </div>
            )}

            {formData.assignToAll && (
              <div className="mt-2 text-sm text-gray-400">
                Assignment will be sent to all active students
              </div>
            )}
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
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                'Create Assignment'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateAssignmentModal; 