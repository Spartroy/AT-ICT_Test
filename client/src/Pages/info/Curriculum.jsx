import React from 'react';
import { motion } from 'framer-motion';
import Nav from '../../components/Nav';
import { BookOpen, Clock, CheckCircle, Star, Users, Target, Zap, Award } from 'lucide-react';

const Curriculum = () => {
  const courseModules = [
    {
      week: 1,
      title: "ICT Fundamentals & Hardware",
      description: "Build your foundation with computer basics and hardware understanding",
      topics: [
        "Computer Systems Overview",
        "Input, Output & Storage Devices", 
        "Hardware Components Deep Dive",
        "System Specifications & Performance"
      ],
      practicalWork: "Hands-on computer assembly simulation",
      duration: "6 hours",
      difficulty: "Beginner"
    },
    {
      week: 2,
      title: "Software & Operating Systems",
      description: "Master different types of software and how they work together",
      topics: [
        "System vs Application Software",
        "Operating System Functions",
        "File Management Systems",
        "Software Installation & Maintenance"
      ],
      practicalWork: "Real OS navigation and file organization",
      duration: "5 hours",
      difficulty: "Beginner"
    },
    {
      week: 3,
      title: "Database Design & Management",
      description: "Create and manage databases like a professional",
      topics: [
        "Database Concepts & Terminology",
        "Entity Relationship Diagrams",
        "Table Creation & Relationships",
        "Data Types & Validation Rules"
      ],
      practicalWork: "Build a complete school database system",
      duration: "8 hours",
      difficulty: "Intermediate"
    },
    {
      week: 4,
      title: "Spreadsheet Mastery",
      description: "Advanced spreadsheet skills for data analysis",
      topics: [
        "Complex Formulas & Functions",
        "Data Analysis & Charts",
        "Conditional Formatting",
        "Pivot Tables & Data Modeling"
      ],
      practicalWork: "Business analysis project with real data",
      duration: "7 hours",
      difficulty: "Intermediate"
    },
    {
      week: 5,
      title: "Web Development Basics",
      description: "Create stunning websites from scratch",
      topics: [
        "HTML Structure & Semantics",
        "CSS Styling & Layouts",
        "Responsive Web Design",
        "Website Planning & Design"
      ],
      practicalWork: "Build your own portfolio website",
      duration: "10 hours",
      difficulty: "Intermediate"
    },
    {
      week: 6,
      title: "Programming Fundamentals",
      description: "Learn to code with Python programming",
      topics: [
        "Variables, Data Types & Operators",
        "Control Structures (If/Else, Loops)",
        "Functions & Procedures",
        "Problem Solving Techniques"
      ],
      practicalWork: "Create interactive games and utilities",
      duration: "9 hours",
      difficulty: "Advanced"
    },
    {
      week: 7,
      title: "Networks & Internet",
      description: "Understand how the digital world connects",
      topics: [
        "Network Types & Topologies",
        "Internet Protocols & Services",
        "Network Security Basics",
        "Cloud Computing Concepts"
      ],
      practicalWork: "Network design simulation project",
      duration: "6 hours",
      difficulty: "Intermediate"
    },
    {
      week: 8,
      title: "Digital Media & Communication",
      description: "Master multimedia and digital communication",
      topics: [
        "Image, Audio & Video Editing",
        "Digital Communication Methods",
        "Multimedia Project Planning",
        "Copyright & Ethical Considerations"
      ],
      practicalWork: "Create a multimedia presentation",
      duration: "7 hours",
      difficulty: "Intermediate"
    },
    {
      week: 9,
      title: "Data Security & Ethics",
      description: "Protect yourself and others in the digital world",
      topics: [
        "Cybersecurity Threats & Prevention",
        "Data Protection Laws",
        "Ethical Use of Technology",
        "Digital Footprint Management"
      ],
      practicalWork: "Security audit and improvement plan",
      duration: "5 hours",
      difficulty: "Intermediate"
    },
    {
      week: 10,
      title: "Exam Preparation & Mastery",
      description: "Perfect your exam technique and knowledge",
      topics: [
        "Past Paper Analysis",
        "Exam Strategy & Time Management",
        "Common Mistakes & How to Avoid Them",
        "Final Review & Confidence Building"
      ],
      practicalWork: "Mock exams with detailed feedback",
      duration: "8 hours",
      difficulty: "Advanced"
    }
  ];

  const courseFeatures = [
    {
      icon: <BookOpen className="text-[#CA133E]" size={40} />,
      title: "200+ Interactive Materials",
      description: "Comprehensive notes, videos, and exercises for every topic"
    },
    {
      icon: <Users className="text-[#CA133E]" size={40} />,
      title: "Personal Mentoring",
      description: "One-on-one guidance and support throughout your journey"
    },
    {
      icon: <Target className="text-[#CA133E]" size={40} />,
      title: "Exam-Focused Learning",
      description: "Every lesson designed to maximize your exam performance"
    },
    {
      icon: <Zap className="text-[#CA133E]" size={40} />,
      title: "Hands-On Practice",
      description: "Real projects and practical work in every module"
    }
  ];

  const learningOutcomes = [
    "Design and implement complete database systems",
    "Create professional websites using HTML & CSS",
    "Develop programs using Python programming language",
    "Analyze and present data using advanced spreadsheet techniques",
    "Understand and apply cybersecurity best practices",
    "Plan and execute multimedia projects effectively",
    "Demonstrate expert-level ICT knowledge in exams"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      
      <div className="pt-24 pb-12">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-[#0F0F0F] via-[#4A0D0D] to-[#C70039] text-white py-16">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto text-center"
            >
              <span className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-full text-sm font-bold mb-4 inline-block">
                📚 COMPLETE CURRICULUM
              </span>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Your Roadmap to <span className="text-yellow-300">A* Success</span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 opacity-90">
                A comprehensive 10-week journey from ICT beginner to IGCSE expert. 
                Structured, practical, and proven to deliver results.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white bg-opacity-10 p-6 rounded-xl">
                  <div className="text-3xl font-bold text-yellow-300 mb-2">10 Weeks</div>
                  <div className="text-lg">Structured Learning</div>
                </div>
                <div className="bg-white bg-opacity-10 p-6 rounded-xl">
                  <div className="text-3xl font-bold text-yellow-300 mb-2">68 Hours</div>
                  <div className="text-lg">Total Content</div>
                </div>
                <div className="bg-white bg-opacity-10 p-6 rounded-xl">
                  <div className="text-3xl font-bold text-yellow-300 mb-2">95%</div>
                  <div className="text-lg">Success Rate</div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Course Features */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
                What Makes Our <span className="text-[#CA133E]">Curriculum</span> Special?
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {courseFeatures.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="text-center p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-all"
                  >
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-3">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Curriculum Modules */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-4xl font-bold text-center text-gray-800 mb-4">
                Complete <span className="text-[#CA133E]">Course Breakdown</span>
              </h2>
              <p className="text-xl text-gray-600 text-center mb-12">
                Week-by-week structured learning path designed for IGCSE success
              </p>
              
              <div className="space-y-8">
                {courseModules.map((module, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all"
                  >
                    <div className="p-8">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                        <div className="flex items-center mb-4 lg:mb-0">
                          <div className="w-12 h-12 bg-[#CA133E] text-white rounded-full flex items-center justify-center font-bold text-lg mr-4">
                            {module.week}
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-gray-800">{module.title}</h3>
                            <p className="text-gray-600">{module.description}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            module.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                            module.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {module.difficulty}
                          </span>
                          <div className="flex items-center text-gray-600">
                            <Clock size={16} className="mr-1" />
                            {module.duration}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                          <h4 className="font-semibold text-gray-800 mb-3">Topics Covered:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {module.topics.map((topic, topicIndex) => (
                              <div key={topicIndex} className="flex items-center text-gray-600">
                                <CheckCircle className="text-green-500 mr-2 flex-shrink-0" size={16} />
                                <span className="text-sm">{topic}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-xl">
                          <h4 className="font-semibold text-gray-800 mb-2">Practical Work:</h4>
                          <p className="text-gray-600 text-sm mb-3">{module.practicalWork}</p>
                          <div className="flex items-center text-[#CA133E] text-sm font-semibold">
                            <Star size={16} className="mr-1" />
                            Hands-on Project
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Learning Outcomes */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center mb-12"
              >
                <h2 className="text-4xl font-bold text-gray-800 mb-4">
                  What You'll <span className="text-[#CA133E]">Master</span>
                </h2>
                <p className="text-xl text-gray-600">
                  By the end of this course, you'll have these valuable skills
                </p>
              </motion.div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {learningOutcomes.map((outcome, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="flex items-start p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <Award className="text-[#CA133E] mr-3 mt-1 flex-shrink-0" size={20} />
                    <span className="text-gray-700">{outcome}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 bg-gradient-to-r from-[#CA133E] to-[#A01030]">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-3xl mx-auto text-center text-white"
            >
              <h2 className="text-4xl font-bold mb-6">
                Ready to Start Your <span className="text-yellow-300">A* Journey?</span>
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Join 500+ students who have already transformed their ICT skills with our proven curriculum.
                Your success story starts here!
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="/register" className="bg-white text-[#CA133E] px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all">
                  Enroll Now 🚀
                </a>
                <a href="/samples" className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-[#CA133E] transition-all">
                  Try Free Samples First 📚
                </a>
              </div>
              
      
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Curriculum; 