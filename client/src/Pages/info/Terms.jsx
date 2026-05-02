import React from 'react';
import Nav from '../../components/Nav';
import Footer from '../../components/Footer';
import Seo from '../../components/Seo';

const Terms = () => (
  <div className="min-h-screen bg-gray-50 flex flex-col">
    <Seo
      title="Terms of Service"
      description="Terms and conditions for using the AT-ICT learning platform."
      path="/terms"
    />
    <Nav />
    <main className="flex-1 pt-28 pb-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
        <p className="text-gray-700 mb-4">
          By using AT-ICT, you agree to use the platform for educational purposes and comply with
          classroom and community rules.
        </p>
        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">Accounts & Access</h2>
        <p className="text-gray-700 mb-4">
          Users are responsible for keeping their credentials secure and for activity under their account.
        </p>
        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">Content & Conduct</h2>
        <p className="text-gray-700 mb-4">
          Course content is provided for enrolled students only and may not be redistributed without permission.
        </p>
        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">Support</h2>
        <p className="text-gray-700">
          Questions about these terms can be sent to <a className="text-[#CA133E]" href="mailto:at.ictofficial@gmail.com">at.ictofficial@gmail.com</a>.
        </p>
      </div>
    </main>
    <Footer />
  </div>
);

export default Terms;
