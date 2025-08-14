import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Nav from '../../components/Nav';
import { Download, FileText, Play, Eye, BookOpen, Star, CheckCircle, ArrowRight, Gift, Zap } from 'lucide-react';

const Samples = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [email, setEmail] = useState('');

  const categories = [
    { id: 'all', name: 'All Samples', icon: BookOpen },
    { id: 'notes', name: 'Interactive Notes', icon: FileText },
    { id: 'videos', name: 'Video Lessons', icon: Play },
    { id: 'exercises', name: 'Practice Exercises', icon: CheckCircle }
  ];

  const sampleMaterials = [
    {
      id: 1,
      title: "Networks",
      category: 'notes',
      type: 'Interactive Notes',
      description: "Learn the basics of networks with our interactive notes.",
      features: ['Interactive diagrams', 'Quick revision notes'],
      preview: true
    },
    {
      id: 2,
      title: "CH(1) - Computer structure",
      category: 'videos',
      type: 'Video Explanation',
      description: "Explanation of the building blocks of the ICT You will learn about the 3 main concepts (Input, Processing, Output).",
     
      features: ['HD video quality', 'Practice files included'],
      preview: true
    },
    {
      id: 3,
      title: "Storage Devices",
      category: 'notes',
      type: 'Interactive Notes',
      description: "Learn the basics of storage devices with our interactive notes.",
      features: ['Interactive diagrams', 'Quick revision notes'],
      preview: true
    },
    {
      id: 4,
      title: "Paper 2 - Exam Revision",
      category: 'exercises',
      type: 'Final Revision',
      description: "This is a final revision for the Paper 2 of the IGCSE ICT exam. It includes all the topics that are covered in the course.",
      features: ['Real exam format', 'Detailed solutions'],
      preview: true
    },
    {
      id: 5,
      title: "CH(5) - Database",
      category: 'videos',
      type: 'Video Explanation',
      description: "Watch the video explanation of theoretical concepts of the database then dive into the practical implementation.",
     
      features: ['HD video quality', 'Practice files included'],
      preview: true
    },

  ];

  const filteredMaterials = selectedCategory === 'all' 
    ? sampleMaterials 
    : sampleMaterials.filter(material => material.category === selectedCategory);

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setEmailSubmitted(true);
      console.log('Email submitted:', email);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      
      <div className="pt-24 pb-12">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#1a1a1a] via-[#2a1a1a] to-[#3a1a1a] text-white py-[150px] mt-[-100px]">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto text-center"
            >
     
              <h1 className="text-[20pt] sm:text-[22pt] md:text-[25pt] font-bold mb-6 leading-tight">
                Experience AT-ICT Quality 
                <br />Before You Enroll
              </h1>
     
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="#samples" className="bg-white text-[#CA133E] px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:bg-gray-100 transition-all">
                  Browse Free Samples
                </a>
                <a href="/register" className="bg-transparent border-2 border-white text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:bg-white hover:text-[#CA133E] transition-all">
                  Start Full Course
                </a>
              </div>
            </motion.div>
          </div>
        </section>
        {/* Sample Materials */}
        <section id="samples" className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-[20pt] sm:text-[22pt] md:text-[25pt] font-bold text-center text-gray-800 mt-[40px] leading-tight">
                <span className="text-[#CA133E]">Free</span> Sample Materials
              </h2>
              <p className="text-[13pt] sm:text-[14pt] md:text-[15pt] text-gray-600 text-center mb-12 px-4">
                Experience our teaching quality with these free samples
              </p>
              
              {/* Category Filter - Improved Responsiveness */}
              <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-8 px-4">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-medium transition-all text-sm sm:text-base whitespace-nowrap ${
                      selectedCategory === category.id
                        ? 'bg-[#CA133E] text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <category.icon size={16} className="mr-1 sm:mr-2 flex-shrink-0" />
                    <span className="hidden sm:inline">{category.name}</span>
                    <span className="sm:hidden">
                      {category.id === 'all' ? 'All' : 
                       category.id === 'notes' ? 'Notes' :
                       category.id === 'videos' ? 'Videos' :
                       category.id === 'exercises' ? 'Exercises' : category.name}
                    </span>
                  </button>
                ))}
              </div>

              {/* Materials Grid - Improved Responsiveness */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-4">
                <AnimatePresence mode="wait">
                  {filteredMaterials.map((material, index) => (
                    <motion.div
                      key={material.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden"
                    >
                      {/* Material Header */}
                      <div className="bg-gradient-to-r from-[#CA133E] to-[#A01030] p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white/20 rounded-xl">
                              {material.category === 'notes' && <FileText className="h-5 w-5 text-white" />}
                              {material.category === 'videos' && <Play className="h-5 w-5 text-white" />}
                              {material.category === 'exercises' && <CheckCircle className="h-5 w-5 text-white" />}
                            </div>
                            <div>
                              <h3 className="text-white font-semibold text-sm sm:text-base lg:text-lg leading-tight">
                                {material.title}
                              </h3>
                              <p className="text-white/80 text-xs sm:text-sm">{material.type}</p>
                            </div>
                          </div>
                          {material.preview && (
                            <div className="bg-white/20 px-2 py-1 rounded-full">
                              <span className="text-white text-xs font-medium">Free</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Material Content */}
                      <div className="p-4 sm:p-6">
                        <p className="text-gray-600 mb-4 text-sm sm:text-base leading-relaxed">
                          {material.description}
                        </p>
                        
                        <div className="space-y-1 sm:space-y-2 mb-4">
                          {material.features.slice(0, 3).map((feature, idx) => (
                            <div key={idx} className="flex items-center text-xs sm:text-sm text-gray-600">
                              <CheckCircle className="text-green-500 mr-2 flex-shrink-0" size={12} />
                              <span className="break-words">{feature}</span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex gap-2">
                          <button className="flex-1 bg-[#CA133E] text-white py-2 px-3 rounded-[15px] font-medium hover:bg-[#A01030] transition-colors text-sm sm:text-base">
                            <a href="/register" className="block w-full h-full flex items-center justify-center">
                              Access Now
                            </a>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 bg-gradient-to-r from-[#CA133E] to-[#A01030]">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl mx-auto text-center text-white"
            >
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                Ready for the Full Course?
              </h2>
     
           
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="/register" className="bg-white text-[#CA133E] px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors text-base sm:text-lg">
                  Enroll Now 
                </a>
            
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Samples; 