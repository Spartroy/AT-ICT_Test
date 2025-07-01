const mongoose = require('mongoose');
const User = require('../models/User');

async function createTestTeacher() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/at-ict', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Check if test teacher already exists
    const existingTeacher = await User.findOne({ email: 'teacher@example.com' });
    if (existingTeacher) {
      console.log('Test teacher already exists:', existingTeacher._id);
      console.log('Role:', existingTeacher.role);
      return;
    }
    
    // Create test teacher user
    const testTeacher = await User.create({
      firstName: 'Test',
      lastName: 'Teacher',
      email: 'teacher@example.com',
      password: 'password123',
      role: 'teacher',
      contactNumber: '9876543210',
      teacherInfo: {
        subject: 'Computer Science',
        qualification: 'Master of Computer Science',
        experience: 5,
        joinDate: new Date(),
        isActive: true
      },
      registrationStatus: 'approved',
      isActive: true
    });
    
    console.log('✅ Test teacher created successfully!');
    console.log('Teacher ID:', testTeacher._id);
    console.log('Name:', testTeacher.firstName, testTeacher.lastName);
    console.log('Email:', testTeacher.email);
    console.log('Role:', testTeacher.role);
    console.log('Registration Status:', testTeacher.registrationStatus);
    
  } catch (error) {
    console.error('❌ Error creating test teacher:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createTestTeacher(); 