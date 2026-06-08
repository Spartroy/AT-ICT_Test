import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Nav from '../../components/Nav';
import Footer from '../../components/Footer';
import Seo from '../../components/Seo';
import { Mail, Phone, MapPin, School, HelpCircle } from 'lucide-react';
import { showError, showSuccess } from '../../utils/toast';

const WHATSAPP_NUMBER = '201274584000';
const SUPPORT_EMAIL = 'at.ictofficial@gmail.com';

const EG_PHONE_REGEX = /^(?:\+?20|0)?1[0125]\d{8}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const contactJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: 'Contact AT-ICT',
  url: 'https://at-ict-test.vercel.app/contact',
  description: 'Get in touch with AT-ICT for IGCSE ICT course enrolment, free trials, and support.'
};

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    phone: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = () => {
    const { name, email, subject, message, phone } = formData;
    const fieldErrors = {};
    if (!name.trim() || name.trim().length < 2) fieldErrors.name = 'Please enter your full name.';
    if (!EMAIL_REGEX.test(email.trim())) fieldErrors.email = 'Please enter a valid email address.';
    if (!subject.trim()) fieldErrors.subject = 'Please enter a subject.';
    if (!message.trim() || message.trim().length < 10) fieldErrors.message = 'Please write a message of at least 10 characters.';
    const phoneClean = phone.replace(/[\s-]/g, '');
    if (!EG_PHONE_REGEX.test(phoneClean)) fieldErrors.phone = 'Please enter a valid Egyptian phone number (e.g. 01012345678).';
    return fieldErrors;
  };

  const buildMessage = () => {
    const { name, email, subject, message, phone } = formData;
    return (
      `New contact request from AT-ICT website%0A` +
      `------------------------------%0A` +
      `Name: ${encodeURIComponent(name)}%0A` +
      `Email: ${encodeURIComponent(email)}%0A` +
      `Phone: ${encodeURIComponent(phone)}%0A` +
      `Subject: ${encodeURIComponent(subject)}%0A%0A` +
      `${encodeURIComponent(message)}`
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      showError(Object.values(fieldErrors)[0]);
      return;
    }
    setErrors({});
    setSubmitting(true);
    const text = buildMessage();
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    showSuccess('Opening WhatsApp to send your message…');
    setTimeout(() => setSubmitting(false), 600);
  };

  const handleEmailFallback = () => {
    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      showError(Object.values(fieldErrors)[0]);
      return;
    }
    setErrors({});
    const subject = encodeURIComponent(formData.subject || 'Inquiry from AT-ICT website');
    const body = encodeURIComponent(
      `Name: ${formData.name}\n` +
      `Email: ${formData.email}\n` +
      `Phone: ${formData.phone}\n\n` +
      `${formData.message}`
    );
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  };

  const inputClass = (field) =>
    `w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CA133E] focus:border-transparent ${
      errors[field] ? 'border-red-500' : 'border-gray-300'
    }`;

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
      content: 'Apex Academy - EzScience - IG Cubs - IG Stars',
      subContent: 'Bright Minds - Future Stars Center - IG Guide Academy'
    },
    {
      icon: School,
      title: 'Schools',
      content: 'Royal College International School'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] via-[#2a1a1a] to-[#3a1a1a]">
      <Seo
        title="Contact Us"
        description="Reach AT-ICT for enrolment, course questions, or a free trial — via WhatsApp, email, or phone."
        path="/contact"
        jsonLd={contactJsonLd}
      />
      <Nav />

      <main id="main-content" className="pt-20 px-4 pb-8">
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

              <form onSubmit={handleSubmit} noValidate className="space-y-4 flex-1 flex flex-col">
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
                      autoComplete="name"
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? 'name-error' : undefined}
                      className={inputClass('name')}
                    />
                    {errors.name && (
                      <p id="name-error" role="alert" className="text-xs text-red-600 mt-1">{errors.name}</p>
                    )}
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
                      autoComplete="email"
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? 'email-error' : undefined}
                      className={inputClass('email')}
                    />
                    {errors.email && (
                      <p id="email-error" role="alert" className="text-xs text-red-600 mt-1">{errors.email}</p>
                    )}
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
                    aria-invalid={!!errors.subject}
                    aria-describedby={errors.subject ? 'subject-error' : undefined}
                    className={inputClass('subject')}
                    placeholder="What is this about?"
                  />
                  {errors.subject && (
                    <p id="subject-error" role="alert" className="text-xs text-red-600 mt-1">{errors.subject}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="01012345678"
                    pattern="^(?:\+?20|0)?1[0125]\d{8}$"
                    aria-invalid={!!errors.phone}
                    aria-describedby={errors.phone ? 'phone-error phone-hint' : 'phone-hint'}
                    className={inputClass('phone')}
                  />
                  <p id="phone-hint" className="text-xs text-gray-500 mt-1">
                    Egyptian mobile number — e.g. 01012345678 or +201012345678.
                  </p>
                  {errors.phone && (
                    <p id="phone-error" role="alert" className="text-xs text-red-600 mt-1">{errors.phone}</p>
                  )}
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
                    aria-invalid={!!errors.message}
                    aria-describedby={errors.message ? 'message-error' : undefined}
                    className={`w-full h-full min-h-[100px] px-3 py-2 mb-1 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CA133E] focus:border-transparent resize-none ${
                      errors.message ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Tell us how we can help you..."
                  />
                  {errors.message && (
                    <p id="message-error" role="alert" className="text-xs text-red-600 mt-1">{errors.message}</p>
                  )}
                </div>

                <div className="mt-auto space-y-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[#CA133E] text-white py-2.5 rounded-xl font-semibold hover:bg-[#A01030] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Sending…' : 'Send via WhatsApp'}
                  </button>
                  <button
                    type="button"
                    onClick={handleEmailFallback}
                    className="w-full bg-gray-100 text-gray-800 py-2.5 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300 border border-gray-200"
                  >
                    Send via Email instead
                  </button>
                </div>
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
                      <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center" aria-hidden="true">
                        <info.icon className="text-[#CA133E]" size={16} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 text-sm">{info.title}</h3>
                        <p className="text-gray-600 text-sm">{info.content}</p>
                        {info.subContent && (
                          <p className="text-gray-600 text-sm">{info.subContent}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* FAQ link - keeps a single source of truth */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-white p-6 rounded-xl shadow-lg flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0" aria-hidden="true">
                <HelpCircle className="text-[#CA133E]" size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-gray-800 mb-1">Have a quick question?</h3>
                <p className="text-sm text-gray-600">
                  Most answers — enrolment, payment, technology, and support — are already in the FAQ.
                </p>
              </div>
              <Link
                to="/faq"
                className="bg-[#CA133E] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#A01030] transition-colors whitespace-nowrap"
              >
                See full FAQ
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default ContactUs;
