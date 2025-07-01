import React, { useState, useEffect } from "react";
import { motion } from "framer-motion"; // For animations

// import Slider from "react-slick";
// import "slick-carousel/slick/slick.css";
// import "slick-carousel/slick/slick-theme.css";

import Nav from "../components/Nav";
import Hero from "../components/Hero";
import WhyChooseATICT from "../components/WhyChooseATICT";
import DashboardLayout from "../components/About";







const Home = () => {




  // const submitToGoogleSheets = async (email, phoneNumber, amount, donationType) => {
  //   const url = "https://script.google.com/macros/s/AKfycbx_3m_CO8b6HflAFwTDIydzBoSUX1xzqerB-QaLISL-cncHPj1aUbG9VzKyw_nrYeERnw/exec"; // Use the deployed URL

  //   const data = {
  //     email,
  //     phoneNumber,
  //     amount,
  //     donationType,
  //   };

  //   try {
  //     const response = await fetch(url, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/x-www-form-urlencoded', // Google Apps Script expects this format
  //       },
  //       body: JSON.stringify(data),
  //     });

  //     const textResponse = await response.text(); // Get the actual response
  //     console.log("Server Response:", textResponse);
  //   } catch (error) {
  //     console.error("Error submitting data:", error);
  //   }
  // };



  return (
    <>
      <Nav />

      <div>
        <Hero />
        <WhyChooseATICT />


      </div>




    </>
  );
};

export default Home;