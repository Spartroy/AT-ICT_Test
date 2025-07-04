import React from 'react';
import { motion } from 'framer-motion';
import videoThumbnail from '../assets/video-thumbnail.png';

const Hero = () => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.3 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3a1a1a] via-[#2a1a1a] to-[#1a1a1a] text-white flex items-center pt-32 pb-10">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Content */}
          <motion.div
            className="space-y-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {/* Top Badge */}
            <motion.div
              className="inline-block bg-[#CA133E] text-white px-6 py-6 rounded-full text-[14pt] font-semibold mt-6 mb-[-80px]"
              variants={itemVariants}
            >
              92% Average Across Students. Grade 9? Our Standard!
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              className="text-[42pt] lg:text-[52pt] font-bold leading-tight"
              variants={itemVariants}
            >
              Struggling with{' '}
              <br className="hidden lg:block" />
              <span className="text-white">IGCSE?</span> Let's{' '}
              <br className="hidden lg:block" />
              fix that — <span className="text-[#CA133E]">fast.</span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              className="text-gray-300 text-[16pt] max-w-lg leading-relaxed"
              variants={itemVariants}
            >
              The only ICT tutoring course built on interactive sessions. No boring sessions. No memorizing.
            </motion.p>

            {/* Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              variants={itemVariants}
            >
              <button className="bg-[#CA133E] text-white px-8 py-4 rounded-xl text-[16pt] font-semibold hover:bg-[#A01030] transition-all">
                Watch a Free Lesson
              </button>
              
              <button className="border-2 border-gray-500 text-white px-8 py-4 rounded-xl text-[16pt] font-semibold hover:bg-gray-500 hover:text-white transition-all">
                Start Learning
              </button>
            </motion.div>

            {/* Features */}
            <motion.div
              className="flex flex-wrap gap-6"
              variants={itemVariants}
            >
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-300 text-[14pt]">Scoring A+</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-300 text-[14pt]">No Coding Required</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-300 text-[14pt]">24/7 Support</span>
              </div>
            </motion.div>

            {/* Rating */}
            <motion.div
              className="flex items-center space-x-3"
              variants={itemVariants}
            >
              <div className="flex space-x-1 ">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-6 h-6 text-[#CA133E]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-[#CA133E] text-[14pt] font-semibold">100+</span>
              <span className="text-gray-300 text-[14pt]">Satisfied Students</span>
        
          
            </motion.div>
          </motion.div>

          {/* Right Content - Video Section */}
          <motion.div
            className="relative"
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="relative bg-gray-800 rounded-xl overflow-hidden border-4 h-[600px] w-[750px] border-[#CA133E]">
              {/* Video content */}
              <div className="h-full bg-gray-800 flex items-center justify-center relative">
                
                {/* Thumbnail placeholder */}
                <div className="absolute inset-0">
                  <img 
                    src={videoThumbnail}
                    alt="Video Thumbnail"
                    className="w-full h-full object-cover blur-sm"
                  />
                </div>
                
                {/* Play button */}
                <div className="relative z-10 w-[92px] h-[92px] bg-[#333333] rounded-full cursor-pointer hover:scale-110 transition-all transform flex items-center justify-center">
                  <svg className="w-[40.41px] h-[40.41px] text-[#CD143F] ml-1" fill="currentColor" viewBox="0 0 20 20" style={{filter: 'drop-shadow(inset 3px 4px 6.1px rgba(0, 0, 0, 0.13))'}}>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default Hero;