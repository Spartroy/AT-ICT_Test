import React from 'react';
import { motion } from 'framer-motion';

const STUDY_GUIDE_URL = '/study-guide.html';

const GLOW_DIM = '0 0 12px 2px rgba(202,19,62,0.45), 0 8px 24px rgba(0,0,0,0.35)';
const GLOW_BRIGHT = '0 0 30px 8px rgba(202,19,62,0.9), 0 8px 24px rgba(0,0,0,0.35)';

// Always-visible glowing speech bubble that hangs off the right end of the navbar
// (nav is max 1200px wide, centered). It has no close button by design.
const StudyGuidePopup = () => (
  <motion.a
    href={STUDY_GUIDE_URL}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Open the complete IGCSE ICT revision study guide"
    className="fixed z-[60] block w-[calc(100vw-2rem)] max-w-[300px] rounded-2xl border border-[#CA133E] bg-white p-4 text-gray-900"
    style={{
      top: '108px',
      right: 'max(1rem, calc((100vw - 1200px) / 2 + 1rem))',
    }}
    initial={{ opacity: 0, y: -12, scale: 0.95, boxShadow: GLOW_DIM }}
    animate={{ opacity: 1, y: 0, scale: 1, boxShadow: [GLOW_DIM, GLOW_BRIGHT, GLOW_DIM] }}
    transition={{
      opacity: { duration: 0.4, delay: 0.8 },
      y: { duration: 0.4, delay: 0.8 },
      scale: { duration: 0.4, delay: 0.8 },
      boxShadow: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
    }}
    whileHover={{ scale: 1.03 }}
  >
    {/* Tail pointing up at the navbar */}
    <span
      aria-hidden="true"
      className="absolute -top-2 right-10 h-4 w-4 rotate-45 border-l border-t border-[#CA133E] bg-white"
    />
    <p className="text-xs font-semibold uppercase tracking-wide text-[#CA133E]">New for students</p>
    <p className="mt-1 text-base font-bold leading-snug">Complete IGCSE ICT Revision</p>
    <p className="mt-1 text-sm text-gray-600">Every chapter in one place.</p>
    <span className="mt-3 inline-block rounded-full bg-[#CA133E] px-4 py-2 text-sm font-semibold text-white">
      Open the Study Guide
    </span>
  </motion.a>
);

export default StudyGuidePopup;
