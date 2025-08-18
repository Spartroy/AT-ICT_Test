import React from 'react';
import { motion } from 'framer-motion';
import Nav from '../../components/Nav';

const HallOfFame = () => {
  const students = [
    { name: "Nuria Amr", year: "2024" },
    { name: "Jana Ahmad", year: "2024" },
    { name: "Abdelrahman Bassem", year: "2024" },
    { name: "Andrew", year: "2024" },
    { name: "Hussain", year: "2024" },
    { name: "Razan Mohamed", year: "2024" },
    { name: "Mohamed Tamer", year: "2023" },
    { name: "Haitham", year: "2023" },
    { name: "Kenzy", year: "2024" },
    { name: "Ahmad Qayem", year: "2024" },
    { name: "Abdelrahman Drogham", year: "2023" },
    { name: "Malak", year: "2024" },
    { name: "Shaikha", year: "2024" },
    { name: "Abdelrahman (Boda)", year: "2023" },
    { name: "Nouran Mohamed", year: "2024" },
    { name: "Mohannad", year: "2023" },
    { name: "Ahmad Hatem", year: "2024" },
    { name: "Fahmy", year: "2024" },
    { name: "Dina", year: "2023" },
    { name: "Joud El Daher", year: "2024" },
    { name: "Karam Al Jararah", year: "2024" },
    { name: "Omar Tarek", year: "2024" },
    { name: "Omar Badawy", year: "2023" },
    { name: "Shahd", year: "2024" },
    { name: "Abdelrahman", year: "2024" },
    { name: "Ali Jamal", year: "2023" },
    { name: "Basel El Dawakhly", year: "2024" },
    { name: "Joury", year: "2024" },
    { name: "Yassin", year: "2023" },
    { name: "Muntaha", year: "2024" },
    { name: "Jad", year: "2024" },
    { name: "Ahmad", year: "2023" },
    { name: "Tala", year: "2024" },
    { name: "Natalie", year: "2024" },
    { name: "Shady El Trawneh", year: "2024" },
    { name: "Omar Amer", year: "2024" },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <Nav />
      
      {/* Hero Section */}
      <div className="pt-32 pb-16 px-6 lg:px-12">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-16"
          >
           
            
            <h1 className="text-[48pt] lg:text-[64pt] font-bold mb-6">
              Hall of <span className="text-[#CA133E]">Fame</span>
            </h1>
            
            <p className="text-[20pt] text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Celebrating the exceptional achievements of our students who have excelled in IGCSE ICT with AT-ICT's proven teaching methodology.
            </p>
          </motion.div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 justify-center max-w-2xl mx-auto"
          >
            <div className="bg-gradient-to-br from-[#CA133E] to-[#A01030] rounded-xl p-8 text-center">
              <div className="text-[36pt] font-bold mb-2">92%</div>
              <div className="text-[16pt] text-gray-100">Average Grade</div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl p-8 text-center">
              <div className="text-[36pt] font-bold mb-2">100+</div>
              <div className="text-[16pt] text-gray-100">Successful Students</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Students Grid */}
      <div className="px-6 lg:px-12 pb-16">
        <div className="container mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {students.map((student, index) => (
              <motion.div
                key={index}
                variants={cardVariants}
                whileHover={{ 
                  scale: 1.05, 
                  boxShadow: "0 20px 40px rgba(202, 19, 62, 0.3)",
                  transition: { duration: 0.2 }
                }}
                className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 hover:border-[#CA133E] transition-all duration-300 cursor-pointer group"
              >
                {/* Profile Picture Placeholder */}
                <div className="w-16 h-16 bg-gradient-to-br from-[#CA133E] to-[#A01030] rounded-full flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <span className="text-[18pt] font-bold text-white">
                    {student.name.charAt(0)}
                  </span>
                </div>

                {/* Student Info */}
                <div className="text-center">
                  <h3 className="text-[18pt] font-bold text-white mb-2 group-hover:text-[#CA133E] transition-colors">
                    {student.name}
                  </h3>
                  
                  <div className="space-y-2">
                   
                    
                   
                    
                    {/* <div className="text-[12pt] text-gray-500">
                      Class of {student.year}
                    </div> */}
                  </div>
                </div>

                {/* Achievement Badge */}
                <div className="mt-4 flex justify-center">
                  <div className="bg-[#CA133E] bg-opacity-20 border border-[#CA133E] rounded-xl px-3 py-1 text-[#CA133E] text-[10pt] font-semibold">
                    🎖️ IGCSE Success
                  </div>
                </div>
              </motion.div>
            ))}

            {/* CTA Card - You're Next */}
            <motion.a
              href="/register"
              variants={cardVariants}
              whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(202, 19, 62, 0.35)" }}
              className="rounded-xl p-6 border-2 border-dashed border-[#CA133E]/60 bg-gray-900/60 hover:bg-gray-900 transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer"
            >
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#CA133E] to-[#A01030] flex items-center justify-center mb-4 animate-pulse">
                <span className="text-white text-[24pt] font-bold">?</span>
              </div>
              <h3 className="text-[18pt] font-bold mb-2">You're next</h3>
              <p className="text-[12pt] text-gray-400 mb-4">Your name belongs here. Start today.</p>
              <span className="inline-block px-5 py-2 rounded-xl bg-white text-[#CA133E] font-bold">Claim your spot now !</span>
            </motion.a>
          </motion.div>
        </div>
      </div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="bg-gradient-to-r from-[#CA133E] to-[#A01030] py-16 px-6 lg:px-12"
      >
        <div className="container mx-auto text-center">
          <h2 className="text-[36pt] lg:text-[42pt] font-bold mb-6">
            Ready to Join Our Hall of Fame?
          </h2>
          
          <p className="text-[18pt] mb-8 max-w-2xl mx-auto">
            Start your journey with AT-ICT today and become our next success story
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            
            <a href="/register">
              <button className="bg-white text-[#CA133E] px-8 py-4 rounded-xl text-[16pt] font-semibold hover:bg-gray-100 transition-all">
                Start Learning Today
              </button>
            </a>
            
            <a href="/samples">
              <button className="border-2 border-white text-white px-8 py-4 rounded-xl text-[16pt] font-semibold hover:bg-white hover:text-[#CA133E] transition-all">
                View Free Samples
              </button>
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default HallOfFame; 