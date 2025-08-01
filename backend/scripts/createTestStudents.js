const mongoose = require('mongoose');
const User = require('../models/User');

async function createTestStudents() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/at-ict', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    const testStudents = [
      {
        firstName: 'Sarah',
        lastName: 'Ahmed',
        email: 'sarah.ahmed@example.com',
        password: 'password123',
        role: 'student',
        contactNumber: '9876543210',
        registrationStatus: 'approved',
        isActive: true,
        studentInfo: {
          year: 12,
          nationality: 'Egyptian',
          school: 'Cairo International School',
          session: 'NOV 25',
          isRetaker: false,
          parentContactNumber: '9876543211',
          techKnowledge: 3,
          otherSubjects: 'Math, Science'
        }
      },
      {
        firstName: 'Omar',
        lastName: 'Hassan',
        email: 'omar.hassan@example.com',
        password: 'password123',
        role: 'student',
        contactNumber: '9876543212',
        registrationStatus: 'approved',
        isActive: true,
        studentInfo: {
          year: 11,
          nationality: 'Egyptian',
          school: 'Alexandria High School',
          session: 'JUN 26',
          isRetaker: true,
          parentContactNumber: '9876543213',
          techKnowledge: 6,
          otherSubjects: 'Physics, Chemistry'
        }
      },
      {
        firstName: 'Fatima',
        lastName: 'Al Zahra',
        email: 'fatima.alzahra@example.com',
        password: 'password123',
        role: 'student',
        contactNumber: '9876543214',
        registrationStatus: 'approved',
        isActive: true,
        studentInfo: {
          year: 12,
          nationality: 'Egyptian',
          school: 'Giza Technical School',
          session: 'NOV 25',
          isRetaker: false,
          parentContactNumber: '9876543215',
          techKnowledge: 8,
          otherSubjects: 'English, History'
        }
      },
      {
        firstName: 'Ahmed',
        lastName: 'Mahmoud',
        email: 'ahmed.mahmoud@example.com',
        password: 'password123',
        role: 'student',
        contactNumber: '9876543216',
        registrationStatus: 'approved',
        isActive: true,
        studentInfo: {
          year: 10,
          nationality: 'Egyptian',
          school: 'Heliopolis Academy',
          session: 'JUN 26',
          isRetaker: false,
          parentContactNumber: '9876543217',
          techKnowledge: 2,
          otherSubjects: 'Arabic, Islamic Studies'
        }
      },
      {
        firstName: 'Layla',
        lastName: 'Mohammed',
        email: 'layla.mohammed@example.com',
        password: 'password123',
        role: 'student',
        contactNumber: '9876543218',
        registrationStatus: 'approved',
        isActive: true,
        studentInfo: {
          year: 11,
          nationality: 'Egyptian',
          school: 'Maadi International School',
          session: 'NOV 25',
          isRetaker: true,
          parentContactNumber: '9876543219',
          techKnowledge: 5,
          otherSubjects: 'French, Art'
        }
      }
    ];
    
    for (const studentData of testStudents) {
      // Check if student already exists
      const existingStudent = await User.findOne({ email: studentData.email });
      if (existingStudent) {
        console.log(`Student ${studentData.firstName} ${studentData.lastName} already exists`);
        continue;
      }
      
      // Create student
      const student = await User.create(studentData);
      console.log(`✅ Created student: ${student.firstName} ${student.lastName} (${student.email})`);
    }
    
    console.log('\nTest students creation completed!');
    
  } catch (error) {
    console.error('❌ Error creating test students:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createTestStudents(); 