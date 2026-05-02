import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Nav from '../../components/Nav';
import Footer from '../../components/Footer';
import Seo from '../../components/Seo';
import { Trophy, RefreshCw, Search } from 'lucide-react';
import API_ENDPOINTS from '../../config/api';

const PAGE_SIZE = 16;

// Historical roster preserved for legacy display alongside the live list.
const legacyAlumni = [
  { name: 'Nuria Amr', year: '2024' },
  { name: 'Jana Ahmad', year: '2024' },
  { name: 'Abdelrahman Bassem', year: '2024' },
  { name: 'Andrew', year: '2024' },
  { name: 'Hussain', year: '2024' },
  { name: 'Razan Mohamed', year: '2024' },
  { name: 'Mohamed Tamer', year: '2023' },
  { name: 'Haitham', year: '2023' },
  { name: 'Kenzy', year: '2024' },
  { name: 'Ahmad Qayem', year: '2024' },
  { name: 'Abdelrahman Drogham', year: '2023' },
  { name: 'Malak', year: '2024' },
  { name: 'Shaikha', year: '2024' },
  { name: 'Abdelrahman (Boda)', year: '2023' },
  { name: 'Nouran Mohamed', year: '2024' },
  { name: 'Mohannad', year: '2023' },
  { name: 'Ahmad Hatem', year: '2024' },
  { name: 'Fahmy', year: '2024' },
  { name: 'Dina', year: '2023' },
  { name: 'Joud El Daher', year: '2024' },
  { name: 'Karam Al Jararah', year: '2024' },
  { name: 'Omar Tarek', year: '2024' },
  { name: 'Omar Badawy', year: '2023' },
  { name: 'Shahd', year: '2024' },
  { name: 'Abdelrahman', year: '2024' },
  { name: 'Ali Jamal', year: '2023' },
  { name: 'Basel El Dawakhly', year: '2024' },
  { name: 'Joury', year: '2024' },
  { name: 'Yassin', year: '2023' },
  { name: 'Muntaha', year: '2024' },
  { name: 'Jad', year: '2024' },
  { name: 'Ahmad', year: '2023' },
  { name: 'Tala', year: '2024' },
  { name: 'Natalie', year: '2024' },
  { name: 'Shady El Trawneh', year: '2024' },
  { name: 'Omar Amer', year: '2024' }
];

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

const HallOfFame = () => {
  const [liveStudents, setLiveStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [page, setPage] = useState(1);

  const loadLive = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_ENDPOINTS.LEADERBOARD.HALL_OF_FAME}?limit=50`);
      if (!res.ok) throw new Error('Failed to load Hall of Fame');
      const json = await res.json();
      setLiveStudents(json?.data?.hallOfFame || []);
    } catch (err) {
      setError(err.message || 'Could not load live Hall of Fame');
      setLiveStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLive();
  }, []);

  const years = useMemo(() => {
    const set = new Set(legacyAlumni.map((s) => s.year));
    return ['all', ...Array.from(set).sort().reverse()];
  }, []);

  const filteredAlumni = useMemo(() => {
    const term = search.trim().toLowerCase();
    return legacyAlumni.filter((s) => {
      const matchesYear = yearFilter === 'all' || s.year === yearFilter;
      const matchesSearch = term === '' || s.name.toLowerCase().includes(term);
      return matchesYear && matchesSearch;
    });
  }, [search, yearFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAlumni.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedAlumni = filteredAlumni.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    setPage(1);
  }, [search, yearFilter]);

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white flex flex-col">
      <Seo
        title="Hall of Fame"
        description="Celebrating AT-ICT's top performers — live IGCSE ICT leaderboard plus alumni who reached A* with us."
        path="/hall-of-fame"
      />
      <Nav />

      <div className="pt-32 pb-16 px-6 lg:px-12 flex-1">
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
            <p className="text-[16pt] text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Live ranking from the AT-ICT student platform, plus the legacy of every student
              who's already made it through with us.
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
              <div className="text-[14pt] text-gray-100">Average Grade</div>
            </div>
            <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl p-8 text-center">
              <div className="text-[36pt] font-bold mb-2">100+</div>
              <div className="text-[14pt] text-gray-100">Successful Students</div>
            </div>
          </motion.div>
        </div>

        {/* LIVE LEADERBOARD */}
        <div className="container mx-auto mb-16">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Trophy className="text-[#CA133E]" size={28} />
              <h2 className="text-2xl md:text-3xl font-bold">Top Performers — Live</h2>
            </div>
            <button
              onClick={loadLive}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
              disabled={loading}
              aria-label="Refresh hall of fame"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-300 mb-4">
              {error}. Showing alumni list below.
            </p>
          )}

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-800/40 border border-gray-700 rounded-xl p-6 animate-pulse h-32"
                />
              ))}
            </div>
          ) : liveStudents.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {liveStudents.map((student) => (
                <motion.div
                  key={student._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-5 border border-gray-700 hover:border-[#CA133E] transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#CA133E] to-[#A01030] flex items-center justify-center font-bold text-sm">
                      #{student.rank}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{student.name}</p>
                      {student.session && (
                        <p className="text-xs text-gray-400 truncate">{student.session}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-[#CA133E] font-bold text-lg">
                    {student.totalPoints} <span className="text-xs text-gray-400 font-normal">pts</span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No live data yet — be the first on the board!</p>
          )}
        </div>

        {/* ALUMNI WITH FILTERS */}
        <div className="container mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl md:text-3xl font-bold">Alumni</h2>
            <span className="text-sm text-gray-400">{filteredAlumni.length} students</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search alumni…"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[#CA133E]"
              />
            </div>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CA133E]"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y === 'all' ? 'All years' : `Class of ${y}`}
                </option>
              ))}
            </select>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
          >
            {pagedAlumni.map((student, index) => (
              <motion.div
                key={`${student.name}-${index}`}
                variants={cardVariants}
                whileHover={{ scale: 1.04 }}
                className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-5 border border-gray-700 hover:border-[#CA133E] transition-all duration-300 cursor-default"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-[#CA133E] to-[#A01030] rounded-full flex items-center justify-center mb-3 mx-auto">
                  <span className="text-base font-bold">{student.name.charAt(0)}</span>
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-semibold mb-1 truncate">{student.name}</h3>
                  <p className="text-xs text-gray-500">Class of {student.year}</p>
                </div>
              </motion.div>
            ))}

            <motion.div variants={cardVariants}>
              <Link
                to="/register"
                className="rounded-xl p-5 border-2 border-dashed border-[#CA133E]/60 bg-gray-900/60 hover:bg-gray-900 transition-all duration-300 flex flex-col items-center justify-center text-center h-full min-h-[150px]"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#CA133E] to-[#A01030] flex items-center justify-center mb-3">
                  <span className="text-white text-xl font-bold">?</span>
                </div>
                <h3 className="text-sm font-bold mb-1">You're next</h3>
                <p className="text-xs text-gray-400">Claim your spot</p>
              </Link>
            </motion.div>
          </motion.div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 rounded-xl text-sm"
              >
                Previous
              </button>
              <span className="text-sm text-gray-400 mx-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 rounded-xl text-sm"
              >
                Next
              </button>
            </div>
          )}
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
