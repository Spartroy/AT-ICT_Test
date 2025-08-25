import React from 'react';

const LoadingSpinner = ({ 
  size = "default", 
  color = "white", 
  className = "",
  text = ""
}) => {
  const sizeClasses = {
    small: "h-4 w-4",
    default: "h-5 w-5",
    large: "h-6 w-6"
  };

  const colorClasses = {
    white: "border-white",
    blue: "border-blue-500",
    green: "border-green-500",
    gray: "border-gray-400"
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div 
        className={`animate-spin rounded-full border-2 border-t-transparent ${sizeClasses[size]} ${colorClasses[color]}`}
      />
      {text && <span className="ml-2">{text}</span>}
    </div>
  );
};

export default LoadingSpinner;
