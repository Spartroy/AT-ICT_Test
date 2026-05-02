import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Layers,
  Trophy,
  ChevronRight,
  Quote,
  Sparkles,
  CheckCircle,
  ChevronLeft,
  ChevronRightCircle
} from 'lucide-react';
import API_ENDPOINTS from '../config/api';
import { studentStories } from '../data/studentStories';

const curriculumTeasers = [
  {
    icon: BookOpen,
    title: 'Foundations & Theory',
    description:
      'From hardware basics to networks, security, and emerging technologies — every theory topic broken down for IGCSE.',
    bullet: 'Weeks 1 – 4'
  },
  {
    icon: Layers,
    title: 'Practical Mastery',
    description:
      'Word, Excel, Access, web authoring and presentations covered with hands-on tasks and exam-style files.',
    bullet: 'Weeks 5 – 8'
  },
  {
    icon: Trophy,
    title: 'Exam Domination',
    description:
      'Mock papers, examiner-style marking, and final revision sprints designed to push you toward an A*.',
    bullet: 'Weeks 9 – 10'
  }
];

const carouselStories = studentStories.slice(0, 6);

export const CurriculumTeaser = () => (
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
          The Curriculum
        </span>
        <h2 className="text-3xl md:text-4xl font-bold mb-3">
          A 10-week roadmap to <span className="text-[#CA133E]">A*</span>
        </h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Every week is mapped to specific exam outcomes. No fluff, no filler — just what gets results.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {curriculumTeasers.map((item, idx) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 hover:border-[#CA133E] transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-[#CA133E]/15 flex items-center justify-center mb-4">
              <item.icon className="text-[#CA133E]" size={24} />
            </div>
            <span className="text-xs font-semibold text-[#CA133E]">{item.bullet}</span>
            <h3 className="text-xl font-bold mt-1 mb-2">{item.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
          </motion.div>
        ))}
      </div>

      <div className="text-center mt-10">
        <Link
          to="/curriculum"
          className="inline-flex items-center gap-2 bg-[#CA133E] hover:bg-[#A01030] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Explore the full curriculum
          <ChevronRight size={18} />
        </Link>
      </div>
    </div>
  </section>
);

export const TestimonialsStrip = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const goPrev = () => {
    setActiveIndex((prev) => (prev === 0 ? carouselStories.length - 1 : prev - 1));
  };

  const goNext = () => {
    setActiveIndex((prev) => (prev === carouselStories.length - 1 ? 0 : prev + 1));
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
            6 stories from <span className="text-[#CA133E]">our students</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Same stories shown in the About page, now in a swipeable carousel.
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
          <span className="text-sm text-gray-400">
            {activeIndex + 1} / {carouselStories.length}
          </span>
          <button
            onClick={goNext}
            className="p-2 rounded-xl border border-gray-700 hover:border-[#CA133E] transition-colors"
            aria-label="Next story"
          >
            <ChevronRightCircle size={18} />
          </button>
        </div>

        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-300"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {carouselStories.map((story) => (
              <div
                key={story.name}
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
          <p className="text-gray-400 max-w-2xl mx-auto">
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
                {loading ? '…' : (student.firstName?.[0] || '?')}
              </div>
              <p className="font-semibold text-sm truncate">
                {loading ? 'Loading…' : student.name}
              </p>
              <p className="text-xs text-[#CA133E] mt-1">
                {loading ? '' : `${student.totalPoints} pts`}
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
