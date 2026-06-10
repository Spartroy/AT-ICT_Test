import React from 'react';
import { motion } from 'framer-motion';

const items = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} fill="none" viewBox="0 0 24 24">
        <rect x="4" y="3" width="16" height="18" rx="2" stroke="#CA133E" strokeWidth="2"/>
        <path d="M8 3v18" stroke="#CA133E" strokeWidth="2"/>
      </svg>
    ),
    title: 'Interactive Notes',
    desc: 'Comprehensive, interactive learning materials designed to enhance understanding and memorization.',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} fill="none" viewBox="0 0 24 24">
        <rect x="3" y="5" width="18" height="16" rx="2" stroke="#CA133E" strokeWidth="2"/>
        <path d="M16 3v4M8 3v4M3 9h18" stroke="#CA133E" strokeWidth="2"/>
      </svg>
    ),
    title: 'Compact Plan',
    desc: 'A structured path that plots every step from Day one till the Exam day.',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} fill="none" viewBox="0 0 24 24">
        <rect x="2" y="4" width="20" height="14" rx="2" stroke="#CA133E" strokeWidth="2"/>
        <path d="M10 9l5 3-5 3V9z" fill="#CA133E"/>
      </svg>
    ),
    title: 'Recorded Sessions',
    desc: "Stuck? We've got you — a huge library of past videos solving practical and explaining theory.",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" stroke="#CA133E" strokeWidth="2"/>
        <circle cx="12" cy="12" r="4" stroke="#CA133E" strokeWidth="2"/>
        <path d="M4.93 4.93l4.24 4.24M19.07 4.93l-4.24 4.24M19.07 19.07l-4.24-4.24M4.93 19.07l4.24-4.24" stroke="#CA133E" strokeWidth="2"/>
      </svg>
    ),
    title: 'Continuous Assistance',
    desc: "Full support along the journey — tough topics or exam stress, we'll be there for you.",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} fill="none" viewBox="0 0 24 24">
        <path d="M6 9V7a2 2 0 0 1 2-2h2M18 15v2a2 2 0 0 1-2 2h-2M15 6a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM9 18a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM3 15v-2a2 2 0 0 1 2-2h2M21 9v2a2 2 0 0 1-2 2h-2" stroke="#CA133E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Practical Activities',
    desc: 'Hands-on projects & simulations that turn boring theory into enjoyable knowledge.',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} fill="none" viewBox="0 0 24 24">
        <rect x="3" y="12" width="4" height="8" rx="1" stroke="#CA133E" strokeWidth="2"/>
        <rect x="9" y="8" width="4" height="12" rx="1" stroke="#CA133E" strokeWidth="2"/>
        <rect x="15" y="4" width="4" height="16" rx="1" stroke="#CA133E" strokeWidth="2"/>
      </svg>
    ),
    title: 'Progress Tracking',
    desc: 'Regular assessments, quizzes & performance reports keep you on track.',
  },
];

const WhyChooseATICT = () => {
  return (
    <section className="py-16 sm:py-20 bg-[#1a1a1a]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-12">
        <motion.h2
          className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-center mb-12 md:mb-16 text-white"
          style={{ letterSpacing: '-0.02em' }}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-[#CA133E]">AT-ICT </span>Why Choose Us?
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map(({ icon, title, desc }, i) => (
            <motion.div
              key={title}
              className="bg-white p-5 sm:p-6 rounded-xl border border-[#E7E7E9] hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
            >
              <div className="w-11 h-11 bg-[#FDE8EC] rounded-xl flex items-center justify-center mb-4">
                {icon}
              </div>
              <h3 className="font-display font-bold text-xl text-[#1A1A1A] mb-2">{title}</h3>
              <p className="text-[#44444B] text-sm sm:text-base leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseATICT;
