const mongoose = require('mongoose');
const User = require('../models/User');

async function createTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/at-ict', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'teststudent@example.com' });
    if (existingUser) {
      console.log('Test user already exists:', existingUser._id);
      console.log('Registration Status:', existingUser.registrationStatus);
      return;
    }
    
    // Create test user with pending registration
    const testUser = await User.create({
      firstName: 'Test',
      lastName: 'Student',
      email: 'teststudent@example.com',
      password: 'password123',
      role: 'student',
      contactNumber: '1234567890',
      address: {
        city: 'Test City'
      },
      studentInfo: {
        year: 12,
        nationality: 'Test Country',
        school: 'Test School',
        session: 'NOV 25',
        isRetaker: false,
        parentContactNumber: '0987654321',
        techKnowledge: 7,
        otherSubjects: 'Math, Physics'
      },
      registrationStatus: 'pending'
    });
    
    console.log('✅ Test user created successfully!');
    console.log('User ID:', testUser._id);
    console.log('Name:', testUser.firstName, testUser.lastName);
    console.log('Email:', testUser.email);
    console.log('Registration Status:', testUser.registrationStatus);
    
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createTestUser(); 