import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const Dropdown = () => {
  const navigate = useNavigate();
  
  // Function to handle dropdown selection
  const handleSelectChange = (event) => {
    const selectedValue = event.target.value;
    if (selectedValue) {
      navigate(selectedValue); // Navigate to the selected page
    }
  };

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Dropdown */}
      <select
        name="cars"
        id="cars"
        onChange={handleSelectChange}
        className="w-full bg-[#2a1a1a] border-2 border-[#CA133E] text-white py-3 px-10 rounded-xl appearance-none focus:outline-none focus:border-[#A01030] cursor-pointer transition-all duration-300 hover:bg-[#3a1a1a]"
      >
        <option value="/contact">Contact us</option>
        <option value="/faq">FAQ</option>
      </select>

      {/* Custom Dropdown Arrow */}
      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
        <svg
          className="w-6 h-6 text-[#CA133E]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </motion.div>
  );
};

export default Dropdown;