/**
 * @fileoverview AT-ICT Learning Management System - Main Server
 * @description Express.js server with Socket.IO for real-time chat, authentication, 
 *              file uploads, and comprehensive educational features
 * @author AT-ICT Development Team
 * @version 1.0.0
 * @created 2024
 */

// ===================================================================
// DEPENDENCIES & IMPORTS
// ===================================================================

// Core Dependencies
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const colors = require('colors');
const path = require('path');
const http = require('http');

// Security & Middleware
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Real-time Communication
const socketIo = require('socket.io');

// Environment Configuration - Must be first
dotenv.config();

// Internal Imports
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const parentRoutes = require('./routes/parentRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const chatRoutes = require('./routes/chatRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const quizRoutes = require('./routes/quizRoutes');
const flashcardRoutes = require('./routes/flashcardRoutes');
const activityRoutes = require('./routes/activityRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const teacherSessionRoutes = require('./routes/teacherSessionRoutes');

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'AT-ICT Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime()
  });
});

// ===================================================================
// SERVER INITIALIZATION
// ===================================================================

/**
 * Express application instance
 */
const app = express();

// Trust proxy for Railway deployment
app.set('trust proxy', 1);

/**
 * HTTP server instance for Socket.IO integration
 */
const server = http.createServer(app);

/**
 * Socket.IO instance for real-time communication
 * Configured with CORS for secure cross-origin requests
 */
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// ===================================================================
// DATABASE CONNECTION
// ===================================================================

/**
 * Initialize database connection
 * MongoDB connection with error handling
 */
connectDB();

// ===================================================================
// SECURITY & MIDDLEWARE CONFIGURATION
// ===================================================================

/**
 * CORS Configuration
 * Allows requests from frontend domains based on environment
 */
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.CLIENT_URL, 'https://at-ict-test.vercel.app']
    : ['http://localhost:3000', 'https://at-ict-test.vercel.app'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Security Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS Protection
app.use(cors(corsOptions));

// Request Parsing Middleware
app.use(express.json({ 
  limit: '100mb',
  verify: (req, res, buf) => {
    // Only validate when there is a non-empty JSON body
    try {
      if (buf && buf.length > 0) {
        JSON.parse(buf);
      }
    } catch (e) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Invalid JSON payload' 
      });
    }
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '100mb' 
}));

// Static File Serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1d', // Cache static files for 1 day
  etag: true
}));

// Request Logging (Development Only)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
  
  // Custom request logging for debugging
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`.yellow);
    next();
  });
}

// ===================================================================
// RATE LIMITING
// ===================================================================

/**
 * API Rate Limiter
 * Prevents abuse and ensures fair usage
 */
const apiLimiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes default
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100, // 100 requests per window
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((process.env.RATE_LIMIT_WINDOW || 15) * 60)
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
});

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// ===================================================================
// SOCKET.IO REAL-TIME COMMUNICATION
// ===================================================================

/**
 * Socket.IO Connection Handler
 * Manages real-time chat functionality between students and teachers
 */
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`.green);

  /**
   * Join Chat Room
   * Users join specific rooms for private conversations
   */
  socket.on('join_room', (roomId) => {
    if (!roomId || typeof roomId !== 'string') {
      socket.emit('error', { message: 'Invalid room ID' });
      return;
    }
    
    socket.join(roomId);
    console.log(`📨 User ${socket.id} joined room ${roomId}`.cyan);
  });

  /**
   * Send Message
   * Relay messages to other users in the same room
   */
  socket.on('send_message', (messageData) => {
    if (!messageData || !messageData.roomId) {
      socket.emit('error', { message: 'Invalid message data' });
      return;
    }
    
    socket.to(messageData.roomId).emit('receive_message', messageData);
  });

  /**
   * Typing Indicators
   * Show when users are typing
   */
  socket.on('typing', (data) => {
    if (data && data.roomId) {
      socket.to(data.roomId).emit('user_typing', data);
    }
  });

  socket.on('stop_typing', (data) => {
    if (data && data.roomId) {
      socket.to(data.roomId).emit('user_stop_typing', data);
    }
  });

  /**
   * Handle Disconnection
   */
  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`.red);
  });
});

// ===================================================================
// HEALTH CHECK ENDPOINT
// ===================================================================

/**
 * Health Check Endpoint
 * Provides system status and basic information
 * @route GET /health
 * @access Public
 */
app.get('/health', (req, res) => {
  const healthStatus = {
    status: 'success',
    message: 'AT-ICT LMS API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    uptime: process.uptime(),
    database: process.env.MONGO_URI ? 'Connected' : 'Connection string needed'
  };

  res.status(200).json(healthStatus);
});

// ===================================================================
// API ROUTES
// ===================================================================

/**
 * Authentication Routes
 * Login, registration, password management
 */
app.use('/api/auth', authRoutes);

/**
 * Student-specific Routes
 * Student dashboard, assignments, materials
 */
app.use('/api/student', studentRoutes);

/**
 * Teacher-specific Routes
 * Teacher dashboard, student management, grading
 */
app.use('/api/teacher', teacherRoutes);
app.use('/api/schedule', scheduleRoutes);

/**
 * Parent-specific Routes
 * Parent dashboard, child progress monitoring
 */
app.use('/api/parent', parentRoutes);

/**
 * Announcement Routes
 * System-wide announcements and notifications
 */
app.use('/api/announcements', announcementRoutes);

/**
 * Chat Routes
 * Real-time messaging between students and teachers
 */
app.use('/api/chat', chatRoutes);

/**
 * Registration Routes
 * Student registration and approval workflow
 */
app.use('/api/registration', registrationRoutes);

/**
 * Assignment Routes
 * Assignment creation, submission, and grading
 */
app.use('/api/assignments', assignmentRoutes);

/**
 * Quiz Routes
 * Quiz creation, taking, and scoring
 */
app.use('/api/quizzes', quizRoutes);

/**
 * Flashcard Routes
 * Flashcard creation, study, and management
 */
app.use('/api/flashcards', flashcardRoutes);

/**
 * Activity Routes
 * Teacher notification and activity tracking
 */
app.use('/api/teacher/activities', activityRoutes);

/**
 * Session Routes
 * Device session management and security
 */
app.use('/api/sessions', sessionRoutes);

/**
 * Teacher Session Monitoring Routes
 * Teacher monitoring of student device sessions
 */
app.use('/api/teacher/sessions', teacherSessionRoutes);

// ===================================================================
// ERROR HANDLING
// ===================================================================

/**
 * 404 Handler for Undefined Routes
 * Catches all undefined API endpoints
 */
app.all('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

/**
 * Global Error Handler
 * Must be the last middleware
 */
app.use(errorHandler);

// ===================================================================
// SERVER STARTUP
// ===================================================================

/**
 * Server Port Configuration
 */
const PORT = process.env.PORT || 5000;

/**
 * Start Server
 * Initialize HTTP server with Socket.IO support
 */
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                    🚀 AT-ICT LMS SERVER STARTED                   ║
╠════════════════════════════════════════════════════════════════════╣
║ Environment: ${(process.env.NODE_ENV || 'development').padEnd(51)} ║
║ Server URL:  http://localhost:${PORT.toString().padEnd(43)} ║
║ Health URL:  http://localhost:${PORT}/health${' '.repeat(31)} ║
║ Database:    ${(process.env.MONGO_URI ? 'Connected ✅' : 'Not Connected ❌').padEnd(51)} ║
║ Socket.IO:   Enabled ✅${' '.repeat(42)} ║
║ Security:    Helmet, CORS, Rate Limiting ✅${' '.repeat(24)} ║
╚════════════════════════════════════════════════════════════════════╝
  `.green.bold);
});

// ===================================================================
// PROCESS EVENT HANDLERS
// ===================================================================

/**
 * Handle Unhandled Promise Rejections
 * Graceful shutdown on critical errors
 */
process.on('unhandledRejection', (err, promise) => {
  console.log(`❌ Unhandled Promise Rejection: ${err.message}`.red.bold);
  console.log('Stack:', err.stack);
  
  // Close server and exit process
  server.close(() => {
    console.log('🔴 Server closed due to unhandled promise rejection');
    process.exit(1);
  });
});

/**
 * Handle Uncaught Exceptions
 * Last resort error handling
 */
process.on('uncaughtException', (err) => {
  console.log(`❌ Uncaught Exception: ${err.message}`.red.bold);
  console.log('Stack:', err.stack);
  console.log('🔴 Shutting down server due to uncaught exception');
  process.exit(1);
});

/**
 * Graceful Shutdown Handler
 * Handle SIGTERM signals for proper cleanup
 */
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received. Shutting down gracefully...'.yellow);
  
  server.close(() => {
    console.log('✅ Server shutdown complete'.green);
    process.exit(0);
  });
});

/**
 * Handle SIGINT (Ctrl+C)
 * Allow manual server shutdown
 */
process.on('SIGINT', () => {
  console.log('\n🔄 SIGINT received. Shutting down gracefully...'.yellow);
  
  server.close(() => {
    console.log('✅ Server shutdown complete'.green);
    process.exit(0);
  });
});

// ===================================================================
// MODULE EXPORTS
// ===================================================================

/**
 * Export server components for testing
 */
module.exports = { 
  app, 
  io, 
  server 
}; 