import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ENDPOINTS } from '../../config/api';
import QRCode from 'react-qr-code';
import { getValidToken, clearAuth, redirectToLogin, setAuthHeaders } from '../../utils/auth';
import { showSuccess, showError, showWarning } from '../../utils/toast';
import {
  CalendarDaysIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  BookOpenIcon,
  ComputerDesktopIcon,
  QrCodeIcon,
  UserGroupIcon,
  TableCellsIcon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UserIcon,
  ClockIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const SESSION_TYPES = [
  { value: 'theory',    label: 'Theory',    icon: BookOpenIcon,       color: 'blue'   },
  { value: 'practical', label: 'Practical', icon: ComputerDesktopIcon, color: 'green' },
  { value: 'revision',  label: 'Revision',  icon: AcademicCapIcon,    color: 'purple' },
  { value: 'quiz',      label: 'Quiz',      icon: DocumentTextIcon,   color: 'red'    },
];

const TYPE_COLORS = {
  theory:    { bg: 'bg-blue-600',   light: 'bg-blue-900/30',   border: 'border-blue-500',   text: 'text-blue-300'   },
  practical: { bg: 'bg-green-600',  light: 'bg-green-900/30',  border: 'border-green-500',  text: 'text-green-300'  },
  revision:  { bg: 'bg-purple-600', light: 'bg-purple-900/30', border: 'border-purple-500', text: 'text-purple-300' },
  quiz:      { bg: 'bg-red-600',    light: 'bg-red-900/30',    border: 'border-red-500',    text: 'text-red-300'    },
};

function initWeek() {
  return DAYS.map(day => ({ day, sessions: [] }));
}

function formatTime(t) {
  try {
    return new Date(`2000-01-01T${t}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch { return t; }
}

// ─── Session Editor Modal ──────────────────────────────────────────────────
function SessionEditorModal({ schedule, onSave, onClose, saving }) {
  const [formData, setFormData] = useState({
    title: schedule?.title || 'New Schedule',
    notes: schedule?.notes || '',
    schedule: schedule?.schedule || initWeek(),
  });

  const addSession = (dayIndex) => {
    const daySessions = formData.schedule[dayIndex].sessions;
    let start = '09:00', end = '10:30';
    if (daySessions.length > 0) {
      const last = daySessions[daySessions.length - 1];
      const s = new Date(new Date(`2000-01-01T${last.endTime}`).getTime() + 30 * 60000);
      start = s.toTimeString().slice(0, 5);
      end = new Date(s.getTime() + 90 * 60000).toTimeString().slice(0, 5);
    }
    const updated = [...formData.schedule];
    updated[dayIndex].sessions.push({ startTime: start, endTime: end, type: 'theory', topic: '', isActive: true });
    setFormData(f => ({ ...f, schedule: updated }));
  };

  const removeSession = (di, si) => {
    const updated = [...formData.schedule];
    updated[di].sessions.splice(si, 1);
    setFormData(f => ({ ...f, schedule: updated }));
  };

  const updateSession = (di, si, field, value) => {
    const updated = [...formData.schedule];
    const session = updated[di].sessions[si];
    session[field] = value;
    if (field === 'startTime') {
      const s = new Date(`2000-01-01T${value}`);
      const e = new Date(`2000-01-01T${session.endTime}`);
      if (e <= s) session.endTime = new Date(s.getTime() + 90 * 60000).toTimeString().slice(0, 5);
    }
    if (field === 'endTime') {
      const s = new Date(`2000-01-01T${session.startTime}`);
      const e = new Date(`2000-01-01T${value}`);
      if (e <= s) return;
    }
    setFormData(f => ({ ...f, schedule: updated }));
  };

  const handleSubmit = () => {
    const validated = {
      title: formData.title.trim() || 'Schedule',
      notes: formData.notes,
      schedule: formData.schedule.map(day => ({
        day: day.day,
        sessions: day.sessions.map(s => ({
          startTime: s.startTime || '09:00',
          endTime: s.endTime || '10:30',
          type: ['theory','practical','revision','quiz'].includes(s.type) ? s.type : 'theory',
          topic: s.topic?.trim() || 'Untitled Session',
          isActive: s.isActive !== false,
        }))
      }))
    };
    onSave(validated);
  };

  const totalSessions = formData.schedule.reduce((sum, d) => sum + d.sessions.length, 0);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-start justify-center z-50 px-2 py-4 sm:px-4 md:px-6 lg:px-8 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 24 }}
        className="bg-[#2a1010] rounded-xl shadow-2xl w-full max-w-[min(98vw,1680px)] border border-[#CA133E]/50 my-2 sm:my-4 min-h-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 sm:px-8 sm:py-5 border-b border-white/20">
          <div className="flex items-center gap-3">
            <CalendarDaysIcon className="h-6 w-6 text-[#CA133E]" />
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              {schedule?._id ? 'Edit Schedule' : 'Create Schedule'}
            </h3>
            <span className="text-sm text-gray-400 bg-white/10 px-2 py-0.5 rounded-xl">{totalSessions} session{totalSessions !== 1 ? 's' : ''}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-xl hover:bg-white/10 transition-colors">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="px-5 py-5 sm:px-8 sm:py-6 lg:px-10 lg:py-8 space-y-6">
          {/* Meta */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-8">
            <div>
              <label className="block text-sm font-semibold text-white mb-1.5">Schedule Name</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData(f => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-[#CA133E] focus:outline-none"
                placeholder="e.g. Monday/Wednesday Group"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white mb-1.5">Notes (optional)</label>
              <input
                type="text"
                value={formData.notes}
                onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-[#CA133E] focus:outline-none"
                placeholder="Additional notes"
              />
            </div>
          </div>

          {/* Day Editors */}
          <div className="space-y-3">
            {formData.schedule.map((day, di) => (
              <DayEditor
                key={day.day}
                day={day}
                dayIndex={di}
                onAddSession={() => addSession(di)}
                onRemoveSession={(si) => removeSession(di, si)}
                onUpdateSession={(si, field, val) => updateSession(di, si, field, val)}
              />
            ))}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-6 border-t border-white/20">
            <button onClick={onClose} className="px-5 py-2.5 text-gray-300 hover:text-white bg-white/10 rounded-xl hover:bg-white/20 font-semibold transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2.5 bg-[#CA133E] hover:bg-[#A01030] text-white rounded-xl font-bold shadow-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : schedule?._id ? 'Save Changes' : 'Create Schedule'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function DayEditor({ day, dayIndex, onAddSession, onRemoveSession, onUpdateSession }) {
  const [expanded, setExpanded] = useState(day.sessions.length > 0);
  const hasSessions = day.sessions.length > 0;

  return (
    <div className={`border rounded-xl transition-all ${hasSessions ? 'border-white/30 bg-white/[0.07]' : 'border-white/20 bg-white/[0.04]'}`}>
      <div
        className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-6 cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          {expanded ? <ChevronUpIcon className="h-4 w-4 text-gray-300" /> : <ChevronDownIcon className="h-4 w-4 text-gray-300" />}
          <span className="font-bold text-white text-base">{day.day}</span>
          {hasSessions ? (
            <span className="text-xs bg-[#CA133E]/40 text-red-200 px-2.5 py-0.5 rounded-full font-semibold">
              {day.sessions.length} session{day.sessions.length !== 1 ? 's' : ''}
            </span>
          ) : (
            <span className="text-xs text-gray-500">No sessions</span>
          )}
        </div>
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onAddSession(); setExpanded(true); }}
          className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors shadow"
        >
          <PlusIcon className="h-4 w-4" /> Add Session
        </button>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2 border-t border-white/15 pt-3">
              {day.sessions.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-3 italic">No sessions yet — click "Add Session"</p>
              ) : (
                day.sessions.map((session, si) => (
                  <SessionRow
                    key={si}
                    session={session}
                    onUpdate={(field, val) => onUpdateSession(si, field, val)}
                    onRemove={() => onRemoveSession(si)}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SessionRow({ session, onUpdate, onRemove }) {
  const colors = TYPE_COLORS[session.type] || TYPE_COLORS.theory;
  const inputCls = "w-full px-3 py-2.5 bg-white/10 border border-white/25 rounded-xl text-white text-sm focus:border-[#CA133E] focus:outline-none placeholder-gray-400";
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4 p-4 sm:p-5 rounded-xl border-l-4 ${colors.border} bg-white/[0.06]`}>
      <div>
        <label className="block text-xs font-bold text-gray-300 mb-1.5">Start</label>
        <input type="time" value={session.startTime} onChange={e => onUpdate('startTime', e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-300 mb-1.5">End</label>
        <input type="time" value={session.endTime} onChange={e => onUpdate('endTime', e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-300 mb-1.5">Type</label>
        <select value={session.type} onChange={e => onUpdate('type', e.target.value)} className={inputCls}>
          {SESSION_TYPES.map(t => <option key={t.value} value={t.value} className="bg-[#2a1010] text-white">{t.label}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-300 mb-1.5">Topic</label>
        <input type="text" value={session.topic} onChange={e => onUpdate('topic', e.target.value)}
          placeholder="e.g. Chapter 4" className={inputCls} />
      </div>
      <div className="flex items-end col-span-2 lg:col-span-1">
        <button onClick={onRemove} className="w-full py-2.5 bg-red-600/60 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors border border-red-500/40">
          Remove
        </button>
      </div>
    </div>
  );
}

// ─── Assign Students Modal ──────────────────────────────────────────────────
function AssignStudentsModal({ schedule, allStudents, onSave, onClose, saving }) {
  const assignedIds = new Set((schedule.assignedStudents || []).map(a => a.student?._id || a.student));
  const [selected, setSelected] = useState(new Set(assignedIds));
  const [search, setSearch] = useState('');

  const filtered = allStudents.filter(s => {
    const name = `${s.firstName} ${s.lastName}`.toLowerCase();
    return name.includes(search.toLowerCase()) || (s.studentInfo?.studentId || '').toLowerCase().includes(search.toLowerCase());
  });

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(s => s._id)));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#2a1010] rounded-xl shadow-2xl max-w-2xl w-full border border-[#CA133E]/50 max-h-[85vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-5 border-b border-white/20">
          <div>
            <h3 className="text-xl font-bold text-white">Assign Students</h3>
            <p className="text-sm text-gray-400 mt-0.5">Schedule: <span className="text-white font-medium">{schedule.title}</span></p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-xl hover:bg-white/10">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4 border-b border-white/20">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search students…"
              className="w-full pl-9 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-[#CA133E] focus:outline-none text-sm"
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-gray-400">{selected.size} selected out of {filtered.length}</span>
            <button onClick={toggleAll} className="text-sm text-[#CA133E] hover:text-red-400 font-semibold">
              {selected.size === filtered.length ? 'Deselect all' : 'Select all'}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filtered.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No students found</p>
          ) : filtered.map(student => {
            const isSelected = selected.has(student._id);
            return (
              <label
                key={student._id}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  isSelected ? 'border-[#CA133E] bg-[#CA133E]/15' : 'border-white/15 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className={`h-5 w-5 rounded flex items-center justify-center border-2 flex-shrink-0 transition-colors ${
                  isSelected ? 'bg-[#CA133E] border-[#CA133E]' : 'border-gray-500'
                }`}>
                  {isSelected && <CheckIcon className="h-3 w-3 text-white" />}
                </div>
                <input type="checkbox" checked={isSelected} onChange={() => toggle(student._id)} className="sr-only" />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">{student.firstName} {student.lastName}</p>
                  <p className="text-gray-400 text-xs">
                    {student.studentInfo?.studentId ? `ID: ${student.studentInfo.studentId}` : 'No ID'}
                    {student.studentInfo?.timezone ? ` · ${student.studentInfo.timezone}` : ''}
                  </p>
                </div>
                {assignedIds.has(student._id) && (
                  <span className="text-xs bg-green-800/50 text-green-300 px-2 py-0.5 rounded-full flex-shrink-0">assigned</span>
                )}
              </label>
            );
          })}
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-white/20">
          <button onClick={onClose} className="px-5 py-2.5 text-gray-300 bg-white/10 rounded-xl hover:bg-white/20 font-semibold">Cancel</button>
          <button
            onClick={() => onSave(Array.from(selected))}
            disabled={saving}
            className="px-6 py-2.5 bg-[#CA133E] hover:bg-[#A01030] text-white rounded-xl font-bold shadow-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : `Assign ${selected.size} Student${selected.size !== 1 ? 's' : ''}`}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Schedule Card ──────────────────────────────────────────────────────────
function ScheduleCard({ schedule, onEdit, onDelete, onAssign, onQr }) {
  const totalSessions = (schedule.schedule || []).reduce((s, d) => s + d.sessions.length, 0);
  const activeDays = (schedule.schedule || []).filter(d => d.sessions.length > 0).map(d => d.day.slice(0, 3));
  const assignedCount = (schedule.assignedStudents || []).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.07] border border-white/20 rounded-xl p-5 hover:border-[#CA133E]/60 transition-all group"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white truncate group-hover:text-red-300 transition-colors">{schedule.title}</h3>
          {schedule.notes && <p className="text-sm text-gray-400 mt-0.5 truncate">{schedule.notes}</p>}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={() => onEdit(schedule)} title="Edit sessions"
            className="p-2 text-gray-400 hover:text-white hover:bg-white/15 rounded-xl transition-colors">
            <PencilIcon className="h-4 w-4" />
          </button>
          <button onClick={() => onDelete(schedule._id)} title="Delete schedule"
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-xl transition-colors">
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="flex items-center gap-1.5 text-xs bg-white/10 px-2.5 py-1 rounded-full text-gray-300">
          <ClockIcon className="h-3.5 w-3.5" /> {totalSessions} session{totalSessions !== 1 ? 's' : ''}
        </span>
        <span className="flex items-center gap-1.5 text-xs bg-white/10 px-2.5 py-1 rounded-full text-gray-300">
          <UserGroupIcon className="h-3.5 w-3.5" /> {assignedCount} student{assignedCount !== 1 ? 's' : ''}
        </span>
        {activeDays.length > 0 && activeDays.map(d => (
          <span key={d} className="text-xs bg-[#CA133E]/20 text-red-300 px-2.5 py-1 rounded-full">{d}</span>
        ))}
      </div>

      {/* Assigned students preview */}
      {assignedCount > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {(schedule.assignedStudents || []).slice(0, 5).map(a => {
            const s = a.student;
            if (!s) return null;
            return (
              <span key={s._id} className="flex items-center gap-1 text-xs bg-white/10 text-gray-300 px-2 py-0.5 rounded-full">
                <UserIcon className="h-3 w-3" />{s.firstName} {s.lastName}
              </span>
            );
          })}
          {assignedCount > 5 && <span className="text-xs text-gray-500 px-2 py-0.5">+{assignedCount - 5} more</span>}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-white/20">
        <button
          onClick={() => onAssign(schedule)}
          className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#CA133E]/20 hover:bg-[#CA133E]/40 text-red-300 rounded-xl text-sm font-semibold transition-colors border border-[#CA133E]/30"
        >
          <UserGroupIcon className="h-4 w-4" /> Assign Students
        </button>
        <button
          onClick={() => onQr(schedule)}
          className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-xl text-sm font-semibold transition-colors"
        >
          <QrCodeIcon className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Weekly Overview (combined all-schedules view) ─────────────────────────
function WeeklyOverview({ overview, loading }) {
  const [hoveredSession, setHoveredSession] = useState(null);

  if (loading) return (
    <div className="grid grid-cols-7 gap-2">
      {DAYS.map(d => (
        <div key={d} className="bg-white/5 rounded-xl p-3 animate-pulse">
          <div className="h-4 bg-white/10 rounded mb-3 w-3/4 mx-auto" />
          {[...Array(2)].map((_, i) => <div key={i} className="h-16 bg-white/10 rounded mb-2" />)}
        </div>
      ))}
    </div>
  );

  if (!overview || overview.every(d => d.sessions.length === 0)) {
    return (
      <div className="text-center py-16">
        <CalendarDaysIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400 text-lg font-semibold">No sessions across any schedule yet</p>
        <p className="text-gray-600 text-sm mt-1">Create schedules and add sessions to see them here</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[900px] grid grid-cols-7 gap-2">
        {(overview || []).map((dayObj, di) => {
          const colors = TYPE_COLORS;
          return (
            <div key={dayObj.day} className="flex flex-col gap-1">
              {/* Day header */}
              <div className={`text-center py-2 rounded-xl text-sm font-bold ${
                dayObj.sessions.length > 0
                  ? 'bg-[#CA133E]/20 text-red-300 border border-[#CA133E]/30'
                  : 'bg-white/5 text-gray-500'
              }`}>
                {SHORT_DAYS[di]}
                {dayObj.sessions.length > 0 && (
                  <span className="block text-xs font-normal text-gray-400">{dayObj.sessions.length} session{dayObj.sessions.length !== 1 ? 's' : ''}</span>
                )}
              </div>

              {/* Sessions */}
              {dayObj.sessions.length === 0 ? (
                <div className="flex-1 border border-dashed border-white/20 rounded-xl min-h-[80px] flex items-center justify-center">
                  <span className="text-gray-700 text-xs">—</span>
                </div>
              ) : (
                dayObj.sessions.map((session, si) => {
                  const c = colors[session.type] || colors.theory;
                  const key = `${di}-${si}`;
                  return (
                    <div
                      key={si}
                      className={`relative p-2.5 rounded-xl border-l-4 ${c.border} ${c.light} cursor-pointer hover:brightness-125 transition-all`}
                      onMouseEnter={() => setHoveredSession(key)}
                      onMouseLeave={() => setHoveredSession(null)}
                    >
                      <div className={`text-xs font-bold ${c.text} mb-0.5`}>
                        {formatTime(session.startTime)}
                      </div>
                      <div className="text-white text-xs font-semibold leading-tight truncate">{session.topic}</div>
                      <div className="text-gray-400 text-xs mt-1 truncate">{session.scheduleTitle}</div>
                      {session.students.length > 0 && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <UserGroupIcon className="h-3 w-3 text-gray-500" />
                          <span className="text-gray-500 text-xs">{session.students.length}</span>
                        </div>
                      )}

                      {/* Hover tooltip */}
                      {hoveredSession === key && (
                        <div className="absolute z-20 left-full top-0 ml-2 w-52 bg-[#2a1010] border border-white/30 rounded-xl p-3 shadow-2xl pointer-events-none">
                          <p className="text-white font-bold text-sm mb-1">{session.topic}</p>
                          <p className="text-gray-400 text-xs mb-0.5">{formatTime(session.startTime)} – {formatTime(session.endTime)}</p>
                          <p className="text-gray-400 text-xs mb-2 italic">{session.scheduleTitle}</p>
                          {session.students.length > 0 && (
                            <>
                              <p className="text-gray-500 text-xs font-semibold mb-1">Students:</p>
                              <div className="space-y-0.5 max-h-28 overflow-y-auto">
                                {session.students.map(st => (
                                  <div key={st._id} className="text-white text-xs flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 bg-[#CA133E] rounded-full flex-shrink-0" />
                                    {st.name}
                                    {st.timezone && <span className="text-gray-500 text-[10px] ml-auto">{st.timezone}</span>}
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main ScheduleBuilder Component ────────────────────────────────────────
const ScheduleBuilder = () => {
  const [view, setView] = useState('schedules'); // 'schedules' | 'weekly'
  const [schedules, setSchedules] = useState([]);
  const [overview, setOverview] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modals
  const [editingSchedule, setEditingSchedule] = useState(null); // null = no modal, {} = new, { ...sched } = edit
  const [assigningSchedule, setAssigningSchedule] = useState(null);
  const [qrModal, setQrModal] = useState({ open: false, token: '', schedule: null });
  const [deleteConfirm, setDeleteConfirm] = useState(null); // scheduleId to delete

  const token = () => {
    const t = getValidToken();
    if (!t) { clearAuth(); redirectToLogin('invalid_token'); }
    return t;
  };

  const loadSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.SCHEDULE.SCHEDULES, { headers: setAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setSchedules(data.data.schedules || []);
      }
    } catch (e) {
      showError('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.SCHEDULE.WEEKLY_OVERVIEW, { headers: setAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setOverview(data.data.overview || []);
      }
    } catch (e) {
      showError('Failed to load weekly overview');
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  const loadStudents = useCallback(async () => {
    try {
      const res = await fetch(`${API_ENDPOINTS.TEACHER.STUDENTS}?all=true`, { headers: setAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAllStudents(data.data.students || []);
      }
    } catch (e) {
      // non-critical
    }
  }, []);

  useEffect(() => {
    loadSchedules();
    loadStudents();
  }, [loadSchedules, loadStudents]);

  useEffect(() => {
    if (view === 'weekly') loadOverview();
  }, [view, loadOverview]);

  // ── Create / Update schedule ──
  const handleSaveSchedule = async (formData) => {
    if (!token()) return;
    setSaving(true);
    try {
      let res;
      if (editingSchedule?._id) {
        res = await fetch(`${API_ENDPOINTS.SCHEDULE.SCHEDULES}/${editingSchedule._id}`, {
          method: 'PUT',
          headers: setAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(formData),
        });
      } else {
        res = await fetch(API_ENDPOINTS.SCHEDULE.SCHEDULES, {
          method: 'POST',
          headers: setAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(formData),
        });
      }
      if (res.ok) {
        showSuccess(editingSchedule?._id ? 'Schedule updated!' : 'Schedule created!');
        setEditingSchedule(null);
        await loadSchedules();
      } else {
        const err = await res.json();
        showError(err.message || 'Failed to save schedule');
      }
    } catch {
      showError('Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete schedule ──
  const handleDeleteSchedule = async (scheduleId) => {
    if (!token()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_ENDPOINTS.SCHEDULE.SCHEDULES}/${scheduleId}`, {
        method: 'DELETE',
        headers: setAuthHeaders(),
      });
      if (res.ok) {
        showSuccess('Schedule deleted');
        setDeleteConfirm(null);
        await loadSchedules();
      } else {
        const err = await res.json();
        showError(err.message || 'Failed to delete schedule');
      }
    } catch {
      showError('Failed to delete schedule');
    } finally {
      setSaving(false);
    }
  };

  // ── Assign students ──
  const handleAssignStudents = async (studentIds) => {
    if (!token()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_ENDPOINTS.SCHEDULE.SCHEDULES}/${assigningSchedule._id}/assign-students`, {
        method: 'POST',
        headers: setAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ studentIds }),
      });
      if (res.ok) {
        const data = await res.json();
        showSuccess(`Assigned ${studentIds.length} student${studentIds.length !== 1 ? 's' : ''} successfully`);
        setAssigningSchedule(null);
        await loadSchedules();
      } else {
        const err = await res.json();
        showError(err.message || 'Failed to assign students');
      }
    } catch {
      showError('Failed to assign students');
    } finally {
      setSaving(false);
    }
  };

  // ── QR ──
  const openQr = async (schedule) => {
    // Find first session with times to generate QR
    const firstSession = (schedule.schedule || [])
      .flatMap(d => d.sessions.map(s => ({ day: d.day, ...s })))
      .find(s => s.startTime && s.endTime);

    if (!firstSession) {
      showWarning('No sessions in this schedule to generate a QR code for');
      return;
    }
    try {
      const url = `${API_ENDPOINTS.SCHEDULE.QR}?day=${encodeURIComponent(firstSession.day)}&start=${encodeURIComponent(firstSession.startTime)}&end=${encodeURIComponent(firstSession.endTime)}`;
      const res = await fetch(url, { headers: setAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setQrModal({ open: true, token: data?.data?.token || '', schedule });
      } else {
        showError('Failed to generate QR code');
      }
    } catch {
      showError('Failed to generate QR code');
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <CalendarDaysIcon className="h-7 w-7 text-[#CA133E]" />
            Schedule Builder
          </h2>
          <p className="text-gray-400 text-sm mt-1">Create per-student schedules and view a combined weekly overview</p>
        </div>

        {/* View toggle + New Schedule button */}
        <div className="flex items-center gap-3">
          <div className="flex bg-white/10 rounded-xl p-1 gap-1">
            <button
              onClick={() => setView('schedules')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${view === 'schedules' ? 'bg-[#CA133E] text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <ListBulletIcon className="h-4 w-4" /> Schedules
            </button>
            <button
              onClick={() => setView('weekly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${view === 'weekly' ? 'bg-[#CA133E] text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <TableCellsIcon className="h-4 w-4" /> Weekly View
            </button>
          </div>

          {view === 'schedules' && (
            <button
              onClick={() => setEditingSchedule({})}
              className="flex items-center gap-2 bg-[#CA133E] hover:bg-[#A01030] text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg transition-colors"
            >
              <PlusIcon className="h-4 w-4" /> New Schedule
            </button>
          )}
        </div>
      </div>

      {/* ── Schedules View ── */}
      {view === 'schedules' && (
        <>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white/10 rounded-xl p-5 animate-pulse border border-white/20 h-44" />
              ))}
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-16 bg-white/5 rounded-xl border border-dashed border-white/20">
              <CalendarDaysIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No schedules yet</h3>
              <p className="text-gray-400 mb-6">Create your first schedule and assign students to it</p>
              <button
                onClick={() => setEditingSchedule({})}
                className="bg-[#CA133E] hover:bg-[#A01030] text-white px-6 py-2.5 rounded-xl font-bold shadow-lg"
              >
                Create First Schedule
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {schedules.map(sched => (
                <ScheduleCard
                  key={sched._id}
                  schedule={sched}
                  onEdit={s => setEditingSchedule(s)}
                  onDelete={id => setDeleteConfirm(id)}
                  onAssign={s => setAssigningSchedule(s)}
                  onQr={openQr}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Weekly Overview ── */}
      {view === 'weekly' && (
        <div className="bg-white/5 rounded-xl border border-white/15 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-white">Combined Weekly View</h3>
              <p className="text-gray-400 text-sm">All sessions from all schedules in one place</p>
            </div>
            <button onClick={loadOverview} className="text-sm text-gray-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
              Refresh
            </button>
          </div>
          <WeeklyOverview overview={overview} loading={overviewLoading} />
        </div>
      )}

      {/* ── Modals ── */}
      <AnimatePresence>
        {editingSchedule !== null && (
          <SessionEditorModal
            key="editor"
            schedule={editingSchedule._id ? editingSchedule : null}
            onSave={handleSaveSchedule}
            onClose={() => setEditingSchedule(null)}
            saving={saving}
          />
        )}

        {assigningSchedule && (
          <AssignStudentsModal
            key="assign"
            schedule={assigningSchedule}
            allStudents={allStudents}
            onSave={handleAssignStudents}
            onClose={() => setAssigningSchedule(null)}
            saving={saving}
          />
        )}

        {deleteConfirm && (
          <div key="delete" className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#2a1010] rounded-xl p-6 border border-red-600/50 max-w-sm w-full text-center"
            >
              <TrashIcon className="h-12 w-12 text-red-500 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-white mb-2">Delete Schedule?</h3>
              <p className="text-gray-400 text-sm mb-6">This will permanently delete the schedule and remove all student assignments.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 font-semibold">Cancel</button>
                <button
                  onClick={() => handleDeleteSchedule(deleteConfirm)}
                  disabled={saving}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold disabled:opacity-50"
                >
                  {saving ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {qrModal.open && (
          <div key="qr" className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#2a1010] rounded-xl p-6 border border-white/30 max-w-md w-full"
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-white font-bold text-lg">Attendance QR</h3>
                  <p className="text-gray-400 text-sm">{qrModal.schedule?.title}</p>
                </div>
                <button onClick={() => setQrModal({ open: false, token: '', schedule: null })} className="text-gray-400 hover:text-white">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              {qrModal.token ? (
                <div className="space-y-4">
                  <div className="flex justify-center bg-white p-4 rounded-xl">
                    <QRCode value={qrModal.token} size={200} bgColor="#ffffff" fgColor="#000000" />
                  </div>
                  <p className="text-gray-400 text-sm text-center">Students scan this to check in for the first session</p>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">No token generated</p>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ScheduleBuilder;
