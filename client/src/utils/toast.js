import { toast } from 'react-toastify';

// Success toast
export const showSuccess = (message) => {
  toast.success(message, {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    className: "bg-green-600 text-white",
    progressClassName: "bg-green-400",
  });
};

// Error toast
export const showError = (message) => {
  toast.error(message, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    className: "bg-red-600 text-white",
    progressClassName: "bg-red-400",
  });
};

// Warning toast
export const showWarning = (message) => {
  toast.warning(message, {
    position: "top-right",
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    className: "bg-orange-600 text-white",
    progressClassName: "bg-orange-400",
  });
};

// Info toast
export const showInfo = (message) => {
  toast.info(message, {
    position: "top-right",
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    className: "bg-blue-600 text-white",
    progressClassName: "bg-blue-400",
  });
};

// Loading toast (for async operations)
export const showLoading = (message = "Loading...") => {
  return toast.loading(message, {
    position: "top-right",
    className: "bg-gray-700 text-white",
  });
};

// Update toast (to update a loading toast)
export const updateToast = (toastId, type, message) => {
  const config = {
    render: message,
    type: type,
    isLoading: false,
    autoClose: type === 'error' ? 5000 : 3000,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  };

  switch (type) {
    case 'success':
      config.className = "bg-green-600 text-white";
      config.progressClassName = "bg-green-400";
      break;
    case 'error':
      config.className = "bg-red-600 text-white";
      config.progressClassName = "bg-red-400";
      break;
    case 'warning':
      config.className = "bg-orange-600 text-white";
      config.progressClassName = "bg-orange-400";
      break;
    case 'info':
      config.className = "bg-blue-600 text-white";
      config.progressClassName = "bg-blue-400";
      break;
    default:
      break;
  }

  toast.update(toastId, config);
};

// Dismiss all toasts
export const dismissAll = () => {
  toast.dismiss();
};

// Custom toast for specific operations
export const showOperationToast = {
  // Login/Authentication
  loginSuccess: () => showSuccess("Login successful! Redirecting..."),
  loginError: (message) => showError(`❌ Login failed: ${message}`),
  logoutSuccess: () => showInfo("👋 Logged out successfully"),
  
  // Registration
  registrationSuccess: () => showSuccess("Registration submitted! Check your WhatsApp for approval."),
  registrationError: (message) => showError(`❌ Registration failed: ${message}`),
  
  // Data operations
  saveSuccess: (item = "Data") => showSuccess(` ${item} saved successfully!`),
  saveError: (item = "Data", message) => showError(`❌ Failed to save ${item.toLowerCase()}: ${message}`),
  deleteSuccess: (item = "Item") => showSuccess(`🗑️ ${item} deleted successfully!`),
  deleteError: (item = "Item", message) => showError(`❌ Failed to delete ${item.toLowerCase()}: ${message}`),
  
  // File operations
  uploadSuccess: (filename) => showSuccess(`📁 ${filename} uploaded successfully!`),
  uploadError: (message) => showError(`❌ Upload failed: ${message}`),
  downloadError: (message) => showError(`❌ Download failed: ${message}`),
  
  // Network operations
  networkError: () => showError("🌐 Network error. Please check your connection and try again."),
  serverError: () => showError("🔧 Server error. Please try again later."),
  
  // Validation
  validationError: (message) => showWarning(`⚠️ ${message}`),
  
  // General operations
  operationPending: (operation) => showLoading(`Processing ${operation}...`),
  operationSuccess: (operation) => showSuccess(` ${operation} completed successfully!`),
  operationError: (operation, message) => showError(`❌ ${operation} failed: ${message}`),
}; 