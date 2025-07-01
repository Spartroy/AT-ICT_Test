import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  ChatBubbleLeftRightIcon,
  UserIcon,
  AcademicCapIcon,
  ClockIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

const ParentChat = ({ selectedChild, parentData }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Sample teacher info (in real app, this would come from API)
  const teacherInfo = {
    name: 'Mr. Ahmad Khoja',
    title: 'Computer Science Teacher',
    isOnline: true,
    lastSeen: new Date()
  };

  // Sample messages for demonstration
  const sampleMessages = [
    {
      _id: '1',
      sender: 'teacher',
      content: `Hello! I wanted to update you on ${selectedChild?.student?.user?.firstName || 'your child'}'s progress this week.`,
      timestamp: new Date(Date.now() - 86400000), // 1 day ago
      read: true
    },
    {
      _id: '2',
      sender: 'parent',
      content: 'Thank you for reaching out! How has the performance been in the recent assignments?',
      timestamp: new Date(Date.now() - 82800000), // 23 hours ago
      read: true
    },
    {
      _id: '3',
      sender: 'teacher',
      content: `${selectedChild?.student?.user?.firstName || 'Your child'} has shown excellent improvement in programming tasks. The Database Design assignment was particularly well done with a score of 87%.`,
      timestamp: new Date(Date.now() - 82200000), // 22.8 hours ago
      read: true
    },
    {
      _id: '4',
      sender: 'parent',
      content: 'That\'s wonderful to hear! Are there any areas where additional practice would be beneficial?',
      timestamp: new Date(Date.now() - 81600000), // 22.6 hours ago
      read: true
    },
    {
      _id: '5',
      sender: 'teacher',
      content: 'I would recommend focusing on advanced algorithms and data structures. I can provide some additional practice materials if that would help.',
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      read: false
    }
  ];

  // Quick message templates
  const quickMessages = [
    "How is my child's progress this week?",
    "Are there any assignments I should help with?",
    "Can we schedule a meeting to discuss performance?",
    "Thank you for the update!",
    "Is there any homework for this weekend?",
    "How can I support learning at home?"
  ];

  useEffect(() => {
    // Simulate loading messages
    setTimeout(() => {
      setMessages(sampleMessages);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (messageContent = newMessage) => {
    if (!messageContent.trim()) return;

    setSending(true);
    
    const message = {
      _id: Date.now().toString(),
      sender: 'parent',
      content: messageContent.trim(),
      timestamp: new Date(),
      read: false
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Simulate message sending delay
    setTimeout(() => {
      setSending(false);
      
      // Simulate teacher response after a delay
      if (Math.random() > 0.5) {
        setTimeout(() => {
          const teacherResponse = {
            _id: (Date.now() + 1).toString(),
            sender: 'teacher',
            content: 'Thank you for your message. I\'ll get back to you with more details soon.',
            timestamp: new Date(),
            read: false
          };
          setMessages(prev => [...prev, teacherResponse]);
        }, 2000);
      }
    }, 500);
  };

  const handleQuickMessage = (message) => {
    handleSendMessage(message);
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInHours = (now - messageTime) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - messageTime) / (1000 * 60));
      return `${diffInMinutes} min ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else {
      return messageTime.toLocaleDateString();
    }
  };

  if (!selectedChild) {
    return (
      <div className="text-center py-12">
        <ChatBubbleLeftRightIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Child Selected</h3>
        <p className="text-gray-500">Please select a child to start chatting with their teacher.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Chat Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <AcademicCapIcon className="h-6 w-6 text-blue-600" />
              </div>
              {teacherInfo.isOnline && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{teacherInfo.name}</h3>
              <p className="text-sm text-gray-500">{teacherInfo.title}</p>
              <div className="flex items-center text-xs text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                {teacherInfo.isOnline ? 'Online now' : `Last seen ${formatTime(teacherInfo.lastSeen)}`}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Teaching</div>
            <div className="font-medium text-gray-900">
              {selectedChild.student.user.firstName} {selectedChild.student.user.lastName}
            </div>
            <div className="text-xs text-gray-500">Year {selectedChild.student.year}</div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="bg-white rounded-lg border border-gray-200 h-96 flex flex-col">
        {/* Messages Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((message, index) => (
            <motion.div
              key={message._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex ${message.sender === 'parent' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md ${message.sender === 'parent' ? 'order-2' : 'order-1'}`}>
                <div
                  className={`px-4 py-2 rounded-lg ${
                    message.sender === 'parent'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
                <div className={`mt-1 flex items-center space-x-1 text-xs text-gray-500 ${
                  message.sender === 'parent' ? 'justify-end' : 'justify-start'
                }`}>
                  <span>{formatTime(message.timestamp)}</span>
                  {message.sender === 'parent' && (
                    <CheckIcon className={`h-3 w-3 ${message.read ? 'text-blue-600' : 'text-gray-400'}`} />
                  )}
                </div>
              </div>
              
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                message.sender === 'parent' ? 'order-1 mr-2 bg-blue-100' : 'order-2 ml-2 bg-gray-100'
              }`}>
                {message.sender === 'parent' ? (
                  <UserIcon className="h-4 w-4 text-blue-600" />
                ) : (
                  <AcademicCapIcon className="h-4 w-4 text-gray-600" />
                )}
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="flex-1">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your message..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={sending}
              />
            </div>
            <button
              onClick={() => handleSendMessage()}
              disabled={sending || !newMessage.trim()}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <UserIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Messages */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="font-medium text-gray-900 mb-3">Quick Messages</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {quickMessages.map((message, index) => (
            <button
              key={index}
              onClick={() => handleQuickMessage(message)}
              className="text-left p-3 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={sending}
            >
              {message}
            </button>
          ))}
        </div>
      </div>

      {/* Communication Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2 flex items-center">
          <ClockIcon className="h-4 w-4 mr-1" />
          Communication Guidelines
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Messages are typically responded to within 24 hours during weekdays</li>
          <li>• For urgent matters, please call the school directly</li>
          <li>• Weekly progress updates are sent every Friday</li>
          <li>• Parent-teacher conferences can be scheduled through this chat</li>
        </ul>
      </div>
    </div>
  );
};

export default ParentChat; 