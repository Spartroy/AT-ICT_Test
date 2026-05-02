import React from 'react';
import Nav from '../../components/Nav';
import Footer from '../../components/Footer';
import Seo from '../../components/Seo';
import AboutComponent from '../../components/About';

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Seo
        title="About AT-ICT"
        description="Meet the team behind AT-ICT and learn how our IGCSE ICT methodology delivers consistent A* results."
        path="/about"
      />
      <Nav />
      <div className="flex-1">
        <AboutComponent />
      </div>
      <Footer />
    </div>
  );
};

export default About;
