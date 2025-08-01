import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ENDPOINTS } from '../../config/api';
import {
  PlayIcon,
  BookOpenIcon,
  ComputerDesktopIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

// Slightly darker gradients for each program
const programGradients = {
  Word: 'from-blue-900/50 via-blue-800/40 to-gray-900/30',
  PowerPoint: 'from-orange-900/50 via-orange-800/40 to-gray-900/30',
  Access: 'from-red-900/50 via-red-800/40 to-gray-900/30',
  Excel: 'from-green-900/50 via-green-800/40 to-gray-900/30',
  SharePoint: 'from-indigo-900/50 via-indigo-800/40 to-gray-900/30'
};

// Manual chapter names for each phase (total 13 chapters)
const ChapterNames = {
  1: [
    "Computer Structure",
    "Input Devices",
    "Output Devices",
    "Storage Devices"
  ],
  2: [
    "Database",
    "Networks",
    "Malware Attacks",
  ],
  3: [
    "System Life Cycle (SDLC)",
    "ICT Systems",
    "Banking Applications",
    "ICT Applications",
    "ICT Programs",
    "ICT Effects"
  ]
};

// Flatten all chapter names for numbering
const allChapters = [
  ...ChapterNames[1],
  ...ChapterNames[2],
  ...ChapterNames[3]
];

const getChapterNumber = (phase, index) => {
  if (phase === 1) return index + 1;
  if (phase === 2) return ChapterNames[1].length + index + 1;
  if (phase === 3) return ChapterNames[1].length + ChapterNames[2].length + index + 1;
  return index + 1;
};

const VideosTab = ({ studentData }) => {
  const [activeSection, setActiveSection] = useState('theory');
  const [expandedSections, setExpandedSections] = useState({});
  const [videos, setVideos] = useState({ theory: {}, practical: {} });
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.STUDENT.VIDEOS, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVideos(data.data.videos);
        setProgress(data.data.progress);
      } else {
        console.error('Failed to fetch videos:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClick = (video) => {
    setSelectedVideo(video);
    setShowVideoPlayer(true);
  };

  const VideoCard = ({ video, index }) => {
    const formatDuration = (seconds) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        className="bg-gray-800/70 rounded-xl border border-gray-700/50 p-4 shadow-md transition-shadow hover:bg-gray-700/90 cursor-pointer"
        onClick={() => handleVideoClick(video)}
      >
        <div className="flex items-center space-x-3">
          <div className="w-16 h-12 bg-gray-700/80 rounded-xl flex items-center justify-center">
            <PlayIcon className="h-6 w-6 text-gray-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-white">{video.title}</h4>
        
          </div>
          <button className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 transition-colors">
            <PlayIcon className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6 bg-gray-800/60 rounded-xl p-6 shadow-2xl backdrop-blur-sm border-2 border-gray-600/50">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[20pt] font-bold text-white">Recordings Library</h2>

      </div>

      {/* Section Tabs */}
      <div className="border-b border-gray-700 flex justify-center">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveSection('theory')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeSection === 'theory'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <BookOpenIcon className="inline h-5 w-5 mr-2" />
            Theory Videos
          </button>
          <button
            onClick={() => setActiveSection('practical')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeSection === 'practical'
                ? 'border-green-500 text-green-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <ComputerDesktopIcon className="inline h-5 w-5 mr-2" />
            Practical Videos
          </button>
          <button
            onClick={() => setActiveSection('other')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeSection === 'other'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <PlayIcon className="inline h-5 w-5 mr-2" />
            Other Videos
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="mt-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading videos...</p>
          </div>
        ) : activeSection === 'theory' ? (
          <div className="space-y-4">
            {[1, 2, 3].map((phase) => {
              const phaseVideos = videos.theory[`phase${phase}`] || [];
              return (
                <div
                  key={phase}
                  className="bg-gray-900/70 rounded-xl border border-gray-700/50 transition-all backdrop-blur-md"
                >
                  <button
                    onClick={() => toggleSection(`phase${phase}`)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-800/70 rounded-xl transition-colors"
                  >
                    <div>
                      <h3 className="text-lg font-medium text-white">Phase {phase}</h3>
                      <p className="text-sm text-gray-400">
                        {phaseVideos.length} videos
                      </p>
                    </div>
                    {expandedSections[`phase${phase}`] ? (
                      <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                  {expandedSections[`phase${phase}`] && (
                    <div className="px-6 pb-6 space-y-3">
                      {phaseVideos.length > 0 ? (
                        phaseVideos.map((video, i) => (
                          <VideoCard key={video._id} video={video} index={i} />
                        ))
                      ) : (
                        <p className="text-gray-400 text-center py-4">No videos available for this phase</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : activeSection === 'practical' ? (
          <div className="space-y-4">
            {[
              { name: 'Word', guides: 2, tasks: 2 },
              { name: 'PowerPoint', guides: 2, tasks: 2 },
              { name: 'Access', guides: 4, tasks: 4 },
              { name: 'Excel', guides: 4, tasks: 4 },
              { name: 'SharePoint', guides: 5, tasks: 5 }
            ].map((program) => {
              const programVideos = videos.practical[program.name.toLowerCase()] || {};
              const guides = programVideos.guides || [];
              const tasks = programVideos.tasks || [];
              
              return (
                <div
                  key={program.name}
                  className={`rounded-xl border border-gray-700/50 transition-all bg-gradient-to-br ${programGradients[program.name]} backdrop-blur-md`}
                >
                  <button
                    onClick={() => toggleSection(program.name.toLowerCase())}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <div>
                      <h3 className="text-lg font-medium text-white">Microsoft {program.name}</h3>
                      <p className="text-sm text-gray-300">
                        {guides.length + tasks.length} videos
                      </p>
                    </div>
                    {expandedSections[program.name.toLowerCase()] ? (
                      <ChevronDownIcon className="h-5 w-5 text-gray-300" />
                    ) : (
                      <ChevronRightIcon className="h-5 w-5 text-gray-300" />
                    )}
                  </button>
                  {expandedSections[program.name.toLowerCase()] && (
                    <div className="px-6 pb-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium mb-3 text-white">Guides</h4>
                          <div className="space-y-3">
                            {guides.length > 0 ? (
                              guides.map((video, i) => (
                                <VideoCard key={video._id} video={video} index={i} />
                              ))
                            ) : (
                              <p className="text-gray-400 text-center py-4">No guides available</p>
                            )}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-3 text-white">Tasks</h4>
                          <div className="space-y-3">
                            {tasks.length > 0 ? (
                              tasks.map((video, i) => (
                                <VideoCard key={video._id} video={video} index={i} />
                              ))
                            ) : (
                              <p className="text-gray-400 text-center py-4">No tasks available</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-900/70 rounded-xl border border-gray-700/50 transition-all backdrop-blur-md">
              <div className="px-6 py-4">
                <h3 className="text-lg font-medium text-white">Other Videos</h3>
                <p className="text-sm text-gray-400">Revisions, additional materials, and miscellaneous content</p>
              </div>
              <div className="px-6 pb-6 space-y-3">
                {videos.other && videos.other.length > 0 ? (
                  videos.other.map((video, i) => (
                    <VideoCard key={video._id} video={video} index={i} />
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-4">No other videos available</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      <AnimatePresence>
        {showVideoPlayer && selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">{selectedVideo.title}</h3>
                <button
                  onClick={() => {
                    setShowVideoPlayer(false);
                    setSelectedVideo(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="aspect-video bg-black rounded-xl overflow-hidden mb-4">
                <iframe
                  src={selectedVideo.videoUrl}
                  title={selectedVideo.title}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

             
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideosTab; 