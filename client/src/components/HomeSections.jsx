import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  Quote,
  Sparkles,
  CheckCircle,
  ChevronLeft
} from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';
import { useStories } from '../context/StoriesContext';

export const TestimonialsStrip = () => {
  const { stories, loading: loadingStories } = useStories();
  const [activeIndex, setActiveIndex] = useState(0);

  const goPrev = () => {
    setActiveIndex((prev) => (prev === 0 ? stories.length - 1 : prev - 1));
  };

  const goNext = () => {
    setActiveIndex((prev) => (prev === stories.length - 1 ? 0 : prev + 1));
  };

  return (
    <section className="py-20 bg-[#1a1a1a] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-block bg-[#CA133E]/15 text-[#CA133E] text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
            Student stories
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Stories from <span className="text-[#CA133E]">our students</span>
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Real students, real results. Swipe through their experiences with AT-ICT.
          </p>
        </motion.div>

        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goPrev}
            className="p-2 rounded-xl border border-gray-700 hover:border-[#CA133E] transition-colors"
            aria-label="Previous story"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm text-gray-300">
            {stories.length ? `${activeIndex + 1} / ${stories.length}` : '0 / 0'}
          </span>
          <button
            onClick={goNext}
            className="p-2 rounded-xl border border-gray-700 hover:border-[#CA133E] transition-colors"
            aria-label="Next story"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div
          className="overflow-hidden"
          aria-live="polite"
          aria-atomic="true"
        >
          <div
            className="flex transition-transform duration-300"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {(loadingStories ? carouselStoriesFallback : stories).map((story, idx) => (
              <div
                key={story._id || `${story.name}-${idx}`}
                className="min-w-full snap-center bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-gray-800 rounded-xl p-6"
              >
                <Quote className="text-[#CA133E] mb-3" size={24} />
                <p className="text-gray-200 leading-relaxed mb-4 text-sm">"{story.text}"</p>
                <div>
                  <p className="font-semibold">{story.name}</p>
                  <p className="text-xs text-[#CA133E]">{story.country}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export const HallOfFameStrip = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch(`${API_ENDPOINTS.LEADERBOARD.HALL_OF_FAME}?limit=8`);
        if (!res.ok) throw new Error('failed');
        const data = await res.json();
        if (mounted) {
          setStudents(data?.data?.hallOfFame || []);
        }
      } catch (err) {
        if (mounted) setStudents([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (!loading && students.length === 0) return null;

  return (
    <section className="py-20 bg-[#0F0F0F] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-block bg-[#CA133E]/15 text-[#CA133E] text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
            Hall of Fame
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Top performers <span className="text-[#CA133E]">right now</span>
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Live ranking from the AT-ICT student platform. Could your name be next?
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(loading ? Array.from({ length: 8 }) : students).map((student, idx) => (
            <div
              key={student?._id || idx}
              className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#CA133E] to-[#A01030] flex items-center justify-center mx-auto mb-3 font-bold">
                {loading ? '…' : (student.name?.[0] || '?')}
              </div>
              <p className="font-semibold text-sm truncate">
                {loading ? 'Loading…' : student.name}
              </p>
              <p className="text-xs text-[#CA133E] mt-1">
                {loading ? '' : `Class of ${student.year || 'N/A'}`}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            to="/hall-of-fame"
            className="inline-flex items-center gap-2 border-2 border-[#CA133E] hover:bg-[#CA133E] hover:text-white text-[#CA133E] font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            See the full Hall of Fame
            <ChevronRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export const FeesTeaser = () => (
  <section className="py-20 bg-gradient-to-br from-[#1a1a1a] via-[#2a1a1a] to-[#3a1a1a] text-white">
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 md:p-12 text-center"
      >
        <Sparkles className="mx-auto text-[#CA133E] mb-4" size={36} />
        <h2 className="text-3xl md:text-4xl font-bold mb-3">
          Plans from <span className="text-[#CA133E]">EGP 4,500</span> / term
        </h2>
        <p className="text-gray-300 max-w-2xl mx-auto mb-6">
          Three transparent packages. Flexible instalments, group discounts, and an early-bird offer.
          No card details required to reserve a seat.
        </p>

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-300 mb-8">
          <span className="flex items-center gap-2"><CheckCircle size={16} className="text-[#CA133E]" /> 2–3 instalments</span>
          <span className="flex items-center gap-2"><CheckCircle size={16} className="text-[#CA133E]" /> 15% group discount</span>
          <span className="flex items-center gap-2"><CheckCircle size={16} className="text-[#CA133E]" /> 10% early bird</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/fees"
            className="bg-[#CA133E] hover:bg-[#A01030] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            See all plans
          </Link>
          <Link
            to="/contact"
            className="border-2 border-white/30 hover:border-white text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Talk to us first
          </Link>
        </div>
      </motion.div>
    </div>
  </section>
);

export const FinalCTA = () => (
  <section className="py-20 bg-gradient-to-r from-[#CA133E] to-[#A01030] text-white">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-3xl md:text-5xl font-bold mb-4"
      >
        Your A* journey starts today.
      </motion.h2>
      <p className="text-lg md:text-xl opacity-90 mb-8">
        Try the free samples first, or jump straight in and reserve your seat.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          to="/samples"
          className="bg-white text-[#CA133E] font-bold px-8 py-4 rounded-xl hover:bg-gray-100 transition-colors"
        >
          Try free samples
        </Link>
        <Link
          to="/register"
          className="border-2 border-white text-white font-bold px-8 py-4 rounded-xl hover:bg-white hover:text-[#CA133E] transition-colors"
        >
          Reserve my seat
        </Link>
      </div>
    </div>
  </section>
);
