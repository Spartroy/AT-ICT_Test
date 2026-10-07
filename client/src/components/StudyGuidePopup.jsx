import React from 'react';
import { motion } from 'framer-motion';

const GLOW_DIM = '0 0 12px 2px rgba(202,19,62,0.45), 0 8px 24px rgba(0,0,0,0.35)';
const GLOW_BRIGHT = '0 0 30px 8px rgba(202,19,62,0.9), 0 8px 24px rgba(0,0,0,0.35)';

const BUBBLES = [
  {
    href: '/study-guide.html',
    label: 'Open the complete IGCSE ICT revision study guide',
    kicker: 'New for students',
    title: 'Complete IGCSE ICT Revision',
    text: 'Every chapter in one place.',
    cta: 'Open the Study Guide',
  },
  {
    href: '/ict-mindmap.html',
    label: 'Open the ICT mindmap',
    kicker: 'Visual revision',
    title: 'ICT Mindmap',
    text: 'The whole syllabus at a glance.',
    cta: 'Open the Mindmap',
  },
];

// Always-visible glowing speech bubbles that hang off the right end of the navbar
// (nav is max 1200px wide, centered). They have no close button by design.
const StudyGuidePopup = () => (
  <div
    className="fixed z-[60] flex w-[calc(100vw-2rem)] max-w-[300px] flex-col gap-4"
    style={{
      top: '108px',
      right: 'max(1rem, calc((100vw - 1200px) / 2 + 1rem))',
    }}
  >
    {BUBBLES.map((b, i) => (
      <motion.a
        key={b.href}
        href={b.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={b.label}
        className="relative block rounded-2xl border border-[#CA133E] bg-white p-4 text-gray-900"
        initial={{ opacity: 0, y: -12, scale: 0.95, boxShadow: GLOW_DIM }}
        animate={{ opacity: 1, y: 0, scale: 1, boxShadow: [GLOW_DIM, GLOW_BRIGHT, GLOW_DIM] }}
        transition={{
          opacity: { duration: 0.4, delay: 0.8 + i * 0.2 },
          y: { duration: 0.4, delay: 0.8 + i * 0.2 },
          scale: { duration: 0.4, delay: 0.8 + i * 0.2 },
          boxShadow: { duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 },
        }}
        whileHover={{ scale: 1.03 }}
      >
        {i === 0 && (
          // Tail pointing up at the navbar
          <span
            aria-hidden="true"
            className="absolute -top-2 right-10 h-4 w-4 rotate-45 border-l border-t border-[#CA133E] bg-white"
          />
        )}
        <p className="text-xs font-semibold uppercase tracking-wide text-[#CA133E]">{b.kicker}</p>
        <p className="mt-1 text-base font-bold leading-snug">{b.title}</p>
        <p className="mt-1 text-sm text-gray-600">{b.text}</p>
        <span className="mt-3 inline-block rounded-full bg-[#CA133E] px-4 py-2 text-sm font-semibold text-white">
          {b.cta}
        </span>
      </motion.a>
    ))}
  </div>
);

export default StudyGuidePopup;
