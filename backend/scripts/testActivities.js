const mongoose = require('mongoose');
const Activity = require('../models/Activity');
const User = require('../models/User');
const Assignment = require('../models/Assignment');
const Quiz = require('../models/Quiz');
const Message = require('../models/Message');

async function testActivities() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/at-ict', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Find a teacher
    const teacher = await User.findOne({ role: 'teacher' });
    if (!teacher) {
      console.error('No teacher found. Please create a teacher account first.');
      return;
    }
    
    // Find some students
    const students = await User.find({ 
      role: 'student', 
      registrationStatus: 'approved' 
    }).limit(5);
    
    if (students.length === 0) {
      console.error('No approved students found. Please create student accounts first.');
      return;
    }
    
    console.log(`Found ${students.length} students for testing`);
    
    // Clear existing activities
    await Activity.deleteMany({});
    console.log('Cleared existing activities');
    
    // Create sample activities
    const activities = [];
    
    // Registration activities
    for (let i = 0; i < 3; i++) {
      const student = students[i % students.length];
      activities.push({
        type: 'registration',
        title: 'New Student Registration',
        description: `${student.firstName} ${student.lastName} submitted a new registration`,
        student: student._id,
        relatedItemId: student._id,
        relatedItemModel: 'Registration',
        metadata: {
          year: '2024',
          session: 'Morning',
          school: 'Test School'
        },
        priority: 'high',
        createdAt: new Date(Date.now() - (i * 2 * 60 * 60 * 1000)) // 2 hours apart
      });
    }
    
    // Assignment submission activities
    for (let i = 0; i < 4; i++) {
      const student = students[i % students.length];
      const isLate = i % 2 === 0; // Every other submission is late
      activities.push({
        type: 'assignment_submission',
        title: 'Assignment Submitted',
        description: `${student.firstName} ${student.lastName} submitted assignment: Database Design Project`,
        student: student._id,
        relatedItemId: new mongoose.Types.ObjectId(), // Mock assignment ID
        relatedItemModel: 'Assignment',
        metadata: {
          assignmentTitle: 'Database Design Project',
          isLate: isLate,
          submissionDate: new Date(),
          attachmentsCount: Math.floor(Math.random() * 3) + 1
        },
        priority: isLate ? 'high' : 'medium',
        createdAt: new Date(Date.now() - (i * 3 * 60 * 60 * 1000)) // 3 hours apart
      });
    }
    
    // Quiz submission activities
    for (let i = 0; i < 3; i++) {
      const student = students[i % students.length];
      const isLate = i === 1; // Second submission is late
      activities.push({
        type: 'quiz_submission',
        title: 'Quiz Submitted',
        description: `${student.firstName} ${student.lastName} submitted quiz: JavaScript Fundamentals`,
        student: student._id,
        relatedItemId: new mongoose.Types.ObjectId(), // Mock quiz ID
        relatedItemModel: 'Quiz',
        metadata: {
          quizTitle: 'JavaScript Fundamentals',
          isLate: isLate,
          submissionDate: new Date(),
          timeSpent: Math.floor(Math.random() * 45) + 15, // 15-60 minutes
          attachmentsCount: 0
        },
        priority: isLate ? 'high' : 'medium',
        createdAt: new Date(Date.now() - (i * 4 * 60 * 60 * 1000)) // 4 hours apart
      });
    }
    
    // Message activities
    for (let i = 0; i < 2; i++) {
      const student = students[i % students.length];
      activities.push({
        type: 'message',
        title: 'New Message from Student',
        description: `${student.firstName} ${student.lastName} sent a new message`,
        student: student._id,
        relatedItemId: new mongoose.Types.ObjectId(), // Mock message ID
        relatedItemModel: 'Message',
        metadata: {
          messageType: 'text',
          hasAttachments: false,
          recipientName: `${teacher.firstName} ${teacher.lastName}`
        },
        priority: 'medium',
        createdAt: new Date(Date.now() - (i * 1 * 60 * 60 * 1000)) // 1 hour apart
      });
    }
    
    // Insert all activities
    await Activity.insertMany(activities);
    console.log(`Created ${activities.length} sample activities`);
    
    // Fetch and display activities
    const recentActivities = await Activity.getRecentActivities(10);
    console.log('\nRecent Activities:');
    recentActivities.forEach((activity, index) => {
      console.log(`${index + 1}. ${activity.student?.firstName} ${activity.student?.lastName} - ${activity.description}`);
      console.log(`   Type: ${activity.type}, Priority: ${activity.priority}, Time: ${activity.createdAt}`);
      console.log(`   Read: ${activity.isRead ? 'Yes' : 'No'}`);
      console.log('');
    });
    
    // Get unread count
    const unreadCount = await Activity.getUnreadCount();
    console.log(`Unread activities: ${unreadCount}`);
    
  } catch (error) {
    console.error('Error testing activities:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

testActivities(); 