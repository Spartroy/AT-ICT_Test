import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import Logo from "../assets/logo.png";

const Nav = () => {
  const [navOpen, setNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const mobileMenuRef = useRef(null);
  const menuButtonRef = useRef(null);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleNav = () => {
    setNavOpen((prev) => !prev);
  };

  // Close mobile menu on ESC key, lock body scroll, and focus trap
  useEffect(() => {
    if (!navOpen) {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setNavOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      if (e.key === 'Tab' && mobileMenuRef.current) {
        const focusable = mobileMenuRef.current.querySelectorAll(
          'a, button, input, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [navOpen]);

  return (
    <nav className="fixed w-full left-0 right-0 z-50 px-4 sm:px-6 lg:px-8" style={{ top: '20px' }}>
      {/* Main Navigation Container */}
      <div 
        className="mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 lg:py-5 transition-all duration-300"
        style={{
          maxWidth: '1200px',
          width: '100%',
          minHeight: '70px',
          background: scrolled 
            ? 'rgba(255, 255, 255, 0.95)' 
            : 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: scrolled 
            ? '1px solid rgba(0, 0, 0, 0.1)' 
            : '1px solid rgba(255, 255, 255, 0.25)',
          borderRadius: '10px',
          boxShadow: scrolled 
            ? '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)' 
            : '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(255, 255, 255, 0.1)',
        }}
      >
        
        {/* Left Section - Logo */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <img 
              src={Logo} 
              alt="Ahmad Tamer Logo" 
              className="h-8 sm:h-10 lg:h-[42.1px] w-auto filter drop-shadow-lg"
            />
          </Link>
        </div>

        {/* Center Section - Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-[20px]">
          {[
            { to: '/about', label: 'About' },
            { to: '/curriculum', label: 'Curriculum' },
            { to: '/fees', label: 'Fees' },
            { to: '/hall-of-fame', label: 'Hall of Fame' },
            { to: '/samples', label: 'Free Samples' },
            { to: '/faq', label: 'FAQ' },
            { to: '/contact', label: 'Contact' },
          ].map(({ to, label }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`transition-all duration-300 relative group text-[18px] tracking-tight ${
                  isActive
                    ? 'text-[#CD143F] font-semibold'
                    : scrolled ? 'text-gray-800 hover:text-[#CD143F] font-medium' : 'text-white hover:text-[#CD143F] font-medium'
                }`}
                style={{
                  textShadow: scrolled
                    ? '0 1px 2px rgba(0, 0, 0, 0.1)'
                    : '0 1px 3px rgba(0, 0, 0, 0.5)'
                }}
              >
                {label}
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-[#CD143F] to-white transition-all duration-300 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
              </Link>
            );
          })}
        </div>

        {/* Right Section - Desktop Login/Sign Up Buttons & Mobile Menu Button */}
        <div className="flex items-center gap-2 lg:gap-[7.15px]">
          {/* Desktop Login/Sign Up Buttons */}
          <div className="hidden lg:flex items-center gap-[7.15px]">
            {/* Login Button */}
            <Link
              to="/signin"
              className={`flex justify-center items-center w-[106px] h-[42px] px-[14px] rounded-lg text-[18px] font-medium tracking-tight transition-all duration-300 relative overflow-hidden group ${
                scrolled
                  ? 'text-gray-700 hover:bg-gray-100 border border-black/10'
                  : 'text-white hover:bg-white/20 border border-white/30'
              }`}
              style={{
                background: scrolled ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                boxShadow: scrolled
                  ? '0 4px 16px rgba(0,0,0,0.05)'
                  : '0 4px 16px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.2)',
                textShadow: scrolled ? 'none' : '0 1px 2px rgba(0,0,0,0.4)'
              }}
            >
              <span className="relative z-10">Login</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300 -skew-x-12"></div>
            </Link>

            {/* Sign Up Button */}
            <Link
              to="/register"
              className="flex justify-center items-center w-[121px] h-[42px] px-[14px] rounded-lg text-[18px] font-medium tracking-tight text-white hover:shadow-xl transition-all duration-300 relative overflow-hidden group border border-white/20"
              style={{
                background: 'linear-gradient(135deg, #CD143F 0%, #A01030 100%)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                boxShadow: '0 4px 16px rgba(205,20,63,0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
                textShadow: '0 1px 2px rgba(0,0,0,0.4)'
              }}
            >
              <span className="relative z-10">Sign Up</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30 transition-opacity duration-300 -skew-x-12"></div>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            ref={menuButtonRef}
            className={`lg:hidden p-2 rounded-xl transition-all duration-300 ${
              scrolled ? 'text-gray-700 hover:bg-gray-200' : 'text-white hover:bg-white/10'
            }`}
            onClick={toggleNav}
            aria-label={navOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={navOpen}
            aria-controls="mobile-nav-menu"
          >
            {navOpen ? <XMarkIcon className="h-7 w-7" /> : <Bars3Icon className="h-7 w-7" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {navOpen && (
          <motion.div
            id="mobile-nav-menu"
            ref={mobileMenuRef}
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 flex flex-col items-center justify-center space-y-5 lg:hidden overflow-y-auto py-16"
            style={{
              background: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(15px)',
              WebkitBackdropFilter: 'blur(15px)'
            }}
          >
            <button
              className="absolute top-6 right-6 text-white hover:bg-white/10 rounded-xl p-2 transition-all duration-300"
              onClick={toggleNav}
              aria-label="Close navigation menu"
            >
              <XMarkIcon className="h-7 w-7" />
            </button>

            <Link to="/" onClick={toggleNav} className="text-white text-[22px] font-medium hover:text-[#CD143F] transition-colors">
              Home
            </Link>
            <Link to="/about" onClick={toggleNav} className="text-white text-[22px] font-medium hover:text-[#CD143F] transition-colors">
              About
            </Link>
            <Link to="/curriculum" onClick={toggleNav} className="text-white text-[22px] font-medium hover:text-[#CD143F] transition-colors">
              Curriculum
            </Link>
            <Link to="/fees" onClick={toggleNav} className="text-white text-[22px] font-medium hover:text-[#CD143F] transition-colors">
              Fees
            </Link>
            <Link to="/hall-of-fame" onClick={toggleNav} className="text-white text-[22px] font-medium hover:text-[#CD143F] transition-colors">
              Hall of Fame
            </Link>
            <Link to="/samples" onClick={toggleNav} className="text-white text-[22px] font-medium hover:text-[#CD143F] transition-colors">
              Free Samples
            </Link>
            <Link to="/faq" onClick={toggleNav} className="text-white text-[22px] font-medium hover:text-[#CD143F] transition-colors">
              FAQ
            </Link>
            <Link to="/contact" onClick={toggleNav} className="text-white text-[22px] font-medium hover:text-[#CD143F] transition-colors">
              Contact
            </Link>

            <div className="flex flex-col space-y-4 mt-8">
              <Link
                to="/signin"
                onClick={toggleNav}
                className="text-white text-center hover:bg-white/20 px-8 py-3 rounded-xl font-medium text-lg transition-all border border-white/30"
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
                }}
              >
                Login
              </Link>

              <Link
                to="/register"
                onClick={toggleNav}
                className="text-white text-center px-8 py-3 rounded-xl font-medium text-lg transition-colors border border-white/20"
                style={{
                  background: 'linear-gradient(135deg, #CD143F 0%, #A01030 100%)',
                  boxShadow: '0 4px 16px rgba(205,20,63,0.4)'
                }}
              >
                Sign Up
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Nav;
