import React from 'react';
import Nav from '../../components/Nav';
import Hero from '../../components/Hero';
import WhyChooseATICT from '../../components/WhyChooseATICT';

const Home = () => {
  return (
    <div className="min-h-screen">
      <Nav />
      <Hero />
      <WhyChooseATICT />
    </div>
  );
};

export default Home; 