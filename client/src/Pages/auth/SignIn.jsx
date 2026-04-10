import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import Nav from '../../components/Nav';
import { showOperationToast } from '../../utils/toast';
import { API_ENDPOINTS } from '../../config/api';

const SignIn = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Check for messages in URL params
    const messageParam = searchParams.get('message');
    const errorParam = searchParams.get('error');
    
    if (messageParam === 'registration-pending') {
      showOperationToast.registrationSuccess();
    }

    // Handle error parameters
    if (errorParam === 'invalid_token') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      showOperationToast.loginError('Your session has expired or is invalid. Please log in again.');
    }

    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      try {
        const userData = JSON.parse(user);
        
        // Basic JWT format validation
        if (token.match(/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]*$/)) {
          // Redirect to appropriate dashboard
          navigate(userData.dashboardUrl || '/');
        } else {
          // Clear invalid token
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          showOperationToast.loginError('Invalid session detected. Please log in again.');
        }
      } catch (error) {
        // Clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, [navigate, searchParams]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        // Store user data and token
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        // Show success message
        showOperationToast.loginSuccess();
        
        // Redirect to appropriate dashboard based on role
        setTimeout(() => {
          navigate(data.data.user.dashboardUrl);
        }, 1000);
        
      } else {
        // Handle errors
        if (response.status === 423) {
          showOperationToast.loginError('Account is temporarily locked due to too many failed attempts. Please try again later.');
        } else if (response.status === 403) {
          showOperationToast.loginError(data.message);
        } else {
          showOperationToast.loginError(data.message || 'Login failed. Please check your credentials.');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      showOperationToast.networkError();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #000000 0%, #0f0f0f 30%, #1a1a1a 60%, #D91743 100%)' }}>
      <Nav />
      
      <div className="flex items-center justify-center min-h-screen pt-16 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md w-full space-y-8"
        >
          {/* Header */}
          <div className="text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-[25pt] font-bold text-transparent bg-clip-text mb-2"
              style={{ backgroundImage: 'linear-gradient(135deg, #D91743, #ff6b9d)' }}
            >
              Welcome Back
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-[15pt] text-gray-300"
            >
              Sign in to access your AT-ICT dashboard
            </motion.p>
          </div>

          {/* Error Messages */}
          {errors.general && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-xl border bg-red-50 border-red-200"
            >
              <p className="text-sm text-red-600 text-center">{errors.general}</p>
            </motion.div>
          )}

          {/* Sign In Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="py-8 px-8 shadow-2xl border-2 rounded-3xl glassify-signin-form"
            style={{
              background: 'linear-gradient(135deg, rgba(10,10,10,0.55) 0%, rgba(0,0,0,0.75) 100%)',
              borderColor: '#D91743',
              boxShadow: '0 25px 50px rgba(217, 23, 67, 0.3), 0 0 0 1px rgba(217, 23, 67, 0.2)',
              borderRadius: '2rem',
              backdropFilter: 'blur(18px) saturate(1.5)',
              WebkitBackdropFilter: 'blur(18px) saturate(1.5)',
            }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-3" style={{ color: '#D91743' }}>
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-8 py-5 border-2 text-white placeholder-gray-400 transition-all duration-300 bg-black/30 backdrop-blur-md ${
                    errors.email ? 'shadow-xl' : 'hover:border-gray-600'
                  }`}
                  style={{
                    backgroundColor: 'rgba(10,10,10,0.35)',
                    borderColor: errors.email ? '#D91743' : '#2a2a2a',
                    borderRadius: '2rem',
                    boxShadow: errors.email ? '0 0 20px rgba(217, 23, 67, 0.5)' : 'none',
                    backdropFilter: 'blur(6px) saturate(1.2)',
                    WebkitBackdropFilter: 'blur(6px) saturate(1.2)',
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
                  placeholder="Enter your email"
                />
                {errors.email && <p className="text-sm mt-2" style={{ color: '#D91743' }}>{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-3" style={{ color: '#D91743' }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full px-8 py-5 pr-14 border-2 text-white placeholder-gray-400 transition-all duration-300 bg-black/30 backdrop-blur-md ${
                      errors.password ? 'shadow-xl' : 'hover:border-gray-600'
                    }`}
                    style={{
                      backgroundColor: 'rgba(10,10,10,0.35)',
                      borderColor: errors.password ? '#D91743' : '#2a2a2a',
                      borderRadius: '2rem',
                      boxShadow: errors.password ? '0 0 20px rgba(217, 23, 67, 0.5)' : 'none',
                      backdropFilter: 'blur(6px) saturate(1.2)',
                      WebkitBackdropFilter: 'blur(6px) saturate(1.2)',
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
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm mt-2" style={{ color: '#D91743' }}>{errors.password}</p>}
              </div>

              <div>
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-4 px-8 border-2 text-white rounded-full font-medium shadow-xl transition-all duration-300 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, #D91743, #ff6b9d)',
                    borderColor: '#D91743',
                    boxShadow: '0 10px 25px rgba(217, 23, 67, 0.4)',
                    opacity: loading ? 0.7 : 1,
                    backdropFilter: 'blur(2px) saturate(1.2)',
                    WebkitBackdropFilter: 'blur(2px) saturate(1.2)',
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
                  whileHover={!loading ? { scale: 1.02 } : {}}
                  whileTap={!loading ? { scale: 0.98 } : {}}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </motion.button>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-300">
                  Don't have an account?{' '}
                  <Link
                    to="/register"
                    className="font-medium hover:underline transition-colors"
                    style={{ color: '#D91743' }}
                  >
                    Register here
                  </Link>
                </p>
              </div>
            </form>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default SignIn; 