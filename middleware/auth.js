const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_jwt_secret_for_development');

      // Get user from token
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'No user found with this token'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          status: 'error',
          message: 'User account has been deactivated'
        });
      }

      // Check registration status for students
      if (user.role === 'student' && user.registrationStatus !== 'approved') {
        return res.status(403).json({
          status: 'error',
          message: 'Account pending approval or rejected'
        });
      }

      // Add user to request object
      req.user = user;
      next();

    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized to access this route'
      });
    }

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Server error in authentication'
    });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }

    next();
  };
};

// Check if user owns the resource (for student/parent data access)
const checkOwnership = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;
    const resourceId = req.params.id || req.params.studentId || req.params.parentId;

    // Teachers can access all resources
    if (role === 'teacher') {
      return next();
    }

    // Students can only access their own data
    if (role === 'student') {
      if (userId.toString() !== resourceId.toString()) {
        return res.status(403).json({
          status: 'error',
          message: 'Not authorized to access this resource'
        });
      }
    }

    // Parents can only access their children's data
    if (role === 'parent') {
      const parent = await User.findById(userId);
      const childIds = parent.parentInfo.children.map(child => child.studentId.toString());
      
      if (!childIds.includes(resourceId.toString()) && userId.toString() !== resourceId.toString()) {
        return res.status(403).json({
          status: 'error',
          message: 'Not authorized to access this resource'
        });
      }
    }

    next();
  } catch (error) {
    console.error('Ownership check error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Server error checking resource ownership'
    });
  }
};

// Role-specific middleware for backwards compatibility
const teacherOnly = (req, res, next) => {
  return authorize('teacher')(req, res, next);
};

const studentOnly = (req, res, next) => {
  return authorize('student')(req, res, next);
};

const parentOnly = (req, res, next) => {
  return authorize('parent')(req, res, next);
};

// Admin or teacher access
const adminOrTeacher = (req, res, next) => {
  return authorize('teacher', 'admin')(req, res, next);
};

// Student or parent access (for shared resources)
const studentOrParent = (req, res, next) => {
  return authorize('student', 'parent')(req, res, next);
};

module.exports = {
  protect,
  authorize,
  checkOwnership,
  teacherOnly,
  studentOnly,
  parentOnly,
  adminOrTeacher,
  studentOrParent
}; 