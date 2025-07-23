import React from 'react';
import { motion } from 'framer-motion';
import Nav from '../../components/Nav';

const HallOfFame = () => {
  const students = [
    { name: "Nuria", grade: "A*", subject: "IGCSE ICT", year: "2024" },
    { name: "Jana", grade: "A*", subject: "IGCSE ICT", year: "2024" },
    { name: "Abdo Bassem", grade: "A*", subject: "IGCSE ICT", year: "2024" },
    { name: "Andrew", grade: "A", subject: "IGCSE ICT", year: "2024" },
    { name: "Hussain", grade: "A*", subject: "IGCSE ICT", year: "2024" },
    { name: "Razan", grade: "A", subject: "IGCSE ICT", year: "2024" },
    { name: "Mohamed", grade: "A*", subject: "IGCSE ICT", year: "2023" },
    { name: "Haitham", grade: "A", subject: "IGCSE ICT", year: "2023" },
    { name: "Kenzy", grade: "A*", subject: "IGCSE ICT", year: "2024" },
    { name: "Ahmad Qayem", grade: "A", subject: "IGCSE ICT", year: "2024" },
    { name: "Abdo Drogham", grade: "A*", subject: "IGCSE ICT", year: "2023" },
    { name: "Malak", grade: "A", subject: "IGCSE ICT", year: "2024" },
    { name: "Shaikha", grade: "A*", subject: "IGCSE ICT", year: "2024" },
    { name: "Boda", grade: "A", subject: "IGCSE ICT", year: "2023" },
    { name: "Nouran", grade: "A*", subject: "IGCSE ICT", year: "2024" },
    { name: "Mohannad", grade: "A", subject: "IGCSE ICT", year: "2023" },
    { name: "Hatem", grade: "A*", subject: "IGCSE ICT", year: "2024" },
    { name: "Fahmy", grade: "A", subject: "IGCSE ICT", year: "2024" },
    { name: "Dina", grade: "A*", subject: "IGCSE ICT", year: "2023" },
    { name: "Joud", grade: "A", subject: "IGCSE ICT", year: "2024" },
    { name: "Karam", grade: "A*", subject: "IGCSE ICT", year: "2024" },
    { name: "Omar Tarek", grade: "A", subject: "IGCSE ICT", year: "2024" },
    { name: "Omar Badawy", grade: "A*", subject: "IGCSE ICT", year: "2023" },
    { name: "Shahd", grade: "A", subject: "IGCSE ICT", year: "2024" },
    { name: "Abdelrahman", grade: "A*", subject: "IGCSE ICT", year: "2024" },
    { name: "Ali", grade: "A", subject: "IGCSE ICT", year: "2023" },
    { name: "Basel", grade: "A*", subject: "IGCSE ICT", year: "2024" },
    { name: "Joury", grade: "A", subject: "IGCSE ICT", year: "2024" },
    { name: "Yassin", grade: "A*", subject: "IGCSE ICT", year: "2023" },
    { name: "Muntaha", grade: "A", subject: "IGCSE ICT", year: "2024" },
    { name: "Jad", grade: "A*", subject: "IGCSE ICT", year: "2024" },
    { name: "Ahmad", grade: "A", subject: "IGCSE ICT", year: "2023" },
    { name: "Tala", grade: "A*", subject: "IGCSE ICT", year: "2024" },
    { name: "Natalie", grade: "A", subject: "IGCSE ICT", year: "2024" },
    { name: "Shady", grade: "A*", subject: "IGCSE ICT", year: "2024" },
    { name: "Ahmad Farag", grade: "A*", subject: "IGCSE ICT", year: "2024" },
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
                    <div className={`inline-block px-3 py-1 rounded-full text-[12pt] font-semibold ${
                      student.grade === 'A*' 
                        ? 'bg-yellow-500 text-black' 
                        : 'bg-green-500 text-white'
                    }`}>
                      Grade {student.grade}
                    </div>
                    
                    <div className="text-[14pt] text-gray-400">
                      {student.subject}
                    </div>
                    
                    <div className="text-[12pt] text-gray-500">
                      Class of {student.year}
                    </div>
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
            <button className="bg-white text-[#CA133E] px-8 py-4 rounded-xl text-[16pt] font-semibold hover:bg-gray-100 transition-all">
              Start Learning Today
            </button>
            
            <button className="border-2 border-white text-white px-8 py-4 rounded-xl text-[16pt] font-semibold hover:bg-white hover:text-[#CA133E] transition-all">
              View Free Samples
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default HallOfFame; 