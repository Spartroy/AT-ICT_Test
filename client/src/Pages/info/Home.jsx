import React from 'react';
import Nav from '../../components/Nav';
import Hero from '../../components/Hero';
import WhyChooseATICT from '../../components/WhyChooseATICT';
import Footer from '../../components/Footer';
import Seo from '../../components/Seo';
import {
  CurriculumTeaser,
  TestimonialsStrip,
  HallOfFameStrip,
  FeesTeaser,
  FinalCTA
} from '../../components/HomeSections';

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Seo
        title="IGCSE ICT Mastery"
        description="Interactive notes, live sessions and personalised mentoring for IGCSE ICT students. Built to take you from zero to A*."
        path="/"
      />
      <Nav />
      <main className="flex-1">
        <Hero />
        <WhyChooseATICT />
        <TestimonialsStrip />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Home;
