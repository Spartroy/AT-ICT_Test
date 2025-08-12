import React from 'react';
import { BookOpen, FileCheck, Video } from 'lucide-react';
import { motion } from 'framer-motion';

const WhyChooseATICT = () => {
  // Animation variants for the cards
  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  // Animation for the section heading
  const headingVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
  };

  // bg-gradient-to-br from-[#3a1a1a] via-[#2a1a1a] to-[#1a1a1a]
  return (
    <section className="py-12 sm:py-16 bg-[#1a1a1a]">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Section Heading */}
        <motion.h2
          className="text-[28pt] sm:text-[32pt] md:text-[36pt] lg:text-[40pt] font-bold text-center mb-8 md:mb-16 text-white"
          variants={headingVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <span className="text-[#CA133E]">AT-ICT </span>Why Choose Us?
        </motion.h2>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-4">
          {/* Card 1 */}
          <motion.div
            className="bg-white p-4 sm:p-6 rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105"
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
              {/* Notebook icon for notes */}
              <svg xmlns="http://www.w3.org/2000/svg" className="text-[#CA133E]" width={24} height={24} fill="none" viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2" stroke="#CA133E" strokeWidth="2"/><path d="M8 3v18" stroke="#CA133E" strokeWidth="2"/></svg>
            </div>
            <h3 className="text-[16pt] sm:text-[18pt] lg:text-[20pt] font-semibold mb-2">Interactive Notes</h3>
            <p className="text-gray-600 text-[12pt] sm:text-[14pt] lg:text-[16pt]">
              Access <span className="text-[#CA133E] font-bold">comprehensive</span> and <span className="text-[#CA133E] font-bold">Interactive</span><br />
              learning materials designed to enhance your understanding and Memorization.
            </p>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            className="bg-white p-4 sm:p-6 rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105"
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
              {/* Calendar icon for plan */}
              <svg xmlns="http://www.w3.org/2000/svg" className="text-[#CA133E]" width={24} height={24} fill="none" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2" stroke="#CA133E" strokeWidth="2"/><path d="M16 3v4M8 3v4M3 9h18" stroke="#CA133E" strokeWidth="2"/></svg>
            </div>
            <h3 className="text-[16pt] sm:text-[18pt] lg:text-[20pt] font-semibold mb-2">Compact Plan</h3>
            <p className="text-gray-600 text-[12pt] sm:text-[14pt] lg:text-[16pt]">
              Follow a structured learning path that plots every step from <span className='text-[#CA133E] font-bold'>Day one</span> till the <span className='text-[#CA133E] font-bold'>Exam day</span>.
            </p>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            className="bg-white p-4 sm:p-6 rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105"
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
              <Video className="text-[#CA133E]" size={24} />
            </div>
            <h3 className="text-[16pt] sm:text-[18pt] lg:text-[20pt] font-semibold mb-2">Recorded Sessions</h3>
            <p className="text-gray-600 text-[12pt] sm:text-[14pt] lg:text-[16pt]">
              Whenever you're <strong>stuck</strong>,  <span  className="text-[#CA133E] font-bold">We've got you !</span> With our <span className='text-[16pt] sm:text-[18pt] lg:text-[20pt] font-bold'>Huge</span> library of past recorded videos, Solving Practical & Explaing Theory.
            </p>
          </motion.div>

          {/* Card 4 */}
          <motion.div
            className="bg-white p-4 sm:p-6 rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105"
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
              {/* Lifebuoy icon for assistance */}
              <svg xmlns="http://www.w3.org/2000/svg" className="text-[#CA133E]" width={24} height={24} fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#CA133E" strokeWidth="2"/><circle cx="12" cy="12" r="4" stroke="#CA133E" strokeWidth="2"/><path d="M4.93 4.93l4.24 4.24M19.07 4.93l-4.24 4.24M19.07 19.07l-4.24-4.24M4.93 19.07l4.24-4.24" stroke="#CA133E" strokeWidth="2"/></svg>
            </div>
            <h3 className="text-[16pt] sm:text-[18pt] lg:text-[20pt] font-semibold mb-2">Continous Assistance</h3>
            <p className="text-gray-600 text-[12pt] sm:text-[14pt] lg:text-[16pt]">
              You've got <span className="text-[#CA133E] font-bold">full support</span> along your learning journey. Whenever you're facing <span className='text-[#CA133E] font-bold'>Tough topics</span> or feeling <span className='text-[#CA133E] font-bold'>Exam stress</span>. <br />We'll be there for you.
            </p>
          </motion.div>

          {/* Card 5 */}
          <motion.div
            className="bg-white p-4 sm:p-6 rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105"
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
              {/* Puzzle icon for practical activities */}
              <svg xmlns="http://www.w3.org/2000/svg" className="text-[#CA133E]" width={24} height={24} fill="none" viewBox="0 0 24 24"><path d="M6 9V7a2 2 0 0 1 2-2h2M18 15v2a2 2 0 0 1-2 2h-2M15 6a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM9 18a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM3 15v-2a2 2 0 0 1 2-2h2M21 9v2a2 2 0 0 1-2 2h-2" stroke="#CA133E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h3 className="text-[16pt] sm:text-[18pt] lg:text-[20pt] font-semibold mb-2">Practical Activities</h3>
            <p className="text-gray-600 text-[12pt] sm:text-[14pt] lg:text-[16pt]">
              Hands on <span className='text-gray-600 font-bold'>projects, simulations, & engaging activities</span> that transforms <span className='text-[#CA133E] font-bold'>Boring theory</span> into <span className='text-[#CA133E] font-bold'>Enjoiable knowledge</span>.
            </p>
          </motion.div>

          {/* Card 6 */}
          <motion.div
            className="bg-white p-4 sm:p-6 rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105"
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
              {/* Bar chart icon for progress tracking */}
              <svg xmlns="http://www.w3.org/2000/svg" className="text-[#CA133E]" width={24} height={24} fill="none" viewBox="0 0 24 24"><rect x="3" y="12" width="4" height="8" rx="1" stroke="#CA133E" strokeWidth="2"/><rect x="9" y="8" width="4" height="12" rx="1" stroke="#CA133E" strokeWidth="2"/><rect x="15" y="4" width="4" height="16" rx="1" stroke="#CA133E" strokeWidth="2"/></svg>
            </div>
            <h3 className="text-[16pt] sm:text-[18pt] lg:text-[20pt] font-semibold mb-2">Progress Tracking</h3>
            <p className="text-gray-600 text-[12pt] sm:text-[14pt] lg:text-[16pt]">
              We monitor your progress with regular 
              <ul className='list-disc pl-5'>
                <li>
                  <span className='text-[#CA133E] font-bold'>Assessments</span>
                </li>
                <li>
                  <span className='text-[#CA133E] font-bold'>Quizzes</span>
                </li>
                <li>
                  <span className='text-[#CA133E] font-bold'>Performance reports</span>
                </li>
              </ul>
              to help you stay on track.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseATICT;