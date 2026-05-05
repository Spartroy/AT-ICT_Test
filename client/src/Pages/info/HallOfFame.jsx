import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Nav from '../../components/Nav';
import Footer from '../../components/Footer';
import Seo from '../../components/Seo';
import { API_ENDPOINTS } from '../../config/api';

const HallOfFame = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHallOfFame = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.LEADERBOARD.HALL_OF_FAME);
        const data = await response.json();

        if (response.ok && data?.status === 'success') {
          setStudents(data.data?.hallOfFame || []);
        }
      } catch (error) {
        console.error('Failed to load Hall of Fame:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHallOfFame();
  }, []);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: 'easeOut' }
  }
};

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white flex flex-col">
      <Seo
        title="Hall of Fame"
        description="Celebrating AT-ICT's top performers — live IGCSE ICT leaderboard plus alumni who reached A* with us."
        path="/hall-of-fame"
      />
      <Nav />

      <div className="pt-32 pb-16 px-6 lg:px-12">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-12"
          >
            <h1 className="text-[42pt] lg:text-[56pt] font-bold mb-6 leading-tight">
              Hall of <span className="text-[#CA133E]">Fame</span>
            </h1>
            <p className="text-[20pt] text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Celebrating the exceptional achievements of our students who have excelled in IGCSE ICT with AT-ICT's proven teaching methodology.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 justify-center max-w-2xl mx-auto"
          >
            <div className="bg-gradient-to-br from-[#CA133E] to-[#A01030] rounded-xl p-8 text-center">
              <div className="text-[36pt] font-bold mb-2">92%</div>
              <div className="text-[16pt] text-gray-100">Average Grade</div>
            </div>
            <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl p-8 text-center">
              <div className="text-[36pt] font-bold mb-2">400+</div>
              <div className="text-[16pt] text-gray-100">Successful Students</div>
            </div>
          </motion.div>
        </div>
        <div className="container mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {!loading && students.map((student, index) => (
              <motion.div
                key={student._id || `${student.name}-${index}`}
                variants={cardVariants}
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 20px 40px rgba(202, 19, 62, 0.3)",
                  transition: { duration: 0.2 }
                }}
                className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 hover:border-[#CA133E] transition-all duration-300 cursor-pointer group"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-[#CA133E] to-[#A01030] rounded-full flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <span className="text-[18pt] font-bold text-white">
                    {student.name.charAt(0)}
                  </span>
                </div>
                <div className="text-center">
                  <h3 className="text-[18pt] font-bold text-white mb-2 group-hover:text-[#CA133E] transition-colors">
                    {student.name}
                  </h3>
                  <div className="space-y-2">
                    <p className="text-[11pt] text-gray-400">Class of {student.year || 'N/A'}</p>
                  </div>
                </div>
                <div className="mt-4 flex justify-center">
                  <div className="bg-[#CA133E] bg-opacity-20 border border-[#CA133E] rounded-xl px-3 py-1 text-[#CA133E] text-[10pt] font-semibold">
                    🎖️ IGCSE Success
                  </div>
                </div>
              </motion.div>
            ))}
            {!loading && students.length === 0 && (
              <motion.div variants={cardVariants} className="col-span-full">
                <div className="rounded-xl border border-dashed border-gray-600 bg-gray-900/60 p-10 text-center">
                  <p className="text-gray-300 text-[14pt]">No Hall of Fame students added yet.</p>
                </div>
              </motion.div>
            )}
            <motion.div variants={cardVariants}>
              <Link
                to="/register"
                className="rounded-xl p-6 border-2 border-dashed border-[#CA133E]/60 bg-gray-900/60 hover:bg-gray-900 transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer"
              >
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#CA133E] to-[#A01030] flex items-center justify-center mb-4 animate-pulse">
                  <span className="text-white text-[24pt] font-bold">?</span>
                </div>
                <h3 className="text-[18pt] font-bold mb-2">You're next</h3>
                <p className="text-[12pt] text-gray-400 mb-4">Your name belongs here. Start today.</p>
                <span className="inline-block px-5 py-2 rounded-xl bg-white text-[#CA133E] font-bold">Claim your spot now !</span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="bg-gradient-to-r from-[#CA133E] to-[#A01030] py-16 px-6 lg:px-12"
      >
        <div className="container mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Ready to Join Our Hall of Fame?</h2>
          <p className="text-base lg:text-lg mb-8 max-w-2xl mx-auto">
            Start your journey with AT-ICT today and become our next success story.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-[#CA133E] px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all"
            >
              Start Learning Today
            </Link>
            <Link
              to="/samples"
              className="border-2 border-white text-white px-8 py-3 rounded-xl font-semibold hover:bg-white hover:text-[#CA133E] transition-all"
            >
              View Free Samples
            </Link>
          </div>
        </div>
      </motion.div>
      <Footer />
    </div>
  );
};

export default HallOfFame;
