const mongoose = require('mongoose');
const User = require('../models/User');

// Try to load environment variables
try {
  require('dotenv').config();
} catch (error) {
  console.log('No .env file found, using default values');
}

const testLogin = async () => {
  try {
    // Set default environment variables if not set
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = 'fallback_jwt_secret_for_testing';
    }
    if (!process.env.JWT_EXPIRE) {
      process.env.JWT_EXPIRE = '30d';
    }
    
    // Use environment variable or fallback to default MongoDB URI
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/atict';
    
    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB:', mongoUri);

    // Test email and password
    const email = 'ahmad@atict.com';
    const password = '123456';
    
    console.log('\n🔍 Testing login for:', email);
    
    // Step 1: Find user
    console.log('\n1. Looking up user...');
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:');
    console.log('  - Name:', user.firstName, user.lastName);
    console.log('  - Email:', user.email);
    console.log('  - Role:', user.role);
    console.log('  - Registration Status:', user.registrationStatus);
    console.log('  - Is Active:', user.isActive);
    
    // Step 2: Check if account is locked
    console.log('\n2. Checking account lock status...');
    if (user.isLocked()) {
      console.log('❌ Account is locked');
      return;
    }
    console.log('✅ Account is not locked');
    
    // Step 3: Check if account is active
    console.log('\n3. Checking if account is active...');
    if (!user.isActive) {
      console.log('❌ Account is not active');
      return;
    }
    console.log('✅ Account is active');
    
    // Step 4: Test password
    console.log('\n4. Testing password...');
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      console.log('❌ Password does not match');
      return;
    }
    console.log('✅ Password matches');
    
    // Step 5: Check registration status for students
    console.log('\n5. Checking registration status...');
    if (user.role === 'student' && user.registrationStatus !== 'approved') {
      console.log('❌ Student registration not approved');
      return;
    }
    console.log('✅ Registration status OK');
    
    // Step 6: Generate JWT token
    console.log('\n6. Generating JWT token...');
    try {
      const token = user.getSignedJwtToken();
      console.log('✅ JWT token generated successfully');
      console.log('Token length:', token.length);
    } catch (error) {
      console.log('❌ JWT token generation failed:', error.message);
      return;
    }
    
    // Step 7: Get dashboard URL
    console.log('\n7. Getting dashboard URL...');
    console.log('✅ Dashboard URL:', user.dashboardUrl);
    
    console.log('\n🎉 All login steps passed! Login should work.');
    
  } catch (error) {
    console.error('❌ Error during login test:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
};

// Run the test
testLogin(); 