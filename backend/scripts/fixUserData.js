/**
 * Script to fix user data issues in the database
 * This script checks for and fixes common data integrity issues
 */

require('dotenv').config();
const mongoose = require('mongoose');
const colors = require('colors');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline.bold);
  } catch (error) {
    console.error(`Database connection error: ${error.message}`.red.underline.bold);
    process.exit(1);
  }
};

// User model
const User = require('../models/User');

const fixUserData = async () => {
  try {
    console.log('🔍 Checking for user data issues...'.yellow);

    // Find users with missing or invalid roles
    const usersWithoutRole = await User.find({ 
      $or: [
        { role: { $exists: false } },
        { role: null },
        { role: '' },
        { role: { $nin: ['student', 'teacher', 'parent'] } }
      ]
    });

    console.log(`Found ${usersWithoutRole.length} users with role issues`.yellow);

    for (const user of usersWithoutRole) {
      console.log(`Fixing user: ${user.email || user._id}`.blue);
      
      // Set default role to 'student' if not specified
      if (!user.role || !['student', 'teacher', 'parent'].includes(user.role)) {
        user.role = 'student';
        console.log(`  ✅ Set role to 'student'`.green);
      }

      // Ensure required fields exist
      if (!user.firstName) {
        user.firstName = 'Unknown';
        console.log(`  ✅ Set firstName to 'Unknown'`.green);
      }

      if (!user.lastName) {
        user.lastName = 'User';
        console.log(`  ✅ Set lastName to 'User'`.green);
      }

      // Initialize role-specific data if missing
      if (user.role === 'student' && !user.studentInfo) {
        user.studentInfo = {
          year: 1,
          session: 'current',
          subjects: []
        };
        console.log(`  ✅ Initialized studentInfo`.green);
      }

      if (user.role === 'teacher' && !user.teacherInfo) {
        user.teacherInfo = {
          subjects: [],
          qualification: 'Not specified'
        };
        console.log(`  ✅ Initialized teacherInfo`.green);
      }

      if (user.role === 'parent' && !user.parentInfo) {
        user.parentInfo = {
          children: []
        };
        console.log(`  ✅ Initialized parentInfo`.green);
      }

      // Save the fixed user
      await user.save();
      console.log(`  ✅ Saved user ${user.email || user._id}`.green);
    }

    // Check for users with missing names
    const usersWithoutNames = await User.find({
      $or: [
        { firstName: { $exists: false } },
        { firstName: null },
        { firstName: '' },
        { lastName: { $exists: false } },
        { lastName: null },
        { lastName: '' }
      ]
    });

    console.log(`Found ${usersWithoutNames.length} users with name issues`.yellow);

    for (const user of usersWithoutNames) {
      console.log(`Fixing names for user: ${user.email || user._id}`.blue);
      
      if (!user.firstName) {
        user.firstName = 'Unknown';
        console.log(`  ✅ Set firstName to 'Unknown'`.green);
      }

      if (!user.lastName) {
        user.lastName = 'User';
        console.log(`  ✅ Set lastName to 'User'`.green);
      }

      await user.save();
      console.log(`  ✅ Saved user ${user.email || user._id}`.green);
    }

    console.log('✅ Data fix completed successfully!'.green.bold);

    // Display summary
    const totalUsers = await User.countDocuments();
    const studentCount = await User.countDocuments({ role: 'student' });
    const teacherCount = await User.countDocuments({ role: 'teacher' });
    const parentCount = await User.countDocuments({ role: 'parent' });

    console.log('\n📊 Database Summary:'.cyan.bold);
    console.log(`Total Users: ${totalUsers}`.white);
    console.log(`Students: ${studentCount}`.white);
    console.log(`Teachers: ${teacherCount}`.white);
    console.log(`Parents: ${parentCount}`.white);

  } catch (error) {
    console.error('❌ Error fixing user data:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed'.yellow);
    process.exit(0);
  }
};

// Run the script
const runScript = async () => {
  await connectDB();
  await fixUserData();
};

// Handle command line execution
if (require.main === module) {
  runScript();
}

module.exports = { fixUserData }; 