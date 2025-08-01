const mongoose = require('mongoose');
const Schedule = require('../models/Schedule');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/at-ict', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const testScheduleFunctionality = async () => {
  try {
    console.log('Testing schedule functionality...');
    
    // Find a teacher user
    const teacher = await User.findOne({ role: 'teacher' });
    if (!teacher) {
      console.error('No teacher found. Please create a teacher account first.');
      return;
    }

    // Create a test schedule
    const testSchedule = {
      title: "Test Class Schedule",
      notes: "This is a test schedule",
      createdBy: teacher._id,
      lastUpdatedBy: teacher._id,
      schedule: [
        {
          day: "Monday",
          sessions: [
            {
              startTime: "09:00",
              endTime: "10:30",
              type: "theory",
              topic: "Introduction to ICT",
              isActive: true
            },
            {
              startTime: "11:00",
              endTime: "12:30",
              type: "practical",
              topic: "Word Processing",
              isActive: true
            }
          ]
        },
        {
          day: "Tuesday",
          sessions: [
            {
              startTime: "09:00",
              endTime: "10:30",
              type: "theory",
              topic: "Database Concepts",
              isActive: true
            }
          ]
        },
        {
          day: "Wednesday",
          sessions: []
        },
        {
          day: "Thursday",
          sessions: [
            {
              startTime: "14:00",
              endTime: "15:30",
              type: "quiz",
              topic: "Weekly Assessment",
              isActive: true
            }
          ]
        },
        {
          day: "Friday",
          sessions: [
            {
              startTime: "09:00",
              endTime: "10:30",
              type: "revision",
              topic: "Week Review",
              isActive: true
            }
          ]
        },
        {
          day: "Saturday",
          sessions: []
        },
        {
          day: "Sunday",
          sessions: []
        }
      ],
      lastUpdatedBy: teacher._id
    };

    // Check if schedule already exists
    let existingSchedule = await Schedule.findOne({ lastUpdatedBy: teacher._id });
    
    if (existingSchedule) {
      console.log('Updating existing schedule...');
      existingSchedule.title = testSchedule.title;
      existingSchedule.notes = testSchedule.notes;
      existingSchedule.schedule = testSchedule.schedule;
      existingSchedule.lastUpdatedBy = teacher._id;
      await existingSchedule.save();
      console.log('Schedule updated successfully!');
    } else {
      console.log('Creating new schedule...');
      const schedule = new Schedule(testSchedule);
      await schedule.save();
      console.log('Schedule created successfully!');
    }

    // Test fetching the schedule
    console.log('\nTesting schedule retrieval...');
    const fetchedSchedule = await Schedule.findOne({ lastUpdatedBy: teacher._id })
      .populate('lastUpdatedBy', 'firstName lastName');
    
    if (fetchedSchedule) {
      console.log('Schedule retrieved successfully:');
      console.log(`Title: ${fetchedSchedule.title}`);
      console.log(`Notes: ${fetchedSchedule.notes}`);
      console.log(`Last updated by: ${fetchedSchedule.lastUpdatedBy.firstName} ${fetchedSchedule.lastUpdatedBy.lastName}`);
      console.log(`Total days: ${fetchedSchedule.schedule.length}`);
      
      fetchedSchedule.schedule.forEach(day => {
        console.log(`${day.day}: ${day.sessions.length} sessions`);
        day.sessions.forEach(session => {
          console.log(`  - ${session.startTime}-${session.endTime}: ${session.topic} (${session.type})`);
        });
      });
    } else {
      console.log('No schedule found');
    }

    console.log('\nSchedule functionality test completed successfully!');
  } catch (error) {
    console.error('Error testing schedule functionality:', error);
  } finally {
    mongoose.connection.close();
  }
};

testScheduleFunctionality(); 