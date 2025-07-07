/**
 * Authentication utilities for client-side token handling
 */

/**
 * Validates if a string is a properly formatted JWT token
 * @param {string} token - The token to validate
 * @returns {boolean} - Whether the token appears to be valid
 */
export const isValidJWT = (token) => {
  if (!token) return false;
  
  // Basic format check - JWT should have 3 parts separated by dots
  // Each part should be base64url encoded (alphanumeric + "-" + "_")
  const jwtRegex = /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]*$/;
  return jwtRegex.test(token);
};

/**
 * Gets the JWT token from localStorage and validates it
 * @returns {string|null} - The token if valid, null otherwise
 */
export const getValidToken = () => {
  const token = localStorage.getItem('token');
  return isValidJWT(token) ? token : null;
};

/**
 * Clears authentication data from localStorage
 */
export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/**
 * Redirects to login with an optional error message
 * @param {string} errorType - Type of error to pass as URL parameter
 */
export const redirectToLogin = (errorType = null) => {
  const url = errorType ? `/login?error=${errorType}` : '/login';
  window.location.href = url;
};

/**
 * Sets authentication headers for fetch requests
 * @param {Object} headers - Existing headers object to add to
 * @returns {Object} - Headers object with Authorization if token is valid
 */
export const setAuthHeaders = (headers = {}) => {
  const token = getValidToken();
  
  if (token) {
    return {
      ...headers,
      'Authorization': `Bearer ${token}`
    };
  }
  
  return headers;
};

/**
 * Handles API response specifically for auth errors
 * @param {Response} response - Fetch API response object
 * @returns {boolean} - True if handled (redirected), false otherwise
 */
export const handleAuthResponse = (response) => {
  if (response.status === 401) {
    clearAuth();
    redirectToLogin('session_expired');
    return true;
  }
  return false;
};

export default {
  isValidJWT,
  getValidToken,
  clearAuth,
  redirectToLogin,
  setAuthHeaders,
  handleAuthResponse
}; 