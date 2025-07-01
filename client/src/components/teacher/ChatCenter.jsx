import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { API_ENDPOINTS } from '../../config/api';
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  UserIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  ClockIcon,
  PaperClipIcon,
  DocumentIcon,
  PhotoIcon,
  MusicalNoteIcon,
  VideoCameraIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

const ChatCenter = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      fetchMessages();
    }
  }, [selectedStudent]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.CHAT.BASE}/teacher/students`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStudents(data.data.students);
        
        // Auto-select first student if available
        if (data.data.students.length > 0 && !selectedStudent) {
          setSelectedStudent(data.data.students[0]);
        }
      } else {
        console.error('Failed to fetch students');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!selectedStudent) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.CHAT.CONVERSATIONS}/${selectedStudent.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.data.messages);
        
        // Update student's unread count to 0
        setStudents(prev => 
          prev.map(student => 
            student.id === selectedStudent.id 
              ? { ...student, unreadCount: 0 }
              : student
          )
        );
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && selectedFiles.length === 0) || !selectedStudent) return;

    setSendingMessage(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      formData.append('recipientId', selectedStudent.id);
      formData.append('content', newMessage);
      formData.append('type', 'text');

      // Add files to form data
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch(API_ENDPOINTS.CHAT.SEND, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data.data.message]);
        setNewMessage('');
        setSelectedFiles([]);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // Update student's last message in the sidebar
        setStudents(prev => 
          prev.map(student => 
            student.id === selectedStudent.id 
              ? { 
                  ...student, 
                  lastMessage: {
                    content: newMessage || 'File attachment',
                    createdAt: new Date().toISOString(),
                    isFromCurrentUser: true
                  },
                  lastActivity: new Date().toISOString()
                }
              : student
          )
        );
      } else {
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.CHAT.MESSAGES}/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setMessages(prev => prev.filter(msg => msg._id !== messageId));
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const downloadFile = async (messageId, filename, originalName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.CHAT.FILES}/${messageId}/${filename}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = originalName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        console.error('Failed to download file');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const getFileIcon = (mimetype) => {
    if (mimetype.startsWith('image/')) return PhotoIcon;
    if (mimetype.startsWith('audio/')) return MusicalNoteIcon;
    if (mimetype.startsWith('video/')) return VideoCameraIcon;
    return DocumentIcon;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimestamp = (timestamp) => {
    const messageTime = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const messageDate = new Date(messageTime.getFullYear(), messageTime.getMonth(), messageTime.getDate());

    const timeString = messageTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    if (messageDate.getTime() === today.getTime()) {
      return timeString; // Today: just show time
    } else if (messageDate.getTime() === yesterday.getTime()) {
      return `Yesterday ${timeString}`;
    } else if (now.getTime() - messageTime.getTime() < 7 * 24 * 60 * 60 * 1000) {
      // Within a week: show day name
      return messageTime.toLocaleDateString('en-US', {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } else {
      // Older: show date
      return messageTime.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
  };

  const filteredStudents = students.filter(student =>
    student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[70vh] lg:h-[80vh] bg-gray-900/70 rounded-xl border border-gray-700/50 overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Students Sidebar */}
      <div className={`${selectedStudent ? 'hidden lg:flex' : 'flex'} w-full lg:w-1/3 border-r border-gray-700/50 flex-col bg-gray-900/50`}>
        {/* Search Header */}
        <div className="p-3 sm:p-4 border-b border-gray-700/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base sm:text-lg font-semibold text-white">Student Chats</h3>
            <div className="flex items-center space-x-2">
              <span className="text-xs sm:text-sm text-gray-400">
                {students.filter(s => s.unreadCount > 0).length} unread
              </span>
            </div>
          </div>
          
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search students..."
              className="w-full pl-10 pr-3 py-2 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-800/90 text-white"
            />
          </div>
        </div>

        {/* Students List */}
        <div className="flex-1 overflow-y-auto">
          {filteredStudents.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-2 text-gray-600" />
              <p>No students found</p>
            </div>
          ) : (
            filteredStudents.map((student) => (
              <button
                key={student.id}
                onClick={() => setSelectedStudent(student)}
                className={`w-full p-3 sm:p-4 text-left hover:bg-gray-700/50 border-b border-gray-800/70 transition-colors ${
                  selectedStudent?.id === student.id
                    ? 'bg-blue-900/50'
                    : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-700/80 rounded-full flex items-center justify-center shadow-sm ring-2 ring-gray-600/50">
                      <UserIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                    </div>
                    {student.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                        {student.unreadCount}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white truncate">
                        {student.fullName}
                      </p>
                      {student.lastMessage && (
                        <p className="text-xs text-gray-400">
                          {formatTimestamp(student.lastMessage.createdAt)}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-1 gap-1">
                      <p className="text-xs text-gray-500">
                        {student.studentId} • Year {student.year}
                      </p>
                      <p className="text-xs text-gray-500 sm:hidden">
                        {student.session}
                      </p>
                    </div>
                    
                    {student.lastMessage && (
                      <p className="text-xs text-gray-400 truncate mt-1">
                        {student.lastMessage.isFromCurrentUser ? 'You: ' : ''}
                        {student.lastMessage.content}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedStudent ? (
          <>
            {/* Chat Header */}
            <div className="p-3 sm:p-4 border-b border-gray-700/50">
              <div className="flex items-center justify-between">
                {/* Back button for mobile */}
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-xl transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-700/80 rounded-full flex items-center justify-center shadow-sm ring-2 ring-gray-600/50">
                  <UserIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-medium text-white truncate">
                    {selectedStudent.fullName}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-400 truncate">
                    {selectedStudent.studentId} • Year {selectedStudent.year} • {selectedStudent.session}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 mt-8 sm:mt-12">
                  <div className="bg-gray-800/60 rounded-full p-4 sm:p-6 shadow-lg inline-block mb-4 border border-gray-700/50">
                    <ChatBubbleLeftRightIcon className="h-12 w-12 sm:h-16 sm:w-16 text-gray-500" />
                  </div>
                  <h3 className="text-base sm:text-lg font-medium text-white mb-2">No messages yet</h3>
                  <p className="text-sm text-gray-500">Start the conversation with {selectedStudent.firstName}!</p>
                </div>
              ) : (
                messages.map((message, index) => {
                  const isOwnMessage = message.sender.role === 'teacher';
                  
                  return (
                    <motion.div
                      key={message._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 group`}
                    >
                      <div className={`flex items-end space-x-2 max-w-xs sm:max-w-sm lg:max-w-md ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        {/* Avatar */}
                        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-md flex-shrink-0 ${
                          isOwnMessage ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-gray-600 to-gray-700'
                        }`}>
                          {isOwnMessage ? (
                            <AcademicCapIcon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                          ) : (
                            <UserIcon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                          )}
                        </div>
                        
                        {/* Message Container */}
                        <div className="relative">
                          {/* Message Bubble */}
                          <div className={`relative px-3 sm:px-4 py-2 sm:py-3 shadow-md ${
                            isOwnMessage 
                            ? 'bg-gray-700/80 text-white rounded-xl rounded-bl-lg border border-red-700'
                            : 'bg-gray-700/80 text-white rounded-xl rounded-bl-lg'
                          }`}>
                            {/* Sender Name */}
                            <p className={`text-xs font-semibold mb-1 ${
                              isOwnMessage ? 'text-blue-200' : 'text-white-400'
                            }`}>
                              {isOwnMessage ? '' : `${message.sender.firstName} ${message.sender.lastName}`}
                            </p>
                            
                            {/* Message Content */}
                            {message.content && (
                              <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                            )}
                            
                            {/* File Attachments */}
                            {message.attachments && message.attachments.length > 0 && (
                              <div className="mt-2 sm:mt-3 space-y-2">
                                {message.attachments.map((attachment, idx) => {
                                  const FileIcon = getFileIcon(attachment.mimetype);
                                  return (
                                    <div
                                      key={idx}
                                      className={`flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-xl ${
                                        isOwnMessage ? 'bg-blue-900/30' : 'bg-gray-600/50'
                                      }`}
                                    >
                                      <div className={`p-1 sm:p-2 rounded-xl ${
                                        isOwnMessage ? 'bg-white/10' : 'bg-gray-500/50'
                                      }`}>
                                        <FileIcon className={`h-4 w-4 sm:h-5 sm:w-5 ${
                                          isOwnMessage ? 'text-blue-200' : 'text-gray-300'
                                        }`} />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs sm:text-sm font-medium truncate text-white">
                                          {attachment.originalName}
                                        </p>
                                        <p className={`text-xs ${
                                          isOwnMessage ? 'text-blue-200' : 'text-gray-400'
                                        }`}>
                                          {formatFileSize(attachment.size)}
                                        </p>
                                      </div>
                                      <button
                                        onClick={() => downloadFile(message._id, attachment.filename, attachment.originalName)}
                                        className={`p-1 sm:p-2 rounded-xl transition-colors ${
                                          isOwnMessage ? 'text-blue-200 hover:bg-white/20' : 'text-gray-300 hover:bg-gray-400/50'
                                        }`}
                                      >
                                        <ArrowDownTrayIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            
                            {/* Timestamp */}
                            <p className={`text-xs mt-1 ${
                              isOwnMessage ? 'text-gray-300' : 'text-gray-500'
                            }`}>
                              {formatTimestamp(message.createdAt)}
                            </p>
                          </div>
                          
                          {/* Delete Button for Teacher's Messages */}
                          {isOwnMessage && (
                            <button
                              onClick={() => deleteMessage(message._id)}
                              className="absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:text-red-400 hover:bg-red-500/20 rounded-full transition-all"
                              style={{ left: 'auto', right: '-2.5rem' }}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* File Preview */}
            {selectedFiles.length > 0 && (
              <div className="px-3 sm:px-6 py-3 sm:py-4 bg-gray-900/50 border-t border-gray-700/50">
                <p className="text-sm font-medium text-blue-400 mb-3">Files to send:</p>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {selectedFiles.map((file, index) => {
                    const FileIcon = getFileIcon(file.type);
                    return (
                      <div key={index} className="flex items-center space-x-2 sm:space-x-3 bg-gray-700/70 rounded-xl p-2 sm:p-3 border border-gray-600/50 shadow-md hover:shadow-lg transition-shadow">
                        <div className="p-1 sm:p-2 bg-blue-500/20 rounded-xl">
                          <FileIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-white truncate">{file.name}</p>
                          <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="p-1 text-red-500 hover:text-red-400 hover:bg-red-500/20 rounded-full transition-colors"
                        >
                          <TrashIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Message Input */}
            <div className="p-3 sm:p-4 border-t border-gray-700/50">
              {/* File previews */}
              <form onSubmit={sendMessage} className="flex flex-col sm:flex-row items-end space-y-2 sm:space-y-0 sm:space-x-2 lg:space-x-4">
                <div className="flex-1 w-full">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-800/90 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 resize-none text-sm sm:text-base"
                    rows={2}
                    disabled={sendingMessage}
                  />
                </div>
                
                <div className="flex flex-row sm:flex-col w-full sm:w-auto space-x-2 sm:space-x-0 sm:space-y-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    multiple
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 sm:flex-none p-2 sm:p-3 bg-gray-700/50 text-gray-300 rounded-xl hover:bg-gray-600/50 transition-colors"
                  >
                    <PaperClipIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>

                  <button
                    type="submit"
                    disabled={(!newMessage.trim() && selectedFiles.length === 0) || sendingMessage}
                    className="flex-1 sm:flex-none p-2 sm:p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <PaperAirplaneIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center text-gray-400 p-4">
            <div>
              <ChatBubbleLeftRightIcon className="h-16 w-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-lg font-medium text-white mb-2">Select a Student</h3>
              <p className="text-sm text-gray-500">Choose a student from the list to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatCenter; 