const Message = require('../models/Message');
const User = require('../models/User');
const Student = require('../models/Student');
const path = require('path');
const fs = require('fs');

// @desc    Get student's assigned teacher (for single chat)
// @route   GET /api/chat/student/teacher
// @access  Private (Student)
const getStudentTeacher = async (req, res) => {
  try {
    // For now, assume all students chat with the first teacher
    // Later this can be enhanced to support assigned teachers per student
    const teacher = await User.findOne({ role: 'teacher', isActive: true })
      .select('firstName lastName email role profileImage');

    if (!teacher) {
      return res.status(404).json({
        status: 'error',
        message: 'No teacher found'
      });
    }

    // Get unread count from this teacher
    const unreadCount = await Message.countDocuments({
      recipient: req.user.id,
      sender: teacher._id,
      isRead: false,
      'deleted.isDeleted': { $ne: true }
    });

    // Get last message
    const lastMessage = await Message.findOne({
      $or: [
        { sender: req.user.id, recipient: teacher._id },
        { sender: teacher._id, recipient: req.user.id }
      ],
      'deleted.isDeleted': { $ne: true }
    })
    .sort({ createdAt: -1 })
    .populate('sender', 'firstName lastName');

    res.status(200).json({
      status: 'success',
      data: {
        teacher: {
          id: teacher._id,
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          fullName: `${teacher.firstName} ${teacher.lastName}`,
          email: teacher.email,
          role: teacher.role,
          profileImage: teacher.profileImage
        },
        unreadCount,
        lastMessage: lastMessage ? {
          content: lastMessage.content,
          createdAt: lastMessage.createdAt,
          isFromCurrentUser: lastMessage.sender._id.toString() === req.user.id
        } : null
      }
    });
  } catch (error) {
    console.error('Get student teacher error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving teacher information'
    });
  }
};

// @desc    Get teacher's students (for multiple chat heads)
// @route   GET /api/chat/teacher/students
// @access  Private (Teacher)
const getTeacherStudents = async (req, res) => {
  try {
    // Get all approved students
    const students = await User.find({ 
      role: 'student', 
      registrationStatus: 'approved',
      isActive: true 
    })
    .select('firstName lastName email studentInfo.studentId studentInfo.year studentInfo.session profileImage')
    .sort({ firstName: 1, lastName: 1 });

    // Get conversation data for each student
    const studentsWithChatData = await Promise.all(
      students.map(async (student) => {
        // Get unread count from this student
        const unreadCount = await Message.countDocuments({
          recipient: req.user.id,
          sender: student._id,
          isRead: false,
          'deleted.isDeleted': { $ne: true }
        });

        // Get last message
        const lastMessage = await Message.findOne({
          $or: [
            { sender: req.user.id, recipient: student._id },
            { sender: student._id, recipient: req.user.id }
          ],
          'deleted.isDeleted': { $ne: true }
        })
        .sort({ createdAt: -1 })
        .populate('sender', 'firstName lastName');

        return {
          id: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          fullName: `${student.firstName} ${student.lastName}`,
          email: student.email,
          studentId: student.studentInfo?.studentId || 'N/A',
          year: student.studentInfo?.year || 'N/A',
          session: student.studentInfo?.session || 'N/A',
          profileImage: student.profileImage,
          unreadCount,
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            createdAt: lastMessage.createdAt,
            isFromCurrentUser: lastMessage.sender._id.toString() === req.user.id
          } : null,
          lastActivity: lastMessage ? lastMessage.createdAt : student.createdAt
        };
      })
    );

    // Sort by last activity (most recent first)
    studentsWithChatData.sort((a, b) => {
      const aTime = a.lastActivity ? new Date(a.lastActivity) : new Date(0);
      const bTime = b.lastActivity ? new Date(b.lastActivity) : new Date(0);
      return bTime - aTime;
    });

    res.status(200).json({
      status: 'success',
      data: {
        students: studentsWithChatData
      }
    });
  } catch (error) {
    console.error('Get teacher students error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving students'
    });
  }
};

// @desc    Get conversations for current user
// @route   GET /api/chat/conversations
// @access  Private
const getConversations = async (req, res) => {
  try {
    const conversations = await Message.getUserConversations(req.user.id);
    
    // Format the response to include other participant info
    const formattedConversations = conversations.map(conv => {
      const lastMessage = conv.lastMessage;
      const isCurrentUserSender = lastMessage.sender.toString() === req.user.id;
      
      // Get other participant info
      const otherParticipant = isCurrentUserSender 
        ? conv.recipientInfo[0] 
        : conv.senderInfo[0];
      
      return {
        conversationId: conv._id,
        otherParticipant: {
          id: otherParticipant._id,
          firstName: otherParticipant.firstName,
          lastName: otherParticipant.lastName,
          fullName: `${otherParticipant.firstName} ${otherParticipant.lastName}`,
          profileImage: otherParticipant.profileImage,
          role: otherParticipant.role
        },
        lastMessage: {
          content: lastMessage.content,
          type: lastMessage.type,
          createdAt: lastMessage.createdAt,
          isFromCurrentUser: isCurrentUserSender
        },
        unreadCount: conv.unreadCount
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        conversations: formattedConversations
      }
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving conversations'
    });
  }
};

// @desc    Get messages from a specific conversation
// @route   GET /api/chat/conversations/:userId
// @access  Private
const getConversationMessages = async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Verify other user exists
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // For student-teacher chat, verify the relationship
    if (req.user.role === 'student' && otherUser.role !== 'teacher') {
      return res.status(403).json({
        status: 'error',
        message: 'Students can only chat with teachers'
      });
    }

    if (req.user.role === 'teacher' && otherUser.role !== 'student') {
      return res.status(403).json({
        status: 'error',
        message: 'Teachers can only chat with students'
      });
    }

    // Get conversation messages
    const conversationId = Message.generateConversationId(req.user.id, otherUserId);
    const messages = await Message.find({
      conversationId,
      'deleted.isDeleted': { $ne: true }
    })
    .populate('sender', 'firstName lastName profileImage role')
    .populate('recipient', 'firstName lastName profileImage role')
    .populate('replyTo')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);

    // Mark messages as read if they were sent to current user
    const unreadMessages = messages.filter(
      msg => msg.recipient._id.toString() === req.user.id && !msg.isRead
    );

    if (unreadMessages.length > 0) {
      await Promise.all(
        unreadMessages.map(msg => msg.markAsRead(req.user.id))
      );
    }

    // Get total count for pagination
    const total = await Message.countDocuments({
      conversationId,
      'deleted.isDeleted': { $ne: true }
    });

    res.status(200).json({
      status: 'success',
      data: {
        messages: messages.reverse(), // Show oldest first
        otherUser: {
          id: otherUser._id,
          firstName: otherUser.firstName,
          lastName: otherUser.lastName,
          fullName: `${otherUser.firstName} ${otherUser.lastName}`,
          profileImage: otherUser.profileImage,
          role: otherUser.role
        },
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get conversation messages error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving messages'
    });
  }
};

// @desc    Send a message
// @route   POST /api/chat/send
// @access  Private
const sendMessage = async (req, res) => {
  try {
    console.log('📨 Sending message - Body:', req.body);
    console.log('📁 Files received:', req.files?.length || 0);
    
    // Check for validation errors
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        status: 'error',
        message: 'Validation errors',
        errors: errors.array()
      });
    }
    
    const { recipientId, content, type = 'text', replyTo } = req.body;

    // For file uploads, content might be empty but files should be present
    if (!content && (!req.files || req.files.length === 0)) {
      console.log('❌ No content or files provided');
      return res.status(400).json({
        status: 'error',
        message: 'Message content or file attachment is required'
      });
    }

    // Verify recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        status: 'error',
        message: 'Recipient not found'
      });
    }

    // For student-teacher chat, verify the relationship
    if (req.user.role === 'student' && recipient.role !== 'teacher') {
      return res.status(403).json({
        status: 'error',
        message: 'Students can only message teachers'
      });
    }

    if (req.user.role === 'teacher' && recipient.role !== 'student') {
      return res.status(403).json({
        status: 'error',
        message: 'Teachers can only message students'
      });
    }

    // Handle file attachments
    let attachments = [];
    let messageType = type;

    if (req.files && req.files.length > 0) {
      attachments = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype
      }));

      // Determine message type based on file type
      if (messageType === 'text' && attachments.length > 0) {
        const firstFile = attachments[0];
        if (firstFile.mimetype.startsWith('image/')) {
          messageType = 'image';
        } else if (firstFile.mimetype.startsWith('audio/')) {
          messageType = 'audio';
        } else if (firstFile.mimetype.startsWith('video/')) {
          messageType = 'video';
        } else {
          messageType = 'file';
        }
      }
    }

    // Generate conversation ID
    const conversationId = Message.generateConversationId(req.user.id, recipientId);

    // Create message
    console.log('💾 Creating message with data:', {
      sender: req.user.id,
      recipient: recipientId,
      content: content || '',
      type: messageType,
      attachments: attachments.length,
      conversationId
    });

    let message;
    try {
      message = await Message.create({
        sender: req.user.id,
        recipient: recipientId,
        content: content || '', // Allow empty content for file-only messages
        type: messageType,
        attachments,
        conversationId,
        replyTo: replyTo || undefined
      });

      console.log('✅ Message created successfully:', message._id);
    } catch (createError) {
      console.error('❌ Message creation failed:', createError);
      throw createError;
    }

    // Populate message for response
    await message.populate([
      { path: 'sender', select: 'firstName lastName profileImage role' },
      { path: 'recipient', select: 'firstName lastName profileImage role' },
      { path: 'replyTo' }
    ]);

    res.status(201).json({
      status: 'success',
      message: 'Message sent successfully',
      data: {
        message
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error sending message'
    });
  }
};

// @desc    Mark message as read
// @route   PUT /api/chat/messages/:messageId/read
// @access  Private
const markMessageAsRead = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    
    if (!message) {
      return res.status(404).json({
        status: 'error',
        message: 'Message not found'
      });
    }

    // Check if current user is the recipient
    if (message.recipient.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to mark this message as read'
      });
    }

    await message.markAsRead(req.user.id);

    res.status(200).json({
      status: 'success',
      message: 'Message marked as read'
    });
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error marking message as read'
    });
  }
};

// @desc    Get unread messages count
// @route   GET /api/chat/unread-count
// @access  Private
const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Message.getUnreadCount(req.user.id);

    res.status(200).json({
      status: 'success',
      data: {
        unreadCount
      }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving unread count'
    });
  }
};

// @desc    Search for users to start conversation (Teacher only)
// @route   GET /api/chat/search-users
// @access  Private (Teacher)
const searchUsers = async (req, res) => {
  try {
    const { search, role } = req.query;
    
    if (!search || search.length < 2) {
      return res.status(400).json({
        status: 'error',
        message: 'Search query must be at least 2 characters'
      });
    }

    let query = {
      $or: [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ],
      _id: { $ne: req.user.id }, // Exclude current user
      isActive: true
    };

    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('firstName lastName email profileImage role')
      .limit(20);

    // If searching for students, include student ID
    let enhancedUsers = users;
    if (role === 'student') {
      enhancedUsers = await Promise.all(
        users.map(async (user) => {
          const student = await Student.findOne({ user: user._id });
          return {
            ...user.toObject(),
            studentId: student?.studentId
          };
        })
      );
    }

    res.status(200).json({
      status: 'success',
      data: {
        users: enhancedUsers
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error searching users'
    });
  }
};

// @desc    Delete message
// @route   DELETE /api/chat/messages/:messageId
// @access  Private
const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    
    if (!message) {
      return res.status(404).json({
        status: 'error',
        message: 'Message not found'
      });
    }

    // Check if current user is the sender
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this message'
      });
    }

    // Soft delete the message
    message.deleted.isDeleted = true;
    message.deleted.deletedAt = new Date();
    message.deleted.deletedBy = req.user.id;
    
    await message.save();

    res.status(200).json({
      status: 'success',
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error deleting message'
    });
  }
};

// @desc    Download chat file attachment
// @route   GET /api/chat/files/:messageId/:filename
// @access  Private
const downloadFile = async (req, res) => {
  try {
    const { messageId, filename } = req.params;

    // Find the message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        status: 'error',
        message: 'Message not found'
      });
    }

    // Check if user is authorized to download this file
    if (message.sender.toString() !== req.user.id && message.recipient.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to download this file'
      });
    }

    // Find the attachment
    const attachment = message.attachments.find(att => att.filename === filename);
    if (!attachment) {
      return res.status(404).json({
        status: 'error',
        message: 'File not found'
      });
    }

    // Check if file exists on disk
    const filePath = path.resolve(attachment.path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        status: 'error',
        message: 'File not found on server'
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
    res.setHeader('Content-Type', attachment.mimetype);
    res.setHeader('Content-Length', attachment.size);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error downloading file'
    });
  }
};

module.exports = {
  getStudentTeacher,
  getTeacherStudents,
  getConversations,
  getConversationMessages,
  sendMessage,
  markMessageAsRead,
  getUnreadCount,
  deleteMessage,
  downloadFile
}; 