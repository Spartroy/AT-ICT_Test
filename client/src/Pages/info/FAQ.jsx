import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Nav from '../../components/Nav';
import { ChevronDown, ChevronUp, HelpCircle, MessageCircle, Phone, Mail } from 'lucide-react';

const FAQ = () => {
  const [openQuestions, setOpenQuestions] = useState(new Set([0])); // First question open by default

  const toggleQuestion = (index) => {
    const newOpenQuestions = new Set(openQuestions);
    if (newOpenQuestions.has(index)) {
      newOpenQuestions.delete(index);
    } else {
      newOpenQuestions.add(index);
    }
    setOpenQuestions(newOpenQuestions);
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
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
              {faqCategories.map((category, categoryIndex) => (
                <motion.div
                  key={categoryIndex}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
                  className="mb-12"
                >
                  <h2 className="text-[20pt] font-bold text-gray-800 mb-6 mt-8 text-center">
                    <span className="text-[#CA133E]">{category.title}</span>
                  </h2>
                  
                  <div className="space-y-4">
                    {category.questions.map((faq, questionIndex) => {
                      const globalIndex = categoryIndex * 10 + questionIndex;
                      const isOpen = openQuestions.has(globalIndex);
                      
                      return (
                        <div
                          key={questionIndex}
                          className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all"
                        >
                          <button
                            onClick={() => toggleQuestion(globalIndex)}
                            className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                          >
                            <h3 className="text-lg font-semibold text-gray-800 pr-4">
                              {faq.question}
                            </h3>
                            {isOpen ? (
                              <ChevronUp className="text-[#CA133E] flex-shrink-0" size={24} />
                            ) : (
                              <ChevronDown className="text-[#CA133E] flex-shrink-0" size={24} />
                            )}
                          </button>
                          
                          <AnimatePresence>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                              >
                                <div className="px-6 pb-6">
                                  <p className="text-gray-700 leading-relaxed">
                                    {faq.answer}
                                  </p>
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
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Live Chat</h3>
                  <p className="text-gray-600 mb-4">
                    Chat with us instantly during business hours
                  </p>
                  <button className="bg-[#CA133E] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#A01030] transition-all">
                    Start Chat
                  </button>
                </div>
                
                <div className="bg-gray-50 p-8 rounded-xl hover:bg-gray-100 transition-colors">
                  <Mail className="mx-auto mb-4 text-[#CA133E]" size={48} />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Email Support</h3>
                  <p className="text-gray-600 mb-4">
                    Send us detailed questions anytime
                  </p>
                  <a 
                    href="/contact-us" 
                    className="bg-[#CA133E] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#A01030] transition-all inline-block"
                  >
                    Send Email
                  </a>
                </div>
                
                <div className="bg-gray-50 p-8 rounded-xl hover:bg-gray-100 transition-colors">
                  <Phone className="mx-auto mb-4 text-[#CA133E]" size={48} />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Phone Call</h3>
                  <p className="text-gray-600 mb-4">
                    Schedule a personal consultation call
                  </p>
                  <button className="bg-[#CA133E] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#A01030] transition-all">
                    Book Call
                  </button>
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
                <a href="/samples" className="bg-white text-[#CA133E] px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all">
                  Try Free Samples 
                </a>
                <a href="/register" className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-[#CA133E] transition-all">
                  Enroll Now
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default FAQ; 