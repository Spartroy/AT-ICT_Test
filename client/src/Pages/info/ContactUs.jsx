import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Nav from '../../components/Nav';
import { Mail, Phone, MapPin, Clock, School } from 'lucide-react';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    phone: ''
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
      content: 'at.ictofficial@gmail.com',
      subContent: 'ahmad.tamer.ali11@gmail.com'
    },
    {
      icon: Phone,
      title: 'Phone',
      content: '(+20) 127 458 4000',
      subContent: '(+20) 107 089 5012'
    },
    {
      icon: MapPin,
      title: 'Centers',
      content: 'Apex Academy - EzScience - IG Cubs - IG Stars - Bright Minds',
      subContent: 'Future Stars Center - IG Guide Academy',
     
    },

    {
      icon: School,
      title: 'Schools',
      content: 'Gateway Montessori International School'
     
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] via-[#2a1a1a] to-[#3a1a1a]">
      <Nav />
      
      <div className="pt-20 px-4 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-6xl mx-auto"
        >
          <h1 className="text-3xl md:text-[25pt] font-bold text-white text-center mt-6 mb-2">
            Contact <span className="text-[#CA133E]">AT-ICT</span>
          </h1>
          
          <p className="text-[15pt] text-gray-300 text-center mb-8 mt-2">
            Get in touch with us for any questions or inquiries
          </p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="bg-white p-6 rounded-xl shadow-lg h-full flex flex-col"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-4">Send us a Message</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CA133E] focus:border-transparent"
                      placeholder="Your full name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CA133E] focus:border-transparent"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CA133E] focus:border-transparent"
                    placeholder="What is this about?"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CA133E] focus:border-transparent"
                    placeholder="Your phone number"
                  />
                </div>

                
                <div className="flex-1">
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full h-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CA133E] focus:border-transparent resize-none"
                    placeholder="Tell us how we can help you..."
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-[#CA133E] text-white py-2.5 rounded-xl font-semibold hover:bg-[#A01030] transition-all duration-300 mt-auto"
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
              className="h-full flex flex-col"
            >
              <div className="bg-white p-6 rounded-xl shadow-lg h-full flex flex-col">
                <h2 className="text-xl font-bold text-gray-800 mb-3">Get in Touch</h2>
                <p className="text-gray-600 mb-4 text-sm">
                  We're here to help you succeed in your ICT journey.  <br /> Don't hesitate to reach out 
                  with any questions about the course, teaching methods, or enrollment process.
                </p>
                
                <div className="space-y-3 flex-1">
                  {contactInfo.map((info, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className="flex items-start space-x-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center">
                        <info.icon className="text-[#CA133E]" size={16} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 text-sm">{info.title}</h3>
                        <p className="text-gray-600 text-sm">{info.content}</p>
                        <p className="text-gray-600 text-sm">{info.subContent}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* FAQ Section - Centered below the two cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-bold text-gray-800 mb-3 text-center">Quick Questions?</h3>
              <div className="space-y-3">
                <div className="border-l-4 border-[#CA133E] pl-3">
                  <h4 className="font-semibold text-gray-800 text-sm">How do I enroll?</h4>
                  <p className="text-gray-600 text-xs">Contact us via email or phone to discuss enrollment options.</p>
                </div>
                <div className="border-l-4 border-[#CA133E] pl-3">
                  <h4 className="font-semibold text-gray-800 text-sm">What's included in the course?</h4>
                  <p className="text-gray-600 text-xs">Interactive notes, recorded sessions, and continuous support.</p>
                </div>
                <div className="border-l-4 border-[#CA133E] pl-3">
                  <h4 className="font-semibold text-gray-800 text-sm">Do you offer trial sessions?</h4>
                  <p className="text-gray-600 text-xs">Yes ofcourse ! Contact us to arrange a free trial session.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default ContactUs; 