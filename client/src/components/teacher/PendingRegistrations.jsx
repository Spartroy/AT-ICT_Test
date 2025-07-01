import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { API_ENDPOINTS } from '../../config/api';
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
        alert(`✅ ${result.message || 'Registration approved successfully!'}`);
        fetchPendingRegistrations();
        // Update parent dashboard count
        if (onRegistrationUpdate) {
          onRegistrationUpdate();
        }
        setShowModal(false);
        setSelectedRegistration(null);
      } else {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.message || 'Failed to approve registration'}`);
      }
    } catch (error) {
      console.error('Error approving registration:', error);
      alert(`❌ Network Error: ${error.message || 'Failed to connect to server'}`);
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
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-red-500 to-red-700 flex items-center justify-center ring-2 ring-red-500/50">
                      <span className="text-white font-semibold text-lg">
                        {registration.firstName[0]}{registration.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {registration.firstName} {registration.lastName}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span className="flex items-center">
                          <AcademicCapIcon className="h-4 w-4 mr-1" />
                          Year {registration.year}
                        </span>
                        <span className="flex items-center">
                          <MapPinIcon className="h-4 w-4 mr-1" />
                          {registration.city}, {registration.nationality}
                        </span>
                        <span className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {new Date(registration.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        setSelectedRegistration(registration);
                        setShowModal(true);
                      }}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-700/80 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors"
                    >
                      <EyeIcon className="h-4 w-4" />
                      <span>View Details</span>
                    </button>
                    <button
                      onClick={() => handleApprove(registration._id)}
                      disabled={actionLoading}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                    >
                      <CheckCircleIcon className="h-4 w-4" />
                      <span>Approve</span>
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-800/70 rounded-xl">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">School</p>
                    <p className="text-sm font-medium text-white">{registration.school}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Session</p>
                    <p className="text-sm font-medium text-white">{registration.session}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Tech Level</p>
                    <p className="text-sm font-medium text-white">{registration.techKnowledge}/10</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Retaker</p>
                    <p className="text-sm font-medium text-white">
                      {registration.isRetaker ? 'Yes' : 'No'}
                    </p>
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
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">
                  Registration Details
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              <div>
                <h4 className="text-lg font-medium text-white mb-4">Personal Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Full Name</p>
                    <p className="font-medium text-white">{selectedRegistration.firstName} {selectedRegistration.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Year</p>
                    <p className="font-medium text-white">Year {selectedRegistration.year}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Nationality</p>
                    <p className="font-medium text-white">{selectedRegistration.nationality}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">City</p>
                    <p className="font-medium text-white">{selectedRegistration.city}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-white mb-4">Contact Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    <span className="text-white">{selectedRegistration.email}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                    <span className="text-white">{selectedRegistration.contactNumber} (Student)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-300 bg-gray-700/80 rounded-xl hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => handleApprove(selectedRegistration._id)}
                disabled={actionLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading ? 'Processing...' : 'Approve'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PendingRegistrations; 