import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  UserCircleIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  AcademicCapIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline';
import { API_ENDPOINTS } from '../../config/api';
import { showSuccess, showError } from '../../utils/toast';

const ROLE_LABELS = { student: 'Student', teacher: 'Teacher', parent: 'Parent' };
const ROLE_COLORS = {
  student: 'bg-blue-900/30 text-blue-300 border border-blue-700/50',
  teacher: 'bg-[#CA133E]/20 text-red-300 border border-[#CA133E]/50',
  parent:  'bg-purple-900/30 text-purple-300 border border-purple-700/50',
};

const ProfileModal = ({ user, onClose }) => {
  const [tab, setTab] = useState('info'); // 'info' | 'password'
  const [pwForm, setPwForm]   = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw]   = useState({ current: false, newPw: false, confirm: false });
  const [saving, setSaving]   = useState(false);
  const [pwError, setPwError] = useState('');

  if (!user) return null;

  const displayName   = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  const roleData      = user.roleData || {};

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwError('Password must be at least 6 characters.');
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        showSuccess('Password changed successfully!');
        setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTab('info');
      } else {
        setPwError(data.message || 'Failed to change password.');
      }
    } catch {
      setPwError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const pwField = (id, label, key, showKey) => (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5 font-semibold uppercase tracking-wide">{label}</label>
      <div className="relative">
        <input
          type={showPw[showKey] ? 'text' : 'password'}
          value={pwForm[key]}
          onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))}
          className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-[#CA133E] focus:outline-none text-sm pr-10"
          placeholder="••••••••"
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setShowPw(s => ({ ...s, [showKey]: !s[showKey] }))}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
        >
          {showPw[showKey] ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -16 }}
        className="bg-[#161616] border border-white/10 rounded-2xl w-full max-w-md"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#CA133E] to-[#8B0D28] flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-[#CA133E]/20">
              {(user.firstName?.[0] || '?')}{(user.lastName?.[0] || '')}
            </div>
            <div>
              <h3 className="text-white font-bold text-lg leading-tight">{displayName || user.email}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${ROLE_COLORS[user.role] || 'bg-gray-700 text-gray-300'}`}>
                  {ROLE_LABELS[user.role] || user.role}
                </span>
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-white/10">
          {[
            { id: 'info',     label: 'Profile',         Icon: UserCircleIcon },
            { id: 'password', label: 'Change Password',  Icon: KeyIcon        },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => { setTab(id); setPwError(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors border-b-2 ${
                tab === id
                  ? 'border-[#CA133E] text-white bg-[#CA133E]/10'
                  : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-5">
          {tab === 'info' && (
            <div className="space-y-3">
              {/* Email */}
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <EnvelopeIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Email</p>
                  <p className="text-white text-sm truncate">{user.email}</p>
                </div>
              </div>
              {/* Role-specific info */}
              {user.role === 'student' && (
                <>
                  {roleData.studentId && (
                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                      <AcademicCapIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Student ID</p>
                        <p className="text-white text-sm">{roleData.studentId}</p>
                      </div>
                    </div>
                  )}
                  {(roleData.year || roleData.session) && (
                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                      <BuildingOffice2Icon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Year / Session</p>
                        <p className="text-white text-sm">Year {roleData.year} • {roleData.session}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
              {user.role === 'teacher' && (
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                  <ShieldCheckIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Role</p>
                    <p className="text-white text-sm">Instructor — AT ICT</p>
                  </div>
                </div>
              )}
              {user.role === 'parent' && roleData.studentName && (
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                  <AcademicCapIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Child</p>
                    <p className="text-white text-sm">{roleData.studentName}</p>
                  </div>
                </div>
              )}
              {/* Last login */}
              {user.lastLogin && (
                <div className="text-xs text-gray-600 text-center mt-2">
                  Last login: {new Date(user.lastLogin).toLocaleString()}
                </div>
              )}
            </div>
          )}

          {tab === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              {pwField('current', 'Current Password', 'currentPassword', 'current')}
              {pwField('new', 'New Password', 'newPassword', 'newPw')}
              {pwField('confirm', 'Confirm New Password', 'confirmPassword', 'confirm')}

              <AnimatePresence>
                {pwError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 bg-red-900/20 border border-red-500/40 rounded-xl px-3 py-2.5 text-red-300 text-sm"
                  >
                    <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
                    {pwError}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={saving || !pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword}
                className="w-full py-2.5 bg-[#CA133E] hover:bg-[#A01030] text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <><div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                ) : (
                  <><CheckCircleIcon className="h-5 w-5" /> Change Password</>
                )}
              </button>
              <p className="text-xs text-gray-600 text-center">
                Password must be at least 6 characters.
              </p>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ProfileModal;
