const mongoose = require('mongoose');
const User = require('../models/User');

// Try to load environment variables
try {
  require('dotenv').config();
} catch (error) {
  console.log('No .env file found, using default values');
}

const createTeacher = async () => {
  try {
    // Set default environment variables if not set
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = 'fallback_jwt_secret_for_teacher_creation';
    }
    if (!process.env.JWT_EXPIRE) {
      process.env.JWT_EXPIRE = '30d';
    }
    
    // Use environment variable or fallback to default MongoDB URI
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/atict';
    
    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB:', mongoUri);

    // Check if teacher already exists
    const existingTeacher = await User.findOne({ email: 'ahmad@atict.com' });
    if (existingTeacher) {
      console.log('Teacher account already exists!');
      console.log('Email:', existingTeacher.email);
      console.log('Role:', existingTeacher.role);
      process.exit(0);
    }

    // Create teacher account with minimal required fields
    const teacherData = {
      firstName: 'Ahmad',
      lastName: 'Teacher',
      email: 'ahmad@atict.com',
      password: '123456',
      role: 'teacher',
      contactNumber: '+201234567890',
      registrationStatus: 'approved',
      isActive: true,
      isEmailVerified: true,
      teacherInfo: {
        subject: 'Computer Science',
        qualification: 'Master\'s in Computer Science',
        experience: 5,
        joinDate: new Date(),
        isActive: true
      },
      address: {
        city: 'Cairo',
        country: 'Egypt'
      }
    };

    const teacher = await User.create(teacherData);
    
    console.log('✅ Teacher account created successfully!');
    console.log('📧 Email:', teacher.email);
    console.log('🔑 Password: 123456');
    console.log('👤 Role:', teacher.role);
    console.log('🆔 Employee ID:', teacher.teacherInfo.employeeId);
    console.log('🎯 Dashboard URL:', teacher.dashboardUrl);
    
  } catch (error) {
    console.error('❌ Error creating teacher:', error.message);
    
    if (error.code === 11000) {
      console.log('Teacher with this email already exists!');
    }
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the script
createTeacher(); 