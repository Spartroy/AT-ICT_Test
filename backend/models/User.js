/**
 * @fileoverview User Model
 * @description MongoDB schema for user accounts with role-based data (Student, Teacher, Parent)
 * @author AT-ICT Development Team
 * @version 1.0.0
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const DeviceSession = require('./DeviceSession');

// ===================================================================
// USER SCHEMA DEFINITION
// ===================================================================

/**
 * User Schema
 * Supports three user types: Student, Teacher, Parent
 * Each role has specific fields and validation rules
 */
const userSchema = new mongoose.Schema({
  // ===================================================================
  // BASIC USER INFORMATION
  // ===================================================================
  
  /**
   * User's first name
   * @type {String}
   * @required
   */
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxLength: [50, 'First name cannot exceed 50 characters'],
    validate: {
      validator: function(name) {
        return /^[a-zA-Z\s]+$/.test(name);
      },
      message: 'First name should only contain letters and spaces'
    }
  },

  /**
   * User's last name
   * @type {String}
   * @required
   */
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxLength: [50, 'Last name cannot exceed 50 characters'],
    validate: {
      validator: function(name) {
        return /^[a-zA-Z\s]+$/.test(name);
      },
      message: 'Last name should only contain letters and spaces'
    }
  },

  /**
   * User's email address (unique identifier)
   * @type {String}
   * @required
   * @unique
   */
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address'
    ]
  },

  /**
   * User's password (hashed)
   * @type {String}
   * @required
   * @select false - Excluded from queries by default
   */
  password: {
    type: String,
    required: [true, 'Password is required'],
    minLength: [6, 'Password must be at least 6 characters'],
    select: false, // Don't include in queries by default
    validate: {
      validator: function(password) {
        // Only validate on creation or when password is being changed
        if (this.isNew || this.isModified('password')) {
          return password.length >= 6;
        }
        return true;
      },
      message: 'Password must be at least 6 characters long'
    }
  },
  
  // ===================================================================
  // ROLE AND PERMISSIONS
  // ===================================================================
  
  /**
   * User role determines access level and functionality
   * @type {String}
   * @required
   * @enum ['student', 'teacher', 'parent']
   */
  role: {
    type: String,
    enum: {
      values: ['student', 'teacher', 'parent'],
      message: 'Role must be either student, teacher, or parent'
    },
    required: [true, 'User role is required']
  },
  
  // ===================================================================
  // CONTACT INFORMATION
  // ===================================================================
  
  /**
   * Primary contact number
   * @type {String}
   * @required
   */
  contactNumber: {
    type: String,
    required: [true, 'Contact number is required'],
    trim: true,
    validate: {
      validator: function(phone) {
        return /^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/[\s\-\(\)]/g, ''));
      },
      message: 'Please provide a valid contact number'
    }
  },

  /**
   * Alternative contact number (optional)
   * @type {String}
   */
  alternativeNumber: {
    type: String,
    trim: true,
    validate: {
      validator: function(phone) {
        if (!phone) return true; // Allow empty
        return /^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/[\s\-\(\)]/g, ''));
      },
      message: 'Please provide a valid alternative contact number'
    }
  },
  
  /**
   * User's address information
   * @type {Object}
   */
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
    postalCode: { type: String, trim: true }
  },
  
  // ===================================================================
  // STUDENT-SPECIFIC INFORMATION
  // ===================================================================
  
  /**
   * Student-specific data and academic information
   * Only populated for users with role 'student'
   * @type {Object}
   */
  studentInfo: {
    /**
     * Auto-generated student ID
     * Format: AT{YEAR}{4-digit-number}
     * @type {String}
     * @unique
     */
    studentId: {
      type: String,
      unique: true,
      sparse: true, // Only applies when field exists
      validate: {
        validator: function(id) {
          if (!id) return true;
          return /^AT\d{8}$/.test(id);
        },
        message: 'Student ID must follow format AT{YEAR}{4-digit-number}'
      }
    },

    /**
     * Academic year level
     * @type {Number}
     * @enum [10, 11, 12]
     */
    year: {
      type: Number,
      enum: {
        values: [10, 11, 12],
        message: 'Year must be 10, 11, or 12'
      },
      validate: {
        validator: function(year) {
          return this.role !== 'student' || year != null;
        },
        message: 'Year is required for students'
      }
    },

    /**
     * Exam session
     * @type {String}
     * @enum ['NOV 25', 'JUN 26']
     */
    session: {
      type: String,
      enum: {
        values: ['NOV 25', 'JUN 26'],
        message: 'Session must be either NOV 25 or JUN 26'
      },
      validate: {
        validator: function(session) {
          return this.role !== 'student' || session != null;
        },
        message: 'Session is required for students'
      }
    },

    /**
     * Student's nationality
     * @type {String}
     */
    nationality: {
      type: String,
      trim: true,
      validate: {
        validator: function(nationality) {
          return this.role !== 'student' || (nationality && nationality.length > 0);
        },
        message: 'Nationality is required for students'
      }
    },

    /**
     * Current school name
     * @type {String}
     */
    school: {
      type: String,
      trim: true,
      validate: {
        validator: function(school) {
          return this.role !== 'student' || (school && school.length > 0);
        },
        message: 'School is required for students'
      }
    },

    /**
     * Whether the student is retaking the exam
     * @type {Boolean}
     * @default false
     */
    isRetaker: {
      type: Boolean,
      default: false
    },

    /**
     * Parent's contact number
     * @type {String}
     */
    parentContactNumber: {
      type: String,
      trim: true,
      validate: {
        validator: function(phone) {
          if (this.role !== 'student' || !phone) return true;
          return /^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/[\s\-\(\)]/g, ''));
        },
        message: 'Please provide a valid parent contact number'
      }
    },

    /**
     * Student's self-assessed technology knowledge level
     * @type {Number}
     * @min 1
     * @max 10
     */
    techKnowledge: {
      type: Number,
      min: [1, 'Technology knowledge level must be at least 1'],
      max: [10, 'Technology knowledge level cannot exceed 10'],
      validate: {
        validator: function(level) {
          return this.role !== 'student' || level != null;
        },
        message: 'Technology knowledge level is required for students'
      }
    },

    /**
     * Other subjects the student is taking
     * @type {String}
     */
    otherSubjects: {
      type: String,
      trim: true
    },

    /**
     * Current grade/performance level
     * @type {String}
     */
    currentGrade: {
      type: String,
      trim: true
    },

    /**
     * Target grade the student aims to achieve
     * @type {String}
     * @default 'A*'
     */
    targetGrade: {
      type: String,
      default: 'A*',
      trim: true
    },

    /**
     * Overall academic progress percentage
     * @type {Number}
     * @min 0
     * @max 100
     * @default 0
     */
    overallProgress: {
      type: Number,
      default: 0,
      min: [0, 'Progress cannot be negative'],
      max: [100, 'Progress cannot exceed 100%']
    },

    /**
     * Date when student enrolled
     * @type {Date}
     */
    enrolledDate: {
      type: Date,
      default: Date.now
    },

    /**
     * Whether the student account is active
     * @type {Boolean}
     * @default true
     */
    isActive: {
      type: Boolean,
      default: true
    }
  },
  
  // ===================================================================
  // TEACHER-SPECIFIC INFORMATION
  // ===================================================================
  
  /**
   * Teacher-specific data and employment information
   * Only populated for users with role 'teacher'
   * @type {Object}
   */
  teacherInfo: {
    /**
     * Auto-generated employee ID
     * Format: EMP{4-digit-number}
     * @type {String}
     * @unique
     */
    employeeId: {
      type: String,
      unique: true,
      sparse: true, // Only applies when field exists
      validate: {
        validator: function(id) {
          if (!id) return true;
          return /^EMP\d{4}$/.test(id);
        },
        message: 'Employee ID must follow format EMP{4-digit-number}'
      }
    },

    /**
     * Subject taught by the teacher
     * @type {String}
     * @default 'Computer Science'
     */
    subject: {
      type: String,
      default: 'Computer Science',
      trim: true
    },

    /**
     * Teacher's educational qualifications
     * @type {String}
     */
    qualification: {
      type: String,
      trim: true,
      validate: {
        validator: function(qualification) {
          return this.role !== 'teacher' || (qualification && qualification.length > 0);
        },
        message: 'Qualification is required for teachers'
      }
    },

    /**
     * Years of teaching experience
     * @type {Number}
     * @min 0
     */
    experience: {
      type: Number,
      min: [0, 'Experience cannot be negative'],
      validate: {
        validator: function(exp) {
          return this.role !== 'teacher' || exp != null;
        },
        message: 'Experience is required for teachers'
      }
    },

    /**
     * Date when teacher joined
     * @type {Date}
     */
    joinDate: {
      type: Date,
      default: Date.now
    },

    /**
     * Whether the teacher account is active
     * @type {Boolean}
     * @default true
     */
    isActive: {
      type: Boolean,
      default: true
    }
  },
  
  // ===================================================================
  // PARENT-SPECIFIC INFORMATION
  // ===================================================================
  
  /**
   * Parent-specific data and family information
   * Only populated for users with role 'parent'
   * @type {Object}
   */
  parentInfo: {
    /**
     * List of children (students) linked to this parent
     * @type {Array}
     */
    children: [{
      /**
       * Reference to student user account
       * @type {ObjectId}
       */
      studentId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        validate: {
          validator: function(studentId) {
            if (!studentId) return true;
            return mongoose.Types.ObjectId.isValid(studentId);
          },
          message: 'Invalid student ID'
        }
      },

      /**
       * Relationship to the student
       * @type {String}
       * @enum ['mother', 'father', 'guardian']
       */
      relationship: {
        type: String,
        enum: {
          values: ['mother', 'father', 'guardian'],
          message: 'Relationship must be mother, father, or guardian'
        }
      },

      /**
       * Whether this is the primary parent/guardian
       * @type {Boolean}
       * @default false
       */
      isPrimary: {
        type: Boolean,
        default: false
      }
    }],

    /**
     * Emergency contact information
     * @type {Object}
     */
    emergencyContact: {
      name: { type: String, trim: true },
      relationship: { type: String, trim: true },
      phone: {
        type: String,
        trim: true,
        validate: {
          validator: function(phone) {
            if (!phone) return true;
            return /^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/[\s\-\(\)]/g, ''));
          },
          message: 'Please provide a valid emergency contact number'
        }
      }
    },

    /**
     * Notification preferences for different types of updates
     * @type {Object}
     */
    notificationPreferences: {
      email: {
        grades: { type: Boolean, default: true },
        attendance: { type: Boolean, default: true },
        assignments: { type: Boolean, default: true },
        announcements: { type: Boolean, default: true },
        fees: { type: Boolean, default: true }
      },
      sms: {
        grades: { type: Boolean, default: false },
        attendance: { type: Boolean, default: true },
        assignments: { type: Boolean, default: false },
        announcements: { type: Boolean, default: false },
        fees: { type: Boolean, default: true }
      }
    }
  },
  
  // ===================================================================
  // ACCOUNT STATUS AND VERIFICATION
  // ===================================================================
  
  /**
   * Registration approval status
   * @type {String}
   * @enum ['pending', 'approved', 'rejected']
   * @default 'pending'
   */
  registrationStatus: {
    type: String,
    enum: {
      values: ['pending', 'approved', 'rejected'],
      message: 'Registration status must be pending, approved, or rejected'
    },
    default: 'pending'
  },
  
  /**
   * Email verification status
   * @type {Boolean}
   * @default false
   */
  isEmailVerified: {
    type: Boolean,
    default: false
  },

  /**
   * Email verification token
   * @type {String}
   */
  emailVerificationToken: String,

  /**
   * Email verification token expiry
   * @type {Date}
   */
  emailVerificationExpire: Date,

  /**
   * Password reset token
   * @type {String}
   */
  resetPasswordToken: String,

  /**
   * Password reset token expiry
   * @type {Date}
   */
  resetPasswordExpire: Date,

  /**
   * Last login timestamp
   * @type {Date}
   */
  lastLogin: Date,
  
  // ===================================================================
  // SECURITY AND LOGIN TRACKING
  // ===================================================================
  
  /**
   * Number of consecutive failed login attempts
   * @type {Number}
   * @default 0
   */
  loginAttempts: {
    type: Number,
    default: 0,
    min: [0, 'Login attempts cannot be negative']
  },

  /**
   * Account lock expiry time
   * @type {Date}
   */
  lockUntil: Date,
  
  /**
   * User's profile avatar URL
   * @type {String}
   */
  avatar: {
    type: String,
    validate: {
      validator: function(url) {
        if (!url) return true;
        return /^https?:\/\/.+/.test(url);
      },
      message: 'Avatar must be a valid URL'
    }
  },

  /**
   * Whether the user account is active
   * @type {Boolean}
   * @default true
   */
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  toJSON: { virtuals: true }, // Include virtuals when converting to JSON
  toObject: { virtuals: true } // Include virtuals when converting to Object
});

// ===================================================================
// DATABASE INDEXES
// ===================================================================

/**
 * Create database indexes for efficient queries
 */
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ 'studentInfo.studentId': 1 }, { sparse: true });
userSchema.index({ 'teacherInfo.employeeId': 1 }, { sparse: true });
userSchema.index({ registrationStatus: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ lastLogin: 1 });

// ===================================================================
// PRE-SAVE MIDDLEWARE
// ===================================================================

/**
 * Hash password before saving to database
 * Only runs when password is modified
 */
userSchema.pre('save', async function(next) {
  // Only hash password if it has been modified
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    // Generate salt and hash password
    const saltRounds = 12; // Increased for better security
    const salt = await bcrypt.genSalt(saltRounds);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Generate student ID for new student accounts
 * Format: AT{YEAR}{4-digit-sequential-number}
 */
userSchema.pre('save', async function(next) {
  if (this.role === 'student' && this.isNew && !this.studentInfo.studentId) {
    try {
      const currentYear = new Date().getFullYear();
      const count = await this.constructor.countDocuments({ 
        role: 'student',
        'studentInfo.studentId': { $exists: true, $ne: null }
      });
      
      // Format: AT + Year + 4-digit number (e.g., AT20240001)
      this.studentInfo.studentId = `AT${currentYear}${String(count + 1).padStart(4, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

/**
 * Generate employee ID for new teacher accounts
 * Format: EMP{4-digit-sequential-number}
 */
userSchema.pre('save', async function(next) {
  if (this.role === 'teacher' && this.isNew && !this.teacherInfo.employeeId) {
    try {
      const count = await this.constructor.countDocuments({ 
        role: 'teacher',
        'teacherInfo.employeeId': { $exists: true, $ne: null }
      });
      
      // Format: EMP + 4-digit number (e.g., EMP0001)
      this.teacherInfo.employeeId = `EMP${String(count + 1).padStart(4, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// ===================================================================
// INSTANCE METHODS
// ===================================================================

/**
 * Compare provided password with stored hash
 * @param {String} enteredPassword - Plain text password to check
 * @returns {Promise<Boolean>} True if password matches
 */
userSchema.methods.matchPassword = async function(enteredPassword) {
  try {
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

/**
 * Generate JWT token for user authentication
 * @returns {String} Signed JWT token
 */
userSchema.methods.getSignedJwtToken = function() {
  const jwtSecret = process.env.JWT_SECRET || 'fallback_jwt_secret_for_development';
  const jwtExpire = process.env.JWT_EXPIRE || '30d';
  
  if (!jwtSecret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be provided in production environment');
  }
  
  return jwt.sign(
    { 
      id: this._id, 
      role: this.role,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName
    },
    jwtSecret,
    { expiresIn: jwtExpire }
  );
};

/**
 * Create a new device session for the user
 * @param {Object} sessionData - Session information
 * @param {String} sessionData.deviceId - Device identifier
 * @param {String} sessionData.deviceName - Device name
 * @param {String} sessionData.userAgent - User agent string
 * @param {String} sessionData.ipAddress - IP address
 * @param {String} sessionData.location - Location information
 * @returns {Promise<Object>} Created session with token
 */
userSchema.methods.createDeviceSession = async function(sessionData) {
  // Determine session limit based on user role
  let maxSessions;
  if (this.role === 'teacher') {
    maxSessions = 999; // Unlimited for teachers (practical limit)
  } else {
    maxSessions = 1; // Only one session for students and parents
  }
  
  // Enforce session limit
  await DeviceSession.enforceSessionLimit(this._id, maxSessions);
  
  // Generate token
  const token = this.getSignedJwtToken();
  
  // Create session
  const session = await DeviceSession.create({
    userId: this._id,
    token,
    deviceId: sessionData.deviceId,
    deviceName: sessionData.deviceName,
    userAgent: sessionData.userAgent,
    ipAddress: sessionData.ipAddress,
    location: sessionData.location || 'Unknown'
  });

  return {
    token,
    sessionId: session._id,
    deviceName: session.deviceName
  };
};

/**
 * Get all active sessions for the user
 * @returns {Promise<Array>} Array of active sessions
 */
userSchema.methods.getActiveSessions = async function() {
  return await DeviceSession.getActiveSessions(this._id);
};

/**
 * Deactivate a specific session
 * @param {String} sessionId - Session ID to deactivate
 * @returns {Promise<Boolean>} Success status
 */
userSchema.methods.deactivateSession = async function(sessionId) {
  const session = await DeviceSession.findById(sessionId);
  if (session && session.userId.toString() === this._id.toString()) {
    await session.deactivate();
    return true;
  }
  return false;
};

/**
 * Deactivate all sessions for the user
 * @returns {Promise<Number>} Number of sessions deactivated
 */
userSchema.methods.deactivateAllSessions = async function() {
  const result = await DeviceSession.deactivateAllSessions(this._id);
  return result.modifiedCount || 0;
};

/**
 * Get active session count for the user
 * @returns {Promise<Number>} Number of active sessions
 */
userSchema.methods.getActiveSessionCount = async function() {
  return await DeviceSession.getActiveSessionCount(this._id);
};

/**
 * Check if user account is temporarily locked
 * @returns {Boolean} True if account is locked
 */
userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

/**
 * Increment failed login attempts and lock account if necessary
 * @returns {Promise} Update operation result
 */
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  const maxAttempts = 5; // Maximum failed attempts before lock
  const lockDuration = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
  
  // Lock account after maximum failed attempts
  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + lockDuration };
  }
  
  return this.updateOne(updates);
};

/**
 * Reset login attempts and unlock account
 * @returns {Promise} Update operation result
 */
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: {
      loginAttempts: 1,
      lockUntil: 1
    }
  });
};

/**
 * Get role-specific data for the user
 * @returns {Object} Role-specific information
 */
userSchema.methods.getRoleData = function() {
  if (!this.role) {
    return {};
  }
  switch(this.role) {
    case 'student':
      return this.studentInfo || {};
    case 'teacher':
      return this.teacherInfo || {};
    case 'parent':
      return this.parentInfo || {};
    default:
      return {};
  }
};

/**
 * Update role-specific data and save
 * @param {Object} data - New role-specific data to merge
 * @returns {Promise} Save operation result
 */
userSchema.methods.updateRoleData = function(data) {
  if (!this.role) {
    throw new Error('User role is not defined');
  }
  switch(this.role) {
    case 'student':
      this.studentInfo = { ...this.studentInfo, ...data };
      break;
    case 'teacher':
      this.teacherInfo = { ...this.teacherInfo, ...data };
      break;
    case 'parent':
      this.parentInfo = { ...this.parentInfo, ...data };
      break;
    default:
      throw new Error(`Invalid role: ${this.role}`);
  }
  return this.save();
};

// ===================================================================
// STATIC METHODS
// ===================================================================

/**
 * Find all users by role
 * @param {String} role - User role to filter by
 * @returns {Promise<Array>} Array of users with specified role
 */
userSchema.statics.findByRole = function(role) {
  return this.find({ 
    role, 
    isActive: true,
    registrationStatus: 'approved'
  }).sort({ createdAt: -1 });
};

/**
 * Find all pending student registrations
 * @returns {Promise<Array>} Array of pending student registrations
 */
userSchema.statics.findPendingRegistrations = function() {
  return this.find({ 
    registrationStatus: 'pending',
    role: 'student'
  }).sort({ createdAt: -1 });
};

/**
 * Find all students associated with a parent
 * @param {String} parentId - Parent's user ID
 * @returns {Promise<Array>} Array of student users
 */
userSchema.statics.findStudentsByParent = function(parentId) {
  return this.find({
    'parentInfo.children.studentId': parentId,
    role: 'student'
  }).populate('parentInfo.children.studentId');
};

/**
 * Get user statistics by role
 * @returns {Promise<Object>} User count statistics
 */
userSchema.statics.getUserStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$role',
        total: { $sum: 1 },
        active: { $sum: { $cond: ['$isActive', 1, 0] } },
        approved: { $sum: { $cond: [{ $eq: ['$registrationStatus', 'approved'] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $eq: ['$registrationStatus', 'pending'] }, 1, 0] } }
      }
    }
  ]);

  return stats.reduce((acc, stat) => {
    acc[stat._id] = {
      total: stat.total,
      active: stat.active,
      approved: stat.approved,
      pending: stat.pending
    };
    return acc;
  }, {});
};

// ===================================================================
// VIRTUAL PROPERTIES
// ===================================================================

/**
 * Virtual property for user's full name
 * @returns {String} Combined first and last name
 */
userSchema.virtual('fullName').get(function() {
  const firstName = this.firstName || '';
  const lastName = this.lastName || '';
  return `${firstName} ${lastName}`.trim() || 'Unknown User';
});

/**
 * Virtual property for role-specific dashboard URL
 * @returns {String} Dashboard URL based on user role
 */
userSchema.virtual('dashboardUrl').get(function() {
  if (!this.role) {
    return '/';
  }
  switch(this.role) {
    case 'student': 
      return '/student-dashboard';
    case 'teacher': 
      return '/teacher-dashboard';
    case 'parent': 
      return '/parent-dashboard';
    default: 
      return '/';
  }
});

/**
 * Virtual property to check if account is locked
 * @returns {Boolean} True if account is currently locked
 */
userSchema.virtual('isAccountLocked').get(function() {
  return this.isLocked();
});

/**
 * Virtual property for user's display name with role
 * @returns {String} Full name with role in parentheses
 */
userSchema.virtual('displayName').get(function() {
  if (!this.role) {
    return this.fullName || 'Unknown User';
  }
  const roleName = this.role.charAt(0).toUpperCase() + this.role.slice(1);
  return `${this.fullName} (${roleName})`;
});

// ===================================================================
// MODULE EXPORT
// ===================================================================

/**
 * Export User model
 * @type {mongoose.Model}
 */
module.exports = mongoose.model('User', userSchema); 