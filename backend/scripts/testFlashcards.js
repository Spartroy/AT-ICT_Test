const mongoose = require('mongoose');
const Flashcard = require('../models/Flashcard');
const User = require('../models/User');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const testFlashcardFunctionality = async () => {
  try {
    console.log('🧪 Testing Flashcard Functionality...\n');

    // Find a teacher and student for testing
    const teacher = await User.findOne({ role: 'teacher' });
    const student = await User.findOne({ role: 'student' });

    if (!teacher || !student) {
      console.log('❌ Need at least one teacher and one student in the database');
      return;
    }

    console.log('👨‍🏫 Teacher:', teacher.firstName, teacher.lastName);
    console.log('👨‍🎓 Student:', student.firstName, student.lastName);

    // Create a teacher flashcard stack
    const teacherStack = await Flashcard.create({
      title: 'Mathematics Basics',
      description: 'Basic mathematical concepts for beginners',
      subject: 'Mathematics',
      category: 'math',
      cards: [
        { front: 'What is 2 + 2?', back: '4', order: 0 },
        { front: 'What is 5 x 5?', back: '25', order: 1 },
        { front: 'What is the square root of 16?', back: '4', order: 2 }
      ],
      createdBy: teacher._id,
      creatorName: `${teacher.firstName} ${teacher.lastName}`,
      creatorRole: 'teacher',
      isPublic: true,
      isTeacherStack: true
    });

    console.log('✅ Created teacher flashcard stack:', teacherStack.title);

    // Create a student flashcard stack
    const studentStack = await Flashcard.create({
      title: 'Science Facts',
      description: 'Interesting science facts for students',
      subject: 'Science',
      category: 'science',
      cards: [
        { front: 'What is the chemical symbol for water?', back: 'H2O', order: 0 },
        { front: 'What planet is closest to the Sun?', back: 'Mercury', order: 1 },
        { front: 'What is the largest organ in the human body?', back: 'Skin', order: 2 }
      ],
      createdBy: student._id,
      creatorName: `${student.firstName} ${student.lastName}`,
      creatorRole: 'student',
      isPublic: true,
      isTeacherStack: false
    });

    console.log('✅ Created student flashcard stack:', studentStack.title);

    // Test fetching all public stacks
    const allStacks = await Flashcard.find({ isPublic: true })
      .populate('createdBy', 'firstName lastName');
    
    console.log('✅ Retrieved all public stacks:', allStacks.length);

    // Test fetching teacher stacks
    const teacherStacks = await Flashcard.find({ isTeacherStack: true, isPublic: true });
    console.log('✅ Retrieved teacher stacks:', teacherStacks.length);

    // Test fetching student stacks
    const studentStacks = await Flashcard.find({ isTeacherStack: false, isPublic: true });
    console.log('✅ Retrieved student stacks:', studentStacks.length);

    // Test study count increment
    await teacherStack.incrementStudyCount();
    console.log('✅ Incremented study count for teacher stack');

    // Test adding a card
    await teacherStack.addCard('What is 10 - 3?', '7');
    console.log('✅ Added card to teacher stack');

    // Test updating a card
    await teacherStack.updateCard(0, 'What is 2 + 2? (Updated)', '4');
    console.log('✅ Updated card in teacher stack');

    // Test removing a card
    await teacherStack.removeCard(3); // Remove the last card
    console.log('✅ Removed card from teacher stack');

    console.log('\n🎉 All flashcard tests passed!');
    console.log('\n📊 Final Stats:');
    console.log('- Total stacks:', allStacks.length);
    console.log('- Teacher stacks:', teacherStacks.length);
    console.log('- Student stacks:', studentStacks.length);
    console.log('- Teacher stack study count:', teacherStack.studyCount);
    console.log('- Teacher stack total cards:', teacherStack.totalCards);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

testFlashcardFunctionality(); 