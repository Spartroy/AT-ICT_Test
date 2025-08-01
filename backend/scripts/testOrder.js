const mongoose = require('mongoose');
const Video = require('../models/Video');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/at-ict-test', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const testOrderFunctionality = async () => {
  try {
    console.log('Testing order functionality for practical videos...');
    
    // Find a teacher user
    const teacher = await User.findOne({ role: 'teacher' });
    if (!teacher) {
      console.error('No teacher found. Please create a teacher account first.');
      return;
    }

    // Create test practical videos with different orders
    const testVideos = [
      {
        title: "Test Word Guide 1",
        description: "Test guide for Word",
        type: "practical",
        videoUrl: "https://drive.google.com/file/d/test1/preview",
        program: "word",
        contentType: "guide",
        order: 1,
        uploadedBy: teacher._id
      },
      {
        title: "Test Word Guide 2",
        description: "Test guide for Word",
        type: "practical",
        videoUrl: "https://drive.google.com/file/d/test2/preview",
        program: "word",
        contentType: "guide",
        order: 2,
        uploadedBy: teacher._id
      },
      {
        title: "Test Word Task 1",
        description: "Test task for Word",
        type: "practical",
        videoUrl: "https://drive.google.com/file/d/test3/preview",
        program: "word",
        contentType: "task",
        order: 1,
        uploadedBy: teacher._id
      },
      {
        title: "Test Word Task 2",
        description: "Test task for Word",
        type: "practical",
        videoUrl: "https://drive.google.com/file/d/test4/preview",
        program: "word",
        contentType: "task",
        order: 2,
        uploadedBy: teacher._id
      }
    ];

    // Create the test videos
    for (const videoData of testVideos) {
      const video = new Video(videoData);
      await video.save();
      console.log(`Created test video: ${videoData.title} with order ${videoData.order}`);
    }

    // Test the getPracticalVideosByProgram method
    console.log('\nTesting getPracticalVideosByProgram method...');
    const wordGuides = await Video.getPracticalVideosByProgram('word', 'guide');
    console.log('Word Guides (should be sorted by order):');
    wordGuides.forEach(video => {
      console.log(`- ${video.title} (Order: ${video.order})`);
    });

    const wordTasks = await Video.getPracticalVideosByProgram('word', 'task');
    console.log('\nWord Tasks (should be sorted by order):');
    wordTasks.forEach(video => {
      console.log(`- ${video.title} (Order: ${video.order})`);
    });

    // Test the getAccessibleVideos method
    console.log('\nTesting getAccessibleVideos method...');
    const accessibleVideos = await Video.getAccessibleVideos(teacher._id, 10);
    const practicalVideos = accessibleVideos.filter(v => v.type === 'practical' && v.program === 'word');
    console.log('All Word practical videos (should be sorted by contentType desc, then order):');
    practicalVideos.forEach(video => {
      console.log(`- ${video.title} (${video.contentType}, Order: ${video.order})`);
    });

    // Clean up test videos
    console.log('\nCleaning up test videos...');
    for (const videoData of testVideos) {
      await Video.deleteOne({ title: videoData.title });
    }

    console.log('Order functionality test completed successfully!');
  } catch (error) {
    console.error('Error testing order functionality:', error);
  } finally {
    mongoose.connection.close();
  }
};

testOrderFunctionality(); 