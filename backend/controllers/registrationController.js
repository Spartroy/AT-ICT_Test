const User = require('../models/User');
const { validationResult } = require('express-validator');
const { createActivityFromEvent } = require('./activityController');

// @desc    Submit new registration
// @route   POST /api/registration/submit
// @access  Public
const submitRegistration = async (req, res) => {
  try {
    console.log('📝 Registration submission received');
    console.log('📋 Request body:', JSON.stringify(req.body, null, 2));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        status: 'error',
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      firstName,
      lastName,
      year,
      nationality,
      city,
      school,
      session,
      isRetaker,
      email,
      contactNumber,
      parentNumber,
      techKnowledge,
      englishLevel,
      otherSubjects,
      password
    } = req.body;

    // Check if email already exists 
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User already registered with this email'
      });
    }

    // Create user with pending registration status
    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      role: 'student',
      contactNumber,
      address: {
        city
      },
      studentInfo: {
      year,
      nationality,
      school,
      session,
      isRetaker,
        parentContactNumber: parentNumber,
      techKnowledge,
        englishLevel,
        otherSubjects
      },
      registrationStatus: 'pending'
    });

    // Create activity for new registration
    await createActivityFromEvent({
      type: 'registration',
      title: 'New Student Registration',
      description: `${user.firstName} ${user.lastName} submitted a new registration`,
      studentId: user._id,
      relatedItemId: user._id,
      relatedItemModel: 'Registration',
      metadata: {
        year: year,
        session: session,
        school: school
      },
      priority: 'high'
    });

    res.status(201).json({
      status: 'success',
      message: 'Registration submitted successfully',
      data: {
        registration: {
          id: user._id,
          fullName: `${user.firstName} ${user.lastName}`,
          email: user.email,
          status: user.registrationStatus,
          submittedAt: user.createdAt
        }
      }
    });
      } catch (error) {
      console.error('❌ Submit registration error:', error.message);
      console.error('📋 Full error:', error);
      
      // Check if it's a validation error from mongoose
      if (error.name === 'ValidationError') {
        const validationErrors = Object.keys(error.errors).map(field => ({
          field,
          message: error.errors[field].message
        }));
        
        return res.status(400).json({
          status: 'error',
          message: 'Database validation errors',
          errors: validationErrors
        });
      }
      
      res.status(500).json({
        status: 'error',
        message: 'Server error submitting registration',
        details: error.message
      });
    }
};

// @desc    Get all pending registrations (Teacher only)
// @route   GET /api/registration/pending
// @access  Private (Teacher)
const getPendingRegistrations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get pending users with role 'student' and registrationStatus 'pending'
    const registrations = await User.find({ 
      role: 'student',
      registrationStatus: 'pending' 
    })
    .select('firstName lastName email contactNumber studentInfo registrationStatus createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments({ 
      role: 'student',
      registrationStatus: 'pending' 
    });

    // Transform data to match frontend expectations
    const transformedRegistrations = registrations.map(user => ({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      contactNumber: user.contactNumber,
      year: user.studentInfo?.year || 'N/A',
      nationality: user.studentInfo?.nationality || 'N/A',
      city: user.address?.city || 'N/A',
      school: user.studentInfo?.school || 'N/A',
      session: user.studentInfo?.session || 'N/A',
      techKnowledge: user.studentInfo?.techKnowledge || 'N/A',
      isRetaker: user.studentInfo?.isRetaker || false,
      createdAt: user.createdAt
    }));

    res.status(200).json({
      status: 'success',
      data: {
        registrations: transformedRegistrations,
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
    console.error('Get pending registrations error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving registrations'
    });
  }
};

// @desc    Get all registrations with filters (Teacher only)
// @route   GET /api/registration/all
// @access  Private (Teacher)
const getAllRegistrations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { status, session, year, search } = req.query;

    // Build query for User model
    let query = {
      role: 'student'
    };
    
    if (status) query.registrationStatus = status;
    if (session) query['studentInfo.session'] = session;
    if (year) query['studentInfo.year'] = year;
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'studentInfo.school': { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('firstName lastName email contactNumber studentInfo registrationStatus createdAt address')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    // Transform data to match frontend expectations
    const registrations = users.map(user => ({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      contactNumber: user.contactNumber,
      year: user.studentInfo?.year || 'N/A',
      nationality: user.studentInfo?.nationality || 'N/A',
      city: user.address?.city || 'N/A',
      school: user.studentInfo?.school || 'N/A',
      session: user.studentInfo?.session || 'N/A',
      techKnowledge: user.studentInfo?.techKnowledge || 'N/A',
      isRetaker: user.studentInfo?.isRetaker || false,
      status: user.registrationStatus,
      createdAt: user.createdAt
    }));

    // Get summary statistics
    const stats = await User.aggregate([
      { $match: { role: 'student' } },
      {
        $group: {
          _id: '$registrationStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const summary = {
      total: await User.countDocuments({ role: 'student' }),
      pending: 0,
      approved: 0,
      rejected: 0
    };

    stats.forEach(stat => {
      summary[stat._id] = stat.count;
    });

    res.status(200).json({
      status: 'success',
      data: {
        registrations,
        summary,
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
    console.error('Get all registrations error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving registrations'
    });
  }
};

// @desc    Get single registration (Teacher only)
// @route   GET /api/registration/:id
// @access  Private (Teacher)
const getRegistration = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('firstName lastName email contactNumber studentInfo registrationStatus createdAt address');

    if (!user || user.role !== 'student') {
      return res.status(404).json({
        status: 'error',
        message: 'Registration not found'
      });
    }

    // Transform data to match frontend expectations
    const registration = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      contactNumber: user.contactNumber,
      year: user.studentInfo?.year || 'N/A',
      nationality: user.studentInfo?.nationality || 'N/A',
      city: user.address?.city || 'N/A',
      school: user.studentInfo?.school || 'N/A',
      session: user.studentInfo?.session || 'N/A',
      techKnowledge: user.studentInfo?.techKnowledge || 'N/A',
      isRetaker: user.studentInfo?.isRetaker || false,
      status: user.registrationStatus,
      createdAt: user.createdAt
    };

    res.status(200).json({
      status: 'success',
      data: {
        registration
      }
    });
  } catch (error) {
    console.error('Get registration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving registration'
    });
  }
};

// @desc    Approve registration (Teacher only)
// @route   PUT /api/registration/:id/approve
// @access  Private (Teacher)
const approveRegistration = async (req, res) => {
  try {
    const { notes, feeAmount } = req.body;
    
    // Find the user with pending registration status
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User registration not found'
      });
    }

    if (user.registrationStatus !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: 'Registration has already been processed'
      });
    }

    // Simply update the registration status to approved
    user.registrationStatus = 'approved';
    user.isActive = true;
      
    // Set enrollment date if student
    if (user.role === 'student' && user.studentInfo) {
      user.studentInfo.enrolledDate = new Date();
      if (!user.studentInfo.isActive) {
        user.studentInfo.isActive = true;
      }
    }
    
    await user.save();

    console.log(`✅ Registration approved for ${user.email}`);
    
    res.status(200).json({
      status: 'success',
      message: `Registration approved successfully for ${user.firstName} ${user.lastName}`,
      data: {
          user: {
            id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
            email: user.email,
          registrationStatus: user.registrationStatus,
          studentId: user.studentInfo?.studentId
        }
      }
    });
  } catch (error) {
    console.error('Approve registration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error approving registration',
      details: error.message
    });
  }
};

// @desc    Reject registration (Teacher only)
// @route   PUT /api/registration/:id/reject
// @access  Private (Teacher)
const rejectRegistration = async (req, res) => {
  try {
    const { reason } = req.body;
    
    // Find the user with pending registration status
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User registration not found'
      });
    }

    if (user.registrationStatus !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: 'Registration has already been processed'
      });
    }

    // Simply update the registration status to rejected
    user.registrationStatus = 'rejected';
    
    await user.save();

    console.log(`❌ Registration rejected for ${user.email}`);

    res.status(200).json({
      status: 'success',
      message: `Registration rejected for ${user.firstName} ${user.lastName}`,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          registrationStatus: user.registrationStatus
        }
      }
    });
  } catch (error) {
    console.error('Reject registration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error rejecting registration',
      details: error.message
    });
  }
};

// @desc    Update registration notes (Teacher only)
// @route   PUT /api/registration/:id/notes
// @access  Private (Teacher)
const updateRegistrationNotes = async (req, res) => {
  try {
    const { notes } = req.body;
    
    // For now, we'll just return success since User model doesn't have notes field
    // In the future, you could add a notes field to studentInfo if needed
    const user = await User.findById(req.params.id);

    if (!user || user.role !== 'student') {
      return res.status(404).json({
        status: 'error',
        message: 'Student not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Notes feature not yet implemented for simplified registration system',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        }
      }
    });
  } catch (error) {
    console.error('Update registration notes error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error updating notes'
    });
  }
};

module.exports = {
  submitRegistration,
  getPendingRegistrations,
  getAllRegistrations,
  getRegistration,
  approveRegistration,
  rejectRegistration,
  updateRegistrationNotes
}; 