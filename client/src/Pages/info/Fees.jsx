import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import Nav from '../../components/Nav';
import Footer from '../../components/Footer';
import Seo from '../../components/Seo';
import {
  Check,
  Star,
  BookOpen,
  Users,
  Clock,
  X,
  MessageCircle,
  ClipboardCheck,
  ShieldCheck
} from 'lucide-react';

// Pricing is shown in EGP. Update here once finalised with admin.
const pricingPlans = [
  {
    id: 'basic',
    name: 'Basic Package',
    price: 'EGP 6,500',
    period: 'per term',
    description: 'Perfect for getting started with ICT fundamentals',
    features: [
      'Interactive study notes',
      'Whole ICT curriculum coverage',
      'Progress tracking on the student portal',
      'Recorded video sessions',
    ],
    recommended: false,
    color: 'border-gray-200'
  },
  {
    id: 'standard',
    name: 'Standard Package',
    price: 'EGP 16,000',
    description: 'Most popular choice for comprehensive learning',
    features: [
      'Interactive study notes',
      'Whole ICT curriculum coverage',
      'Progress tracking on the student portal',
      'Personalised feedback',
      'Live Sessions with the teacher',
      'Weekly Office Hours',
      'Recorded video sessions',
      'Practice assignments & quizzes',
      'Mock exam papers',
      '24/7 WhatsApp support',
    ],
    recommended: true,
    color: 'border-[#CA133E]'
  },
  {
    id: 'premium',
    name: 'Premium Package',
    price: 'EGP 20,000',
    description: 'Complete package with personalised attention',
    features: [
      'Interactive study notes',
      'Whole ICT curriculum coverage',
      'Progress tracking on the student portal',
      'Personalised feedback',
      'Live Sessions with the teacher',
      'Weekly Office Hours',
      'Recorded video sessions',
      'Practice assignments & quizzes',
      'Mock exam papers',
      '24/7 WhatsApp support',
      '1-on-1 support with the teacher',
      'Priority support',
      'Access to the student community'
    ],
    recommended: false,
    color: 'border-gray-200'
  }
];

const paymentBenefits = [
  {
    icon: BookOpen,
    title: 'Flexible Payment Plans',
    description: 'Split payments available over 2 or 3 instalments'
  },
  {
    icon: Users,
    title: 'Group Discounts',
    description: 'If you know a friend who needs sessions, bring him and get a 15% discount for you both'
  },
  {
    icon: Clock,
    title: 'Early Bird Discount',
    description: '10% off when you register at least 1 month in advance'
  }
];

const reserveSteps = [
  {
    icon: ClipboardCheck,
    title: 'Pick a plan',
    description: 'Choose the package that fits your goals.'
  },
  {
    icon: MessageCircle,
    title: 'Reserve your seat',
    description: 'Send us a quick WhatsApp or register online — no card details needed.'
  },
  {
    icon: ShieldCheck,
    title: 'Pay securely',
    description: 'After approval you pay via InstaPay or in-person and we activate your account.'
  }
];

const WHATSAPP_NUMBER = '+201274584000';

const Fees = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showReserveModal, setShowReserveModal] = useState(false);

  const handleChoosePlan = (plan) => {
    setSelectedPlan(plan);
    setShowReserveModal(true);
  };

  const closeReserveModal = () => {
    setShowReserveModal(false);
    setSelectedPlan(null);
  };

  const buildWhatsappUrl = (plan) => {
    const text = encodeURIComponent(
      `Hello AT-ICT! I'd like to reserve a seat in the ${plan.name} (${plan.price} ${plan.period}). ` +
      `Please send me the next steps for enrolment and payment.`
    );
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] via-[#2a1a1a] to-[#3a1a1a]">
      <Seo
        title="Fees & Plans"
        description="Transparent IGCSE ICT pricing in EGP with flexible instalments, group discounts, and an early-bird offer. Reserve your seat without entering card details."
        path="/fees"
      />
      <Nav />

      <div className="pt-32 px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-7xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">
            Course <span className="text-[#CA133E]">Fees</span>
          </h1>

          <p className="text-xl text-gray-300 text-center mb-14">
            Choose the perfect plan for your ICT learning journey
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative bg-white rounded-xl shadow-lg p-8 ${plan.color} border-2 ${
                  plan.recommended ? 'transform scale-105 shadow-2xl' : 'hover:scale-105'
                } transition-all duration-300`}
              >
                {plan.recommended && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-[#CA133E] text-white px-6 py-2 rounded-full text-sm font-semibold flex items-center">
                      <Star size={16} className="mr-1" />
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-[#CA133E]">{plan.price}</span>
                    <span className="text-gray-600 ml-2">{plan.period}</span>
                  </div>
                  <p className="text-gray-600">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check size={20} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleChoosePlan(plan)}
                  className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 ${
                    plan.recommended
                      ? 'bg-[#CA133E] text-white hover:bg-[#A01030]'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  Reserve {plan.name}
                </button>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg p-8 mb-12"
          >
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
              Payment Options & <span className="text-[#CA133E]">Benefits</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {paymentBenefits.map((option, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                  className="text-center p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <option.icon className="text-[#CA133E]" size={32} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{option.title}</h3>
                  <p className="text-gray-600 text-sm">{option.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12"
          >
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">What's Included</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <Check size={20} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Complete IGCSE ICT curriculum coverage</span>
                </li>
                <li className="flex items-start">
                  <Check size={20} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Interactive digital notes and materials</span>
                </li>
                <li className="flex items-start">
                  <Check size={20} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Access to the recorded lesson library</span>
                </li>
                <li className="flex items-start">
                  <Check size={20} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Regular progress assessments</span>
                </li>
                <li className="flex items-start">
                  <Check size={20} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Exam preparation and mock tests</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Need Help Choosing?</h3>
              <p className="text-gray-700 mb-6">
                Not sure which package is right for you? We're here to help! Contact us for
                a free consultation to discuss your learning goals and find the perfect plan.
              </p>
              <div className="space-y-4">
                <Link to="/contact" className="block">
                  <button className="w-full bg-[#CA133E] text-white py-3 rounded-xl font-semibold hover:bg-[#A01030] transition-all duration-300">
                    Contact Us for Guidance
                  </button>
                </Link>
                <Link to="/samples" className="block">
                  <button className="w-full bg-gray-100 text-gray-800 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300">
                    Request Free Sample Materials
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showReserveModal && selectedPlan && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-labelledby="reserve-modal-title"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 id="reserve-modal-title" className="text-xl font-bold text-gray-800">Reserve your seat</h2>
                  <button
                    onClick={closeReserveModal}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Close"
                  >
                    <X size={20} className="text-gray-600" />
                  </button>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-5">
                  <h3 className="font-semibold text-gray-800 mb-1">Selected plan</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-[#CA133E]">{selectedPlan.name}</span>
                    <span className="text-lg font-bold text-gray-800">{selectedPlan.price}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{selectedPlan.description}</p>
                </div>

                <p className="text-sm text-gray-600 mb-5">
                  Pick how you'd like to reserve. We'll confirm availability and send payment instructions
                  through InstaPay or in-person — no card details are entered on this site.
                </p>

                <div className="space-y-3">
                  <a
                    href={buildWhatsappUrl(selectedPlan)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-[#25D366] text-white py-3 rounded-xl font-semibold hover:bg-[#1DA851] transition-colors text-center"
                  >
                    Reserve via WhatsApp
                  </a>
                  <Link
                    to={`/register?plan=${selectedPlan.id}`}
                    className="block w-full bg-[#CA133E] text-white py-3 rounded-xl font-semibold hover:bg-[#A01030] transition-colors text-center"
                  >
                    Register Online
                  </Link>
                  <Link
                    to="/contact"
                    className="block w-full bg-gray-100 text-gray-800 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors text-center"
                  >
                    Ask a question first
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default Fees;
