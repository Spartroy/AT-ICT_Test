import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../assets/logo.png";

const Nav = () => {
  const [navOpen, setNavOpen] = useState(false);
  const navigate = useNavigate();

  const toggleNav = () => {
    setNavOpen(!navOpen);
  };

  return (
    <nav className="fixed w-full left-0 right-0 z-50 px-4 sm:px-6 lg:px-8" style={{ top: '20px' }}>
      {/* Main Navigation Container */}
      <div 
        className="mx-auto flex items-center justify-between px-8 py-5"
        style={{
          width: '1203px',
          maxWidth: '100vw',
          height: '83px',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          borderRadius: '10px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(255, 255, 255, 0.1)',
        }}
      >
        
        {/* Mobile Menu Button */}
        <button className="lg:hidden text-white text-2xl" onClick={toggleNav}>
          ☰
        </button>

        {/* Left Section - Logo and Navigation */}
        <div className="hidden lg:flex items-center gap-[50px]">
          {/* Logo Group */}
          <div className="flex items-center" style={{ width: '146px', height: '42.1px' }}>
            <Link to="/" className="flex items-center">
              <img 
                src={Logo} 
                alt="Ahmad Tamer Logo" 
                className="h-[42.1px] w-auto filter drop-shadow-lg"
              />
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-[25px]">
            <Link 
              to="/about" 
              className="text-white hover:text-[#CD143F] transition-all duration-300 relative group"
              style={{
                fontFamily: 'Geist, system-ui, sans-serif',
                fontWeight: '500',
                fontSize: '20px',
                lineHeight: '110%',
                letterSpacing: '-0.05em',
                textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)'
              }}
            >
              About Us
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#CD143F] to-white group-hover:w-full transition-all duration-300"></span>
            </Link>
            
            <Link 
              to="/hall-of-fame" 
              className="text-white hover:text-[#CD143F] transition-all duration-300 relative group"
              style={{
                fontFamily: 'Geist, system-ui, sans-serif',
                fontWeight: '500',
                fontSize: '20px',
                lineHeight: '110%',
                letterSpacing: '-0.05em',
                textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)'
              }}
            >
              Hall of Fame
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#CD143F] to-white group-hover:w-full transition-all duration-300"></span>
            </Link>
            
            <Link 
              to="/samples" 
              className="text-white hover:text-[#CD143F] transition-all duration-300 relative group"
              style={{
                fontFamily: 'Geist, system-ui, sans-serif',
                fontWeight: '500',
                fontSize: '20px',
                lineHeight: '110%',
                letterSpacing: '-0.05em',
                textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)'
              }}
            >
              Free Samples
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#CD143F] to-white group-hover:w-full transition-all duration-300"></span>
            </Link>
            
           
            
            <Link 
              to="/faq" 
              className="text-white hover:text-[#CD143F] transition-all duration-300 relative group"
              style={{
                fontFamily: 'Geist, system-ui, sans-serif',
                fontWeight: '500',
                fontSize: '20px',
                lineHeight: '110%',
                letterSpacing: '-0.05em',
                textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)'
              }}
            >
              FAQ
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#CD143F] to-white group-hover:w-full transition-all duration-300"></span>
            </Link>

            <Link 
              to="/contact" 
              className="text-white hover:text-[#CD143F] transition-all duration-300 relative group"
              style={{
                fontFamily: 'Geist, system-ui, sans-serif',
                fontWeight: '500',
                fontSize: '20px',
                lineHeight: '110%',
                letterSpacing: '-0.05em',
                textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)'
              }}
            >
              Contact
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#CD143F] to-white group-hover:w-full transition-all duration-300"></span>
            </Link>
          </div>
        </div>

        {/* Right Section - Login/Sign Up Buttons */}
        <div className="hidden lg:flex items-center gap-[7.15px]">
          {/* Login Button */}
          <button 
            onClick={() => navigate('/signin')}
            className="flex justify-center items-center text-white hover:bg-white hover:bg-opacity-20 transition-all duration-300 relative overflow-hidden group"
            style={{
              width: '106px',
              height: '42px',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '7.15164px',
              padding: '10.7275px 14.3033px',
              fontFamily: 'Geist, system-ui, sans-serif',
              fontWeight: '500',
              fontSize: '18.5943px',
              lineHeight: '110%',
              letterSpacing: '-0.05em',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)'
            }}
          >
            <span className="relative z-10">Login</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300 transform -skew-x-12"></div>
          </button>
          
          {/* Sign Up Button */}
          <button 
            onClick={() => navigate('/register')}
            className="flex justify-center items-center text-white hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
            style={{
              width: '121px',
              height: '42px',
              background: 'linear-gradient(135deg, #CD143F 0%, #A01030 100%)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              borderRadius: '7.15164px',
              padding: '10.7275px 14.3033px',
              fontFamily: 'Geist, system-ui, sans-serif',
              fontWeight: '500',
              fontSize: '18.5943px',
              lineHeight: '110%',
              letterSpacing: '-0.05em',
              boxShadow: '0 4px 16px rgba(205, 20, 63, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <span className="relative z-10">Sign Up</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30 transition-opacity duration-300 transform -skew-x-12"></div>
          </button>
        </div>

        {/* Mobile Navigation Toggle for smaller screens */}
        <div className="lg:hidden flex items-center">
          <Link to="/" className="flex items-center">
            <img 
              src={Logo} 
              alt="Ahmad Tamer Logo" 
              className="h-8 w-auto filter drop-shadow-lg"
            />
          </Link>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {navOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 flex flex-col items-center justify-center space-y-6 lg:hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(15px)',
              WebkitBackdropFilter: 'blur(15px)'
            }}
          >
            <button className="absolute top-6 right-6 text-white text-3xl" onClick={toggleNav}>
              ✕
            </button>

            <Link to="/" onClick={toggleNav} className="text-white text-[22px] font-medium hover:text-[#CD143F] transition-colors">
              Home
            </Link>
            <Link to="/about" onClick={toggleNav} className="text-white text-[22px] font-medium hover:text-[#CD143F] transition-colors">
              About Us
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
              <button 
                onClick={() => { navigate('/signin'); toggleNav(); }}
                className="text-white hover:bg-white hover:bg-opacity-20 px-8 py-3 rounded-lg font-medium text-[18px] transition-all"
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
                }}
              >
                Login
              </button>
              
              <button 
                onClick={() => { navigate('/register'); toggleNav(); }}
                className="text-white px-8 py-3 rounded-lg font-medium text-[18px] transition-colors"
                style={{
                  background: 'linear-gradient(135deg, #CD143F 0%, #A01030 100%)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  boxShadow: '0 4px 16px rgba(205, 20, 63, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                Sign Up
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Nav;
