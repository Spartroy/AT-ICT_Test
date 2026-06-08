import React from 'react';
import { Link } from 'react-router-dom';
import Nav from './Nav';
import Footer from './Footer';
import Seo from './Seo';

const NotFound = () => {
  return (
    <div className="flex flex-col min-h-screen bg-[#0F0F0F] text-white">
      <Seo
        title="Page Not Found"
        description="The page you're looking for doesn't exist. Head back to AT-ICT to continue exploring IGCSE ICT mastery."
        path="/404"
        noIndex
      />
      <Nav />
      <main id="main-content" className="flex-grow flex items-center justify-center px-4 py-32">
        <div className="text-center max-w-xl">
          <p className="text-[#CA133E] font-bold text-[80px] sm:text-[120px] leading-none">404</p>
          <h1 className="text-3xl sm:text-4xl font-bold mt-4 mb-4">Page not found</h1>
          <p className="text-gray-300 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="bg-[#CA133E] hover:bg-[#A01030] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Go home
            </Link>
            <Link
              to="/contact"
              className="border-2 border-white/30 hover:border-white text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Contact us
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
