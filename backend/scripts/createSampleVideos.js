const mongoose = require('mongoose');
const Video = require('../models/Video');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/at_ict_test', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const sampleVideos = [
  // Theory Videos - Phase 1
  {
    title: "Chapter 1: Computer Structure",
    description: "Learn about the basic components and structure of a computer system",
    type: "theory",
    category: "Computer Fundamentals",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-5/preview",
    duration: 900, // 15 minutes
    phase: 1,
    chapter: 1,
    order: 1,
    tags: ["computer", "structure", "hardware"],
    accessLevel: "all"
  },
  {
    title: "Chapter 2: Input Devices",
    description: "Understanding various input devices and their functions",
    type: "theory",
    category: "Computer Fundamentals",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-6/preview",
    duration: 720, // 12 minutes
    phase: 1,
    chapter: 2,
    order: 2,
    tags: ["input", "devices", "keyboard", "mouse"],
    accessLevel: "all"
  },
  {
    title: "Chapter 3: Output Devices",
    description: "Exploring output devices and their importance",
    type: "theory",
    category: "Computer Fundamentals",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-7/preview",
    duration: 600, // 10 minutes
    phase: 1,
    chapter: 3,
    order: 3,
    tags: ["output", "devices", "monitor", "printer"],
    accessLevel: "all"
  },
  {
    title: "Chapter 4: Storage Devices",
    description: "Understanding different types of storage devices",
    type: "theory",
    category: "Computer Fundamentals",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-8/preview",
    duration: 840, // 14 minutes
    phase: 1,
    chapter: 4,
    order: 4,
    tags: ["storage", "devices", "hard drive", "ssd"],
    accessLevel: "all"
  },

  // Theory Videos - Phase 2
  {
    title: "Chapter 5: Database Fundamentals",
    description: "Introduction to database concepts and management",
    type: "theory",
    category: "Database Systems",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-9/preview",
    duration: 1080, // 18 minutes
    phase: 2,
    chapter: 1,
    order: 5,
    tags: ["database", "sql", "data management"],
    accessLevel: "all"
  },
  {
    title: "Chapter 6: Network Basics",
    description: "Understanding computer networks and communication",
    type: "theory",
    category: "Networking",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-10/preview",
    duration: 960, // 16 minutes
    phase: 2,
    chapter: 2,
    order: 6,
    tags: ["networking", "internet", "protocols"],
    accessLevel: "all"
  },
  {
    title: "Chapter 7: Malware and Security",
    description: "Learning about malware types and security measures",
    type: "theory",
    category: "Cybersecurity",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-11/preview",
    duration: 1200, // 20 minutes
    phase: 2,
    chapter: 3,
    order: 7,
    tags: ["security", "malware", "cybersecurity"],
    accessLevel: "all"
  },

  // Theory Videos - Phase 3
  {
    title: "Chapter 8: System Life Cycle (SDLC)",
    description: "Understanding the software development life cycle",
    type: "theory",
    category: "Software Development",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-12/preview",
    duration: 1320, // 22 minutes
    phase: 3,
    chapter: 1,
    order: 8,
    tags: ["sdlc", "development", "software"],
    accessLevel: "all"
  },
  {
    title: "Chapter 9: ICT Systems",
    description: "Exploring Information and Communication Technology systems",
    type: "theory",
    category: "ICT Systems",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-13/preview",
    duration: 900, // 15 minutes
    phase: 3,
    chapter: 2,
    order: 9,
    tags: ["ict", "systems", "information"],
    accessLevel: "all"
  },
  {
    title: "Chapter 10: Banking Applications",
    description: "Understanding ICT applications in banking sector",
    type: "theory",
    category: "ICT Applications",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-14/preview",
    duration: 780, // 13 minutes
    phase: 3,
    chapter: 3,
    order: 10,
    tags: ["banking", "applications", "finance"],
    accessLevel: "all"
  },
  {
    title: "Chapter 11: ICT Applications",
    description: "Various applications of ICT in different sectors",
    type: "theory",
    category: "ICT Applications",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-15/preview",
    duration: 960, // 16 minutes
    phase: 3,
    chapter: 4,
    order: 11,
    tags: ["applications", "sectors", "technology"],
    accessLevel: "all"
  },
  {
    title: "Chapter 12: ICT Programs",
    description: "Understanding different ICT programs and software",
    type: "theory",
    category: "ICT Programs",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-16/preview",
    duration: 840, // 14 minutes
    phase: 3,
    chapter: 5,
    order: 12,
    tags: ["programs", "software", "applications"],
    accessLevel: "all"
  },
  {
    title: "Chapter 13: ICT Effects",
    description: "Impact of ICT on society and daily life",
    type: "theory",
    category: "ICT Effects",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-17/preview",
    duration: 1020, // 17 minutes
    phase: 3,
    chapter: 6,
    order: 13,
    tags: ["effects", "society", "impact"],
    accessLevel: "all"
  },

  // Practical Videos - Word
  {
    title: "Word Guide 1: Basic Document Creation",
    description: "Learn to create and format basic documents in Microsoft Word",
    type: "practical",
    category: "Microsoft Word",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-18/preview",
    duration: 600, // 10 minutes
    program: "word",
    contentType: "guide",
    order: 1,
    tags: ["word", "document", "basic"],
    accessLevel: "all"
  },
  {
    title: "Word Guide 2: Advanced Formatting",
    description: "Advanced formatting techniques in Microsoft Word",
    type: "practical",
    category: "Microsoft Word",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-19/preview",
    duration: 900, // 15 minutes
    program: "word",
    contentType: "guide",
    order: 2,
    tags: ["word", "formatting", "advanced"],
    accessLevel: "all"
  },
  {
    title: "Word Task 1: Create a Business Letter",
    description: "Practice creating a professional business letter",
    type: "practical",
    category: "Microsoft Word",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-20/preview",
    duration: 720, // 12 minutes
    program: "word",
    contentType: "task",
    order: 3,
    tags: ["word", "business", "letter"],
    accessLevel: "all"
  },
  {
    title: "Word Task 2: Design a Newsletter",
    description: "Create an attractive newsletter using Word features",
    type: "practical",
    category: "Microsoft Word",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-21/preview",
    duration: 1080, // 18 minutes
    program: "word",
    contentType: "task",
    order: 4,
    tags: ["word", "newsletter", "design"],
    accessLevel: "all"
  },

  // Practical Videos - PowerPoint
  {
    title: "PowerPoint Guide 1: Basic Presentation",
    description: "Learn to create basic presentations in PowerPoint",
    type: "practical",
    category: "Microsoft PowerPoint",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-22/preview",
    duration: 600, // 10 minutes
    program: "powerpoint",
    contentType: "guide",
    order: 1,
    tags: ["powerpoint", "presentation", "basic"],
    accessLevel: "all"
  },
  {
    title: "PowerPoint Guide 2: Advanced Animations",
    description: "Master advanced animation techniques in PowerPoint",
    type: "practical",
    category: "Microsoft PowerPoint",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-23/preview",
    duration: 900, // 15 minutes
    program: "powerpoint",
    contentType: "guide",
    order: 2,
    tags: ["powerpoint", "animations", "advanced"],
    accessLevel: "all"
  },
  {
    title: "PowerPoint Task 1: Educational Presentation",
    description: "Create an educational presentation with multimedia",
    type: "practical",
    category: "Microsoft PowerPoint",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-24/preview",
    duration: 840, // 14 minutes
    program: "powerpoint",
    contentType: "task",
    order: 3,
    tags: ["powerpoint", "educational", "multimedia"],
    accessLevel: "all"
  },
  {
    title: "PowerPoint Task 2: Business Proposal",
    description: "Design a professional business proposal presentation",
    type: "practical",
    category: "Microsoft PowerPoint",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-25/preview",
    duration: 1020, // 17 minutes
    program: "powerpoint",
    contentType: "task",
    order: 4,
    tags: ["powerpoint", "business", "proposal"],
    accessLevel: "all"
  },

  // Practical Videos - Access
  {
    title: "Access Guide 1: Database Basics",
    description: "Introduction to Microsoft Access and database concepts",
    type: "practical",
    category: "Microsoft Access",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-26/preview",
    duration: 900, // 15 minutes
    program: "access",
    contentType: "guide",
    order: 1,
    tags: ["access", "database", "basics"],
    accessLevel: "all"
  },
  {
    title: "Access Guide 2: Table Design",
    description: "Learn to design and create tables in Access",
    type: "practical",
    category: "Microsoft Access",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-27/preview",
    duration: 720, // 12 minutes
    program: "access",
    contentType: "guide",
    order: 2,
    tags: ["access", "tables", "design"],
    accessLevel: "all"
  },
  {
    title: "Access Guide 3: Query Creation",
    description: "Creating and using queries in Microsoft Access",
    type: "practical",
    category: "Microsoft Access",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-28/preview",
    duration: 840, // 14 minutes
    program: "access",
    contentType: "guide",
    order: 3,
    tags: ["access", "queries", "sql"],
    accessLevel: "all"
  },
  {
    title: "Access Guide 4: Form Design",
    description: "Designing user-friendly forms in Access",
    type: "practical",
    category: "Microsoft Access",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-29/preview",
    duration: 780, // 13 minutes
    program: "access",
    contentType: "guide",
    order: 4,
    tags: ["access", "forms", "design"],
    accessLevel: "all"
  },
  {
    title: "Access Task 1: Student Database",
    description: "Create a student management database system",
    type: "practical",
    category: "Microsoft Access",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-30/preview",
    duration: 1200, // 20 minutes
    program: "access",
    contentType: "task",
    order: 5,
    tags: ["access", "student", "database"],
    accessLevel: "all"
  },
  {
    title: "Access Task 2: Inventory System",
    description: "Build an inventory management system",
    type: "practical",
    category: "Microsoft Access",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-31/preview",
    duration: 1080, // 18 minutes
    program: "access",
    contentType: "task",
    order: 6,
    tags: ["access", "inventory", "management"],
    accessLevel: "all"
  },
  {
    title: "Access Task 3: Library System",
    description: "Create a library management database",
    type: "practical",
    category: "Microsoft Access",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-32/preview",
    duration: 1320, // 22 minutes
    program: "access",
    contentType: "task",
    order: 7,
    tags: ["access", "library", "management"],
    accessLevel: "all"
  },
  {
    title: "Access Task 4: Sales Database",
    description: "Develop a sales tracking database system",
    type: "practical",
    category: "Microsoft Access",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-33/preview",
    duration: 1140, // 19 minutes
    program: "access",
    contentType: "task",
    order: 8,
    tags: ["access", "sales", "tracking"],
    accessLevel: "all"
  },

  // Practical Videos - Excel
  {
    title: "Excel Guide 1: Basic Spreadsheets",
    description: "Learn to create and format basic spreadsheets in Excel",
    type: "practical",
    category: "Microsoft Excel",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-34/preview",
    duration: 600, // 10 minutes
    program: "excel",
    contentType: "guide",
    order: 1,
    tags: ["excel", "spreadsheet", "basic"],
    accessLevel: "all"
  },
  {
    title: "Excel Guide 2: Formulas and Functions",
    description: "Master Excel formulas and built-in functions",
    type: "practical",
    category: "Microsoft Excel",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-35/preview",
    duration: 900, // 15 minutes
    program: "excel",
    contentType: "guide",
    order: 2,
    tags: ["excel", "formulas", "functions"],
    accessLevel: "all"
  },
  {
    title: "Excel Guide 3: Charts and Graphs",
    description: "Creating and customizing charts in Excel",
    type: "practical",
    category: "Microsoft Excel",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-36/preview",
    duration: 720, // 12 minutes
    program: "excel",
    contentType: "guide",
    order: 3,
    tags: ["excel", "charts", "graphs"],
    accessLevel: "all"
  },
  {
    title: "Excel Guide 4: Data Analysis",
    description: "Advanced data analysis techniques in Excel",
    type: "practical",
    category: "Microsoft Excel",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-37/preview",
    duration: 840, // 14 minutes
    program: "excel",
    contentType: "guide",
    order: 4,
    tags: ["excel", "analysis", "data"],
    accessLevel: "all"
  },
  {
    title: "Excel Task 1: Budget Tracker",
    description: "Create a personal budget tracking spreadsheet",
    type: "practical",
    category: "Microsoft Excel",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-38/preview",
    duration: 960, // 16 minutes
    program: "excel",
    contentType: "task",
    order: 5,
    tags: ["excel", "budget", "tracker"],
    accessLevel: "all"
  },
  {
    title: "Excel Task 2: Sales Report",
    description: "Build a comprehensive sales reporting system",
    type: "practical",
    category: "Microsoft Excel",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-39/preview",
    duration: 1080, // 18 minutes
    program: "excel",
    contentType: "task",
    order: 6,
    tags: ["excel", "sales", "report"],
    accessLevel: "all"
  },
  {
    title: "Excel Task 3: Grade Book",
    description: "Create a student grade management system",
    type: "practical",
    category: "Microsoft Excel",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-40/preview",
    duration: 1200, // 20 minutes
    program: "excel",
    contentType: "task",
    order: 7,
    tags: ["excel", "grades", "education"],
    accessLevel: "all"
  },
  {
    title: "Excel Task 4: Inventory Analysis",
    description: "Develop an inventory analysis dashboard",
    type: "practical",
    category: "Microsoft Excel",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-41/preview",
    duration: 1020, // 17 minutes
    program: "excel",
    contentType: "task",
    order: 8,
    tags: ["excel", "inventory", "dashboard"],
    accessLevel: "all"
  },

  // Practical Videos - SharePoint
  {
    title: "SharePoint Guide 1: Site Creation",
    description: "Learn to create and manage SharePoint sites",
    type: "practical",
    category: "Microsoft SharePoint",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-42/preview",
    duration: 900, // 15 minutes
    program: "sharepoint",
    contentType: "guide",
    order: 1,
    tags: ["sharepoint", "sites", "creation"],
    accessLevel: "all"
  },
  {
    title: "SharePoint Guide 2: Document Libraries",
    description: "Managing document libraries in SharePoint",
    type: "practical",
    category: "Microsoft SharePoint",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-43/preview",
    duration: 720, // 12 minutes
    program: "sharepoint",
    contentType: "guide",
    order: 2,
    tags: ["sharepoint", "libraries", "documents"],
    accessLevel: "all"
  },
  {
    title: "SharePoint Guide 3: Lists and Views",
    description: "Creating and customizing lists and views",
    type: "practical",
    category: "Microsoft SharePoint",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-44/preview",
    duration: 840, // 14 minutes
    program: "sharepoint",
    contentType: "guide",
    order: 3,
    tags: ["sharepoint", "lists", "views"],
    accessLevel: "all"
  },
  {
    title: "SharePoint Guide 4: Workflows",
    description: "Understanding SharePoint workflows and automation",
    type: "practical",
    category: "Microsoft SharePoint",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-45/preview",
    duration: 960, // 16 minutes
    program: "sharepoint",
    contentType: "guide",
    order: 4,
    tags: ["sharepoint", "workflows", "automation"],
    accessLevel: "all"
  },
  {
    title: "SharePoint Guide 5: Permissions",
    description: "Managing permissions and security in SharePoint",
    type: "practical",
    category: "Microsoft SharePoint",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-46/preview",
    duration: 780, // 13 minutes
    program: "sharepoint",
    contentType: "guide",
    order: 5,
    tags: ["sharepoint", "permissions", "security"],
    accessLevel: "all"
  },
  {
    title: "SharePoint Task 1: Team Site",
    description: "Create a collaborative team site",
    type: "practical",
    category: "Microsoft SharePoint",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-47/preview",
    duration: 1200, // 20 minutes
    program: "sharepoint",
    contentType: "task",
    order: 6,
    tags: ["sharepoint", "team", "collaboration"],
    accessLevel: "all"
  },
  {
    title: "SharePoint Task 2: Project Management",
    description: "Build a project management portal",
    type: "practical",
    category: "Microsoft SharePoint",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-48/preview",
    duration: 1080, // 18 minutes
    program: "sharepoint",
    contentType: "task",
    order: 7,
    tags: ["sharepoint", "project", "management"],
    accessLevel: "all"
  },
  {
    title: "SharePoint Task 3: Knowledge Base",
    description: "Create a knowledge management system",
    type: "practical",
    category: "Microsoft SharePoint",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-49/preview",
    duration: 1320, // 22 minutes
    program: "sharepoint",
    contentType: "task",
    order: 8,
    tags: ["sharepoint", "knowledge", "management"],
    accessLevel: "all"
  },
  {
    title: "SharePoint Task 4: Document Center",
    description: "Develop a centralized document management system",
    type: "practical",
    category: "Microsoft SharePoint",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-50/preview",
    duration: 1140, // 19 minutes
    program: "sharepoint",
    contentType: "task",
    order: 9,
    tags: ["sharepoint", "documents", "center"],
    accessLevel: "all"
  },
  {
    title: "SharePoint Task 5: Intranet Portal",
    description: "Create a comprehensive intranet portal",
    type: "practical",
    category: "Microsoft SharePoint",
    videoUrl: "https://drive.google.com/file/d/1-2-3-4-51/preview",
    duration: 1500, // 25 minutes
    program: "sharepoint",
    contentType: "task",
    order: 10,
    tags: ["sharepoint", "intranet", "portal"],
    accessLevel: "all"
  }
];

const createSampleVideos = async () => {
  try {
    // Find a teacher user to assign as uploader
    const teacher = await User.findOne({ role: 'teacher' });
    if (!teacher) {
      console.error('No teacher found. Please create a teacher account first.');
      return;
    }

    console.log('Creating sample videos...');

    for (const videoData of sampleVideos) {
      const video = new Video({
        ...videoData,
        uploadedBy: teacher._id
      });
      await video.save();
      console.log(`Created video: ${videoData.title}`);
    }

    console.log('Sample videos created successfully!');
    console.log(`Total videos created: ${sampleVideos.length}`);

    // Print summary
    const theoryCount = sampleVideos.filter(v => v.type === 'theory').length;
    const practicalCount = sampleVideos.filter(v => v.type === 'practical').length;
    
    console.log('\nSummary:');
    console.log(`Theory videos: ${theoryCount}`);
    console.log(`Practical videos: ${practicalCount}`);
    console.log(`Total videos: ${theoryCount + practicalCount}`);

  } catch (error) {
    console.error('Error creating sample videos:', error);
  } finally {
    mongoose.connection.close();
  }
};

createSampleVideos(); 