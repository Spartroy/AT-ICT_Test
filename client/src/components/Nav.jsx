import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../assets/logo.png";
import Dropdown from "./Dropdown";

const Nav = () => {
  const [navOpen, setNavOpen] = useState(false);
  const navigate = useNavigate();

  const toggleNav = () => {
    setNavOpen(!navOpen);
  };

  // 
  return (
    <nav className="fixed w-full left-0 right-0 bg-gradient-to-r from-[#0F0F0F] via-[#4A0D0D] to-[#C70039] h-24 py-2 px-4 sm:px-6 lg:px-10 z-10 font-pop rounded-b-xl">
      <div className="flex justify-between items-center h-full">
        {/* Mobile Menu Button */}
        <button className="md:hidden text-white text-[24pt]" onClick={toggleNav}>
          ☰
        </button>

        {/* Left Navigation Tabs (Desktop) */}
        <div className="hidden md:flex space-x-4 sm:space-x-6 md:space-x-8 lg:space-x-10">
          <Link to="/about" className="text-white hover:text-gray-300 font-bold text-sm sm:text-base md:text-lg mt-4 ">About</Link>
          <Link to="/samples" className="text-white hover:text-gray-300 font-bold text-sm sm:text-base md:text-lg mt-4 ">Free Samples</Link>
            {/* <Link to="/curriculum" className="text-white hover:text-gray-300 font-bold text-sm sm:text-base md:text-lg mt-4 ">Curriculum</Link> */}
            <Link to="/contact" className="text-white hover:text-gray-300 font-bold text-sm sm:text-base md:text-lg mt-4 ">Contact us</Link>
          <Link to="/faq" className="text-white hover:text-gray-300 font-bold text-sm sm:text-base md:text-lg mt-4 ">FAQ</Link>
        
        {/* <Dropdown/> */}

        </div>

        {/* Center Logo */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <Link to="/">
            {/* <img src={Logo2} alt="Logo" className="w-32 sm:w-32 md:w-40 h-auto" /> */}

            <img src={Logo} alt="Logo" className="w-32 sm:w-32 md:w-40 h-auto" />

          </Link>
        </div>

        {/* Right Buttons (Desktop) */}
        <div className="hidden md:flex space-x-4">
          <button 
            onClick={() => navigate('/register')}
            className="bg-white text-black px-4 py-2 rounded-xl font-bold hover:bg-gray-200 transition"
          >
            Register
          </button>
          
          <button 
            onClick={() => navigate('/signin')}
            className="bg-transparent border-2 border-white text-white px-4 py-2 rounded-xl font-bold hover:bg-white hover:text-black transition"
          >
            Login
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {navOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-[#4A0D0D] z-40 flex flex-col items-center justify-center space-y-6 pt-20 md:hidden"
          >
            <button className="absolute top-4 right-4 text-white text-[24pt]" onClick={toggleNav}>
              ✕
            </button>

            <Link to="/" onClick={toggleNav} className="text-white text-lg sm:text-xl font-bold">Home</Link>
            <Link to="/about" onClick={toggleNav} className="text-white text-lg sm:text-xl font-bold">About</Link>
            <Link to="/samples" onClick={toggleNav} className="text-white text-lg sm:text-xl font-bold">Free Samples</Link>
            <Link to="/contact" onClick={toggleNav} className="text-white text-lg sm:text-xl font-bold">Contact Us</Link>

            <button 
              onClick={() => { navigate('/register'); toggleNav(); }}
              className="bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition"
            >
              Register
            </button>
            
            <button 
              onClick={() => { navigate('/signin'); toggleNav(); }}
              className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-xl font-bold hover:bg-white hover:text-black transition"
            >
              Login
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Nav;
