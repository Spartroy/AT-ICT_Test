import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ENDPOINTS } from '../../config/api';
import { getValidToken, clearAuth, redirectToLogin, setAuthHeaders } from '../../utils/auth';
import { showSuccess, showError, showWarning } from '../../utils/toast';
import {
  DocumentTextIcon,
  FolderIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  XMarkIcon,
  CloudArrowUpIcon,
  AcademicCapIcon,
  ComputerDesktopIcon,
  MagnifyingGlassIcon,
  LinkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const typeConfig = {
  theory:    { icon: AcademicCapIcon,     label: 'Theory',    gradient: 'from-blue-600 to-blue-800',     badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',     tab: 'bg-blue-500/20 text-blue-300 border-blue-400/40' },
  practical: { icon: ComputerDesktopIcon, label: 'Practical', gradient: 'from-emerald-600 to-emerald-800', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', tab: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' },
  other:     { icon: DocumentTextIcon,    label: 'Other',     gradient: 'from-violet-600 to-violet-800',  badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30',  tab: 'bg-violet-500/20 text-violet-300 border-violet-400/40' },
};

const EMPTY_FORM = {
  title: '',
  description: '',
  type: 'theory',
  file: null,
  thumbnail: null,
  externalUrl: '',
};

const MaterialsCenter = () => {
  const [materials, setMaterials]             = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [uploading, setUploading]             = useState(false);
  const [uploadProgress, setUploadProgress]   = useState(0);
  const [filter, setFilter]                   = useState('all');
  const [searchTerm, setSearchTerm]           = useState('');
  const [deleteTarget, setDeleteTarget]       = useState(null);
  const [formData, setFormData]               = useState(EMPTY_FORM);
  const [useExternalUrl, setUseExternalUrl]   = useState(false);

  const fileInputRef      = useRef(null);
  const thumbnailInputRef = useRef(null);

  useEffect(() => { fetchMaterials(); }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const token = getValidToken();
      if (!token) { clearAuth(); redirectToLogin('invalid_token'); return; }

      const response = await fetch(API_ENDPOINTS.TEACHER.MATERIALS, {
        headers: setAuthHeaders({ 'Content-Type': 'application/json' })
      });

      if (response.ok) {
        const data = await response.json();
        setMaterials(data.data.materials || []);
      }
    } catch {
      showError('Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) { showError('File size must be less than 100MB'); return; }
    setFormData(f => ({ ...f, file }));
  };

  const handleThumbnailSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showError('Thumbnail must be less than 2MB'); return; }
    if (!file.type.startsWith('image/')) { showError('Thumbnail must be an image'); return; }
    setFormData(f => ({ ...f, thumbnail: file }));
  };

  const openUploadModal = () => {
    setEditingMaterial(null);
    setFormData(EMPTY_FORM);
    setUseExternalUrl(false);
    setShowUploadModal(true);
  };

  const openEditModal = (material) => {
    setEditingMaterial(material);
    setFormData({
      title: material.title,
      description: material.description || '',
      type: material.type,
      file: null,
      thumbnail: null,
      externalUrl: material.externalUrl || '',
    });
    setUseExternalUrl(!!material.externalUrl);
    setShowUploadModal(true);
  };

  const closeModal = () => {
    setShowUploadModal(false);
    setEditingMaterial(null);
    setFormData(EMPTY_FORM);
    setUseExternalUrl(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!editingMaterial && !formData.file && !useExternalUrl) {
      showError('Please select a file or enter an external link');
      return;
    }
    if (useExternalUrl && !formData.externalUrl.trim()) {
      showError('Please enter an external URL');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      const token = getValidToken();
      if (!token) { clearAuth(); redirectToLogin('invalid_token'); return; }

      const uploadData = new FormData();
      uploadData.append('title', formData.title);
      uploadData.append('type', formData.type);
      if (formData.description) uploadData.append('description', formData.description);
      if (formData.file && !useExternalUrl) uploadData.append('material', formData.file);
      if (formData.thumbnail) uploadData.append('thumbnail', formData.thumbnail);
      if (useExternalUrl && formData.externalUrl) uploadData.append('externalUrl', formData.externalUrl);

      const url    = editingMaterial ? `${API_ENDPOINTS.TEACHER.MATERIALS}/${editingMaterial._id}` : API_ENDPOINTS.TEACHER.MATERIALS;
      const method = editingMaterial ? 'PUT' : 'POST';

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            setUploadProgress(Math.round((event.loaded / event.total) * 100));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText);
            showSuccess(`Material ${editingMaterial ? 'updated' : 'uploaded'} successfully!`);
            if (editingMaterial) {
              setMaterials(ms => ms.map(m => m._id === editingMaterial._id ? data.data.material : m));
            } else {
              setMaterials(ms => [data.data.material, ...ms]);
            }
            closeModal();
            resolve();
          } else {
            try {
              const err = JSON.parse(xhr.responseText);
              showError(err.message || 'Upload failed');
            } catch { showError('Upload failed'); }
            reject();
          }
        });

        xhr.addEventListener('error', () => { showError('Network error during upload'); reject(); });
        xhr.open(method, url);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(uploadData);
      });

    } catch { /* errors shown via showError */ } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.TEACHER.MATERIALS}/${deleteTarget._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        showSuccess('Material deleted successfully');
        setMaterials(ms => ms.filter(m => m._id !== deleteTarget._id));
      } else {
        const err = await response.json();
        showError(err.message || 'Failed to delete');
      }
    } catch {
      showError('Error deleting material');
    } finally {
      setDeleteTarget(null);
    }
  };

  const downloadMaterial = async (material) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.TEACHER.MATERIALS}/${material._id}/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = material.fileName;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        showError('Failed to download file');
      }
    } catch { showError('Error downloading material'); }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '—';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileEmoji = (mimeType) => {
    if (!mimeType) return '📁';
    if (mimeType.includes('pdf'))          return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📊';
    if (mimeType.includes('excel') || mimeType.includes('sheet')) return '📈';
    if (mimeType.includes('image'))  return '🖼️';
    if (mimeType.includes('video'))  return '🎥';
    if (mimeType.includes('audio'))  return '🎵';
    if (mimeType.includes('zip'))    return '🗜️';
    return '📁';
  };

  const filteredMaterials = materials.filter(m => {
    const matchesType   = filter === 'all' || m.type === filter;
    const matchesSearch = !searchTerm || m.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const counts = {
    theory:    materials.filter(m => m.type === 'theory').length,
    practical: materials.filter(m => m.type === 'practical').length,
    other:     materials.filter(m => m.type === 'other').length,
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 bg-[#161616] rounded-2xl p-6 border border-white/5">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-white/5 rounded-xl w-48 animate-pulse" />
          <div className="h-10 bg-white/5 rounded-xl w-36 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-700/30 rounded-2xl overflow-hidden animate-pulse">
              <div className="h-40 bg-white/5" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-white/5 rounded w-3/4" />
                <div className="h-3 bg-gray-700/30 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Main ─────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 bg-[#161616] rounded-2xl p-6 border border-white/5">

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#CA133E]/20 rounded-xl border border-[#CA133E]/30">
            <FolderIcon className="h-6 w-6 text-[#CA133E]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Materials Center</h2>
            <p className="text-sm text-gray-400 mt-0.5">Upload and manage learning materials for students</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 sm:flex-initial sm:w-64">
            <MagnifyingGlassIcon className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search materials…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#161616] border border-white/5 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#CA133E] transition-colors/50 transition-all"
            />
          </div>
          <button
            onClick={openUploadModal}
            className="flex items-center justify-center gap-2 bg-[#CA133E] hover:bg-[#a01030] text-white px-5 py-2.5 rounded-xl font-semibold transition-colors shadow-lg whitespace-nowrap"
          >
            <PlusIcon className="h-5 w-5" />
            Upload Material
          </button>
        </div>
      </div>

      {/* Upload progress (global) */}
      <AnimatePresence>
        {uploading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#161616] rounded-xl p-4 border border-white/5"
          >
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white font-medium">Uploading…</span>
              <span className="text-[#CA133E] font-bold">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-700/60 rounded-full h-2">
              <motion.div
                className="bg-[#CA133E] h-2 rounded-full"
                animate={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Type filter tabs + stats */}
      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'theory', 'practical', 'other']).map((type) => {
          const cfg = type !== 'all' ? typeConfig[type] : null;
          const TypeIcon = cfg?.icon;
          const isActive = filter === type;
          const count = type === 'all' ? materials.length : counts[type];

          return (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border
                ${isActive
                  ? type === 'all'
                    ? 'bg-[#CA133E]/20 text-[#CA133E] border-[#CA133E]/40'
                    : `${cfg.tab} border-current`
                  : 'text-gray-400 border-white/10 hover:text-white bg-[#1A1A1A] hover:border-white/20'
                }`}
            >
              {TypeIcon && <TypeIcon className="h-4 w-4" />}
              {type.charAt(0).toUpperCase() + type.slice(1)}
              <span className={`px-1.5 py-0.5 rounded-md text-xs font-bold
                ${isActive ? 'bg-white/20' : 'bg-gray-700/60 text-gray-500'}`}>
                {count}
              </span>
            </button>
          );
        })}

        <span className="ml-auto text-xs text-gray-500">
          {filteredMaterials.length} {filteredMaterials.length === 1 ? 'material' : 'materials'}
          {(searchTerm || filter !== 'all') && ' shown'}
        </span>
      </div>

      {/* Materials grid */}
      {filteredMaterials.length === 0 ? (
        <div className="py-20 text-center rounded-2xl border border-dashed border-white/10 bg-white/3">
          <FolderIcon className="h-14 w-14 mx-auto text-gray-600 mb-4" />
          <h3 className="text-base font-semibold text-white mb-1">
            {searchTerm || filter !== 'all' ? 'No matching materials' : 'No Materials Yet'}
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            {searchTerm || filter !== 'all'
              ? 'Try adjusting your search or filter.'
              : 'Upload your first material to get started.'}
          </p>
          {!searchTerm && filter === 'all' && (
            <button
              onClick={openUploadModal}
              className="px-5 py-2.5 bg-[#CA133E] hover:bg-[#a01030] text-white rounded-xl font-semibold transition-colors"
            >
              Upload Material
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMaterials.map((material, index) => {
            const cfg     = typeConfig[material.type] || typeConfig.other;
            const TypeIcon = cfg.icon;

            return (
              <motion.div
                key={material._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group bg-[#161616] rounded-2xl overflow-hidden border border-white/5 hover:border-white/5 shadow-md hover:shadow-xl transition-all duration-300"
              >
                {/* Cover */}
                <div className="relative h-40 overflow-hidden">
                  {material.thumbnailUrl ? (
                    <img
                      src={material.thumbnailUrl}
                      alt={material.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${cfg.gradient} flex flex-col items-center justify-center`}
                    style={{ display: material.thumbnailUrl ? 'none' : 'flex' }}
                  >
                    <TypeIcon className="h-10 w-10 text-white/70 mb-1" />
                    <span className="text-2xl">{getFileEmoji(material.mimeType)}</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />

                  {/* Type badge */}
                  <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-semibold border ${cfg.badge}`}>
                    {cfg.label}
                  </div>

                  {/* Action buttons (visible on hover) */}
                  <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => downloadMaterial(material)}
                      title="Download"
                      className="p-2 bg-black/50 hover:bg-emerald-600/80 rounded-xl transition-colors"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 text-white" />
                    </button>
                    <button
                      onClick={() => openEditModal(material)}
                      title="Edit"
                      className="p-2 bg-black/50 hover:bg-blue-600/80 rounded-xl transition-colors"
                    >
                      <PencilIcon className="h-4 w-4 text-white" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(material)}
                      title="Delete"
                      className="p-2 bg-black/50 hover:bg-red-600/80 rounded-xl transition-colors"
                    >
                      <TrashIcon className="h-4 w-4 text-white" />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="text-sm font-bold text-white line-clamp-2 mb-3 leading-snug">
                    {material.title}
                  </h3>
                  {material.description && (
                    <p className="text-xs text-gray-400 line-clamp-2 mb-3">{material.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                      <span>{material.downloadCount || 0} downloads</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {material.externalUrl && <LinkIcon className="h-3.5 w-3.5 text-violet-400" title="External link" />}
                      {material.fileSize > 0 && <span>{formatFileSize(material.fileSize)}</span>}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 mt-2 pt-2 border-t border-white/5">
                    {new Date(material.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Upload / Edit Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#161616] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#CA133E]/20 rounded-xl border border-[#CA133E]/30">
                    <CloudArrowUpIcon className="h-5 w-5 text-[#CA133E]" />
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    {editingMaterial ? 'Edit Material' : 'Upload New Material'}
                  </h3>
                </div>
                <button onClick={closeModal} className="p-2 text-gray-400 hover:text-white hover:bg-[#1A1A1A] rounded-xl transition-colors">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1.5">Title <span className="text-[#CA133E]">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData(f => ({ ...f, title: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-[#1A1A1A] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#CA133E] transition-colors text-sm"
                    placeholder="e.g. Introduction to Programming"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1.5">Description <span className="text-gray-500 font-normal">(optional)</span></label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                    rows={2}
                    className="w-full px-4 py-2.5 bg-[#1A1A1A] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#CA133E] transition-colors text-sm resize-none"
                    placeholder="Brief description visible to students…"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Type <span className="text-[#CA133E]">*</span></label>
                  <div className="flex gap-2">
                    {Object.entries(typeConfig).map(([key, cfg]) => {
                      const Icon = cfg.icon;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setFormData(f => ({ ...f, type: key }))}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all
                            ${formData.type === key ? `${cfg.tab} border-current` : 'text-gray-400 border-white/10 bg-[#1A1A1A] hover:border-white/20'}`}
                        >
                          <Icon className="h-4 w-4" />
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* File source toggle */}
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Content Source <span className="text-[#CA133E]">*</span></label>
                  <div className="flex gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => setUseExternalUrl(false)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all
                        ${!useExternalUrl ? 'bg-[#CA133E]/20 text-[#CA133E] border-[#CA133E]/40' : 'text-gray-400 border-white/10 bg-[#1A1A1A] hover:border-white/20'}`}
                    >
                      <CloudArrowUpIcon className="h-4 w-4" />
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseExternalUrl(true)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all
                        ${useExternalUrl ? 'bg-violet-500/20 text-violet-300 border-violet-500/40' : 'text-gray-400 border-white/10 bg-[#1A1A1A] hover:border-white/20'}`}
                    >
                      <LinkIcon className="h-4 w-4" />
                      External Link
                    </button>
                  </div>

                  {useExternalUrl ? (
                    <input
                      type="url"
                      value={formData.externalUrl}
                      onChange={(e) => setFormData(f => ({ ...f, externalUrl: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-[#1A1A1A] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors text-sm"
                      placeholder="https://drive.google.com/…"
                    />
                  ) : (
                    <div
                      className="border-2 border-dashed border-white/5 rounded-xl p-5 text-center hover:border-[#CA133E]/40 transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileSelect}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar"
                        required={!editingMaterial && !useExternalUrl}
                      />
                      {formData.file ? (
                        <div className="flex items-center justify-center gap-3">
                          <span className="text-2xl">{getFileEmoji(formData.file.type)}</span>
                          <div className="text-left">
                            <p className="text-sm font-semibold text-white">{formData.file.name}</p>
                            <p className="text-xs text-gray-400">{formatFileSize(formData.file.size)}</p>
                          </div>
                          <span className="text-xs text-[#CA133E] ml-2">Click to change</span>
                        </div>
                      ) : editingMaterial && editingMaterial.fileName ? (
                        <div className="flex items-center justify-center gap-3">
                          <span className="text-2xl">{getFileEmoji(editingMaterial.mimeType)}</span>
                          <div className="text-left">
                            <p className="text-sm font-semibold text-white">{editingMaterial.fileName}</p>
                            <p className="text-xs text-gray-400">{formatFileSize(editingMaterial.fileSize)} · Click to replace</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <CloudArrowUpIcon className="h-10 w-10 text-gray-500 mx-auto mb-2" />
                          <p className="text-sm text-gray-400">Click to select a file</p>
                          <p className="text-xs text-gray-600 mt-1">PDF, Word, PowerPoint, Excel, ZIP · Max 100MB</p>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Thumbnail */}
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1.5">Thumbnail <span className="text-gray-500 font-normal">(optional · shown as cover image)</span></label>
                  <div
                    className="border-2 border-dashed border-white/5 rounded-xl p-4 text-center hover:border-[#CA133E]/30 transition-colors cursor-pointer"
                    onClick={() => thumbnailInputRef.current?.click()}
                  >
                    <input
                      ref={thumbnailInputRef}
                      type="file"
                      onChange={handleThumbnailSelect}
                      className="hidden"
                      accept="image/*"
                    />
                    {formData.thumbnail ? (
                      <div className="flex items-center justify-center gap-3">
                        <img src={URL.createObjectURL(formData.thumbnail)} alt="preview" className="h-14 w-14 object-cover rounded-xl" />
                        <div className="text-left">
                          <p className="text-sm text-white">{formData.thumbnail.name}</p>
                          <p className="text-xs text-[#CA133E]">Click to change</p>
                        </div>
                      </div>
                    ) : editingMaterial?.thumbnailUrl ? (
                      <div className="flex items-center justify-center gap-3">
                        <img src={editingMaterial.thumbnailUrl} alt="current" className="h-14 w-14 object-cover rounded-xl" />
                        <div className="text-left">
                          <p className="text-sm text-gray-300">Current thumbnail</p>
                          <p className="text-xs text-[#CA133E]">Click to change</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-gray-500">
                        <span className="text-2xl">🖼️</span>
                        <div className="text-left">
                          <p className="text-sm">Add a cover image</p>
                          <p className="text-xs text-gray-600">JPEG, PNG, GIF · Max 2MB</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload progress */}
                <AnimatePresence>
                  {uploading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Uploading…</span>
                        <span className="text-[#CA133E] font-bold">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-700/60 rounded-full h-1.5">
                        <motion.div className="bg-[#CA133E] h-1.5 rounded-full" animate={{ width: `${uploadProgress}%` }} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={uploading}
                    className="px-5 py-2.5 bg-[#1A1A1A] hover:bg-white/8 text-gray-400 rounded-xl font-semibold transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-6 py-2.5 bg-[#CA133E] hover:bg-[#a01030] text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px] flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Uploading…
                      </>
                    ) : editingMaterial ? 'Update Material' : 'Upload Material'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete confirmation modal ───────────────────────────────────────── */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setDeleteTarget(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#161616] border border-white/10 rounded-2xl w-full max-w-sm p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-red-900/30 rounded-xl border border-red-900/40">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Delete Material?</h3>
              </div>
              <p className="text-sm text-gray-400 mb-6">
                <span className="text-white font-semibold">"{deleteTarget.title}"</span> will be permanently removed from Cloudinary and no longer accessible to students.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 bg-[#1A1A1A] hover:bg-white/8 text-gray-400 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MaterialsCenter;
