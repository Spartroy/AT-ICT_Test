const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/at-ict', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Material = require('../models/Material');
const User = require('../models/User');

async function testMaterialUpload() {
  try {
    console.log('🔍 Testing Material Upload System...\n');

    // Check if uploads directory exists
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    const materialsDir = path.join(uploadsDir, 'materials');
    const thumbnailsDir = path.join(materialsDir, 'thumbnails');

    console.log('📁 Checking upload directories...');
    console.log('Uploads directory exists:', fs.existsSync(uploadsDir));
    console.log('Materials directory exists:', fs.existsSync(materialsDir));
    console.log('Thumbnails directory exists:', fs.existsSync(thumbnailsDir));

    if (!fs.existsSync(uploadsDir)) {
      console.log('Creating uploads directory...');
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    if (!fs.existsSync(materialsDir)) {
      console.log('Creating materials directory...');
      fs.mkdirSync(materialsDir, { recursive: true });
    }
    if (!fs.existsSync(thumbnailsDir)) {
      console.log('Creating thumbnails directory...');
      fs.mkdirSync(thumbnailsDir, { recursive: true });
    }

    // Check for existing materials
    console.log('\n📚 Checking existing materials...');
    const materials = await Material.find().populate('uploadedBy', 'firstName lastName');
    console.log(`Found ${materials.length} materials`);

    if (materials.length > 0) {
      console.log('\n📋 Sample materials:');
      materials.slice(0, 3).forEach((material, index) => {
        console.log(`${index + 1}. ${material.title} (${material.type})`);
        console.log(`   File: ${material.fileUrl}`);
        console.log(`   Thumbnail: ${material.thumbnailUrl || 'None'}`);
        console.log(`   Uploaded by: ${material.uploadedBy?.firstName} ${material.uploadedBy?.lastName}`);
        console.log('');
      });
    }

    // Check for teachers
    console.log('👨‍🏫 Checking for teachers...');
    const teachers = await User.find({ role: 'teacher' });
    console.log(`Found ${teachers.length} teachers`);

    if (teachers.length === 0) {
      console.log('❌ No teachers found. Please create a teacher account first.');
      return;
    }

    // Check for students
    console.log('👨‍🎓 Checking for students...');
    const students = await User.find({ role: 'student' });
    console.log(`Found ${students.length} students`);

    console.log('\n✅ Material upload system test completed!');
    console.log('\n📝 To test upload functionality:');
    console.log('1. Start the backend server: npm start');
    console.log('2. Start the frontend: cd ../client && npm start');
    console.log('3. Login as a teacher and try uploading a material');
    console.log('4. Check the browser console for any errors');

  } catch (error) {
    console.error('❌ Error testing material upload:', error);
  } finally {
    mongoose.connection.close();
  }
}

testMaterialUpload(); 