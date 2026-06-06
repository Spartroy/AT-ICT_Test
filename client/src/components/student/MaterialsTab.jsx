import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ENDPOINTS } from '../../config/api';
import { showError } from '../../utils/toast';
import {
  BookOpenIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  FolderIcon,
  AcademicCapIcon,
  ComputerDesktopIcon,
  MagnifyingGlassIcon,
  UserIcon,
  ExclamationCircleIcon,
  XMarkIcon,
  CalendarIcon,
  InformationCircleIcon,
  LinkIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';

const MaterialsTab = ({ studentData }) => {
  const [materials, setMaterials]       = useState({ theory: [], practical: [], other: [] });
  const [allMaterials, setAllMaterials] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeSection, setActiveSection] = useState('theory');
  const [searchTerm, setSearchTerm]     = useState('');
  const [error, setError]               = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [showDetailModal, setShowDetailModal]   = useState(false);
  const [downloading, setDownloading]   = useState(null);

  useEffect(() => { fetchMaterials(); }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.STUDENT.MATERIALS, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        setMaterials(data.data.materials);
        setAllMaterials(data.data.allMaterials);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch materials');
      }
    } catch (err) {
      setError('Network error — could not load materials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (materialId, fileName) => {
    try {
      setDownloading(materialId);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.STUDENT.MATERIALS}/${materialId}/download`, {
        headers: { 'Authorization': `Bearer ${token}` },
        redirect: 'follow'
      });
      if (response.ok) {
        window.open(response.url, '_blank');
      } else {
        const errorData = await response.json();
        showError(errorData.message || 'Failed to download material');
      }
    } catch {
      showError('Failed to download material. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  const handleOpenExternal = (material) => {
    const url = material.externalUrl.includes('/view')
      ? material.externalUrl.replace('/view', '/preview')
      : material.externalUrl;
    window.open(url, '_blank');
  };

  const openDetailModal = (material) => {
    setSelectedMaterial(material);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedMaterial(null);
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '—';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileEmoji = (mimeType) => {
    if (!mimeType) return '📁';
    if (mimeType.includes('pdf'))                          return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📊';
    if (mimeType.includes('excel') || mimeType.includes('sheet')) return '📈';
    if (mimeType.includes('image'))  return '🖼️';
    if (mimeType.includes('video'))  return '🎥';
    if (mimeType.includes('audio'))  return '🎵';
    if (mimeType.includes('zip'))    return '🗜️';
    return '📁';
  };

  const typeConfig = {
    theory:    { icon: AcademicCapIcon,    label: 'Theory',    gradient: 'from-blue-600 to-blue-800',    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',    tab: 'bg-blue-500/20 text-blue-300' },
    practical: { icon: ComputerDesktopIcon, label: 'Practical', gradient: 'from-emerald-600 to-emerald-800', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', tab: 'bg-emerald-500/20 text-emerald-300' },
    other:     { icon: FolderIcon,          label: 'Other',     gradient: 'from-violet-600 to-violet-800',  badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30',  tab: 'bg-violet-500/20 text-violet-300' },
  };

  const getFilteredMaterials = () =>
    allMaterials.filter(m =>
      m.type === activeSection &&
      (searchTerm === '' || m.title.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  const counts = {
    theory:    allMaterials.filter(m => m.type === 'theory').length,
    practical: allMaterials.filter(m => m.type === 'practical').length,
    other:     allMaterials.filter(m => m.type === 'other').length,
  };

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 bg-gray-800/60 rounded-2xl p-6 shadow-2xl backdrop-blur-sm border border-gray-700/50">
        <div className="h-8 bg-gray-700/50 rounded-xl w-52 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-700/30 rounded-2xl overflow-hidden animate-pulse">
              <div className="h-52 bg-gray-700/50" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-700/50 rounded w-3/4" />
                <div className="h-3 bg-gray-700/30 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="bg-gray-800/60 rounded-2xl p-12 text-center border border-red-900/40 shadow-2xl">
        <div className="w-16 h-16 bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ExclamationCircleIcon className="h-8 w-8 text-red-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Couldn't Load Materials</h3>
        <p className="text-gray-400 mb-6 text-sm">{error}</p>
        <button
          onClick={fetchMaterials}
          className="px-6 py-2.5 bg-[#CA133E] hover:bg-[#a01030] text-white rounded-xl font-medium transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const filteredMaterials = getFilteredMaterials();

  // ── Material Card ────────────────────────────────────────────────────────────
  const MaterialCard = ({ material, index }) => {
    const cfg = typeConfig[material.type] || typeConfig.other;
    const TypeIcon = cfg.icon;
    const isDownloading = downloading === material._id;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06 }}
        className="group relative bg-gray-900/70 rounded-2xl overflow-hidden border border-gray-700/40 hover:border-gray-600/60 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
        onClick={() => openDetailModal(material)}
      >
        {/* Cover */}
        <div className="relative h-48 overflow-hidden">
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

          {/* Gradient fallback */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${cfg.gradient} flex flex-col items-center justify-center text-white`}
            style={{ display: material.thumbnailUrl ? 'none' : 'flex' }}
          >
            <TypeIcon className="h-14 w-14 opacity-70 mb-2" />
            <span className="text-3xl">{getFileEmoji(material.mimeType)}</span>
          </div>

          {/* Gradient overlay on image */}
          {material.thumbnailUrl && (
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />
          )}

          {/* Type badge */}
          <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-semibold border backdrop-blur-sm ${cfg.badge}`}>
            {cfg.label}
          </div>

          {/* External link badge */}
          {material.externalUrl && (
            <div className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/40 backdrop-blur-sm border border-white/10">
              <LinkIcon className="h-3.5 w-3.5 text-white/80" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="text-sm font-bold text-white line-clamp-2 mb-3 leading-snug">
            {material.title}
          </h3>

          <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
            <div className="flex items-center gap-1">
              <ArrowDownTrayIcon className="h-3.5 w-3.5" />
              <span>{material.downloadCount || 0} downloads</span>
            </div>
            {material.fileSize > 0 && (
              <span>{formatFileSize(material.fileSize)}</span>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (material.externalUrl) {
                handleOpenExternal(material);
              } else {
                handleDownload(material._id, material.fileName);
              }
            }}
            disabled={isDownloading}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
              ${material.externalUrl
                ? 'bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30'
                : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
              } ${isDownloading ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {isDownloading ? (
              <div className="w-4 h-4 border-2 border-emerald-400/40 border-t-emerald-400 rounded-full animate-spin" />
            ) : material.externalUrl ? (
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            ) : (
              <ArrowDownTrayIcon className="h-4 w-4" />
            )}
            {isDownloading ? 'Opening…' : material.externalUrl ? 'Open Link' : 'Download'}
          </button>
        </div>
      </motion.div>
    );
  };

  // ── Main Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 bg-gray-800/60 rounded-2xl p-6 shadow-2xl backdrop-blur-sm border border-gray-700/50">

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#CA133E]/20 rounded-xl border border-[#CA133E]/30">
            <BookOpenIcon className="h-6 w-6 text-[#CA133E]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Learning Materials</h2>
            <p className="text-sm text-gray-400 mt-0.5">Access and download your course materials</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative lg:w-72">
          <MagnifyingGlassIcon className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search materials…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900/70 border border-gray-700/50 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#CA133E]/50 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Type tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {(['theory', 'practical', 'other']).map((type) => {
          const cfg = typeConfig[type];
          const TypeIcon = cfg.icon;
          const isActive = activeSection === type;
          return (
            <button
              key={type}
              onClick={() => setActiveSection(type)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border
                ${isActive
                  ? `${cfg.tab} border-current shadow-sm`
                  : 'text-gray-400 border-gray-700/50 hover:text-white hover:border-gray-600/50 bg-gray-900/40'
                }`}
            >
              <TypeIcon className="h-4 w-4" />
              {cfg.label}
              <span className={`px-1.5 py-0.5 rounded-md text-xs font-bold
                ${isActive ? 'bg-white/20' : 'bg-gray-700/60 text-gray-400'}`}>
                {counts[type]}
              </span>
            </button>
          );
        })}

        <span className="ml-auto text-xs text-gray-500">
          {filteredMaterials.length} {filteredMaterials.length === 1 ? 'material' : 'materials'}
          {searchTerm && ' found'}
        </span>
      </div>

      {/* Grid */}
      {filteredMaterials.length === 0 ? (
        <div className="py-20 text-center rounded-2xl border-2 border-dashed border-gray-700/50 bg-gray-900/30">
          {React.createElement(typeConfig[activeSection].icon, { className: 'h-14 w-14 mx-auto text-gray-600 mb-4' })}
          <h3 className="text-base font-semibold text-white mb-1">
            {searchTerm ? 'No matching materials' : `No ${activeSection} materials yet`}
          </h3>
          <p className="text-sm text-gray-500">
            {searchTerm
              ? 'Try a different search term.'
              : 'Your teacher hasn\'t uploaded any yet. Check back soon.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredMaterials.map((material, index) => (
            <MaterialCard key={material._id} material={material} index={index} />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedMaterial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={closeDetailModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-gray-900 border border-gray-700/60 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Cover preview */}
              <div className="relative h-52 overflow-hidden">
                {selectedMaterial.thumbnailUrl ? (
                  <img
                    src={selectedMaterial.thumbnailUrl}
                    alt={selectedMaterial.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${typeConfig[selectedMaterial.type]?.gradient || 'from-gray-600 to-gray-800'} flex items-center justify-center`}
                  style={{ display: selectedMaterial.thumbnailUrl ? 'none' : 'flex' }}
                >
                  {React.createElement(typeConfig[selectedMaterial.type]?.icon || FolderIcon, { className: 'h-20 w-20 text-white/60' })}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
                <button
                  onClick={closeDetailModal}
                  className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 rounded-xl backdrop-blur-sm transition-colors"
                >
                  <XMarkIcon className="h-5 w-5 text-white" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-white leading-snug">{selectedMaterial.title}</h2>
                  <span className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-lg text-xs font-semibold border ${typeConfig[selectedMaterial.type]?.badge}`}>
                    {React.createElement(typeConfig[selectedMaterial.type]?.icon || FolderIcon, { className: 'h-3.5 w-3.5' })}
                    {typeConfig[selectedMaterial.type]?.label || selectedMaterial.type}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {selectedMaterial.uploadedBy && (
                    <div className="bg-gray-800/60 rounded-xl p-3">
                      <p className="text-xs text-gray-500 mb-1">Uploaded by</p>
                      <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                        <UserIcon className="h-4 w-4 text-gray-400" />
                        The {selectedMaterial.uploadedBy.lastName}
                      </p>
                    </div>
                  )}
                  <div className="bg-gray-800/60 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">Added</p>
                    <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                      {new Date(selectedMaterial.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="bg-gray-800/60 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">Downloads</p>
                    <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                      <ArrowDownTrayIcon className="h-4 w-4 text-gray-400" />
                      {selectedMaterial.downloadCount || 0} times
                    </p>
                  </div>
                  {selectedMaterial.fileSize > 0 && (
                    <div className="bg-gray-800/60 rounded-xl p-3">
                      <p className="text-xs text-gray-500 mb-1">File size</p>
                      <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                        <span className="text-base">{getFileEmoji(selectedMaterial.mimeType)}</span>
                        {formatFileSize(selectedMaterial.fileSize)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  {selectedMaterial.externalUrl ? (
                    <button
                      onClick={() => { handleOpenExternal(selectedMaterial); closeDetailModal(); }}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold transition-colors"
                    >
                      <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                      Open Link
                    </button>
                  ) : (
                    <button
                      onClick={() => { handleDownload(selectedMaterial._id, selectedMaterial.fileName); closeDetailModal(); }}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors"
                    >
                      <ArrowDownTrayIcon className="h-5 w-5" />
                      Download
                    </button>
                  )}
                  <button
                    onClick={closeDetailModal}
                    className="px-5 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-semibold transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MaterialsTab;
