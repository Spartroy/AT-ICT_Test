import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Nav from '../../components/Nav';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log('Contact form submitted:', formData);
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email',
      content: 'info@at-ict.com',
      subContent: 'ahmad.tamer@at-ict.com'
    },
    {
      icon: Phone,
      title: 'Phone',
      content: '+1 (555) 123-4567',
      subContent: 'Available 9 AM - 6 PM'
    },
    {
      icon: MapPin,
      title: 'Location',
      content: 'Online Classes',
      subContent: 'Available Worldwide'
    },
    {
      icon: Clock,
      title: 'Response Time',
      content: '24 Hours',
      subContent: 'We respond quickly'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] via-[#2a1a1a] to-[#3a1a1a]">
      <Nav />
      
      <div className="pt-32 px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-7xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">
            Contact <span className="text-[#CA133E]">AT-ICT</span>
          </h1>
          
          <p className="text-xl text-gray-300 text-center mb-12">
            Get in touch with us for any questions or inquiries
          </p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="bg-white p-8 rounded-xl shadow-lg"
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Send us a Message</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CA133E] focus:border-transparent"
                      placeholder="Your full name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CA133E] focus:border-transparent"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CA133E] focus:border-transparent"
                    placeholder="What is this about?"
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CA133E] focus:border-transparent resize-none"
                    placeholder="Tell us how we can help you..."
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-[#CA133E] text-white py-3 rounded-xl font-semibold hover:bg-[#A01030] transition-all duration-300"
                >
                  Send Message
                </button>
              </form>
            </motion.div>
            
            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <div className="bg-white p-8 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Get in Touch</h2>
                <p className="text-gray-600 mb-6">
                  We're here to help you succeed in your ICT journey. Don't hesitate to reach out 
                  with any questions about our courses, teaching methods, or enrollment process.
                </p>
                
                <div className="space-y-4">
                  {contactInfo.map((info, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <info.icon className="text-[#CA133E]" size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{info.title}</h3>
                        <p className="text-gray-600">{info.content}</p>
                        <p className="text-sm text-gray-500">{info.subContent}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              {/* FAQ Section */}
              <div className="bg-white p-8 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Questions?</h3>
                <div className="space-y-3">
                  <div className="border-l-4 border-[#CA133E] pl-4">
                    <h4 className="font-semibold text-gray-800">How do I enroll?</h4>
                    <p className="text-gray-600 text-sm">Contact us via email or phone to discuss enrollment options.</p>
                  </div>
                  <div className="border-l-4 border-[#CA133E] pl-4">
                    <h4 className="font-semibold text-gray-800">What's included in the course?</h4>
                    <p className="text-gray-600 text-sm">Interactive notes, recorded sessions, and continuous support.</p>
                  </div>
                  <div className="border-l-4 border-[#CA133E] pl-4">
                    <h4 className="font-semibold text-gray-800">Do you offer trial sessions?</h4>
                    <p className="text-gray-600 text-sm">Yes! Contact us to arrange a free sample session.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ContactUs; 