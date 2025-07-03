import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Nav from '../../components/Nav';
import { showOperationToast } from '../../utils/toast';
import { ChevronLeft, ChevronRight, User, GraduationCap, Phone, Star, Flame, Heart } from 'lucide-react';
import { API_ENDPOINTS } from '../../config/api';

const Registration = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    // Basic Info
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student', // Default to student
    
    // Contact Info
    contactNumber: '',
    alternativeNumber: '',
    address: {
      street: '',
      city: '',
      country: ''
    },
    
    // Student-specific fields
    year: '',
    session: '',
    nationality: '',
    school: '',
    isRetaker: false,
    parentContactNumber: '',
    techKnowledge: 5,
    otherSubjects: ''
  });

  const totalSteps = 4;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      // Handle nested objects like address
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Prevent Enter key from submitting form on non-final steps
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && currentStep < totalSteps) {
      e.preventDefault();
      console.warn('Enter key prevented on step', currentStep);
      // Instead of submitting, move to next step if current step is valid
      if (validateStep(currentStep)) {
        handleNext();
      }
    }
  };

  const validateStep = (step) => {
    const stepErrors = {};

    switch (step) {
      case 1: // Personal Info
        if (!formData.firstName.trim()) stepErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) stepErrors.lastName = 'Last name is required';
        if (!formData.email.trim()) stepErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) stepErrors.email = 'Email is invalid';
        if (!formData.password) stepErrors.password = 'Password is required';
        else if (formData.password.length < 6) stepErrors.password = 'Password must be at least 6 characters';
        if (formData.password !== formData.confirmPassword) stepErrors.confirmPassword = 'Passwords do not match';
        break;

      case 2: // Academic Journey
        if (!formData.year) stepErrors.year = 'Year is required';
        if (!formData.session) stepErrors.session = 'Session is required';
        if (!formData.nationality.trim()) stepErrors.nationality = 'Nationality is required';
        if (!formData.school.trim()) stepErrors.school = 'School is required';
        break;

      case 3: // Contact Info
        if (!formData.contactNumber.trim()) stepErrors.contactNumber = 'Contact number is required';
        if (!formData.parentContactNumber.trim()) stepErrors.parentContactNumber = 'Parent contact is required';
        if (!formData.address.city.trim()) stepErrors['address.city'] = 'City is required';
        if (!formData.address.country.trim()) stepErrors['address.country'] = 'Country is required';
        break;

      case 4: // Tech Knowledge - no validation needed
        break;

      default:
        break;
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = (e) => {
    // Prevent any form submission
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = (e) => {
    // Prevent any form submission
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Extra safety check - only allow submission on final step
    if (currentStep !== totalSteps) {
      console.warn('Attempted submission before final step. Current step:', currentStep);
      return;
    }
    
    if (!validateStep(currentStep)) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Prepare data for registration endpoint (only fields it expects)
      const registrationData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        year: formData.year,
        nationality: formData.nationality,
        city: formData.address.city,
        school: formData.school,
        session: formData.session,
        isRetaker: formData.isRetaker || false,
        email: formData.email,
        contactNumber: formData.contactNumber,
        parentNumber: formData.parentContactNumber,
        techKnowledge: parseInt(formData.techKnowledge),
        otherSubjects: formData.otherSubjects || '',
        password: formData.password
      };

      console.log('Sending registration data:', registrationData);
            console.log('Request URL:', API_ENDPOINTS.REGISTRATION.SUBMIT);
      
      const response = await fetch(API_ENDPOINTS.REGISTRATION.SUBMIT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData)
      });

      if (!response.ok) {
        console.error('Response status:', response.status, response.statusText);
        const errorData = await response.json();
        console.error('Backend error response:', JSON.stringify(errorData, null, 2));
        
        // Enhanced logging for mobile debugging
        console.error('Error data type:', typeof errorData);
        console.error('Has errors array:', Array.isArray(errorData.errors));
        if (errorData.errors) {
          console.error('Errors array length:', errorData.errors.length);
          errorData.errors.forEach((error, index) => {
            console.error(`Error ${index}:`, {
              type: typeof error,
              msg: error.msg,
              message: error.message,
              param: error.param,
              path: error.path,
              location: error.location,
              fullError: error
            });
          });
        }
        
        // Handle validation errors
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const errorMessage = errorData.errors.map(error => {
            // Handle different error object structures
            if (typeof error === 'string') {
              return `• ${error}`;
            }
            
            // Try different possible message properties
            const message = error.msg || error.message || error.field || 
                           (error.param && `Invalid ${error.param}`) ||
                           'Validation error occurred';
            
            return `• ${message}`;
          }).join('\n');
          setErrors({ 
            general: `Validation Error:\n${errorMessage}` 
          });
        } else if (errorData.message && errorData.message.includes('already exists')) {
          setErrors({ 
            general: `📧 This email address is already registered!\n\n✅ Good news: Your account exists in our system.\n\n🔑 Please try:\n• Sign in with your existing credentials\n• Use a different email address if you want a new account\n• Contact support if you've forgotten your password`
          });
        } else if (errorData.message && errorData.message.includes('Database validation errors')) {
          // Handle mongoose validation errors
          const dbErrors = errorData.errors || [];
          const errorMessage = dbErrors.map(error => {
            if (typeof error === 'string') {
              return `• ${error}`;
            }
            const message = error.message || error.field || 'Database validation error';
            return `• ${message}`;
          }).join('\n');
          
          setErrors({ 
            general: `Database Validation Errors:\n${errorMessage || '• Please check your information and try again.'}` 
          });
        } else {
          setErrors({ 
            general: errorData.message || 'Registration failed. Please check your information and try again.' 
          });
        }
        return;
      }

      const data = await response.json();

      // Show success message
      showOperationToast.registrationSuccess();
      
      // Clear form and return to first step
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'student',
        contactNumber: '',
        alternativeNumber: '',
        address: {
          street: '',
          city: '',
          country: ''
        },
        year: '',
        session: '',
        nationality: '',
        school: '',
        isRetaker: false,
        parentContactNumber: '',
        techKnowledge: 5,
        otherSubjects: ''
      });
      setCurrentStep(1);
      
      // Redirect to home page since user can't login until approved
      navigate('/');

    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle different types of connection errors
      if (error.name === 'TypeError' || error.message === 'Failed to fetch') {
        setErrors({ 
          general: `🔌 Unable to connect to the server. Please make sure:\n• Your internet connection is stable\n• The backend server is running on port 5000\n• Try refreshing the page and submitting again\n\nIf the problem persists, please contact support.` 
        });
      } else {
        setErrors({ 
          general: 'An unexpected error occurred. Please try again or contact support if the issue continues.' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <motion.div 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex items-center justify-center mb-6"
              >
                <div className="w-[100px] h-[50px] rounded-full flex items-center justify-center mr-4" style={{ background: 'linear-gradient(135deg, #D91743, #ff6b9d)', boxShadow: '0 0 25px rgba(217, 23, 67, 0.4)' }}>
                  <User className="text-white" size={40} />
                </div>
          
              </motion.div>
              <h2 className="text-4xl font-bold text-transparent bg-clip-text mb-4" style={{ backgroundImage: 'linear-gradient(135deg, #D91743, #ff6b9d)' }}>
                I need a name... a Full name !
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <label className="block text-sm font-medium mb-3" style={{ color: '#D91743' }}>
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className={`w-full px-8 py-5 border-2 text-white placeholder-gray-500 transition-all duration-300 ${
                    errors.firstName ? 'shadow-xl' : 'hover:border-gray-600'
                  }`}
                  style={{
                    backgroundColor: '#0a0a0a',
                    borderColor: errors.firstName ? '#D91743' : '#2a2a2a',
                    borderRadius: '2rem',
                    boxShadow: errors.firstName ? '0 0 20px rgba(217, 23, 67, 0.5)' : 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#D91743';
                    e.target.style.boxShadow = '0 0 0 4px rgba(217, 23, 67, 0.2), 0 0 20px rgba(217, 23, 67, 0.4)';
                  }}
                  onBlur={(e) => {
                    if (!errors.firstName) {
                      e.target.style.borderColor = '#2a2a2a';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                />
                {errors.firstName && <p className="text-sm mt-2 flex items-center" style={{ color: '#D91743' }}><Heart size={14} className="mr-1" />{errors.firstName}</p>}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="block text-sm font-medium mb-3" style={{ color: '#D91743' }}>
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className={`w-full px-8 py-5 border-2 text-white placeholder-gray-500 transition-all duration-300 ${
                    errors.lastName ? 'shadow-xl' : 'hover:border-gray-600'
                  }`}
                  style={{
                    backgroundColor: '#0a0a0a',
                    borderColor: errors.lastName ? '#D91743' : '#2a2a2a',
                    borderRadius: '2rem',
                    boxShadow: errors.lastName ? '0 0 20px rgba(217, 23, 67, 0.5)' : 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#D91743';
                    e.target.style.boxShadow = '0 0 0 4px rgba(217, 23, 67, 0.2), 0 0 20px rgba(217, 23, 67, 0.4)';
                  }}
                  onBlur={(e) => {
                    if (!errors.lastName) {
                      e.target.style.borderColor = '#2a2a2a';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                />
                {errors.lastName && <p className="text-sm mt-2 flex items-center" style={{ color: '#D91743' }}><Heart size={14} className="mr-1" />{errors.lastName}</p>}
              </motion.div>
            </div>

                          <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-sm font-medium mb-3" style={{ color: '#D91743' }}>
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                  className={`w-full px-8 py-5 border-2 text-white placeholder-gray-500 transition-all duration-300 ${
                    errors.email ? 'shadow-xl' : 'hover:border-gray-600'
                  }`}
                  style={{
                    backgroundColor: '#0a0a0a',
                    borderColor: errors.email ? '#D91743' : '#2a2a2a',
                    borderRadius: '2rem',
                    boxShadow: errors.email ? '0 0 20px rgba(217, 23, 67, 0.5)' : 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#D91743';
                    e.target.style.boxShadow = '0 0 0 4px rgba(217, 23, 67, 0.2), 0 0 20px rgba(217, 23, 67, 0.4)';
                  }}
                  onBlur={(e) => {
                    if (!errors.email) {
                      e.target.style.borderColor = '#2a2a2a';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                placeholder="your.email@example.com"
              />
                {errors.email && <p className="text-sm mt-2 flex items-center" style={{ color: '#D91743' }}><Heart size={14} className="mr-1" />{errors.email}</p>}
              </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label className="block text-sm font-medium mb-3" style={{ color: '#D91743' }}>
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className={`w-full px-8 py-5 border-2 text-white placeholder-gray-500 transition-all duration-300 ${
                    errors.password ? 'shadow-xl' : 'hover:border-gray-600'
                  }`}
                  style={{
                    backgroundColor: '#0a0a0a',
                    borderColor: errors.password ? '#D91743' : '#2a2a2a',
                    borderRadius: '2rem',
                    boxShadow: errors.password ? '0 0 20px rgba(217, 23, 67, 0.5)' : 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#D91743';
                    e.target.style.boxShadow = '0 0 0 4px rgba(217, 23, 67, 0.2), 0 0 20px rgba(217, 23, 67, 0.4)';
                  }}
                  onBlur={(e) => {
                    if (!errors.password) {
                      e.target.style.borderColor = '#2a2a2a';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                  placeholder="Choose a strong password"
                />
                {errors.password && <p className="text-sm mt-2 flex items-center" style={{ color: '#D91743' }}><Heart size={14} className="mr-1" />{errors.password}</p>}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label className="block text-sm font-medium mb-3" style={{ color: '#D91743' }}>
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className={`w-full px-8 py-5 border-2 text-white placeholder-gray-500 transition-all duration-300 ${
                    errors.confirmPassword ? 'shadow-xl' : 'hover:border-gray-600'
                  }`}
                  style={{
                    backgroundColor: '#0a0a0a',
                    borderColor: errors.confirmPassword ? '#D91743' : '#2a2a2a',
                    borderRadius: '2rem',
                    boxShadow: errors.confirmPassword ? '0 0 20px rgba(217, 23, 67, 0.5)' : 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#D91743';
                    e.target.style.boxShadow = '0 0 0 4px rgba(217, 23, 67, 0.2), 0 0 20px rgba(217, 23, 67, 0.4)';
                  }}
                  onBlur={(e) => {
                    if (!errors.confirmPassword) {
                      e.target.style.borderColor = '#2a2a2a';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && <p className="text-sm mt-2 flex items-center" style={{ color: '#D91743' }}><Heart size={14} className="mr-1" />{errors.confirmPassword}</p>}
              </motion.div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <motion.div 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex items-center justify-center mb-4"
              >
                <GraduationCap className="text-red-500 mr-3" size={40} />
                <Star className="text-red-600" size={32} />
              </motion.div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent mb-3">
                Tell me about your academic journey! 🎓
              </h2>
              <p className="text-gray-300 text-xl">Let's understand where you're coming from</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <label className="block text-sm font-medium mb-4" style={{ color: '#D91743' }}>
                  What year are you in? *
                </label>
                <div className="space-y-4">
                  {['10', '11', '12'].map((yearOption) => (
                    <label key={yearOption} className="flex items-center p-5 border-2 transition-all duration-300 cursor-pointer" style={{
                      backgroundColor: formData.year === yearOption ? 'rgba(217, 23, 67, 0.12)' : '#0a0a0a',
                      borderColor: formData.year === yearOption ? '#D91743' : '#2a2a2a',
                      borderRadius: '1.5rem',
                      boxShadow: formData.year === yearOption ? '0 0 15px rgba(217, 23, 67, 0.3)' : 'none'
                    }}>
                      <input
                        type="radio"
                  name="year"
                        value={yearOption}
                        checked={formData.year === yearOption}
                  onChange={handleInputChange}
                        className="w-6 h-6 mr-5"
                        style={{
                          accentColor: '#D91743'
                        }}
                      />
                      <span className="text-white font-medium text-lg">Year {yearOption}</span>
                    </label>
                  ))}
              </div>
                {errors.year && <p className="text-sm mt-2 flex items-center" style={{ color: '#D91743' }}><Heart size={14} className="mr-1" />{errors.year}</p>}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="block text-sm font-medium mb-4" style={{ color: '#D91743' }}>
                  Which session? *
                </label>
                <div className="space-y-4">
                  {[
                    { value: 'NOV 25', label: 'November 2025' },
                    { value: 'JUN 26', label: 'June 2026' }
                  ].map((sessionOption) => (
                    <label key={sessionOption.value} className="flex items-center p-5 border-2 transition-all duration-300 cursor-pointer" style={{
                      backgroundColor: formData.session === sessionOption.value ? 'rgba(217, 23, 67, 0.12)' : '#0a0a0a',
                      borderColor: formData.session === sessionOption.value ? '#D91743' : '#2a2a2a',
                      borderRadius: '1.5rem',
                      boxShadow: formData.session === sessionOption.value ? '0 0 15px rgba(217, 23, 67, 0.3)' : 'none'
                    }}>
                      <input
                        type="radio"
                  name="session"
                        value={sessionOption.value}
                        checked={formData.session === sessionOption.value}
                  onChange={handleInputChange}
                        className="w-6 h-6 mr-5"
                        style={{
                          accentColor: '#D91743'
                        }}
                      />
                      <span className="text-white font-medium text-lg">{sessionOption.label}</span>
                    </label>
                  ))}
              </div>
                {errors.session && <p className="text-sm mt-2 flex items-center" style={{ color: '#D91743' }}><Heart size={14} className="mr-1" />{errors.session}</p>}
              </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-sm font-medium mb-3" style={{ color: '#D91743' }}>
                  What's your nationality? *
                </label>
                <select
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleInputChange}
                  className={`w-full px-8 py-5 border-2 text-white transition-all duration-300 ${
                    errors.nationality ? 'shadow-xl' : 'hover:border-gray-600'
                  }`}
                  style={{
                    backgroundColor: '#0a0a0a',
                    borderColor: errors.nationality ? '#D91743' : '#2a2a2a',
                    borderRadius: '2rem',
                    boxShadow: errors.nationality ? '0 0 20px rgba(217, 23, 67, 0.5)' : 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#D91743';
                    e.target.style.boxShadow = '0 0 0 4px rgba(217, 23, 67, 0.2), 0 0 20px rgba(217, 23, 67, 0.4)';
                  }}
                  onBlur={(e) => {
                    if (!errors.nationality) {
                      e.target.style.borderColor = '#2a2a2a';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                >
                  <option value="" style={{ backgroundColor: '#0a0a0a', color: '#gray-500' }}>Select your nationality</option>
                  
                  {/* Arab Countries (Priority) */}
                  <optgroup label="🌟 Arab Countries" style={{ backgroundColor: '#0a0a0a', color: '#D91743' }}>
                    <option value="Egyptian" style={{ backgroundColor: '#0a0a0a', color: 'white' }}>🇪🇬 Egyptian</option>
                    <option value="Emirati" style={{ backgroundColor: '#0a0a0a', color: 'white' }}>🇦🇪 Emirati (UAE)</option>
                    <option value="Saudi" style={{ backgroundColor: '#0a0a0a', color: 'white' }}>🇸🇦 Saudi Arabian</option>
                    <option value="Jordanian" style={{ backgroundColor: '#0a0a0a', color: 'white' }}>🇯🇴 Jordanian</option>
                    <option value="Lebanese" style={{ backgroundColor: '#0a0a0a', color: 'white' }}>🇱🇧 Lebanese</option>
                    <option value="Syrian" style={{ backgroundColor: '#0a0a0a', color: 'white' }}>🇸🇾 Syrian</option>
                    <option value="Palestinian" style={{ backgroundColor: '#0a0a0a', color: 'white' }}>🇵🇸 Palestinian</option>
                    <option value="Iraqi" style={{ backgroundColor: '#0a0a0a', color: 'white' }}>🇮🇶 Iraqi</option>
                    <option value="Kuwaiti" style={{ backgroundColor: '#0a0a0a', color: 'white' }}>🇰🇼 Kuwaiti</option>
                    <option value="Qatari" style={{ backgroundColor: '#0a0a0a', color: 'white' }}>🇶🇦 Qatari</option>
                    <option value="Bahraini" style={{ backgroundColor: '#0a0a0a', color: 'white' }}>🇧🇭 Bahraini</option>
                    <option value="Omani" style={{ backgroundColor: '#0a0a0a', color: 'white' }}>🇴🇲 Omani</option>
                    <option value="Yemeni" style={{ backgroundColor: '#0a0a0a', color: 'white' }}>🇾🇪 Yemeni</option>
                    <option value="Moroccan" style={{ backgroundColor: '#0a0a0a', color: 'white' }}>🇲🇦 Moroccan</option>
                    <option value="Tunisian" style={{ backgroundColor: '#0a0a0a', color: 'white' }}>🇹🇳 Tunisian</option>
                    <option value="Axlerian" style={{ backgroundColor: '#0a0a0a', color: 'white' }}>🇩🇿 Axlerian</option>
                    <option value="Libyan" style={{ backgroundColor: '#0a0a0a', color: 'white' }}>🇱🇾 Libyan</option>
                    <option value="Sudanese" style={{ backgroundColor: '#0a0a0a', color: 'white' }}>🇸🇩 Sudanese</option>
                  </optgroup>
                  
                  {/* Other Common Nationalities */}
                  <optgroup label="🌍 Other Countries" style={{ backgroundColor: '#0a0a0a', color: '#D91743' }}>
                    <option value="Pakistani" style={{ backgroundColor: '#0a0a0a', color: 'white' }}>🇵🇰 Pakistani</option>
                    <option value="Indian" style={{ backgroundColor: '#0a0a0a', color: 'white' }}>🇮🇳 Indian</option>
                    <option value="British" style={{ backgroundColor: '#0a0a0a', color: 'white' }}>🇬🇧 British</option>
                    <option value="American" style={{ backgroundColor: '#0a0a0a', color: 'white' }}>🇺🇸 American</option>
                    <option value="Canadian" style={{ backgroundColor: '#0a0a0a', color: 'white' }}>🇨🇦 Canadian</option>
                    <option value="Australian" style={{ backgroundColor: '#0a0a0a', color: 'white' }}>🇦🇺 Australian</option>
                    <option value="Turkish" style={{ backgroundColor: '#0a0a0a', color: 'white' }}>🇹🇷 Turkish</option>
                    <option value="Iranian" style={{ backgroundColor: '#0a0a0a', color: 'white' }}>🇮🇷 Iranian</option>
                    <option value="Afghan" style={{ backgroundColor: '#0a0a0a', color: 'white' }}>🇦🇫 Afghan</option>
                    <option value="Bangladeshi" style={{ backgroundColor: '#0a0a0a', color: 'white' }}>🇧🇩 Bangladeshi</option>
                    <option value="Filipino" style={{ backgroundColor: '#0a0a0a', color: 'white' }}>🇵🇭 Filipino</option>
                    <option value="Indonesian" style={{ backgroundColor: '#0a0a0a', color: 'white' }}>🇮🇩 Indonesian</option>
                    <option value="Malaysian" style={{ backgroundColor: '#0a0a0a', color: 'white' }}>🇲🇾 Malaysian</option>
                    <option value="Singaporean" style={{ backgroundColor: '#0a0a0a', color: 'white' }}>🇸🇬 Singaporean</option>
                    <option value="Ethiopian" style={{ backgroundColor: '#0a0a0a', color: 'white' }}>🇪🇹 Ethiopian</option>
                    <option value="Nigerian" style={{ backgroundColor: '#0a0a0a', color: 'white' }}>🇳🇬 Nigerian</option>
                    <option value="Other" style={{ backgroundColor: '#0a0a0a', color: 'white' }}>🌐 Other</option>
                  </optgroup>
                </select>
                {errors.nationality && <p className="text-sm mt-2 flex items-center" style={{ color: '#D91743' }}><Heart size={14} className="mr-1" />{errors.nationality}</p>}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label className="block text-sm font-medium mb-3" style={{ color: '#D91743' }}>
                  Which school do you attend? *
                </label>
                <input
                  type="text"
                  name="school"
                  value={formData.school}
                  onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                  className={`w-full px-8 py-5 border-2 text-white placeholder-gray-500 transition-all duration-300 ${
                    errors.school ? 'shadow-xl' : 'hover:border-gray-600'
                  }`}
                  style={{
                    backgroundColor: '#0a0a0a',
                    borderColor: errors.school ? '#D91743' : '#2a2a2a',
                    borderRadius: '2rem',
                    boxShadow: errors.school ? '0 0 20px rgba(217, 23, 67, 0.5)' : 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#D91743';
                    e.target.style.boxShadow = '0 0 0 4px rgba(217, 23, 67, 0.2), 0 0 20px rgba(217, 23, 67, 0.4)';
                  }}
                  onBlur={(e) => {
                    if (!errors.school) {
                      e.target.style.borderColor = '#2a2a2a';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                  placeholder="Your school name"
                />
                {errors.school && <p className="text-sm mt-2 flex items-center" style={{ color: '#D91743' }}><Heart size={14} className="mr-1" />{errors.school}</p>}
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="text-lg font-medium mb-4" style={{ color: '#D91743' }}>
                Additional Information
              </h3>
              
              <label className="flex items-center space-x-5 p-5 border-2 transition-all duration-300 cursor-pointer" style={{
                backgroundColor: '#0a0a0a',
                borderColor: '#2a2a2a',
                borderRadius: '1.5rem'
              }}>
                <input
                  type="checkbox"
                  name="isRetaker"
                  checked={formData.isRetaker}
                  onChange={handleInputChange}
                  className="w-6 h-6 rounded"
                  style={{
                    accentColor: '#D91743'
                  }}
                />
                <span className="text-base font-medium text-gray-300">
                  Are you a retaker? (Don't worry, we've all been there! 😊)
                </span>
              </label>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <label className="block text-sm font-medium mb-3" style={{ color: '#D91743' }}>
                What other subjects are you taking?
              </label>
              <textarea
                name="otherSubjects"
                value={formData.otherSubjects}
                onChange={handleInputChange}
                rows="4"
                className="w-full px-8 py-5 border-2 text-white placeholder-gray-500 transition-all duration-300 hover:border-gray-600"
                style={{
                  backgroundColor: '#0a0a0a',
                  borderColor: '#2a2a2a',
                  borderRadius: '1.5rem'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#D91743';
                  e.target.style.boxShadow = '0 0 0 4px rgba(217, 23, 67, 0.2), 0 0 20px rgba(217, 23, 67, 0.4)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#2a2a2a';
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="e.g., Mathematics, Physics, Chemistry, Business Studies..."
              />
            </motion.div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <motion.div 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex items-center justify-center mb-4"
              >
                <Phone className="text-red-500 mr-3" size={40} />
                <Flame className="text-red-600" size={32} />
              </motion.div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent mb-3">
                Contact Number, So we can TALK! 📞
              </h2>
              <p className="text-gray-300 text-xl">We need to know how to reach you and your parents</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <label className="block text-sm font-medium mb-3" style={{ color: '#D91743' }}>
                  Your Contact Number *
                </label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                  className={`w-full px-8 py-5 border-2 text-white placeholder-gray-500 transition-all duration-300 ${
                    errors.contactNumber ? 'shadow-xl' : 'hover:border-gray-600'
                  }`}
                  style={{
                    backgroundColor: '#0a0a0a',
                    borderColor: errors.contactNumber ? '#D91743' : '#2a2a2a',
                    borderRadius: '2rem',
                    boxShadow: errors.contactNumber ? '0 0 20px rgba(217, 23, 67, 0.5)' : 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#D91743';
                    e.target.style.boxShadow = '0 0 0 4px rgba(217, 23, 67, 0.2), 0 0 20px rgba(217, 23, 67, 0.4)';
                  }}
                  onBlur={(e) => {
                    if (!errors.contactNumber) {
                      e.target.style.borderColor = '#2a2a2a';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                  placeholder="+92 300 1234567"
                />
                {errors.contactNumber && <p className="text-sm mt-2 flex items-center" style={{ color: '#D91743' }}><Heart size={14} className="mr-1" />{errors.contactNumber}</p>}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="block text-sm font-medium mb-3" style={{ color: '#D91743' }}>
                  Parent/Guardian Contact *
                </label>
                <input
                  type="tel"
                  name="parentContactNumber"
                  value={formData.parentContactNumber}
                  onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                  className={`w-full px-8 py-5 border-2 text-white placeholder-gray-500 transition-all duration-300 ${
                    errors.parentContactNumber ? 'shadow-xl' : 'hover:border-gray-600'
                  }`}
                  style={{
                    backgroundColor: '#0a0a0a',
                    borderColor: errors.parentContactNumber ? '#D91743' : '#2a2a2a',
                    borderRadius: '2rem',
                    boxShadow: errors.parentContactNumber ? '0 0 20px rgba(217, 23, 67, 0.5)' : 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#D91743';
                    e.target.style.boxShadow = '0 0 0 4px rgba(217, 23, 67, 0.2), 0 0 20px rgba(217, 23, 67, 0.4)';
                  }}
                  onBlur={(e) => {
                    if (!errors.parentContactNumber) {
                      e.target.style.borderColor = '#2a2a2a';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                  placeholder="+92 300 1234567"
                />
                {errors.parentContactNumber && <p className="text-sm mt-2 flex items-center" style={{ color: '#D91743' }}><Heart size={14} className="mr-1" />{errors.parentContactNumber}</p>}
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-sm font-medium mb-3" style={{ color: '#D91743' }}>
                Alternative Contact Number
              </label>
              <input
                type="tel"
                name="alternativeNumber"
                value={formData.alternativeNumber}
                onChange={handleInputChange}
                className="w-full px-8 py-5 border-2 text-white placeholder-gray-500 transition-all duration-300 hover:border-gray-600"
                style={{
                  backgroundColor: '#0a0a0a',
                  borderColor: '#2a2a2a',
                  borderRadius: '2rem'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#D91743';
                  e.target.style.boxShadow = '0 0 0 4px rgba(217, 23, 67, 0.2), 0 0 20px rgba(217, 23, 67, 0.4)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#2a2a2a';
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="Optional backup number"
              />
            </motion.div>

            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="text-xl font-medium flex items-center" style={{ color: '#D91743' }}>
                <span className="mr-2">🌍</span>
                Where are you located?
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-3" style={{ color: '#D91743' }}>
                    City *
                  </label>
                  <input
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    className={`w-full px-8 py-5 border-2 text-white placeholder-gray-500 transition-all duration-300 ${
                      errors['address.city'] ? 'shadow-xl' : 'hover:border-gray-600'
                    }`}
                    style={{
                      backgroundColor: '#0a0a0a',
                      borderColor: errors['address.city'] ? '#D91743' : '#2a2a2a',
                      borderRadius: '2rem',
                      boxShadow: errors['address.city'] ? '0 0 20px rgba(217, 23, 67, 0.5)' : 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#D91743';
                      e.target.style.boxShadow = '0 0 0 4px rgba(217, 23, 67, 0.2), 0 0 20px rgba(217, 23, 67, 0.4)';
                    }}
                    onBlur={(e) => {
                      if (!errors['address.city']) {
                        e.target.style.borderColor = '#2a2a2a';
                        e.target.style.boxShadow = 'none';
                      }
                    }}
                    placeholder="Your city"
                  />
                  {errors['address.city'] && <p className="text-sm mt-2 flex items-center" style={{ color: '#D91743' }}><Heart size={14} className="mr-1" />{errors['address.city']}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3" style={{ color: '#D91743' }}>
                    Country *
                  </label>
                  <input
                    type="text"
                    name="address.country"
                    value={formData.address.country}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    className={`w-full px-8 py-5 border-2 text-white placeholder-gray-500 transition-all duration-300 ${
                      errors['address.country'] ? 'shadow-xl' : 'hover:border-gray-600'
                    }`}
                    style={{
                      backgroundColor: '#0a0a0a',
                      borderColor: errors['address.country'] ? '#D91743' : '#2a2a2a',
                      borderRadius: '2rem',
                      boxShadow: errors['address.country'] ? '0 0 20px rgba(217, 23, 67, 0.5)' : 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#D91743';
                      e.target.style.boxShadow = '0 0 0 4px rgba(217, 23, 67, 0.2), 0 0 20px rgba(217, 23, 67, 0.4)';
                    }}
                    onBlur={(e) => {
                      if (!errors['address.country']) {
                        e.target.style.borderColor = '#2a2a2a';
                        e.target.style.boxShadow = 'none';
                      }
                    }}
                    placeholder="Your country"
                  />
                  {errors['address.country'] && <p className="text-sm mt-2 flex items-center" style={{ color: '#D91743' }}><Heart size={14} className="mr-1" />{errors['address.country']}</p>}
                </div>
              </div>


            </motion.div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <motion.div 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex items-center justify-center mb-4"
              >
                <Star className="text-red-500 mr-3" size={40} />
                <Flame className="text-red-600" size={32} />
              </motion.div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent mb-3">
                Tech Knowledge Check! 🤓
              </h2>
              <p className="text-gray-300 text-xl">Help us understand your comfort level with technology</p>
            </div>

            <motion.div 
              className="border-2 shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(217, 23, 67, 0.08) 0%, rgba(10, 10, 10, 0.95) 100%)',
                borderColor: '#D91743',
                boxShadow: '0 0 35px rgba(217, 23, 67, 0.4)',
                borderRadius: '2rem',
                padding: '3rem'
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label className="block text-xl font-medium mb-8 text-center" style={{ color: '#D91743' }}>
                On a scale of 1-10, how comfortable are you with technology and computers?
              </label>
              
              <div className="space-y-8">
                {/* Slider Container */}
                <div className="relative">
                <input
                  type="range"
                  name="techKnowledge"
                  min="1"
                  max="10"
                  value={formData.techKnowledge}
                  onChange={handleInputChange}
                    className="w-full h-6 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #D91743 0%, #D91743 ${(formData.techKnowledge - 1) * 11.11}%, #2a2a2a ${(formData.techKnowledge - 1) * 11.11}%, #2a2a2a 100%)`,
                      boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.4)'
                    }}
                  />
                </div>

                {/* Value Display and Labels */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center justify-center px-4 py-3 border-2 rounded-full" style={{
                    backgroundColor: '#0a0a0a',
                    borderColor: '#2a2a2a'
                  }}>
                    <span className="text-sm font-medium text-gray-300">1 - Complete Beginner</span>
              </div>
                  
                  <motion.div 
                    className="font-bold text-4xl w-24 h-24 rounded-full flex items-center justify-center text-white border-4"
                    style={{ 
                      background: 'linear-gradient(135deg, #D91743, #ff6b9d)',
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      boxShadow: '0 0 30px rgba(217, 23, 67, 0.7)'
                    }}
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 1.2, ease: "easeInOut" }}
                    key={formData.techKnowledge}
                  >
                    {formData.techKnowledge}
                  </motion.div>
                  
                  <div className="flex items-center justify-center px-4 py-3 border-2 rounded-full" style={{
                    backgroundColor: '#0a0a0a',
                    borderColor: '#2a2a2a'
                  }}>
                    <span className="text-sm font-medium text-gray-300">10 - Tech Expert</span>
            </div>
                </div>
              </div>
            </motion.div>

            {/* Registration Summary */}
            <motion.div 
              className="border-2 shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(10, 10, 10, 0.9) 0%, rgba(0, 0, 0, 0.98) 100%)',
                borderColor: '#D91743',
                boxShadow: '0 0 35px rgba(217, 23, 67, 0.3)',
                borderRadius: '2rem',
                padding: '3rem'
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="text-2xl font-medium mb-4 flex items-center" style={{ color: '#D91743' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3" style={{ background: 'linear-gradient(135deg, #D91743, #ff6b9d)' }}>
                  <Star className="text-white" size={20} />
                </div>
                Registration Summary
              </h3>
              
              <div className="mb-6 p-4 bg-green-900/20 border border-green-600 rounded-xl">
                <p className="text-green-400 text-sm flex items-center">
                  <span className="mr-2">✅</span>
                  <strong>Final Step: </strong>Review your information and click "Complete Registration" to submit your application.
                </p>
              </div>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center p-5 border" style={{ backgroundColor: 'rgba(5, 5, 5, 0.7)', borderColor: '#D91743', borderRadius: '1.5rem' }}>
                  <span className="text-gray-300">Name:</span>
                  <span className="font-medium text-white">{formData.firstName} {formData.lastName}</span>
                </div>
                <div className="flex justify-between items-center p-5 border" style={{ backgroundColor: 'rgba(5, 5, 5, 0.7)', borderColor: '#D91743', borderRadius: '1.5rem' }}>
                  <span className="text-gray-300">Email:</span>
                  <span className="font-medium text-white">{formData.email}</span>
                </div>
                <div className="flex justify-between items-center p-5 border" style={{ backgroundColor: 'rgba(5, 5, 5, 0.7)', borderColor: '#D91743', borderRadius: '1.5rem' }}>
                  <span className="text-gray-300">Year & Session:</span>
                  <span className="font-medium text-white">Year {formData.year} - {formData.session}</span>
                </div>
                <div className="flex justify-between items-center p-5 border" style={{ backgroundColor: 'rgba(5, 5, 5, 0.7)', borderColor: '#D91743', borderRadius: '1.5rem' }}>
                  <span className="text-gray-300">School:</span>
                  <span className="font-medium text-white">{formData.school}</span>
                </div>
                <div className="flex justify-between items-center p-5 border" style={{ backgroundColor: 'rgba(5, 5, 5, 0.7)', borderColor: '#D91743', borderRadius: '1.5rem' }}>
                  <span className="text-gray-300">Tech Level:</span>
                  <span className="font-medium" style={{ color: '#D91743' }}>{formData.techKnowledge}/10</span>
              </div>
            </div>
            </motion.div>

            {errors.general && (
                <motion.div 
                  className="border-2 p-6"
                  style={{
                    backgroundColor: 'rgba(217, 23, 67, 0.1)',
                    borderColor: '#D91743',
                    borderRadius: '1.5rem',
                    boxShadow: '0 0 20px rgba(217, 23, 67, 0.3)'
                  }}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="flex items-start">
                    <Heart className="mr-3 mt-1 flex-shrink-0" size={18} style={{ color: '#D91743' }} />
                    <div className="flex-1">
                      <h4 className="font-medium mb-2" style={{ color: '#D91743' }}>
                        Registration Error
                      </h4>
                      <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-line mb-4">
                        {errors.general}
              </div>
                      {errors.general && errors.general.includes('already registered') && (
                        <motion.button
                          onClick={() => navigate('/signin')}
                          className="px-6 py-3 text-white rounded-full font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                          style={{
                            background: 'linear-gradient(135deg, #D91743, #ff6b9d)',
                            fontSize: '14px'
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          🔑 Go to Sign In Page
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
            )}
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #000000 0%, #0f0f0f 30%, #1a1a1a 60%, #D91743 100%)' }}>
      <Nav />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 xl:px-8 py-12">
        {/* Progress Bar */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #D91743, #ff6b9d)' }}>
              Student Registration
            </h1>
            <span className="font-medium px-6 py-3 rounded-full border-2 text-white" style={{ backgroundColor: '#D91743', borderColor: '#D91743', boxShadow: '0 0 20px rgba(217, 23, 67, 0.4)' }}>
              Step {currentStep} of {totalSteps}
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-4 shadow-inner">
            <motion.div
              className="h-4 rounded-full shadow-xl"
              style={{ 
                background: 'linear-gradient(135deg, #D91743, #ff6b9d)',
                boxShadow: '0 0 15px rgba(217, 23, 67, 0.6)'
              }}
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            ></motion.div>
          </div>
        </motion.div>

        {/* Step Indicators */}
        <motion.div 
          className="flex justify-between mb-12"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {['Personal Info', 'Academic Journey', 'Contact Info', 'Tech Knowledge'].map((step, index) => (
            <motion.div 
              key={step} 
              className="flex flex-col items-center"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <motion.div
                className={`w-16 h-16 rounded-full flex items-center justify-center text-sm font-bold shadow-xl border-4 ${
                  index + 1 <= currentStep
                    ? 'text-white border-white/30'
                    : 'bg-gray-700 text-gray-400 border-gray-600'
                }`}
                style={index + 1 <= currentStep ? {
                  background: 'linear-gradient(135deg, #D91743, #ff6b9d)',
                  boxShadow: '0 0 25px rgba(217, 23, 67, 0.6)'
                } : {}}
                animate={{
                  scale: index + 1 === currentStep ? [1, 1.1, 1] : 1,
                  boxShadow: index + 1 === currentStep ? '0 0 30px rgba(217, 23, 67, 0.8)' : '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
                transition={{ 
                  scale: { duration: 0.5, repeat: index + 1 === currentStep ? Infinity : 0, repeatType: "reverse" },
                  boxShadow: { duration: 0.3 }
                }}
              >
                {index + 1 < currentStep ? '✓' : index + 1}
              </motion.div>
              <span className="text-xs text-gray-300 mt-3 text-center max-w-20 leading-tight font-medium">{step}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Form Content */}
        <motion.div 
          className="backdrop-blur-sm shadow-2xl p-12 border-2"
          style={{
            background: 'linear-gradient(135deg, rgba(10, 10, 10, 0.95) 0%, rgba(0, 0, 0, 0.98) 100%)',
            borderColor: '#D91743',
            boxShadow: '0 25px 50px rgba(217, 23, 67, 0.3), 0 0 0 1px rgba(217, 23, 67, 0.2)',
            borderRadius: '2rem'
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <form onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Only allow submission on the final step
            if (currentStep === totalSteps) {
              handleSubmit(e);
            } else {
              console.warn('Form submission prevented. Current step:', currentStep, 'Total steps:', totalSteps);
            }
          }}>
            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-12">
              <motion.button
                type="button"
                onClick={handlePrevious}
                className={`px-10 py-5 rounded-full font-medium transition-all duration-300 border-2 ${
                  currentStep === 1
                    ? 'text-gray-500 cursor-not-allowed'
                    : 'text-white shadow-xl hover:shadow-xl transform hover:-translate-y-1'
                }`}
                style={{
                  backgroundColor: currentStep === 1 ? '#1a1a1a' : 'transparent',
                  background: currentStep !== 1 ? 'linear-gradient(135deg, #404040, #2a2a2a)' : '#1a1a1a',
                  borderColor: currentStep === 1 ? '#2a2a2a' : '#404040'
                }}
                disabled={currentStep === 1}
                whileHover={currentStep !== 1 ? { scale: 1.05 } : {}}
                whileTap={currentStep !== 1 ? { scale: 0.95 } : {}}
              >
                <ChevronLeft className="inline mr-2" size={20} />
                Previous
              </motion.button>

              {currentStep < totalSteps ? (
                <motion.button
                  type="button"
                  onClick={handleNext}
                  className="px-10 py-5 text-white rounded-full font-medium transition-all duration-300 shadow-xl hover:shadow-xl transform hover:-translate-y-1 border-2"
                  style={{
                    background: 'linear-gradient(135deg, #D91743, #ff6b9d)',
                    borderColor: '#D91743',
                    boxShadow: '0 10px 25px rgba(217, 23, 67, 0.4)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.boxShadow = '0 15px 35px rgba(217, 23, 67, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.boxShadow = '0 10px 25px rgba(217, 23, 67, 0.4)';
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Next
                  <ChevronRight className="inline ml-2" size={20} />
                </motion.button>
              ) : (
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="px-12 py-5 text-white rounded-full font-medium transition-all duration-300 shadow-xl hover:shadow-xl transform hover:-translate-y-1 disabled:cursor-not-allowed disabled:transform-none border-2"
                  style={{
                    background: loading ? 'linear-gradient(135deg, #059669, #10b981)' : 'linear-gradient(135deg, #D91743, #ff6b9d)',
                    borderColor: loading ? '#059669' : '#D91743',
                    boxShadow: loading ? '0 10px 25px rgba(5, 150, 105, 0.4)' : '0 10px 25px rgba(217, 23, 67, 0.4)'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.target.style.boxShadow = '0 15px 35px rgba(217, 23, 67, 0.6)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.target.style.boxShadow = '0 10px 25px rgba(217, 23, 67, 0.4)';
                    }
                  }}
                  whileHover={!loading ? { scale: 1.05 } : {}}
                  whileTap={!loading ? { scale: 0.95 } : {}}
                >
                  {loading ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Star className="inline mr-2" size={20} />
                      Complete Registration
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Registration; 