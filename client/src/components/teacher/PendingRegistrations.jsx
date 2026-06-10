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
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.status === 'success') setRegistrations(data.data.registrations);
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
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
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
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ feeAmount, notes: 'Registration approved by teacher' })
      });
      if (response.ok) {
        const result = await response.json();
        showSuccess(result.message || 'Registration approved successfully!');
        fetchPendingRegistrations();
        if (onRegistrationUpdate) onRegistrationUpdate();
        setShowModal(false);
        setSelectedRegistration(null);
      } else {
        const errorData = await response.json();
        showError(errorData.message || 'Failed to approve registration');
      }
    } catch (error) {
      showError(`Network Error: ${error.message || 'Failed to connect to server'}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-[#161616] border border-white/5 rounded-xl p-5 animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-white/5 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/5 rounded w-1/4" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Pending Registrations</h2>
          <p className="text-sm text-gray-500 mt-0.5">Review and approve new student registrations</p>
        </div>
        <span className="bg-orange-500/15 text-orange-400 border border-orange-500/20 px-3 py-1 rounded-full text-sm font-medium">
          {registrations.length} Pending
        </span>
      </div>

      {registrations.length === 0 ? (
        <div className="py-14 text-center rounded-xl border border-dashed border-white/10">
          <ClockIcon className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white mb-1">No Pending Registrations</h3>
          <p className="text-xs text-gray-500">All registrations have been processed.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {registrations.map((registration, index) => (
            <motion.div
              key={registration._id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="bg-[#161616] border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-all"
            >
              <div className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  {/* Identity */}
                  <div className="flex items-start sm:items-center space-x-3 min-w-0 flex-1">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#CA133E] to-[#A01030] flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-base">
                        {registration.firstName[0]}{registration.lastName[0]}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-white mb-0.5 truncate">
                        {registration.firstName} {registration.lastName}
                      </h3>
                      <p className="text-xs text-gray-500 mb-2 truncate">{registration.email}</p>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><AcademicCapIcon className="h-3.5 w-3.5 text-blue-400" />Year {registration.year}</span>
                        <span className="flex items-center gap-1"><MapPinIcon className="h-3.5 w-3.5 text-green-400" />{registration.nationality}</span>
                        <span className="flex items-center gap-1"><ClockIcon className="h-3.5 w-3.5 text-yellow-400" />{registration.createdAt ? new Date(registration.createdAt).toLocaleDateString() : 'N/A'}</span>
                        <span className="flex items-center gap-1"><PhoneIcon className="h-3.5 w-3.5 text-purple-400" />{registration.contactNumber || 'N/A'}</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                        {[
                          { label: 'SCHOOL', value: registration.school },
                          { label: 'SESSION', value: registration.session },
                          { label: 'TECH', value: registration.techKnowledge },
                          { label: 'RETAKER', value: registration.isRetaker ? 'Yes' : 'No' },
                        ].map(({ label, value }) => (
                          <div key={label} className="bg-[#1A1A1A] rounded-lg p-2">
                            <p className="text-[10px] text-gray-600 uppercase tracking-wide mb-0.5">{label}</p>
                            <p className="text-xs font-semibold text-white truncate">{value || 'N/A'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => { setSelectedRegistration(registration); setShowModal(true); setShowRejectForm(false); setRejectReason(''); }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 hover:bg-white/8 text-gray-400 hover:text-white rounded-xl transition-colors text-xs font-medium"
                    >
                      <EyeIcon className="h-4 w-4" />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => handleApprove(registration._id)}
                      disabled={actionLoading}
                      className="flex items-center gap-1.5 px-3 py-2 bg-green-600/80 hover:bg-green-600 text-white rounded-xl transition-colors text-xs font-medium disabled:opacity-50"
                    >
                      <CheckCircleIcon className="h-4 w-4" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => { setSelectedRegistration(registration); setShowModal(true); setShowRejectForm(true); setRejectReason(''); }}
                      disabled={actionLoading}
                      className="flex items-center gap-1.5 px-3 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-xl transition-colors text-xs font-medium disabled:opacity-50"
                    >
                      <XCircleIcon className="h-4 w-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showModal && selectedRegistration && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#161616] border border-white/10 text-white rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-orange-500/15 border border-orange-500/20 flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Registration Details</h3>
                  <p className="text-sm text-gray-500">{selectedRegistration.firstName} {selectedRegistration.lastName}</p>
                </div>
              </div>
              <button
                onClick={() => { setShowModal(false); setShowRejectForm(false); setRejectReason(''); }}
                className="p-2 rounded-xl hover:bg-white/8 text-gray-400 hover:text-white transition-colors"
              >
                <XCircleIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Identity */}
              <div className="flex items-center space-x-4">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[#CA133E] to-[#A01030] flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg">
                    {selectedRegistration.firstName[0]}{selectedRegistration.lastName[0]}
                  </span>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">{selectedRegistration.firstName} {selectedRegistration.lastName}</h4>
                  <p className="text-gray-500 text-sm">{selectedRegistration.email}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                    selectedRegistration.schoolType === 'royal'
                      ? 'bg-purple-500/15 text-purple-300 border-purple-500/25'
                      : 'bg-blue-500/15 text-blue-300 border-blue-500/25'
                  }`}>
                    {selectedRegistration.schoolType === 'royal' ? 'Royal College' : 'Center Student'}
                  </span>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-2">
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
                  <div key={label} className="bg-[#1A1A1A] rounded-xl p-3">
                    <p className="text-[10px] text-gray-600 uppercase tracking-wide mb-1">{label}</p>
                    <p className="text-sm font-semibold text-white">{value}</p>
                  </div>
                ))}
              </div>

              {/* Contact */}
              <div className="bg-[#1A1A1A] rounded-xl p-4 space-y-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Contact Information</p>
                <div className="flex items-center space-x-3">
                  <EnvelopeIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <span className="text-white text-sm">{selectedRegistration.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <PhoneIcon className="h-4 w-4 text-blue-400 flex-shrink-0" />
                  <span className="text-white text-sm">{selectedRegistration.contactNumber} <span className="text-gray-600">(Student)</span></span>
                </div>
                {selectedRegistration.parentNumber && (
                  <div className="flex items-center space-x-3">
                    <PhoneIcon className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <span className="text-white text-sm">{selectedRegistration.parentNumber} <span className="text-gray-600">(Parent)</span></span>
                  </div>
                )}
              </div>

              {/* Reject form */}
              {showRejectForm && (
                <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-semibold text-red-400">Rejection Reason</p>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Provide a reason for rejection (minimum 5 characters)..."
                    className="w-full bg-[#1A1A1A] border border-white/10 text-white placeholder-gray-600 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500 transition-colors resize-none h-24"
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-white/5 flex items-center justify-end space-x-3">
              {showRejectForm ? (
                <>
                  <button
                    onClick={() => { setShowRejectForm(false); setRejectReason(''); }}
                    className="px-4 py-2 text-gray-400 bg-white/5 border border-white/10 rounded-xl hover:bg-white/8 transition-colors text-sm"
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
                    className="px-4 py-2 text-gray-400 bg-white/5 border border-white/10 rounded-xl hover:bg-white/8 transition-colors text-sm"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => setShowRejectForm(true)}
                    className="px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-xl transition-colors text-sm flex items-center gap-2"
                  >
                    <XCircleIcon className="h-4 w-4" />
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(selectedRegistration._id)}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    {actionLoading ? 'Processing...' : 'Approve'}
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
