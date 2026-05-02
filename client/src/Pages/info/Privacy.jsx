import React from 'react';
import Nav from '../../components/Nav';
import Footer from '../../components/Footer';
import Seo from '../../components/Seo';

const Privacy = () => (
  <div className="min-h-screen bg-gray-50 flex flex-col">
    <Seo
      title="Privacy Policy"
      description="How AT-ICT collects, uses, and protects student and parent data."
      path="/privacy"
    />
    <Nav />
    <main className="flex-1 pt-28 pb-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        <p className="text-gray-700 mb-4">
          AT-ICT respects your privacy. We collect only the information needed to provide learning
          services, communicate with students and parents, and improve the platform experience.
        </p>
        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">What We Collect</h2>
        <p className="text-gray-700 mb-4">
          Account details, contact information, course activity, and limited technical data required
          for security and session management.
        </p>
        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">How We Use Data</h2>
        <p className="text-gray-700 mb-4">
          Data is used to deliver classes, track progress, support communication, and maintain secure
          access to the platform.
        </p>
        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">Contact</h2>
        <p className="text-gray-700">
          For privacy requests, email <a className="text-[#CA133E]" href="mailto:at.ictofficial@gmail.com">at.ictofficial@gmail.com</a>.
        </p>
      </div>
    </main>
    <Footer />
  </div>
);

export default Privacy;
