import React from 'react';
import { motion } from 'framer-motion';

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

  const blockVariants = {
    hidden: { opacity: 0, y: -100 }, // Start above the screen
    visible: { opacity: 0.3, y: 0 }, // Fall to the final position
  };

  return (
    <div className="relative flex items-center justify-center h-screen bg-gradient-to-br from-[#1a1a1a] via-[#2a1a1a] to-[#3a1a1a] text-white overflow-hidden">
      {/* Grid background with falling animation */}
      <div className="absolute inset-0 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3 md:gap-4 opacity-50 mt-[100px]">
        {[
          "Nuria", "Jana", "Abdo.Bassem", "Andrew", "Hussain",
          "Razan", "Mohamed", "Haitham", "Kenzy", "Ahmad Qayem",
          "Abdo.Drogham", "Malak", "Shaikha", "Boda", "Nouran",
          "Mohannad", "Hatem", "Fahmy", "Jana", "Dina",
          "Malak", "Joud", "Karam", "Omar Tarek", "Omar Badawy",
          "Shahd", "Abdelrahman", "Ali", "Basel", "Joury", "Yassin",
          "Muntaha", "Jad", "Ahmad", "Nuria", "Jana", "Abdo.Bassem", 
          "Andrew", "Hussain","Tala","Nataly","Shady"
        ].map((name, i) => (
          <motion.div
            key={i}
            className="bg-[#CA133E] font-bold rounded-xl w-full h-full opacity-30 flex items-center justify-center text-white text-sm cursor-pointer hover:opacity-100 hover:shadow-glow transition-all duration-300 md:text-[16pt]"
            variants={blockVariants}
            initial="hidden"
            animate="visible"
            transition={{
              duration: 0.2, // Animation duration
              delay: i * 0.04, // Staggered delay based on index
              ease: "easeOut", // Smooth easing
            }}
            whileHover={{
              opacity: 1, // Full opacity on hover
              scale: 1.08, // Slightly scale up on hover
              transition: { duration: 0.2 }, // Smooth transition
            }}
          >
            {name}
          </motion.div>
        ))}
      </div>

      {/* Content */}
      <motion.div
        className="relative text-center px-4 sm:px-6"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {/* Heading */}
        <motion.h1
          className="text-[28pt] sm:text-[36pt] md:text-[40pt] font-bold"
          variants={itemVariants}
        >
          Welcome to <span className="text-[#CA133E]">AT-ICT</span> 
        </motion.h1>

        {/* Subheading */}
        <motion.p
          className="text-[14pt] sm:text-[18pt] md:text-[24pt] text-gray-300 mt-4"
          variants={itemVariants}
        >
          Empowering students with Enjoyable Education 
        </motion.p>

        {/* Buttons */}
        <motion.div
          className="mt-6 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4"
          variants={itemVariants}
        >
          <a href="/register">
            <button className="bg-[#CA133E] text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl text-sm sm:text-lg font-semibold hover:bg-[#A01030] transition-all">
              Register Now !
            </button>
          </a>

          <a href="/contact-us">
            <button className="bg-transparent border border-white text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl text-sm sm:text-lg font-semibold hover:bg-white hover:text-black transition-all">
              Free Sample Materials
            </button>
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Hero;