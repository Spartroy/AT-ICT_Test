import React from 'react';

const ProgressBar = ({ 
  progress, 
  label = "Progress", 
  showPercentage = true, 
  size = "default",
  color = "blue",
  className = "" 
}) => {
  const sizeClasses = {
    small: "h-1",
    default: "h-2", 
    large: "h-3"
  };

  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    red: "bg-red-500",
    yellow: "bg-yellow-500",
    purple: "bg-purple-500"
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between text-sm text-gray-400">
          {label && <span>{label}</span>}
          {showPercentage && <span>{Math.round(progress)}%</span>}
        </div>
      )}
      <div className={`w-full bg-gray-700 rounded-full ${sizeClasses[size]}`}>
        <div 
          className={`${colorClasses[color]} ${sizeClasses[size]} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
