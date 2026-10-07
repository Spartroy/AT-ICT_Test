import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const STORAGE_KEY = 'atict-study-guide-popup-dismissed';
const STUDY_GUIDE_URL = '/study-guide.html';

// Speech bubble that hangs off the right end of the navbar (nav is max 1200px wide, centered).
const StudyGuidePopup = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch (e) {
      // storage unavailable; show the bubble anyway
    }
    if (dismissed) return undefined;
    const timer = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const close = () => {
    setOpen(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch (e) {
      // ignore
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-label="Complete revision study guide"
          className="fixed z-[60] w-[calc(100vw-2rem)] max-w-[300px] rounded-2xl bg-white p-4 text-gray-900 shadow-2xl border border-[#CA133E]/30"
          style={{
            top: '108px',
            right: 'max(1rem, calc((100vw - 1200px) / 2 + 1rem))',
          }}
          initial={{ opacity: 0, y: -12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.95 }}
          transition={{ duration: 0.3 }}
        >
          {/* Tail pointing up at the navbar */}
          <span
            aria-hidden="true"
            className="absolute -top-2 right-10 h-4 w-4 rotate-45 border-l border-t border-[#CA133E]/30 bg-white"
          />
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute right-3 top-1 text-xl leading-none text-gray-400 hover:text-gray-700"
          >
            &times;
          </button>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#CA133E]">New for students</p>
          <p className="mt-1 text-base font-bold leading-snug">Complete IGCSE ICT Revision</p>
          <p className="mt-1 text-sm text-gray-600">Every chapter in one place.</p>
          <a
            href={STUDY_GUIDE_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={close}
            className="mt-3 inline-block rounded-full bg-[#CA133E] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#a30f32]"
          >
            Open the Study Guide
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StudyGuidePopup;
