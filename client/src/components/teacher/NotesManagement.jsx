import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ENDPOINTS } from '../../config/api';
import { showError, showSuccess } from '../../utils/toast';
import { PlusIcon, PencilIcon, TrashIcon, FunnelIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

const NotesManagement = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [filters, setFilters] = useState({ phase: '', search: '' });
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0, hasNext: false, hasPrev: false });
  const [formData, setFormData] = useState({ title: '', phase: '1', linkUrl: '', order: '' });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, [filters, pagination.current]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filters.phase) params.append('phase', filters.phase);
      if (filters.search) params.append('search', filters.search);
      params.append('page', pagination.current);
      params.append('limit', 10);
      const response = await fetch(`${API_ENDPOINTS.TEACHER.NOTES}?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setNotes(data.data.notes);
        setPagination(data.data.pagination);
      }
    } catch (e) {
      console.error('Error fetching notes:', e);
      showError('Failed to fetch notes');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => setFormData({ title: '', phase: '1', linkUrl: '', order: '' });

  const handleCreate = async () => {
    try {
      if (!formData.title || !formData.linkUrl || !formData.phase) {
        showError('Please fill Title, Phase and Link');
        return;
      }
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.TEACHER.NOTES, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        showSuccess('Note created successfully');
        setShowCreateModal(false);
        resetForm();
        fetchNotes();
      } else {
        const err = await response.json();
        showError(err.message || 'Failed to create note');
      }
    } catch (e) {
      console.error('Create note error:', e);
      showError('Failed to create note');
    }
  };

  const handleUpdate = async () => {
    try {
      if (!formData.title || !formData.linkUrl || !formData.phase) {
        showError('Please fill Title, Phase and Link');
        return;
      }
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.TEACHER.NOTES}/${selectedNote._id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        showSuccess('Note updated successfully');
        setShowEditModal(false);
        resetForm();
        fetchNotes();
      } else {
        const err = await response.json();
        showError(err.message || 'Failed to update note');
      }
    } catch (e) {
      console.error('Update note error:', e);
      showError('Failed to update note');
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.TEACHER.NOTES}/${selectedNote._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        showSuccess('Note deleted successfully');
        setShowDeleteModal(false);
        fetchNotes();
      } else {
        const err = await response.json();
        showError(err.message || 'Failed to delete note');
      }
    } catch (e) {
      console.error('Delete note error:', e);
      showError('Failed to delete note');
    }
  };

  const openEdit = (note) => {
    setSelectedNote(note);
    setFormData({ title: note.title, phase: note.phase?.toString() || '1', linkUrl: note.linkUrl, order: note.order?.toString() || '' });
    setShowEditModal(true);
  };

  const openDelete = (note) => { setSelectedNote(note); setShowDeleteModal(true); };

  const NoteCard = ({ note }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-800/70 rounded-xl border border-gray-700/50 p-4 hover:bg-gray-700/90">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full inline-block mb-2">Phase {note.phase} • Order {note.order || 0}</div>
          <h3 className="text-lg font-semibold text-white">{note.title}</h3>
          <p className="text-sm text-gray-400 break-all mt-1">{note.linkUrl}</p>
        </div>
        <div className="flex flex-col space-y-2 ml-4">
          <button onClick={() => openEdit(note)} className="p-2 bg-blue-600/20 text-blue-400 rounded-xl hover:bg-blue-600/40"><PencilIcon className="h-4 w-4" /></button>
          <button onClick={() => openDelete(note)} className="p-2 bg-red-600/20 text-red-400 rounded-xl hover:bg-red-600/40"><TrashIcon className="h-4 w-4" /></button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 bg-gray-800/60 rounded-xl p-4 sm:p-6 border-2 border-gray-600/50">
        <div className="flex-1">
          <h2 className="text-lg sm:text-xl lg:text-[20pt] font-bold text-white">Interactive Notes</h2>
          <p className="text-sm text-gray-300 mt-1">Add Prezi notes by Chapter and Phase</p>
        </div>
        <motion.button onClick={() => setShowCreateModal(true)} className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <PlusIcon className="h-5 w-5" /><span>Add Note</span>
        </motion.button>
      </div>

      <div className="bg-gray-800/60 rounded-xl p-4 sm:p-6 border-2 border-gray-600/50">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <input type="text" placeholder="Search notes..." value={filters.search} onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))} className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="ml-3 flex items-center space-x-2 px-4 py-2 bg-gray-700/50 text-gray-300 rounded-xl hover:bg-gray-600/50"><FunnelIcon className="h-5 w-5" />{showFilters ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}</button>
        </div>
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <select value={filters.phase} onChange={(e) => setFilters(prev => ({ ...prev, phase: e.target.value }))} className="px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white">
                <option value="">All Phases</option>
                <option value="1">Phase 1</option>
                <option value="2">Phase 2</option>
                <option value="3">Phase 3</option>
              </select>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading notes...</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-lg">No notes found</p>
            <p className="text-gray-500 text-sm">Add your first note to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {notes.map((note) => (<NoteCard key={note._id} note={note} />))}
          </div>
        )}
      </div>

      {pagination.pages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <button onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))} disabled={!pagination.hasPrev} className="px-4 py-2 bg-gray-700/50 text-gray-300 rounded-xl disabled:opacity-50">Previous</button>
          <span className="text-gray-400">Page {pagination.current} of {pagination.pages}</span>
          <button onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))} disabled={!pagination.hasNext} className="px-4 py-2 bg-gray-700/50 text-gray-300 rounded-xl disabled:opacity-50">Next</button>
        </div>
      )}

      <AnimatePresence>
        {(showCreateModal || showEditModal) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">{showCreateModal ? 'Add New Note' : 'Edit Note'}</h3>
                <button onClick={() => { setShowCreateModal(false); setShowEditModal(false); resetForm(); }} className="text-gray-400 hover:text-white"><span className="sr-only">Close</span>✕</button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                    <input type="text" value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white" placeholder="Enter note title" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Phase</label>
                    <select value={formData.phase} onChange={(e) => setFormData(prev => ({ ...prev, phase: e.target.value }))} className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white">
                      <option value="1">Phase 1</option>
                      <option value="2">Phase 2</option>
                      <option value="3">Phase 3</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Prezi Link</label>
                  <input type="url" value={formData.linkUrl} onChange={(e) => setFormData(prev => ({ ...prev, linkUrl: e.target.value }))} className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white" placeholder="https://prezi.com/..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Order (optional)</label>
                  <input type="number" value={formData.order} onChange={(e) => setFormData(prev => ({ ...prev, order: e.target.value }))} className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white" placeholder="0" />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button onClick={() => { setShowCreateModal(false); setShowEditModal(false); resetForm(); }} className="px-4 py-2 bg-gray-600 text-white rounded-xl">Cancel</button>
                <button onClick={showCreateModal ? handleCreate : handleUpdate} className="px-4 py-2 bg-blue-600 text-white rounded-xl">{showCreateModal ? 'Create Note' : 'Update Note'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-2">Delete Note</h3>
                <p className="text-gray-400 mb-6">Are you sure you want to delete "{selectedNote?.title}"?</p>
                <div className="flex justify-center space-x-3">
                  <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 bg-gray-600 text-white rounded-xl">Cancel</button>
                  <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-xl">Delete</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotesManagement;


