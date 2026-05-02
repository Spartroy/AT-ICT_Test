import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import Nav from '../../components/Nav';
import Footer from '../../components/Footer';
import Seo from '../../components/Seo';
import { ChevronDown, ChevronUp, HelpCircle, MessageCircle, Phone, Mail, Search } from 'lucide-react';

const faqCategories = [
    {
      title: "Getting Started",
      questions: [
        {
          question: "How do I know if AT-ICT is right for me?",
          answer: "AT-ICT is perfect for any IGCSE ICT student who wants to excel. Whether you're struggling with basics or aiming for an A*, our personalized approach adapts to your level. Try our free samples to experience our teaching style risk-free!"
        },
        {
          question: "What if I'm a complete beginner in ICT?",
          answer: "Perfect! Most of our A* students started as complete beginners. Our curriculum is designed to take you from zero knowledge to expert level. We start with fundamentals and gradually build your skills with patience and support."
        },
        {
          question: "Can I join mid-course if I'm already partway through my IGCSE year?",
          answer: "Absolutely! Our flexible approach allows students to join at any time. We'll assess your current level and create a personalized catch-up plan to ensure you're fully prepared for your exams."
        }
      ]
    },
    {
      title: "Course Content & Structure",
      questions: [
        {
          question: "What exactly is included in the course?",
          answer: "You get 200+ interactive materials, recorded video lessons, live Q&A sessions, practice exercises, mock exams, personal mentoring, 24/7 support, and access to our exclusive student community. Everything you need for A* success!"
        },
        {
          question: "How is this different from school ICT lessons?",
          answer: "Our focus is 100% on IGCSE exam success with interactive, practical learning. While school covers theory, we teach you how to think like an examiner, solve problems efficiently, and apply concepts in real scenarios. Plus, you get personal attention!"
        },
        {
          question: "Can I access materials after the course ends?",
          answer: "Yes! You get lifetime access to all course materials, including future updates. Many students continue using our resources even in university. Your success doesn't end with IGCSE!"
        }
      ]
    },
    {
      title: "Pricing & Payment",
      questions: [
        {
          question: "Are there any hidden costs or additional fees?",
          answer: "Never! Our pricing is completely transparent. The package price includes everything - materials, support, live sessions, mock exams, and lifetime access. No surprise charges ever."
        },
        {
          question: "Do you offer payment plans or discounts?",
          answer: "Yes! We offer flexible payment plans (2-3 installments), early bird discounts (10% off), group discounts (15% for 3+ students), and need-based scholarships. Education should be accessible to everyone."
        },
        {
          question: "What if I'm not satisfied with the course?",
          answer: "We offer a 30-day money-back guarantee, no questions asked. However, with our 98% satisfaction rate and 95% A*/A success rate, we're confident you'll love the results!"
        }
      ]
    },
    {
      title: "Support & Success",
      questions: [
        {
          question: "How quickly do you respond to questions?",
          answer: "Most questions are answered within 2-4 hours during weekdays, and within 8 hours on weekends. For urgent exam-related queries, we often respond within 30 minutes!"
        },
        {
          question: "What if I don't achieve an A* grade?",
          answer: "While 95% of our students achieve A*/A grades, if you complete the course and don't reach your target grade, we'll provide additional support and resources at no extra cost until you do."
        },
        {
          question: "Can parents track their child's progress?",
          answer: "Absolutely! We provide regular progress reports, and parents can schedule calls with Ahmad to discuss their child's development. Transparency and communication are key to success."
        }
      ]
    },
    {
      title: "Technical & Practical",
      questions: [
        {
          question: "What technology do I need for the course?",
          answer: "Just a computer/laptop with internet access! We'll guide you through installing any free software needed. Most activities work on Windows, Mac, or even tablets. No expensive software required."
        },
        {
          question: "How much time should I dedicate per week?",
          answer: "We recommend 3-4 hours per week for optimal results. However, our flexible format allows you to study at your own pace. Some students do intensive weekend sessions, others prefer daily 30-minute chunks."
        },
        {
          question: "Is the course suitable for different exam boards?",
          answer: "Our course is specifically designed for Cambridge IGCSE ICT, but the concepts and skills transfer to other exam boards. We focus on understanding rather than memorization, making you exam-ready regardless of specific board requirements."
        }
      ]
    }
  ];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqCategories.flatMap((category) =>
    category.questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer
      }
    }))
  )
};

const FAQ = () => {
  const [openQuestions, setOpenQuestions] = useState(new Set(['Getting Started-0']));
  const [search, setSearch] = useState('');

  const toggleQuestion = (key) => {
    setOpenQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const filteredCategories = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return faqCategories;
    return faqCategories
      .map((category) => ({
        ...category,
        questions: category.questions.filter(
          (q) =>
            q.question.toLowerCase().includes(term) ||
            q.answer.toLowerCase().includes(term)
        )
      }))
      .filter((c) => c.questions.length > 0);
  }, [search]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Seo
        title="Frequently Asked Questions"
        description="Answers to common questions about AT-ICT — pricing, support, technology requirements, the curriculum, and more."
        path="/faq"
        jsonLd={faqJsonLd}
      />
      <Nav />

      <div className="pt-24 pb-12">
        {/* Hero Section */}
        {/* bg-gradient-to-r from-[#CA133E] to-[#A01030] */}
        <section className="bg-gradient-to-br from-[#1a1a1a] via-[#2a1a1a] to-[#3a1a1a] text-white py-[120px] pb-[50px] mt-[-100px]">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto text-center"
            >
              <HelpCircle className="mx-auto mb-6 text-white" size={64} />
              <h1 className="text-[25pt] md:text-[25pt] font-bold mb-6">
                Frequently Asked <span className="text-[#CA133E]">Questions</span>
              </h1>
              <p className="text-[15pt] md:text-[15pt] mb-4 opacity-90">
                Everything you need to know about AT-ICT. <br /> <br />
                <span className="text-[#CA133E] font-bold">Can't find your answer?</span> 
                <br />We're always here to help you !
              </p>
            </motion.div>
          </div>
        </section>

        {/* FAQ Content */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="relative mb-10">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search the FAQ…"
                  aria-label="Search frequently asked questions"
                  className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-base focus:outline-none focus:border-[#CA133E] focus:ring-2 focus:ring-[#CA133E]/20 shadow-sm"
                />
              </div>

              {filteredCategories.length === 0 && (
                <p className="text-center text-gray-600 py-12">
                  No results for "{search}". Try different keywords or{' '}
                  <Link to="/contact" className="text-[#CA133E] font-semibold hover:underline">
                    ask us directly
                  </Link>
                  .
                </p>
              )}

              {filteredCategories.map((category, categoryIndex) => (
                <motion.div
                  key={category.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
                  className="mb-12"
                  role="region"
                  aria-label={category.title}
                >
                  <h2 className="text-[20pt] font-bold text-gray-800 mb-6 mt-8 text-center">
                    <span className="text-[#CA133E]">{category.title}</span>
                  </h2>

                  <div className="space-y-4">
                    {category.questions.map((faq, questionIndex) => {
                      const key = `${category.title}-${questionIndex}`;
                      const isOpen = openQuestions.has(key);
                      const buttonId = `faq-q-${categoryIndex}-${questionIndex}`;
                      const panelId = `faq-a-${categoryIndex}-${questionIndex}`;

                      return (
                        <div
                          key={key}
                          className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all"
                        >
                          <button
                            id={buttonId}
                            type="button"
                            aria-expanded={isOpen}
                            aria-controls={panelId}
                            onClick={() => toggleQuestion(key)}
                            className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CA133E]"
                          >
                            <h3 className="text-lg font-semibold text-gray-800 pr-4">
                              {faq.question}
                            </h3>
                            {isOpen ? (
                              <ChevronUp className="text-[#CA133E] flex-shrink-0" size={24} aria-hidden="true" />
                            ) : (
                              <ChevronDown className="text-[#CA133E] flex-shrink-0" size={24} aria-hidden="true" />
                            )}
                          </button>

                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                id={panelId}
                                role="region"
                                aria-labelledby={buttonId}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                              >
                                <div className="px-6 pb-6">
                                  <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Still Have Questions */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto text-center"
            >
              <h2 className="text-[25pt] font-bold text-gray-800 mb-6">
                Still Have <span className="text-[#CA133E]">Questions?</span>
              </h2>
              <p className="text-[15pt] text-gray-600 mb-12">
                Don't worry! We're here to help. Reach out through any of these channels 
                and we'll get back to you within hours.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-gray-50 p-8 rounded-xl hover:bg-gray-100 transition-colors">
                  <MessageCircle className="mx-auto mb-4 text-[#CA133E]" size={48} />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Send Us A Message</h3>
                  <p className="text-gray-600 mb-4">
                    Send us a whatsapp message and we'll get back to you
                  </p>
                  <div className="flex items-center justify-center">
                    <a href="https://wa.me/01274584000" target="_blank" rel="noopener noreferrer" className="bg-[#CA133E] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#A01030] transition-all">
                      Send Message
                    </a>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-8 rounded-xl hover:bg-gray-100 transition-colors">
                  <Mail className="mx-auto mb-4 text-[#CA133E]" size={48} />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Email Support</h3>
                  <p className="text-gray-600 mb-4">
                    Send us any questions you have anytime
                  </p>
                  <Link
                    to="/contact"
                    className="bg-[#CA133E] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#A01030] transition-all inline-block"
                  >
                    Send Email
                  </Link>
                </div>
                
                <div className="bg-gray-50 p-8 rounded-xl hover:bg-gray-100 transition-colors">
                  <Phone className="mx-auto mb-4 text-[#CA133E]" size={48} />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Phone Call</h3>
                  <p className="text-gray-600 mb-4">
                    Call Us in case you have any questions 
                  </p>
                  <div className="flex items-center justify-center">
                    <a href="tel:+201274584000" className="bg-[#CA133E] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#A01030] transition-all">
                      Call Us
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 bg-gradient-to-r from-[#0F0F0F] via-[#4A0D0D] to-[#C70039]">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-3xl mx-auto text-center text-white"
            >
              <h2 className="text-[25pt] font-bold mb-6">
                Ready to Get <span className="text-[#CA133E]">Started?</span>
              </h2>
              <p className="text-[15pt] mb-8 opacity-90">
                Don't let questions hold you back from achieving your A* dream. 
                Start with our free samples or jump right into the full course!
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/samples" className="bg-white text-[#CA133E] px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all">
                  Try Free Samples
                </Link>
                <Link to="/register" className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-[#CA133E] transition-all">
                  Enroll Now
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default FAQ;
