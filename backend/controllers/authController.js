/**
 * @fileoverview Authentication Controller
 * @description Handles user authentication, registration, and profile management
 * @author AT-ICT Development Team
 * @version 1.0.0
 */

const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// ===================================================================
// UTILITY FUNCTIONS
// ===================================================================

/**
 * Create standardized user response object
 * @param {Object} user - User document from database
 * @returns {Object} Sanitized user data for client response
 */
const createUserResponse = (user) => ({
  _id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role,
  registrationStatus: user.registrationStatus,
  dashboardUrl: user.dashboardUrl,
  roleData: user.getRoleData(),
  lastLogin: user.lastLogin,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

/**
 * Log authentication events for security monitoring
 * @param {string} event - Event type (login_success, login_fail, etc.)
 * @param {string} email - User email
 * @param {string} ip - Client IP address
 * @param {string} details - Additional details
 */
const logAuthEvent = (event, email, ip = 'unknown', details = '') => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔐 AUTH_EVENT: ${event} | ${email} | ${ip} | ${details}`);
  }
  // In production, this would log to a security audit system
};

/**
 * Generate device fingerprint from request
 * @param {Object} req - Express request object
 * @returns {String} Device fingerprint hash
 */
const generateDeviceId = (req) => {
  const userAgent = req.headers['user-agent'] || '';
  const acceptLanguage = req.headers['accept-language'] || '';
  const acceptEncoding = req.headers['accept-encoding'] || '';
  const ip = req.ip || req.connection.remoteAddress || '';
  
  const fingerprint = `${userAgent}|${acceptLanguage}|${acceptEncoding}|${ip}`;
  return crypto.createHash('sha256').update(fingerprint).digest('hex');
};

/**
 * Get device name from user agent
 * @param {String} userAgent - User agent string
 * @returns {String} Device name
 */
const getDeviceName = (userAgent) => {
  if (!userAgent) return 'Unknown Device';
  
  // Simple device detection
  if (userAgent.includes('Mobile')) {
    if (userAgent.includes('iPhone')) return 'iPhone';
    if (userAgent.includes('Android')) return 'Android Phone';
    return 'Mobile Device';
  }
  
  if (userAgent.includes('iPad')) return 'iPad';
  if (userAgent.includes('Mac')) return 'Mac';
  if (userAgent.includes('Windows')) return 'Windows PC';
  if (userAgent.includes('Linux')) return 'Linux PC';
  
  return 'Desktop Browser';
};

// ===================================================================
// AUTHENTICATION CONTROLLERS
// ===================================================================

/**
 * Register New User
 * @desc    Create new user account with role-based data
 * @route   POST /api/auth/register
 * @access  Public
 * @param   {Object} req - Express request object
 * @param   {Object} res - Express response object
 */
const register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      contactNumber,
      alternativeNumber,
      address,
      // Student-specific fields
      year,
      session,
      nationality,
      school,
      isRetaker,
      parentContactNumber,
      techKnowledge,
      otherSubjects,
      // Teacher-specific fields
      qualification,
      experience,
      // Parent-specific fields
      emergencyContact
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !role) {
      logAuthEvent('registration_fail', email, req.ip, 'Missing required fields');
      return res.status(400).json({
        status: 'error',
        message: 'Please provide all required fields'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      logAuthEvent('registration_fail', email, req.ip, 'Email already exists');
      return res.status(400).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }

    // Create base user object
    const userData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      contactNumber: contactNumber?.trim(),
      alternativeNumber: alternativeNumber?.trim(),
      address
    };

    // Add role-specific data based on user type
    switch (role) {
      case 'student':
        userData.studentInfo = {
          year,
          session,
          nationality: nationality?.trim(),
          school: school?.trim(),
          isRetaker: Boolean(isRetaker),
          parentContactNumber: parentContactNumber?.trim(),
          techKnowledge,
          otherSubjects: otherSubjects?.trim(),
          enrolledDate: new Date()
        };
        userData.registrationStatus = 'pending'; // Students need approval
        break;

      case 'teacher':
        userData.teacherInfo = {
          qualification: qualification?.trim(),
          experience: parseInt(experience) || 0,
          joinDate: new Date()
        };
        userData.registrationStatus = 'approved'; // Teachers auto-approved
        break;

      case 'parent':
        userData.parentInfo = {
          emergencyContact,
          children: []
        };
        userData.registrationStatus = 'approved'; // Parents auto-approved
        break;

      default:
        logAuthEvent('registration_fail', email, req.ip, 'Invalid role');
        return res.status(400).json({
          status: 'error',
          message: 'Invalid role specified. Must be student, teacher, or parent.'
        });
    }

    // Create user in database
    const user = await User.create(userData);

    // Generate JWT token
    const token = user.getSignedJwtToken();

    // Log successful registration
    logAuthEvent('registration_success', email, req.ip, `Role: ${role}`);

    // Send response
    const response = {
      status: 'success',
      message: role === 'student' 
        ? 'Registration successful! Awaiting approval from admin.' 
        : 'Registration successful!',
      data: {
        user: createUserResponse(user),
        token
      }
    };

    res.status(201).json(response);

  } catch (error) {
    logAuthEvent('registration_error', req.body.email || 'unknown', req.ip, error.message);
    
    // Handle specific database errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        status: 'error',
        message: 'Validation Error',
        errors: messages
      });
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        status: 'error',
        message: `${field} already exists`
      });
    }

    console.error('Registration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during registration'
    });
  }
};

/**
 * User Login
 * @desc    Authenticate user and return JWT token
 * @route   POST /api/auth/login
 * @access  Public
 * @param   {Object} req - Express request object
 * @param   {Object} res - Express response object
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      logAuthEvent('login_fail', email || 'unknown', req.ip, 'Missing credentials');
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password'
      });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      logAuthEvent('login_fail', email, req.ip, 'User not found');
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Check if account is locked due to failed attempts
    if (user.isLocked()) {
      logAuthEvent('login_fail', email, req.ip, 'Account locked');
      return res.status(423).json({
        status: 'error',
        message: 'Account temporarily locked due to too many failed login attempts'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      logAuthEvent('login_fail', email, req.ip, 'Account deactivated');
      return res.status(401).json({
        status: 'error',
        message: 'Account has been deactivated'
      });
    }

    // Verify password
    const isPasswordValid = await user.matchPassword(password);

    if (!isPasswordValid) {
      logAuthEvent('login_fail', email, req.ip, 'Invalid password');
      // Increment failed login attempts
      await user.incLoginAttempts();
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }
    
    // Check registration status for students
    if (user.role === 'student' && user.registrationStatus !== 'approved') {
      const message = user.registrationStatus === 'rejected'
        ? 'Your registration has been rejected. Please contact support.'
        : 'Your registration is pending approval';
      
      logAuthEvent('login_fail', email, req.ip, `Registration ${user.registrationStatus}`);
      return res.status(403).json({
        status: 'error',
        message
      });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();

    // Generate device fingerprint
    const deviceId = generateDeviceId(req);
    const deviceName = getDeviceName(req.headers['user-agent']);

    // Create device session
    const sessionData = {
      deviceId,
      deviceName,
      userAgent: req.headers['user-agent'] || 'Unknown',
      ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
      location: 'Unknown' // Could be enhanced with IP geolocation
    };

    const sessionResult = await user.createDeviceSession(sessionData);

    // Log successful login
    logAuthEvent('login_success', email, req.ip, `Role: ${user.role}, Device: ${sessionResult.deviceName}`);

    // Send response
    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: createUserResponse(user),
        token: sessionResult.token,
        sessionId: sessionResult.sessionId,
        deviceName: sessionResult.deviceName
      }
    });

  } catch (error) {
    logAuthEvent('login_error', req.body.email || 'unknown', req.ip, error.message);
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during login'
    });
  }
};

/**
 * Get Current User
 * @desc    Get current logged in user's information
 * @route   GET /api/auth/me
 * @access  Private
 * @param   {Object} req - Express request object with user data
 * @param   {Object} res - Express response object
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: createUserResponse(user)
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving user data'
    });
  }
};

/**
 * Update User Profile
 * @desc    Update user's profile information
 * @route   PUT /api/auth/profile
 * @access  Private
 * @param   {Object} req - Express request object with user data
 * @param   {Object} res - Express response object
 */
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const {
      firstName,
      lastName,
      contactNumber,
      alternativeNumber,
      address,
      roleSpecificData
    } = req.body;

    // Update basic fields if provided
    if (firstName) user.firstName = firstName.trim();
    if (lastName) user.lastName = lastName.trim();
    if (contactNumber) user.contactNumber = contactNumber.trim();
    if (alternativeNumber) user.alternativeNumber = alternativeNumber.trim();
    if (address) user.address = { ...user.address, ...address };

    // Update role-specific data
    if (roleSpecificData) {
      await user.updateRoleData(roleSpecificData);
    } else {
      await user.save();
    }

    logAuthEvent('profile_update', user.email, req.ip, 'Profile updated');

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        user: createUserResponse(user)
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error updating profile'
    });
  }
};

/**
 * Change Password
 * @desc    Change user's password with current password verification
 * @route   PUT /api/auth/change-password
 * @access  Private
 * @param   {Object} req - Express request object with user data
 * @param   {Object} res - Express response object
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide both current and new password'
      });
    }

    // Validate new password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'New password must be at least 6 characters long'
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    // Verify current password
    const isCurrentPasswordValid = await user.matchPassword(currentPassword);
    if (!isCurrentPasswordValid) {
      logAuthEvent('password_change_fail', user.email, req.ip, 'Invalid current password');
      return res.status(400).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }

    // Update password (will be hashed by pre-save middleware)
    user.password = newPassword;
    await user.save();

    logAuthEvent('password_change_success', user.email, req.ip, 'Password changed');

    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error changing password'
    });
  }
};

/**
 * User Logout
 * @desc    Logout user and deactivate current session
 * @route   POST /api/auth/logout
 * @access  Private
 * @param   {Object} req - Express request object with user data
 * @param   {Object} res - Express response object
 */
const logout = async (req, res) => {
  try {
    // Deactivate current session if it exists
    if (req.session) {
      await req.session.deactivate();
      logAuthEvent('logout', req.user?.email || 'unknown', req.ip, `Session deactivated: ${req.session.deviceName}`);
    } else {
      logAuthEvent('logout', req.user?.email || 'unknown', req.ip, 'User logged out (no session)');
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully',
      data: {}
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during logout'
    });
  }
};

/**
 * Forgot Password (Placeholder)
 * @desc    Initiate password reset process
 * @route   POST /api/auth/forgot-password
 * @access  Public
 * @param   {Object} req - Express request object
 * @param   {Object} res - Express response object
 * @todo    Implement email functionality with reset tokens
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email address'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Return success even if user not found (security best practice)
      return res.status(200).json({
        status: 'success',
        message: 'If an account with this email exists, password reset instructions have been sent'
      });
    }

    logAuthEvent('password_reset_request', email, req.ip, 'Reset requested');

    // TODO: Implement email functionality with reset tokens
    res.status(200).json({
      status: 'success',
      message: 'If an account with this email exists, password reset instructions have been sent'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error processing forgot password request'
    });
  }
};

/**
 * Reset Password (Placeholder)
 * @desc    Reset password using reset token
 * @route   PUT /api/auth/reset-password/:resettoken
 * @access  Public
 * @param   {Object} req - Express request object
 * @param   {Object} res - Express response object
 * @todo    Implement token validation and password reset
 */
const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const { resettoken } = req.params;

    if (!password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide new password'
      });
    }

    // TODO: Implement token validation and password reset
    res.status(200).json({
      status: 'success',
      message: 'Password has been reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error resetting password'
    });
  }
};

/**
 * Get Dashboard URL
 * @desc    Get role-specific dashboard URL for user
 * @route   GET /api/auth/dashboard-url
 * @access  Private
 * @param   {Object} req - Express request object with user data
 * @param   {Object} res - Express response object
 */
const getDashboardUrl = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        dashboardUrl: user.dashboardUrl,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Get dashboard URL error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving dashboard URL'
    });
  }
};

// ===================================================================
// MODULE EXPORTS
// ===================================================================

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout,
  forgotPassword,
  resetPassword,
  getDashboardUrl
}; 