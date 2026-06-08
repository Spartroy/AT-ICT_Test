import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, X } from 'lucide-react';

const WHATSAPP_NUMBER = '201274584000';
const DEFAULT_MESSAGE = encodeURIComponent(
  "Hi AT-ICT, I'd like to know more about the IGCSE ICT course."
);

// Hide on dashboard routes — the FAB is for marketing pages and auth.
const hiddenPathPrefixes = [
  '/teacher-dashboard',
  '/student-dashboard',
  '/parent-dashboard'
];

const WhatsAppFab = () => {
  const location = useLocation();
  const [dismissed, setDismissed] = useState(false);
  const [labelOpen, setLabelOpen] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('atict_wa_fab_dismissed');
    if (stored === '1') setDismissed(true);
    const t = setTimeout(() => setLabelOpen(true), 1500);
    return () => clearTimeout(t);
  }, []);

  const isHidden = hiddenPathPrefixes.some((p) => location.pathname.startsWith(p));
  if (isHidden || dismissed) return null;

  const handleDismiss = (e) => {
    e.preventDefault();
    e.stopPropagation();
    sessionStorage.setItem('atict_wa_fab_dismissed', '1');
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-end gap-2">
      {labelOpen && (
        <div className="bg-white text-gray-800 text-xs sm:text-sm font-medium px-3 py-2 rounded-xl shadow-lg max-w-[180px] sm:max-w-[220px] animate-fade-in">
          Have a question? Chat on WhatsApp.
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute -top-2 -right-2 w-5 h-5 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center"
            aria-label="Dismiss WhatsApp prompt"
          >
            <X size={12} />
          </button>
        </div>
      )}
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${DEFAULT_MESSAGE}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with AT-ICT on WhatsApp"
        className="w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#1DA851] text-white flex items-center justify-center shadow-2xl shadow-black/40 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/40"
      >
        <MessageCircle size={26} />
      </a>
    </div>
  );
};

export default WhatsAppFab;
