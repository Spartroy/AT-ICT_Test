import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import Nav from '../../components/Nav';
import Footer from '../../components/Footer';
import Seo from '../../components/Seo';
import { FileText, Play, BookOpen, CheckCircle, ArrowRight } from 'lucide-react';

const CATEGORIES = [
  { id: 'all',       label: 'All',        icon: BookOpen },
  { id: 'notes',     label: 'Notes',      icon: FileText },
  { id: 'videos',    label: 'Videos',     icon: Play },
  { id: 'exercises', label: 'Exercises',  icon: CheckCircle },
];

const SAMPLES = [
  {
    id: 1, title: 'Networks', category: 'notes', type: 'Interactive Notes',
    description: 'Learn the basics of networks with our interactive notes.',
    features: ['Interactive diagrams', 'Quick revision notes'],
  },
  {
    id: 2, title: 'CH(1) — Computer Structure', category: 'videos', type: 'Video Explanation',
    description: 'Explanation of the building blocks of ICT — Input, Processing, Output.',
    features: ['HD video quality', 'Practice files included'],
  },
  {
    id: 3, title: 'Storage Devices', category: 'notes', type: 'Interactive Notes',
    description: 'Learn the basics of storage devices with our interactive notes.',
    features: ['Interactive diagrams', 'Quick revision notes'],
  },
  {
    id: 4, title: 'Paper 2 — Exam Revision', category: 'exercises', type: 'Final Revision',
    description: 'A comprehensive final revision covering all Paper 2 topics for IGCSE ICT.',
    features: ['Real exam format', 'Detailed solutions'],
  },
  {
    id: 5, title: 'CH(5) — Database', category: 'videos', type: 'Video Explanation',
    description: 'Watch theoretical concepts, then dive into practical implementation.',
    features: ['HD video quality', 'Practice files included'],
  },
];

const typeStyle = {
  notes:     { accent: 'text-blue-400',    badge: 'bg-blue-500/15 text-blue-300',    ring: 'border-blue-500/20' },
  videos:    { accent: 'text-purple-400',  badge: 'bg-purple-500/15 text-purple-300', ring: 'border-purple-500/20' },
  exercises: { accent: 'text-emerald-400', badge: 'bg-emerald-500/15 text-emerald-300', ring: 'border-emerald-500/20' },
};

const CardIcon = ({ category }) => {
  const cls = 'h-5 w-5';
  if (category === 'notes')     return <FileText className={cls} />;
  if (category === 'videos')    return <Play className={cls} />;
  if (category === 'exercises') return <CheckCircle className={cls} />;
  return <BookOpen className={cls} />;
};

const SampleCard = ({ material, index }) => {
  const s = typeStyle[material.category] || typeStyle.notes;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      className={`flex flex-col rounded-2xl border overflow-hidden transition-colors hover:border-white/15 ${s.ring}`}
      style={{ background: '#161616' }}
    >
      {/* Header strip */}
      <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-3 border-b border-white/6">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-xl bg-white/6 flex items-center justify-center flex-shrink-0 ${s.accent}`}>
            <CardIcon category={material.category} />
          </div>
          <div className="min-w-0">
            <h3 className="text-white font-semibold text-sm leading-snug">{material.title}</h3>
            <p className={`text-xs mt-0.5 ${s.accent}`}>{material.type}</p>
          </div>
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg flex-shrink-0 ${s.badge}`}>
          Free
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col gap-4 px-5 py-4">
        <p className="text-gray-400 text-sm leading-relaxed">{material.description}</p>
        <ul className="space-y-1.5">
          {material.features.map((f, i) => (
            <li key={i} className="flex items-center gap-2 text-xs text-gray-500">
              <CheckCircle className="text-[#CA133E] flex-shrink-0" size={11} />
              {f}
            </li>
          ))}
        </ul>
        <Link
          to="/register"
          className="mt-auto flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-95"
          style={{ background: 'linear-gradient(135deg,#CA133E,#8a0020)' }}
        >
          Access Now <ArrowRight size={14} />
        </Link>
      </div>
    </motion.div>
  );
};

const Samples = () => {
  const [cat, setCat] = useState('all');
  const filtered = cat === 'all' ? SAMPLES : SAMPLES.filter(m => m.category === cat);

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      <Seo
        title="Free Samples"
        description="Try AT-ICT before you enrol — free interactive notes, video lessons, and practice exercises across the IGCSE ICT curriculum."
        path="/samples"
      />
      <Nav />

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-36 pb-20 px-4 text-center">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(202,19,62,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(202,19,62,0.04) 1px,transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse,rgba(202,19,62,0.15) 0%,transparent 70%)', filter: 'blur(50px)' }}
        />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="relative max-w-3xl mx-auto"
        >
          <span className="inline-block bg-[#CA133E]/15 text-[#CA133E] text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
            Free Samples
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight mb-5">
            Experience AT-ICT quality<br />
            <span style={{ color: '#CA133E' }}>before you enrol</span>
          </h1>
          <p className="text-gray-400 text-base mb-8 max-w-xl mx-auto">
            Interactive notes, video lessons, and practice exercises — free, no account needed.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="#samples"
              className="px-7 py-3.5 rounded-xl font-bold text-[#CA133E] border border-[#CA133E]/40 hover:bg-[#CA133E]/8 transition-colors text-sm"
            >
              Browse Free Samples
            </a>
            <Link
              to="/register"
              className="px-7 py-3.5 rounded-xl font-bold text-white transition-all hover:brightness-110 text-sm"
              style={{ background: 'linear-gradient(135deg,#CA133E,#8a0020)', boxShadow: '0 8px 24px rgba(202,19,62,0.3)' }}
            >
              Start Full Course →
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Sample grid ─────────────────────────────────────────────────── */}
      <section id="samples" className="max-w-6xl mx-auto px-4 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">
            <span style={{ color: '#CA133E' }}>Free</span> Sample Materials
          </h2>
          <p className="text-gray-500 text-sm">Experience our teaching quality — no sign-up required</p>
        </motion.div>

        {/* Category pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {CATEGORIES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setCat(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                cat === id
                  ? 'bg-[#CA133E] text-white shadow-lg shadow-[#CA133E]/20'
                  : 'bg-white/6 text-gray-400 border border-white/8 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {/* Cards */}
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {filtered.map((m, i) => <SampleCard key={m.id} material={m} index={i} />)}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden py-20 px-4 text-center"
        style={{ background: '#0f0f0f', borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(202,19,62,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(202,19,62,0.05) 1px,transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="relative max-w-2xl mx-auto"
        >
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
            Ready for the <span style={{ color: '#CA133E' }}>full course?</span>
          </h2>
          <p className="text-gray-400 mb-8 text-sm">
            Unlock all materials, live sessions, assignments, and 1-on-1 support.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white text-base transition-all hover:brightness-110 hover:scale-105"
            style={{ background: 'linear-gradient(135deg,#CA133E,#8a0020)', boxShadow: '0 8px 32px rgba(202,19,62,0.35)' }}
          >
            Enrol Now <ArrowRight size={16} />
          </Link>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
};

export default Samples;
