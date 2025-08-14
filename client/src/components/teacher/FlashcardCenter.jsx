import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API_ENDPOINTS from '../../config/api';
import { showSuccess, showError, showWarning } from '../../utils/toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  AcademicCapIcon,
  BookOpenIcon,
  UsersIcon,
  ClockIcon,
  ChartBarIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  GlobeAltIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';

// Import modal components
import CreateFlashcardModal from './CreateFlashcardModal';
import EditFlashcardModal from './EditFlashcardModal';
import ViewFlashcardModal from './ViewFlashcardModal';

const FlashcardCenter = () => {
  const [flashcardStacks, setFlashcardStacks] = useState([]);
  const [myStacks, setMyStacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStack, setSelectedStack] = useState(null);
  const [stackToDelete, setStackToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCreator, setFilterCreator] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [stats, setStats] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'math', label: 'Mathematics' },
    { value: 'science', label: 'Science' },
    { value: 'history', label: 'History' },
    { value: 'language', label: 'Language' },
    { value: 'art', label: 'Art' },
    { value: 'music', label: 'Music' },
    { value: 'technology', label: 'Technology' },
    { value: 'other', label: 'Other' }
  ];

  const creatorFilters = [
    { value: '', label: 'All Creators' },
    { value: 'teacher', label: 'Teachers' },
    { value: 'student', label: 'Students' }
  ];

  useEffect(() => {
    fetchFlashcardStacks();
    fetchMyStacks();
    fetchStats();
  }, []);

  const fetchFlashcardStacks = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filterCategory) params.append('category', filterCategory);
      if (filterCreator) params.append('creator', filterCreator);

      const response = await fetch(`${API_ENDPOINTS.FLASHCARDS}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFlashcardStacks(data.data || []);
      } else {
        console.error('Failed to fetch flashcard stacks');
      }
    } catch (error) {
      console.error('Error fetching flashcard stacks:', error);
      showError('Failed to load flashcard stacks');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyStacks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.FLASHCARDS_MY_STACKS, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMyStacks(data.data || []);
      } else {
        console.error('Failed to fetch my flashcard stacks');
      }
    } catch (error) {
      console.error('Error fetching my flashcard stacks:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.FLASHCARDS, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const allStacks = data.data || [];
        
        setStats({
          totalStacks: allStacks.length,
          teacherStacks: allStacks.filter(s => s.isTeacherStack).length,
          studentStacks: allStacks.filter(s => !s.isTeacherStack).length,
          totalCards: allStacks.reduce((sum, stack) => sum + (stack.totalCards || 0), 0),
          myStacks: myStacks.length
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleDeleteStack = async (stackId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.FLASHCARDS}/${stackId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        showSuccess('Flashcard stack deleted successfully');
        fetchFlashcardStacks();
        fetchMyStacks();
        setShowDeleteModal(false);
        setStackToDelete(null);
      } else {
        const errorData = await response.json();
        showError(errorData.message || 'Failed to delete flashcard stack');
      }
    } catch (error) {
      console.error('Error deleting flashcard stack:', error);
      showError('Failed to delete flashcard stack');
    }
  };

  const handleDeleteClick = (stack) => {
    setStackToDelete(stack);
    setShowDeleteModal(true);
  };

  const handleViewStack = (stack) => {
    setSelectedStack(stack);
    setShowViewModal(true);
  };

  const handleEditStack = (stack) => {
    setSelectedStack(stack);
    setShowEditModal(true);
  };

  const handleCreateStack = () => {
    setSelectedStack(null);
    setShowCreateModal(true);
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowViewModal(false);
    setShowDeleteModal(false);
    setSelectedStack(null);
    setStackToDelete(null);
  };

  const handleSuccess = () => {
    handleModalClose();
    fetchFlashcardStacks();
    fetchMyStacks();
  };

  const filteredStacks = flashcardStacks.filter(stack => {
    const matchesSearch = stack.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         stack.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         stack.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const getCurrentStacks = () => {
    switch (activeTab) {
      case 'all':
        return filteredStacks;
      case 'my':
        return myStacks.filter(stack => 
          stack.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          stack.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          stack.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      case 'teachers':
        return filteredStacks.filter(stack => stack.isTeacherStack);
      case 'students':
        return filteredStacks.filter(stack => !stack.isTeacherStack);
      default:
        return filteredStacks;
    }
  };

  const currentStacks = getCurrentStacks();

  const FlashcardStackCard = ({ stack }) => {
    const getCreatorIcon = (role) => {
      return role === 'teacher' ? AcademicCapIcon : UsersIcon;
    };

    const getAccessIcon = (isPublic) => {
      return isPublic ? GlobeAltIcon : LockClosedIcon;
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800/70 rounded-xl border border-gray-700/50 p-4 sm:p-6 shadow-md transition-all hover:bg-gray-700/90 hover:border-gray-600"
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-3">
              <BookOpenIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 flex-shrink-0" />
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                {stack.isTeacherStack ? 'Teacher Stack' : 'Student Stack'}
              </span>
              {stack.isTeacherStack && (
                <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
                  {stack.totalCards} cards
                </span>
              )}
              {!stack.isTeacherStack && (
                <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full">
                  {stack.totalCards} cards
                </span>
              )}
            </div>
            
            <h3 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3 leading-tight break-words">
              {stack.title}
            </h3>
            
            {stack.description && (
              <p className="text-sm text-gray-400 mb-3 sm:mb-4 line-clamp-2 break-words">
                {stack.description}
              </p>
            )}
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-400 mb-3">
              <div className="flex items-center space-x-1">
                <BookOpenIcon className="h-4 w-4 flex-shrink-0" />
                <span>{stack.totalCards} cards</span>
              </div>
              <div className="flex items-center space-x-1">
                <UsersIcon className="h-4 w-4 flex-shrink-0" />
                <span>{stack.studyCount || 0} studies</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 text-xs text-gray-500">
              <span className="truncate">By {stack.creatorName}</span>
              <span className={`px-2 py-1 rounded-full text-xs flex-shrink-0 ${
                stack.creatorRole === 'teacher' 
                  ? 'bg-blue-500/20 text-blue-300' 
                  : 'bg-green-500/20 text-green-300'
              }`}>
                {stack.creatorRole}
              </span>
            </div>
          </div>
          
          <div className="flex sm:flex-col justify-end sm:justify-start gap-2 flex-shrink-0">
            <button
              onClick={() => handleViewStack(stack)}
              className="p-2 bg-blue-600/20 text-blue-400 rounded-xl hover:bg-blue-600/40 transition-colors"
              title="View stack"
            >
              <EyeIcon className="h-4 w-4" />
            </button>
            {stack.createdBy === localStorage.getItem('userId') && (
              <button
                onClick={() => handleEditStack(stack)}
                className="p-2 bg-blue-600/20 text-blue-400 rounded-xl hover:bg-blue-600/40 transition-colors"
                title="Edit stack"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => handleDeleteClick(stack)}
              className="p-2 bg-red-600/20 text-red-400 rounded-xl hover:bg-red-600/40 transition-colors"
              title="Delete stack"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-gray-400 mt-4">Loading flashcard stacks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 bg-gray-800/60 rounded-xl p-4 sm:p-6 shadow-2xl backdrop-blur-sm border-2 border-gray-600/50">
        <div className="flex-1">
          <h2 className="text-lg sm:text-xl lg:text-[20pt] font-bold text-white">Flashcard Center</h2>
          <p className="text-sm lg:text-[14pt] text-gray-300 mt-1">Create and manage flashcard stacks for enhanced learning</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="bg-blue-500/30 text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
            {stats.totalStacks || 0} Stacks
          </div>
          <motion.button
            onClick={handleCreateStack}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-all duration-300 font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <PlusIcon className="h-5 w-5" />
            <span>Create Stack</span>
          </motion.button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Stacks</p>
              <p className="text-2xl font-bold text-white">{stats.totalStacks || 0}</p>
            </div>
            <BookOpenIcon className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Teacher Stacks</p>
              <p className="text-2xl font-bold text-white">{stats.teacherStacks || 0}</p>
            </div>
            <AcademicCapIcon className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Student Stacks</p>
              <p className="text-2xl font-bold text-white">{stats.studentStacks || 0}</p>
            </div>
            <UsersIcon className="h-8 w-8 text-green-400" />
          </div>
        </div>
        <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Cards</p>
              <p className="text-2xl font-bold text-white">{stats.totalCards || 0}</p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800/60 rounded-xl p-4 sm:p-6 shadow-2xl backdrop-blur-sm border-2 border-gray-600/50">
        <div className="space-y-4">
          {/* Search and Filter Toggle */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search flashcard stacks..."
                className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900/70 text-white text-sm sm:text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 sm:py-3 bg-gray-700/50 hover:bg-gray-700/70 text-white rounded-xl transition-colors text-sm sm:text-base"
            >
              <FunnelIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Filters</span>
              <span className="sm:hidden">Filter</span>
            </button>
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                <select
                  className="px-3 py-2 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900/70 text-white text-sm sm:text-base"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
                <select
                  className="px-3 py-2 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900/70 text-white text-sm sm:text-base"
                  value={filterCreator}
                  onChange={(e) => setFilterCreator(e.target.value)}
                >
                  {creatorFilters.map(creator => (
                    <option key={creator.value} value={creator.value}>
                      {creator.label}
                    </option>
                  ))}
                </select>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tab Navigation - Improved Responsiveness */}
        <nav className="flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-4 mt-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-medium transition-all text-sm sm:text-base whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700/70 hover:text-white'
            }`}
          >
            <BookOpenIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 flex-shrink-0" />
            <span className="hidden sm:inline">All Stacks</span>
            <span className="sm:hidden">All</span>
            <span className="ml-1 sm:ml-2 bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full text-xs">
              {stats.totalStacks || 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`flex items-center px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-medium transition-all text-sm sm:text-base whitespace-nowrap ${
              activeTab === 'my'
                ? 'bg-green-600 text-white'
                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700/70 hover:text-white'
            }`}
          >
            <UsersIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 flex-shrink-0" />
            <span className="hidden sm:inline">My Stacks</span>
            <span className="sm:hidden">My</span>
            <span className="ml-1 sm:ml-2 bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full text-xs">
              {myStacks.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('teachers')}
            className={`flex items-center px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-medium transition-all text-sm sm:text-base whitespace-nowrap ${
              activeTab === 'teachers'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700/70 hover:text-white'
            }`}
          >
            <AcademicCapIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 flex-shrink-0" />
            <span className="hidden sm:inline">Teacher Stacks</span>
            <span className="sm:hidden">Teachers</span>
            <span className="ml-1 sm:ml-2 bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full text-xs">
              {stats.teacherStacks || 0}
            </span>
          </button>
        </nav>
      </div>

      {/* Flashcard Stacks List - Improved Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading flashcard stacks...</p>
          </div>
        ) : currentStacks.length === 0 ? (
          <div className="text-center py-8">
            <BookOpenIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No flashcard stacks found</p>
            <p className="text-gray-500 text-sm">Add your first flashcard stack to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {currentStacks.map((stack) => (
              <FlashcardStackCard key={stack._id} stack={stack} />
            ))}
          </div>
        )}
      </div>



      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateFlashcardModal
            isOpen={showCreateModal}
            onClose={handleModalClose}
            onSuccess={handleSuccess}
          />
        )}

        {showEditModal && selectedStack && (
          <EditFlashcardModal
            isOpen={showEditModal}
            onClose={handleModalClose}
            onSuccess={handleSuccess}
            stack={selectedStack}
          />
        )}

                 {showViewModal && selectedStack && (
           <ViewFlashcardModal
             isOpen={showViewModal}
             onClose={handleModalClose}
             stack={selectedStack}
           />
         )}

         {/* Delete Confirmation Modal */}
         {showDeleteModal && stackToDelete && (
           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
             <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700">
               <div className="flex items-center space-x-3 mb-4">
                 <div className="flex-shrink-0">
                   <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                     <TrashIcon className="h-6 w-6 text-red-600" />
                   </div>
                 </div>
                 <div>
                   <h3 className="text-lg font-semibold text-white">Delete Flashcard Stack</h3>
                   <p className="text-sm text-gray-400">This action cannot be undone.</p>
                 </div>
               </div>
               
               <div className="mb-6">
                 <p className="text-gray-300 mb-2">
                   Are you sure you want to delete <span className="font-semibold text-white">"{stackToDelete.title}"</span>?
                 </p>
                 <p className="text-sm text-gray-400">
                   This will permanently remove the stack and all its cards.
                 </p>
               </div>
               
               <div className="flex space-x-3">
                 <button
                   onClick={() => {
                     setShowDeleteModal(false);
                     setStackToDelete(null);
                   }}
                   className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
                 >
                   Cancel
                 </button>
                 <button
                   onClick={() => handleDeleteStack(stackToDelete._id)}
                   className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                 >
                   Delete
                 </button>
               </div>
             </div>
           </div>
         )}
       </AnimatePresence>
     </div>
   );
 };

export default FlashcardCenter; 