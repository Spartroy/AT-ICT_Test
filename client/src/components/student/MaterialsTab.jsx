import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ENDPOINTS } from '../../config/api';
import { showError } from '../../utils/toast';
import {
  BookOpenIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  FolderIcon,
  AcademicCapIcon,
  ComputerDesktopIcon,
  MagnifyingGlassIcon,
  ExclamationCircleIcon,
  XMarkIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  LinkIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '—';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const getFileEmoji = (mimeType) => {
  if (!mimeType) return '📁';
  if (mimeType.includes('pdf'))                                     return '📄';
  if (mimeType.includes('word') || mimeType.includes('document'))   return '📝';
  if (mimeType.includes('powerpoint') || mimeType.includes('pres')) return '📊';
  if (mimeType.includes('excel') || mimeType.includes('sheet'))     return '📈';
  if (mimeType.includes('image')) return '🖼️';
  if (mimeType.includes('video')) return '🎥';
  if (mimeType.includes('audio')) return '🎵';
  if (mimeType.includes('zip'))   return '🗜️';
  return '📁';
};

const TYPE_CFG = {
  theory: {
    icon: AcademicCapIcon,
    label: 'Theory',
    coverGradient: 'from-blue-900 via-blue-800 to-blue-700',
    spineGradient: 'from-blue-950 to-blue-700',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    tab:   'bg-blue-500/15 text-blue-300 border-blue-500/30',
  },
  practical: {
    icon: ComputerDesktopIcon,
    label: 'Practical',
    coverGradient: 'from-emerald-900 via-emerald-800 to-emerald-700',
    spineGradient: 'from-emerald-950 to-emerald-700',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    tab:   'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
  other: {
    icon: FolderIcon,
    label: 'Other',
    coverGradient: 'from-violet-900 via-violet-800 to-violet-700',
    spineGradient: 'from-violet-950 to-violet-700',
    badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    tab:   'bg-violet-500/15 text-violet-300 border-violet-500/30',
  },
};

/* ─── BookCard ───────────────────────────────────────────────────────────────── */
const BookCard = ({ material, index, onPreview, onDownload, onOpenExternal, isDownloading }) => {
  const cfg       = TYPE_CFG[material.type] || TYPE_CFG.other;
  const hasFile   = !!(material.cloudinaryPublicId || material.fileUrl);
  const isPdf     = !!material.mimeType?.includes('pdf');
  const hasPreview = hasFile && isPdf;

  const handleCardClick = () => {
    if (hasPreview)                onPreview(material);
    else if (material.externalUrl) onOpenExternal(material);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 120, damping: 14 }}
      className="group cursor-pointer select-none"
      style={{ perspective: '900px' }}
      onClick={handleCardClick}
    >
      <div
        className="relative flex rounded-xl overflow-hidden shadow-md shadow-black/40 group-hover:shadow-2xl group-hover:shadow-black/60 transition-shadow duration-300"
        style={{ transition: 'transform 0.3s ease, box-shadow 0.3s ease' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'rotateY(-5deg) translateY(-4px)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'rotateY(0deg) translateY(0px)'; }}
      >
        {/* Spine */}
        <div
          className={`w-7 flex-shrink-0 bg-gradient-to-b ${cfg.spineGradient} relative flex items-center justify-center`}
          style={{ minHeight: '272px' }}
        >
          <div className="absolute inset-y-0 left-0 w-px bg-white/15" />
          <div className="absolute inset-y-0 right-0 w-px bg-black/40" />
          <span
            className="text-white/70 font-bold text-[7px] tracking-widest uppercase overflow-hidden"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)', maxHeight: '120px', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}
          >
            {material.title}
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col" style={{ minHeight: '272px' }}>
          <div className={`relative flex-1 bg-gradient-to-br ${cfg.coverGradient} overflow-hidden`}>
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 22px,rgba(255,255,255,.6) 22px,rgba(255,255,255,.6) 23px)' }} />
            {material.thumbnailUrl && (
              <img src={material.thumbnailUrl} alt={material.title} className="absolute inset-0 w-full h-full object-cover opacity-30" onError={e => { e.target.style.display = 'none'; }} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
            <div className="absolute top-3 right-3 text-2xl select-none drop-shadow">{getFileEmoji(material.mimeType)}</div>
            <div className={`absolute top-3 left-3 px-1.5 py-0.5 rounded-md text-[9px] font-bold border backdrop-blur-sm ${cfg.badge}`}>{cfg.label}</div>
            {material.externalUrl && (
              <div className="absolute top-3 right-3 p-1.5 rounded-md bg-black/50 backdrop-blur-sm border border-white/10">
                <LinkIcon className="h-3 w-3 text-white/70" />
              </div>
            )}
            {hasPreview && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="bg-white/15 backdrop-blur-sm rounded-full p-3 border border-white/20 shadow-lg">
                  <EyeIcon className="h-6 w-6 text-white" />
                </div>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 pt-8">
              <h3 className="text-white text-[11px] font-bold line-clamp-3 leading-tight drop-shadow-lg">{material.title}</h3>
            </div>
          </div>

          {/* Page-edge lines */}
          <div className="absolute right-0 top-0 pointer-events-none" style={{ width: '5px', bottom: '82px' }}>
            {[0, 1, 2].map(i => (
              <div key={i} className="absolute inset-0" style={{ right: `${i * 1.5}px`, background: 'rgba(255,255,255,0.04)', borderRight: '1px solid rgba(255,255,255,0.06)' }} />
            ))}
          </div>

          {/* Info strip */}
          <div className="bg-[#161616] border-t border-white/5 px-2.5 py-2 space-y-2">
            <div className="flex items-center justify-between text-[9px] text-gray-500">
              <span className="flex items-center gap-1"><ArrowDownTrayIcon className="h-2.5 w-2.5" />{material.downloadCount || 0}</span>
              {material.fileSize > 0 && <span>{formatFileSize(material.fileSize)}</span>}
            </div>
            <div className="flex gap-1">
              {hasPreview && (
                <button onClick={e => { e.stopPropagation(); onPreview(material); }}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold bg-white/5 hover:bg-white/8 text-gray-300 border border-white/5 transition-all">
                  <EyeIcon className="h-3 w-3" />Preview
                </button>
              )}
              {material.externalUrl ? (
                <button onClick={e => { e.stopPropagation(); onOpenExternal(material); }}
                  className={`${hasPreview ? 'flex-1' : 'w-full'} flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 border border-violet-500/20 transition-all`}>
                  <ArrowTopRightOnSquareIcon className="h-3 w-3" />Open
                </button>
              ) : hasFile ? (
                <button onClick={e => { e.stopPropagation(); onDownload(material); }} disabled={isDownloading}
                  className={`${hasPreview ? 'flex-1' : 'w-full'} flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                    isDownloading
                      ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                      : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/20'}`}>
                  {isDownloading
                    ? <div className="w-2.5 h-2.5 border-[1.5px] border-gray-500/30 border-t-gray-300 rounded-full animate-spin" />
                    : <ArrowDownTrayIcon className="h-3 w-3" />}
                  {isDownloading ? '…' : 'Save'}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ─── PreviewModal ───────────────────────────────────────────────────────────── */
const PreviewModal = ({ material, blobUrl, loading, previewError, onClose, onDownload, isFullscreen, onToggleFullscreen }) => {
  if (!material) return null;
  const cfg    = TYPE_CFG[material.type] || TYPE_CFG.other;
  const isPdf  = !!material.mimeType?.includes('pdf');
  const hasFile = !!(material.cloudinaryPublicId || material.fileUrl);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50"
      style={{ padding: isFullscreen ? 0 : '12px' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 18 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className={`bg-[#161616] border border-white/10 flex flex-col overflow-hidden shadow-2xl ${isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-5xl rounded-xl'}`}
        style={{ height: isFullscreen ? '100dvh' : '88vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/5 bg-[#1A1A1A] flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br ${cfg.coverGradient} flex items-center justify-center shadow-sm`}>
              {React.createElement(cfg.icon, { className: 'h-4 w-4 text-white' })}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{material.title}</p>
              <span className={`text-[9px] font-bold uppercase tracking-wider border px-1.5 py-0.5 rounded ${cfg.badge}`}>{cfg.label}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {!material.externalUrl && hasFile && (
              <button onClick={() => onDownload(material)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/20 rounded-lg text-xs font-semibold transition-all">
                <ArrowDownTrayIcon className="h-3.5 w-3.5" />Download
              </button>
            )}
            <button onClick={onToggleFullscreen} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/8 rounded-lg transition-all">
              {isFullscreen ? <ArrowsPointingInIcon className="h-4 w-4" /> : <ArrowsPointingOutIcon className="h-4 w-4" />}
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-red-500/15 rounded-lg transition-all">
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 relative bg-black/50 overflow-hidden">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
              <div className="w-10 h-10 border-4 border-white/10 border-t-[#CA133E] rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Loading preview…</p>
            </div>
          )}
          {!loading && previewError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
              <ExclamationCircleIcon className="h-12 w-12 text-red-400" />
              <p className="text-white font-semibold">Could not load preview</p>
              <p className="text-gray-400 text-sm">{previewError}</p>
              {hasFile && (
                <button onClick={() => onDownload(material)}
                  className="flex items-center gap-2 px-6 py-2.5 mt-2 bg-[#CA133E] hover:bg-[#A01030] text-white rounded-xl font-semibold transition-colors">
                  <ArrowDownTrayIcon className="h-4 w-4" />Download instead
                </button>
              )}
            </div>
          )}
          {!loading && !previewError && isPdf && blobUrl && (
            <iframe src={blobUrl} title={material.title} className="absolute inset-0 w-full h-full border-0" allow="fullscreen" />
          )}
          {!loading && !previewError && !isPdf && hasFile && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-8 text-center">
              <div className="text-7xl select-none">{getFileEmoji(material.mimeType)}</div>
              <div>
                <p className="text-white font-bold text-lg mb-1">{material.title}</p>
                <p className="text-gray-400 text-sm">Preview is not available for this file type.</p>
              </div>
              <button onClick={() => onDownload(material)}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#CA133E] hover:bg-[#A01030] text-white rounded-xl font-semibold transition-colors shadow-lg">
                <ArrowDownTrayIcon className="h-4 w-4" />Download to view
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ─── MaterialsTab ───────────────────────────────────────────────────────────── */
const MaterialsTab = ({ studentData }) => {
  const [allMaterials, setAllMaterials]   = useState([]);
  const [loading, setLoading]             = useState(true);
  const [activeSection, setActiveSection] = useState('theory');
  const [searchTerm, setSearchTerm]       = useState('');
  const [error, setError]                 = useState('');
  const [downloading, setDownloading]     = useState(null);

  const [previewMaterial, setPreviewMaterial]   = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isFullscreen, setIsFullscreen]         = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl]     = useState(null);
  const [previewLoading, setPreviewLoading]     = useState(false);
  const [previewError, setPreviewError]         = useState('');

  useEffect(() => { fetchMaterials(); }, []);
  useEffect(() => {
    return () => { if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl); };
  }, [previewBlobUrl]);

  const fetchMaterials = async () => {
    try {
      setLoading(true); setError('');
      const token = localStorage.getItem('token');
      const res = await fetch(API_ENDPOINTS.STUDENT.MATERIALS, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setAllMaterials(data.data.allMaterials);
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.message || 'Failed to fetch materials');
      }
    } catch {
      setError('Network error — could not load materials.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBlob = async (materialId) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_ENDPOINTS.STUDENT.MATERIALS}/${materialId}/download`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || `Server returned ${res.status}`);
    }
    return res.blob();
  };

  const handleDownload = async (material) => {
    if (downloading) return;
    setDownloading(material._id);
    try {
      const blob = await fetchBlob(material._id);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = material.fileName || material.title || 'material'; a.rel = 'noopener noreferrer';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (err) {
      showError(err.message || 'Failed to download. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  const handleOpenExternal = (material) => {
    const url = material.externalUrl?.includes('/view')
      ? material.externalUrl.replace('/view', '/preview')
      : material.externalUrl;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const openPreview = async (material) => {
    if (previewBlobUrl) { URL.revokeObjectURL(previewBlobUrl); setPreviewBlobUrl(null); }
    setPreviewMaterial(material); setShowPreviewModal(true); setIsFullscreen(false); setPreviewError('');
    if (material.mimeType?.includes('pdf')) {
      setPreviewLoading(true);
      try {
        const blob = await fetchBlob(material._id);
        setPreviewBlobUrl(URL.createObjectURL(blob));
      } catch (err) {
        setPreviewError(err.message || 'Could not load preview.');
      } finally {
        setPreviewLoading(false);
      }
    }
  };

  const closePreview = () => {
    if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
    setPreviewBlobUrl(null); setPreviewLoading(false); setPreviewError('');
    setShowPreviewModal(false); setPreviewMaterial(null); setIsFullscreen(false);
  };

  const filteredMaterials = allMaterials.filter(m =>
    m.type === activeSection &&
    (searchTerm === '' || m.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const counts = {
    theory:    allMaterials.filter(m => m.type === 'theory').length,
    practical: allMaterials.filter(m => m.type === 'practical').length,
    other:     allMaterials.filter(m => m.type === 'other').length,
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-white/5 rounded-xl animate-pulse w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex animate-pulse rounded-xl overflow-hidden" style={{ height: '272px' }}>
              <div className="w-7 bg-white/5 flex-shrink-0" />
              <div className="flex-1 bg-white/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#161616] border border-white/5 rounded-xl p-10 text-center">
        <ExclamationCircleIcon className="h-10 w-10 text-[#CA133E] mx-auto mb-3" />
        <h3 className="text-base font-bold text-white mb-2">Couldn't Load Materials</h3>
        <p className="text-gray-400 text-sm mb-4">{error}</p>
        <button onClick={fetchMaterials} className="px-5 py-2 bg-[#CA133E] hover:bg-[#A01030] text-white rounded-xl font-medium text-sm transition-colors">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#CA133E]/15 rounded-xl border border-[#CA133E]/25">
            <BookOpenIcon className="h-5 w-5 text-[#CA133E]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Learning Materials</h2>
            <p className="text-sm text-gray-500 mt-0.5">Your course library</p>
          </div>
        </div>
        <div className="relative lg:w-64">
          <MagnifyingGlassIcon className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search materials…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#1A1A1A] border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#CA133E] transition-colors"
          />
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {(['theory', 'practical', 'other']).map(type => {
          const cfg      = TYPE_CFG[type];
          const TypeIcon = cfg.icon;
          const isActive = activeSection === type;
          return (
            <button
              key={type}
              onClick={() => setActiveSection(type)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                isActive
                  ? `${cfg.tab} border-current`
                  : 'text-gray-400 border-white/5 hover:text-white hover:border-white/10 bg-[#1A1A1A]'
              }`}
            >
              <TypeIcon className="h-4 w-4" />
              {cfg.label}
              <span className={`px-1.5 py-0.5 rounded-md text-xs font-bold ${isActive ? 'bg-white/20' : 'bg-white/5 text-gray-500'}`}>
                {counts[type]}
              </span>
            </button>
          );
        })}
        <span className="ml-auto text-xs text-gray-600">
          {filteredMaterials.length} {filteredMaterials.length === 1 ? 'material' : 'materials'}{searchTerm && ' found'}
        </span>
      </div>

      {/* Books grid */}
      {filteredMaterials.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-dashed border-white/10 bg-white/2">
          {React.createElement(TYPE_CFG[activeSection].icon, { className: 'h-12 w-12 mx-auto text-gray-600 mb-3' })}
          <h3 className="text-sm font-semibold text-white mb-1">
            {searchTerm ? 'No matching materials' : `No ${activeSection} materials yet`}
          </h3>
          <p className="text-xs text-gray-500">
            {searchTerm ? 'Try a different search term.' : "Your teacher hasn't uploaded any yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredMaterials.map((material, index) => (
            <BookCard
              key={material._id}
              material={material}
              index={index}
              onPreview={openPreview}
              onDownload={handleDownload}
              onOpenExternal={handleOpenExternal}
              isDownloading={downloading === material._id}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {showPreviewModal && (
          <PreviewModal
            material={previewMaterial}
            blobUrl={previewBlobUrl}
            loading={previewLoading}
            previewError={previewError}
            onClose={closePreview}
            onDownload={handleDownload}
            isFullscreen={isFullscreen}
            onToggleFullscreen={() => setIsFullscreen(f => !f)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MaterialsTab;
