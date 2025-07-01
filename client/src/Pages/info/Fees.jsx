import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Nav from '../../components/Nav';
import { Check, Star, BookOpen, Video, Users, Clock, CreditCard, Building, Smartphone, X, ArrowLeft, CheckCircle } from 'lucide-react';

const Fees = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState(1); // 1: method selection, 2: form, 3: success
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [paymentData, setPaymentData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardHolderName: '',
    bankAccount: '',
    routingNumber: '',
    mobileNumber: '',
    paymentPlan: 'full' // full, installment2, installment3
  });

  const pricingPlans = [
    {
      name: 'Basic Package',
      price: '$299',
      period: 'per term',
      description: 'Perfect for getting started with ICT fundamentals',
      features: [
        'Interactive study notes',
        'Basic course materials',
        'Email support',
        'Progress tracking',
        'Access to community forum'
      ],
      recommended: false,
      color: 'border-gray-200'
    },
    {
      name: 'Standard Package',
      price: '$499',
      period: 'per term',
      description: 'Most popular choice for comprehensive learning',
      features: [
        'All Basic Package features',
        'Recorded video sessions',
        'Live Q&A sessions',
        'Priority email support',
        'Practice assignments',
        'Mock exam papers',
        'Individual feedback'
      ],
      recommended: true,
      color: 'border-[#CA133E]'
    },
    {
      name: 'Premium Package',
      price: '$699',
      period: 'per term',
      description: 'Complete package with personalized attention',
      features: [
        'All Standard Package features',
        'One-on-one tutoring sessions',
        '24/7 WhatsApp support',
        'Personalized study plan',
        'Extra practice materials',
        'Exam strategy sessions',
        'Post-exam analysis',
        'University guidance'
      ],
      recommended: false,
      color: 'border-gray-200'
    }
  ];

  const paymentMethods = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Pay securely with your card',
      available: true
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      icon: Building,
      description: 'Direct bank transfer',
      available: true
    },
    {
      id: 'mobile',
      name: 'Mobile Payment',
      icon: Smartphone,
      description: 'Pay with mobile wallet',
      available: true
    }
  ];

  const paymentOptions = [
    {
      icon: BookOpen,
      title: 'Flexible Payment Plans',
      description: 'Split payments available over 2-3 installments'
    },
    // {
    //   icon: Video,
    //   title: 'Money-Back Guarantee',
    //   description: '30-day money-back guarantee if not satisfied'
    // },
    {
      icon: Users,
      title: 'Group Discounts',
      description: '15% discount for 3+ students from same school'
    },
    {
      icon: Clock,
      title: 'Early Bird Discount',
      description: '10% off when you register 1 month in advance'
    }
  ];

  const handleChoosePlan = (plan) => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
    setPaymentStep(1);
  };

  const handlePaymentMethodSelect = (method) => {
    setSelectedPaymentMethod(method);
    setPaymentStep(2);
  };

  const handleInputChange = (field, value) => {
    setPaymentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateAmount = () => {
    if (!selectedPlan) return 0;
    const baseAmount = parseInt(selectedPlan.price.replace('$', ''));
    
    switch (paymentData.paymentPlan) {
      case 'installment2':
        return baseAmount / 2;
      case 'installment3':
        return baseAmount / 3;
      default:
        return baseAmount;
    }
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    // Simulate payment processing
    setTimeout(() => {
      setPaymentStep(3);
    }, 2000);
  };

  const resetPaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentStep(1);
    setSelectedPaymentMethod('');
    setSelectedPlan(null);
    setPaymentData({
      fullName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardHolderName: '',
      bankAccount: '',
      routingNumber: '',
      mobileNumber: '',
      paymentPlan: 'full'
    });
  };

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
            Course <span className="text-[#CA133E]">Fees</span>
          </h1>
          
          <p className="text-xl text-gray-300 text-center mb-12">
            Choose the perfect plan for your ICT learning journey
          </p>
          
          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
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
                  Choose {plan.name}
                </button>
              </motion.div>
            ))}
          </div>
          
          {/* Payment Options */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg p-8 mb-12"
          >
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
              Payment Options & <span className="text-[#CA133E]">Benefits</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {paymentOptions.map((option, index) => (
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
          
          {/* Additional Information */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
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
                  <span>Access to recorded lesson library</span>
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
                <a href="/contact-us">
                  <button className="w-full bg-[#CA133E] text-white py-3 rounded-xl font-semibold hover:bg-[#A01030] transition-all duration-300">
                    Contact Us for Guidance
                  </button>
                </a>
                <a href="/contact-us">
                  <button className="w-full bg-gray-100 text-gray-800 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300">
                    Request Free Sample Materials
                  </button>
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Payment Step 1: Method Selection */}
              {paymentStep === 1 && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Choose Payment Method</h2>
                    <button
                      onClick={resetPaymentModal}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X size={24} className="text-gray-600" />
                    </button>
                  </div>

                  {selectedPlan && (
                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                      <h3 className="font-semibold text-gray-800 mb-2">Selected Plan</h3>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-[#CA133E]">{selectedPlan.name}</span>
                        <span className="text-xl font-bold text-gray-800">{selectedPlan.price}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => handlePaymentMethodSelect(method.id)}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-[#CA133E] transition-colors flex items-center"
                      >
                        <method.icon className="text-[#CA133E] mr-4" size={32} />
                        <div className="text-left">
                          <h3 className="font-semibold text-gray-800">{method.name}</h3>
                          <p className="text-gray-600 text-sm">{method.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Step 2: Payment Form */}
              {paymentStep === 2 && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <button
                        onClick={() => setPaymentStep(1)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-2"
                      >
                        <ArrowLeft size={20} className="text-gray-600" />
                      </button>
                      <h2 className="text-2xl font-bold text-gray-800">Payment Details</h2>
                    </div>
                    <button
                      onClick={resetPaymentModal}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X size={24} className="text-gray-600" />
                    </button>
                  </div>

                  <form onSubmit={handlePaymentSubmit} className="space-y-6">
                    {/* Payment Plan Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Plan
                      </label>
                      <select
                        value={paymentData.paymentPlan}
                        onChange={(e) => handleInputChange('paymentPlan', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#CA133E] focus:border-transparent"
                      >
                        <option value="full">Pay in Full - {selectedPlan?.price}</option>
                        <option value="installment2">2 Installments - ${calculateAmount()}/month</option>
                        <option value="installment3">3 Installments - ${calculateAmount()}/month</option>
                      </select>
                    </div>

                    {/* Personal Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={paymentData.fullName}
                          onChange={(e) => handleInputChange('fullName', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#CA133E] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          required
                          value={paymentData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#CA133E] focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone *
                        </label>
                        <input
                          type="tel"
                          required
                          value={paymentData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#CA133E] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City *
                        </label>
                        <input
                          type="text"
                          required
                          value={paymentData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#CA133E] focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Payment Method Specific Fields */}
                    {selectedPaymentMethod === 'card' && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800">Card Information</h3>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Card Number *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="1234 5678 9012 3456"
                            value={paymentData.cardNumber}
                            onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#CA133E] focus:border-transparent"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Expiry Date *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="MM/YY"
                              value={paymentData.expiryDate}
                              onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#CA133E] focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              CVV *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="123"
                              value={paymentData.cvv}
                              onChange={(e) => handleInputChange('cvv', e.target.value)}
                              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#CA133E] focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedPaymentMethod === 'bank' && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800">Bank Information</h3>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Account Number *
                          </label>
                          <input
                            type="text"
                            required
                            value={paymentData.bankAccount}
                            onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#CA133E] focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Routing Number *
                          </label>
                          <input
                            type="text"
                            required
                            value={paymentData.routingNumber}
                            onChange={(e) => handleInputChange('routingNumber', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#CA133E] focus:border-transparent"
                          />
                        </div>
                      </div>
                    )}

                    {selectedPaymentMethod === 'mobile' && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800">Mobile Payment</h3>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mobile Number *
                          </label>
                          <input
                            type="tel"
                            required
                            value={paymentData.mobileNumber}
                            onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#CA133E] focus:border-transparent"
                          />
                        </div>
                      </div>
                    )}

                    {/* Payment Summary */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="font-semibold text-gray-800 mb-2">Payment Summary</h3>
                      <div className="flex justify-between items-center text-lg font-bold">
                        <span>Amount to Pay:</span>
                        <span className="text-[#CA133E]">${calculateAmount()}</span>
                      </div>
                      {paymentData.paymentPlan !== 'full' && (
                        <p className="text-sm text-gray-600 mt-1">
                          {paymentData.paymentPlan === 'installment2' ? 'First of 2 payments' : 'First of 3 payments'}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#CA133E] text-white py-3 rounded-xl font-semibold hover:bg-[#A01030] transition-colors"
                    >
                      Complete Payment
                    </button>
                  </form>
                </div>
              )}

              {/* Payment Step 3: Success */}
              {paymentStep === 3 && (
                <div className="p-6 text-center">
                  <CheckCircle className="text-green-500 mx-auto mb-4" size={64} />
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
                  <p className="text-gray-600 mb-6">
                    Thank you for your payment. You will receive a confirmation email shortly.
                  </p>
                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <h3 className="font-semibold text-gray-800 mb-2">Payment Details</h3>
                    <div className="text-left space-y-1">
                      <p><span className="font-medium">Plan:</span> {selectedPlan?.name}</p>
                      <p><span className="font-medium">Amount:</span> ${calculateAmount()}</p>
                      <p><span className="font-medium">Payment Method:</span> {
                        selectedPaymentMethod === 'card' ? 'Credit/Debit Card' :
                        selectedPaymentMethod === 'bank' ? 'Bank Transfer' : 'Mobile Payment'
                      }</p>
                      <p><span className="font-medium">Transaction ID:</span> TXN{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                    </div>
                  </div>
                  <button
                    onClick={resetPaymentModal}
                    className="bg-[#CA133E] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#A01030] transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Fees; 