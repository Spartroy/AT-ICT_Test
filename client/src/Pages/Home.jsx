import React from "react";

import Nav from "../components/Nav";
import Hero from "../components/Hero";
import WhyChooseATICT from "../components/WhyChooseATICT";
import StudyGuidePopup from "../components/StudyGuidePopup";







const Home = () => {
  return (
    <>
      <Nav />
      <StudyGuidePopup />
      <div>
        <Hero />
        <WhyChooseATICT />
      </div>
    </>
  );
};

export default Home;