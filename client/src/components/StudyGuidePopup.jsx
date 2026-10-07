import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const STORAGE_KEY = 'atict-study-guide-popup-dismissed';
const STUDY_GUIDE_URL = '/study-guide.html';

const StudyGuidePopup = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch (e) {
      // storage unavailable; show the popup anyway
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

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="study-guide-popup-title"
            className="relative w-full max-w-md rounded-2xl bg-[#2a1a1a] p-8 text-center text-white shadow-2xl border border-[#CA133E]/40"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute right-4 top-3 text-2xl leading-none text-gray-400 hover:text-white"
            >
              &times;
            </button>
            <span className="inline-block rounded-full bg-[#CA133E] px-4 py-1 text-sm font-semibold">
              New for students
            </span>
            <h2 id="study-guide-popup-title" className="mt-4 font-display text-3xl font-bold leading-tight">
              Complete IGCSE ICT Revision
            </h2>
            <p className="mt-3 text-gray-300">
              Every chapter in one place. Open the full AT-ICT study guide and start revising now.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <a
                href={STUDY_GUIDE_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={close}
                className="rounded-full bg-[#CA133E] px-6 py-3 font-semibold text-white transition hover:bg-[#a30f32]"
              >
                Open the Study Guide
              </a>
              <button
                type="button"
                onClick={close}
                className="text-sm text-gray-400 hover:text-white"
              >
                Maybe later
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StudyGuidePopup;
