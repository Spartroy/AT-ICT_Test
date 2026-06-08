import React from 'react';

const SkipLink = () => (
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:bg-[#CA133E] focus:text-white focus:px-4 focus:py-2 focus:rounded-xl focus:outline-none focus:ring-2 focus:ring-white"
  >
    Skip to main content
  </a>
);

export default SkipLink;
