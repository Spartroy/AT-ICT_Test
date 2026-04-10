import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { API_ENDPOINTS } from '../../config/api';
import { showSuccess, showError } from '../../utils/toast';
import {
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ClockIcon,
  UserIcon,
  AcademicCapIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

const PendingRegistrations = ({ onRegistrationUpdate }) => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchPendingRegistrations();
  }, []);

  const fetchPendingRegistrations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.REGISTRATION.BASE}/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setRegistrations(data.data.registrations);
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (registrationId) => {
    if (!rejectReason.trim() || rejectReason.trim().length < 5) {
      showError('Please provide a rejection reason (at least 5 characters)');
      return;
    }
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.REGISTRATION.BASE}/${registrationId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: rejectReason })
      });

      if (response.ok) {
        const result = await response.json();
        showSuccess(result.message || 'Registration rejected.');
        fetchPendingRegistrations();
        if (onRegistrationUpdate) onRegistrationUpdate();
        setShowModal(false);
        setSelectedRegistration(null);
        setShowRejectForm(false);
        setRejectReason('');
      } else {
        const errorData = await response.json();
        showError(errorData.message || 'Failed to reject registration');
      }
    } catch (error) {
      console.error('Error rejecting registration:', error);
      showError(`Network Error: ${error.message || 'Failed to connect to server'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (registrationId, feeAmount = 499) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.REGISTRATION.BASE}/${registrationId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          feeAmount,
          notes: 'Registration approved by teacher'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        showSuccess(result.message || 'Registration approved successfully!');
        fetchPendingRegistrations();
        // Update parent dashboard count
        if (onRegistrationUpdate) {
          onRegistrationUpdate();
        }
        setShowModal(false);
        setSelectedRegistration(null);
      } else {
        const errorData = await response.json();
        showError(errorData.message || 'Failed to approve registration');
      }
    } catch (error) {
      console.error('Error approving registration:', error);
      showError(`Network Error: ${error.message || 'Failed to connect to server'}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-800/60 rounded-xl shadow-sm p-6 animate-pulse backdrop-blur-sm border-2 border-gray-600/50">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gray-700/50 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-700/50 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-700/50 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-800/60 rounded-xl p-6 shadow-2xl backdrop-blur-sm border-2 border-gray-600/50">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-[20pt] font-bold text-white">Pending Registrations</h2>
          <p className="text-[14pt] text-gray-300">Review and approve new student registrations</p>
        </div>
        <div className="bg-orange-500/30 text-orange-300 px-3 py-1 rounded-full text-sm font-medium">
          {registrations.length} Pending
        </div>
      </div>

      {registrations.length === 0 ? (
        <div className="bg-gray-900/50 rounded-xl p-12 text-center border-2 border-dashed border-gray-700/50">
          <ClockIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No Pending Registrations</h3>
          <p className="text-gray-400">All registrations have been processed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {registrations.map((registration, index) => (
            <motion.div
              key={registration._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-900/70 backdrop-blur-md rounded-xl overflow-hidden hover:shadow-xl transition-shadow border border-gray-700/50"
            >
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-red-500 to-red-700 flex items-center justify-center ring-2 ring-red-500/50 flex-shrink-0">
                      <span className="text-white font-semibold text-lg">
                        {registration.firstName[0]}{registration.lastName[0]}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg sm:text-xl font-semibold text-white mb-1 sm:mb-2 truncate">
                        {registration.firstName} {registration.lastName}
                      </h3>
                      <p className="text-sm text-gray-400 mb-2 sm:mb-3 truncate">{registration.email}</p>
                      
                      {/* Student Details - Responsive Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <AcademicCapIcon className="h-4 w-4 text-blue-400 flex-shrink-0" />
                          <span className="text-gray-300">Year {registration.year}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPinIcon className="h-4 w-4 text-green-400 flex-shrink-0" />
                          <span className="text-gray-300 truncate">{registration.nationality}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <ClockIcon className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                          <span className="text-gray-300 truncate">{registration.createdAt ? new Date(registration.createdAt).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <PhoneIcon className="h-4 w-4 text-purple-400 flex-shrink-0" />
                          <span className="text-gray-300 truncate">{registration.contactNumber || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Additional Info - Responsive Layout */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-3 sm:mt-4">
                        <div className="bg-gray-800/50 rounded-xl p-2 sm:p-3">
                          <p className="text-xs text-gray-400 mb-1">SCHOOL</p>
                          <p className="text-sm font-semibold text-white truncate">{registration.school}</p>
                        </div>
                        <div className="bg-gray-800/50 rounded-xl p-2 sm:p-3">
                          <p className="text-xs text-gray-400 mb-1">SESSION</p>
                          <p className="text-sm font-semibold text-white truncate">{registration.session}</p>
                        </div>
                        <div className="bg-gray-800/50 rounded-xl p-2 sm:p-3">
                          <p className="text-xs text-gray-400 mb-1">TECH LEVEL</p>
                          <p className="text-sm font-semibold text-white truncate">{registration.techKnowledge}</p>
                        </div>
                        <div className="bg-gray-800/50 rounded-xl p-2 sm:p-3">
                          <p className="text-xs text-gray-400 mb-1">RETAKER</p>
                          <p className="text-sm font-semibold text-white truncate">{registration.isRetaker ? 'Yes' : 'No'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-shrink-0">
                    <button
                      onClick={() => {
                        setSelectedRegistration(registration);
                        setShowModal(true);
                        setShowRejectForm(false);
                        setRejectReason('');
                      }}
                      className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors font-medium text-sm sm:text-base"
                    >
                      <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="hidden sm:inline">View Details</span>
                      <span className="sm:hidden">View</span>
                    </button>
                    <button
                      onClick={() => handleApprove(registration._id)}
                      disabled={actionLoading}
                      className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition-colors font-medium text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="hidden sm:inline">Approve</span>
                      <span className="sm:hidden">✓</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRegistration(registration);
                        setShowModal(true);
                        setShowRejectForm(true);
                        setRejectReason('');
                      }}
                      disabled={actionLoading}
                      className="flex items-center justify-center space-x-2 bg-red-600/80 hover:bg-red-600 text-white px-4 py-2 rounded-xl transition-colors font-medium text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XCircleIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="hidden sm:inline">Reject</span>
                      <span className="sm:hidden">✕</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {showModal && selectedRegistration && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900/90 border border-gray-700 text-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Registration Details</h3>
                  <p className="text-sm text-gray-400">
                    {selectedRegistration.firstName} {selectedRegistration.lastName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setShowModal(false); setShowRejectForm(false); setRejectReason(''); }}
                className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <XCircleIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5 overflow-y-auto">
              {/* Identity */}
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center ring-2 ring-red-500/30 flex-shrink-0">
                  <span className="text-white font-bold text-xl">
                    {selectedRegistration.firstName[0]}{selectedRegistration.lastName[0]}
                  </span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white">
                    {selectedRegistration.firstName} {selectedRegistration.lastName}
                  </h4>
                  <p className="text-gray-400 text-sm">{selectedRegistration.email}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                    selectedRegistration.schoolType === 'royal'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                      : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                  }`}>
                    {selectedRegistration.schoolType === 'royal' ? '🏫 Royal College' : '🎓 Center Student'}
                  </span>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Year / Class', value: selectedRegistration.year ? `Year ${selectedRegistration.year}` : (selectedRegistration.royalClass || 'N/A') },
                  { label: 'Nationality', value: selectedRegistration.nationality || selectedRegistration.royalNationality || 'N/A' },
                  { label: 'City', value: selectedRegistration.city || 'N/A' },
                  { label: 'School', value: selectedRegistration.school || 'N/A' },
                  { label: 'Session', value: selectedRegistration.session || 'N/A' },
                  { label: 'Retaker', value: selectedRegistration.isRetaker ? 'Yes' : 'No' },
                  { label: 'Tech Knowledge', value: `${selectedRegistration.techKnowledge || 'N/A'}/10` },
                  { label: 'English Level', value: `${selectedRegistration.englishLevel || 'N/A'}/10` },
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
                  <span className="text-white text-sm">{selectedRegistration.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <PhoneIcon className="h-4 w-4 text-blue-400 flex-shrink-0" />
                  <span className="text-white text-sm">
                    {selectedRegistration.contactNumber} <span className="text-gray-500">(Student)</span>
                  </span>
                </div>
                {selectedRegistration.parentNumber && (
                  <div className="flex items-center space-x-3">
                    <PhoneIcon className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <span className="text-white text-sm">
                      {selectedRegistration.parentNumber} <span className="text-gray-500">(Parent)</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Reject reason input */}
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
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-gray-700 flex items-center justify-end space-x-3">
              {showRejectForm ? (
                <>
                  <button
                    onClick={() => { setShowRejectForm(false); setRejectReason(''); }}
                    className="px-4 py-2 text-gray-300 bg-gray-700/80 rounded-xl hover:bg-gray-700 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleReject(selectedRegistration._id)}
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
                    onClick={() => { setShowModal(false); setShowRejectForm(false); setRejectReason(''); }}
                    className="px-4 py-2 text-gray-300 bg-gray-700/80 rounded-xl hover:bg-gray-700 transition-colors text-sm"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => setShowRejectForm(true)}
                    className="px-5 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-xl transition-colors font-semibold text-sm flex items-center space-x-2"
                  >
                    <XCircleIcon className="h-4 w-4" />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => handleApprove(selectedRegistration._id)}
                    disabled={actionLoading}
                    className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors font-semibold text-sm flex items-center space-x-2 disabled:opacity-50"
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    <span>{actionLoading ? 'Processing...' : 'Approve'}</span>
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PendingRegistrations; 