import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ENDPOINTS } from '../../config/api';
import {
  BookOpenIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  FolderIcon,
  AcademicCapIcon,
  ComputerDesktopIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  TagIcon,
  UserIcon,
  ExclamationCircleIcon,
  XMarkIcon,
  CalendarIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

const MaterialsTab = ({ studentData }) => {
  const [materials, setMaterials] = useState({ theory: [], practical: [], other: [] });
  const [allMaterials, setAllMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('theory');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.STUDENT.MATERIALS, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMaterials(data.data.materials);
        setAllMaterials(data.data.allMaterials);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch materials');
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
      setError('Error fetching materials');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (materialId, fileName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.STUDENT.MATERIALS}/${materialId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error downloading material:', error);
      alert('❌ Error downloading material');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.includes('pdf')) return '📄';
    if (mimeType?.includes('word') || mimeType?.includes('document')) return '📝';
    if (mimeType?.includes('powerpoint') || mimeType?.includes('presentation')) return '📊';
    if (mimeType?.includes('excel') || mimeType?.includes('sheet')) return '📈';
    if (mimeType?.includes('image')) return '🖼️';
    if (mimeType?.includes('video')) return '🎥';
    if (mimeType?.includes('audio')) return '🎵';
    return '📁';
  };

  const getFilteredMaterials = () => {
    return allMaterials.filter(material => {
      const matchesType = material.type === activeSection;
      const matchesSearch = searchTerm === '' || 
        material.title.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesType && matchesSearch;
    });
  };

  const handleMaterialClick = (material) => {
    setSelectedMaterial(material);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedMaterial(null);
  };

  const MaterialCard = ({ material, index }) => {
    const typeConfig = material.type === 'theory' 
      ? { icon: AcademicCapIcon, color: 'blue', bgColor: 'bg-blue-900/30', textColor: 'text-blue-300', bookColor: 'from-blue-500 to-blue-700' }
      : material.type === 'practical'
      ? { icon: ComputerDesktopIcon, color: 'green', bgColor: 'bg-green-900/30', textColor: 'text-green-300', bookColor: 'from-green-500 to-green-700' }
      : { icon: FolderIcon, color: 'gray', bgColor: 'bg-gray-700/30', textColor: 'text-gray-300', bookColor: 'from-gray-500 to-gray-700' };
    
    const TypeIcon = typeConfig.icon;

    return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
        className="group relative cursor-pointer"
        onClick={() => handleMaterialClick(material)}
      >
        {/* Book Card */}
        <div className="bg-gray-800/60 rounded-xl shadow-lg border border-gray-700/50 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 backdrop-blur-sm">
          {/* Book Cover - Thumbnail Dominant */}
          <div className="relative h-80 overflow-hidden">
            {material.thumbnailUrl ? (
              <>
                {/* Main thumbnail background */}
                <img
                  src={`${API_ENDPOINTS.BASE_URL}${material.thumbnailUrl}`}
                  alt={material.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                
                {/* Subtle overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                
                {/* Minimal title overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white text-lg font-bold leading-tight line-clamp-2 drop-shadow-lg">
                    {material.title}
                  </h3>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2 text-white/90 text-sm">
                      <span className="text-lg">{getFileIcon(material.mimeType)}</span>
                      <span className="drop-shadow">{formatFileSize(material.fileSize)}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-white/90 text-sm">
                      <EyeIcon className="h-4 w-4" />
                      <span className="drop-shadow">{material.downloadCount || 0}</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Fallback gradient cover when no thumbnail */
              <div className={`w-full h-full bg-gradient-to-br ${typeConfig.bookColor} flex flex-col items-center justify-center text-white relative p-4`}>
                <TypeIcon className="h-20 w-20 mb-6 opacity-80" />
                <div className="text-center">
                  <h4 className="text-xl font-bold mb-3 line-clamp-3">{material.title}</h4>
                  <div className="text-sm opacity-90 flex items-center justify-center space-x-3">
                    <span className="text-2xl">{getFileIcon(material.mimeType)}</span>
                    <span>{formatFileSize(material.fileSize)}</span>
                  </div>
                  <div className="flex items-center justify-center space-x-1 mt-3 text-sm opacity-80">
                    <EyeIcon className="h-4 w-4" />
                    <span>{material.downloadCount || 0} downloads</span>
                  </div>
                </div>
              </div>
            )}

            {/* Book spine effect */}
            <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-b from-black/30 to-black/50"></div>
            <div className="absolute left-3 top-0 bottom-0 w-1 bg-white/30"></div>

            {/* Minimal type badge */}
            <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium bg-black/40 ${typeConfig.textColor} backdrop-blur-sm border border-white/20`}>
              {material.type.charAt(0).toUpperCase() + material.type.slice(1)}
            </div>
          </div>

          {/* Minimal bottom info */}
          <div className="p-3 bg-gray-900/60">
            {/* Author info - compact */}
            <div className="flex items-center justify-between text-sm">
              {material.uploadedBy && (
                <div className="flex items-center text-gray-400">
                  <UserIcon className="h-3 w-3 mr-1" />
                  <span className="truncate">The {material.uploadedBy.lastName}</span>
                </div>
              )}
              <div className="text-xs text-gray-500">
                {new Date(material.createdAt).toLocaleDateString()}
              </div>
            </div>

            {/* Download button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(material._id, material.fileName);
              }}
              className="w-full mt-3 flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm font-medium"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Download
            </button>
          </div>
        </div>

        {/* Book shadow effect */}
        <div className="absolute inset-0 bg-gray-900/10 rounded-xl transform translate-y-1 translate-x-1 -z-10 group-hover:translate-y-2 group-hover:translate-x-2 transition-transform duration-300"></div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-700/50 rounded w-64 animate-pulse"></div>
          <div className="h-10 bg-gray-700/50 rounded w-32 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-800/60 rounded-xl shadow-sm p-6 animate-pulse backdrop-blur-sm border-2 border-gray-600/50">
              <div className="h-4 bg-gray-700/50 rounded w-3/4 mb-4"></div>
              <div className="h-20 bg-gray-700/50 rounded"></div>
      </div>
          ))}
        </div>
        </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800/60 rounded-xl p-6 shadow-2xl backdrop-blur-sm border-2 border-gray-600/50">
        <div className="text-center">
          <ExclamationCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Error Loading Materials</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchMaterials}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const theoryCount = allMaterials.filter(m => m.type === 'theory').length;
  const practicalCount = allMaterials.filter(m => m.type === 'practical').length;
  const otherCount = allMaterials.filter(m => m.type === 'other').length;
  const filteredMaterials = getFilteredMaterials();

  return (
    <div className="space-y-6 bg-gray-800/60 rounded-xl p-6 shadow-2xl backdrop-blur-sm border-2 border-gray-600/50">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-[20pt] font-bold text-white flex items-center">
            <FolderIcon className="h-8 w-8 mr-3" />
            Learning Materials
          </h2>
          <p className="text-[14pt] text-gray-300 mt-1">Access and download your course materials</p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900/70 text-white"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* Type Tabs */}
        <div className="flex bg-gray-900/70 rounded-xl p-1 border border-gray-700/50">
          <button
            onClick={() => setActiveSection('theory')}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
              activeSection === 'theory'
                ? 'bg-blue-500/30 text-blue-300 shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <AcademicCapIcon className="inline h-4 w-4 mr-2" />
            Theory ({theoryCount})
          </button>
          <button
            onClick={() => setActiveSection('practical')}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
              activeSection === 'practical'
                ? 'bg-green-500/30 text-green-300 shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ComputerDesktopIcon className="inline h-4 w-4 mr-2" />
            Practical ({practicalCount})
          </button>
          <button
            onClick={() => setActiveSection('other')}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
              activeSection === 'other'
                ? 'bg-gray-500/30 text-gray-300 shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FolderIcon className="inline h-4 w-4 mr-2" />
            Other ({otherCount})
          </button>
        </div>

        {/* Results count */}
        <div className="ml-auto text-sm text-gray-300">
          {filteredMaterials.length} Books found
        </div>
      </div>

      {/* Materials Content */}
      <div className="mt-6">
        {filteredMaterials.length === 0 ? (
          <div className="text-center py-12 bg-gray-900/50 rounded-xl border-2 border-dashed border-gray-700/50">
            {activeSection === 'theory' ? (
              <AcademicCapIcon className="h-16 w-16 mx-auto text-gray-500 mb-4" />
            ) : activeSection === 'practical' ? (
              <ComputerDesktopIcon className="h-16 w-16 mx-auto text-gray-500 mb-4" />
            ) : (
              <FolderIcon className="h-16 w-16 mx-auto text-gray-500 mb-4" />
            )}
            <h3 className="text-lg font-medium text-white mb-2">
              {searchTerm 
                ? 'No matching materials found' 
                : `No ${activeSection} materials yet`
              }
            </h3>
            <p className="text-gray-400">
              {searchTerm
                ? 'Try adjusting your search criteria.'
                : `${activeSection === 'theory' ? 'Theory' : activeSection === 'practical' ? 'Practical' : 'Other'} materials will be available soon.`
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredMaterials.map((material, index) => (
              <MaterialCard key={material._id} material={material} index={index} />
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {filteredMaterials.length > 0 && (
        <div className="bg-gray-900/50 rounded-xl p-6 mt-8 border border-gray-700/50">
          <h3 className="text-lg font-medium text-white mb-4">Materials Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{theoryCount}</div>
              <div className="text-sm text-gray-400">Theory Materials</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{practicalCount}</div>
              <div className="text-sm text-gray-400">Practical Materials</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-400">{otherCount}</div>
              <div className="text-sm text-gray-400">Other Materials</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">
                {allMaterials.reduce((total, m) => total + (m.downloadCount || 0), 0)}
              </div>
              <div className="text-sm text-gray-400">Total Downloads</div>
            </div>
          </div>
        </div>
      )}

      {/* Material Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedMaterial && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-gray-900/90 border border-gray-700 text-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h2 className="text-2xl font-bold">Material Details</h2>
                <button
                  onClick={closeDetailModal}
                  className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700/50 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Thumbnail/Image Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center">
                      <EyeIcon className="h-5 w-5 mr-2 text-blue-400" />
                      Preview
                    </h3>
                    
                    <div className="relative">
                      {selectedMaterial.thumbnailUrl ? (
                        <div className="relative rounded-xl overflow-hidden shadow-lg bg-gray-800/50">
                          <img
                            src={`${API_ENDPOINTS.BASE_URL}${selectedMaterial.thumbnailUrl}`}
                            alt={selectedMaterial.title}
                            className="w-full max-h-96 object-contain bg-gray-900/70 rounded-xl"
                            style={{ minHeight: '200px' }}
                          />
                          <div className="mt-4 p-3 bg-gray-800/60 rounded-xl">
                            <h4 className="text-white text-lg font-bold text-center">
                              {selectedMaterial.title}
                            </h4>
                       
                          </div>
                        </div>
                      ) : (
                        <div className={`w-full h-80 bg-gradient-to-br ${
                          selectedMaterial.type === 'theory' ? 'from-blue-500 to-blue-700' :
                          selectedMaterial.type === 'practical' ? 'from-green-500 to-green-700' :
                          'from-gray-500 to-gray-700'
                        } rounded-xl flex flex-col items-center justify-center text-white shadow-lg`}>
                          {selectedMaterial.type === 'theory' ? (
                            <AcademicCapIcon className="h-20 w-20 mb-4 opacity-80" />
                          ) : selectedMaterial.type === 'practical' ? (
                            <ComputerDesktopIcon className="h-20 w-20 mb-4 opacity-80" />
                          ) : (
                            <FolderIcon className="h-20 w-20 mb-4 opacity-80" />
                          )}
                          <h4 className="text-xl font-bold text-center px-4">
                            {selectedMaterial.title}
                          </h4>
                          <p className="text-white/80 text-sm mt-2">No thumbnail available</p>
          </div>
        )}
      </div>
                  </div>

                  {/* Details Section */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white flex items-center mb-4">
                        <InformationCircleIcon className="h-5 w-5 mr-2 text-blue-400" />
                        Information
                      </h3>
                      
                      <div className="space-y-4">
                        {/* Title */}
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                          <p className="text-lg font-semibold text-white">{selectedMaterial.title}</p>
                        </div>

                        {/* Type */}
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Type</label>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            selectedMaterial.type === 'theory' ? 'bg-blue-900/50 text-blue-300' :
                            selectedMaterial.type === 'practical' ? 'bg-green-900/50 text-green-300' :
                            'bg-gray-700 text-gray-300'
                          }`}>
                            {selectedMaterial.type === 'theory' ? (
                              <AcademicCapIcon className="h-4 w-4 mr-1" />
                            ) : selectedMaterial.type === 'practical' ? (
                              <ComputerDesktopIcon className="h-4 w-4 mr-1" />
                            ) : (
                              <FolderIcon className="h-4 w-4 mr-1" />
                            )}
                            {selectedMaterial.type.charAt(0).toUpperCase() + selectedMaterial.type.slice(1)}
                          </span>
                        </div>

                        {/* File Info */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">File Size</label>
                            <p className="text-white flex items-center">
                              <span className="text-xl mr-2">{getFileIcon(selectedMaterial.mimeType)}</span>
                              {formatFileSize(selectedMaterial.fileSize)}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Downloads</label>
                            <p className="text-white flex items-center">
                              <EyeIcon className="h-4 w-4 mr-1 text-gray-400" />
                              {selectedMaterial.downloadCount || 0} times
                            </p>
                          </div>
                        </div>

                        {/* Author */}
                        {selectedMaterial.uploadedBy && (
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Uploaded by</label>
                            <p className="text-white flex items-center">
                              <UserIcon className="h-4 w-4 mr-1 text-gray-400" />
                              The {selectedMaterial.uploadedBy.lastName}
                            </p>
                          </div>
                        )}

                        {/* Date */}
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Added on</label>
                          <p className="text-white flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                            {new Date(selectedMaterial.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 border-t border-gray-700">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() => {
                            handleDownload(selectedMaterial._id, selectedMaterial.fileName);
                            closeDetailModal();
                          }}
                          className="flex-1 flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
                        >
                          <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                          Download Material
          </button>
                        <button
                          onClick={closeDetailModal}
                          className="flex-1 flex items-center justify-center px-6 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors font-medium"
                        >
                          Close
          </button>
        </div>
      </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MaterialsTab; 