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
        <section className="bg-gradient-to-r from-[#CA133E] to-[#A01030] text-white py-16">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto text-center"
            >
     
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Experience <span className="text-yellow-300">AT-ICT Quality</span>
                <br />Before You Enroll!
              </h1>
     
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="#samples" className="bg-white text-[#CA133E] px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all">
                  Browse Free Samples
                </a>
                <a href="/register" className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-[#CA133E] transition-all">
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
              <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">
                <span className="text-[#CA133E]">Free</span> Sample Materials
              </h2>
              <p className="text-lg text-gray-600 text-center mb-12">
                Experience our teaching quality with these free samples
              </p>
              
              {/* Category Filter */}
              <div className="flex justify-center gap-4 mb-8">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center px-4 py-2 rounded-xl font-medium transition-all ${
                      selectedCategory === category.id
                        ? 'bg-[#CA133E] text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <category.icon size={18} className="mr-2" />
                    {category.name}
                  </button>
                ))}
              </div>

              {/* Materials Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {filteredMaterials.map((material, index) => (
                    <motion.div
                      key={material.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      {/* Material Header */}
                      <div className="p-4 bg-gray-50">
                       
                        <h3 className="text-lg font-bold text-gray-800 mb-2 text-center">
                          {material.title}
                        </h3>
                        <div className="text-center">
                          <span className="bg-[#CA133E] text-white px-2 py-1 rounded-[10px] text-xs font-medium">
                            {material.type}
                          </span>
                        </div>
                      </div>

                      {/* Material Content */}
                      <div className="p-4">
                        <p className="text-gray-600 mb-4 text-sm">
                          {material.description}
                        </p>
                        
                        <div className="space-y-1 mb-4">
                          {material.features.slice(0, 3).map((feature, idx) => (
                            <div key={idx} className="flex items-center text-xs text-gray-600">
                              <CheckCircle className="text-green-500 mr-2" size={12} />
                              {feature}
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex gap-2">
                          <button className="flex-1 bg-[#CA133E] text-white py-2 px-3 rounded-[15px] font-medium hover:bg-[#A01030] transition-colors text-sm">
                            Access Now 🚀
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
              <h2 className="text-3xl font-bold mb-4">
                Ready for the Full Course?
              </h2>
     
           
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="/register" className="bg-white text-[#CA133E] px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors">
                  Enroll Now 
                </a>
                <a href="/fees" className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-xl font-bold hover:bg-white hover:text-[#CA133E] transition-all">
                  View Pricing
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