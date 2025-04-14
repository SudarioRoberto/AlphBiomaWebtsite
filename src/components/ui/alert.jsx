import React from 'react';

export const Alert = ({ children, variant = "default", className, ...props }) => {
  const variantClasses = {
    default: "bg-gray-100 text-gray-800",
    destructive: "bg-red-100 text-red-800",
    warning: "bg-yellow-100 text-yellow-800",
    success: "bg-green-100 text-green-800"
  };

  return (
    <div className={`p-4 rounded-lg ${variantClasses[variant]} ${className || ''}`} {...props}>
      {children}
    </div>
  );
};

export const AlertDescription = ({ children, className, ...props }) => {
  return <div className={`text-sm ${className || ''}`} {...props}>{children}</div>;
};

export const AlertTitle = ({ children, className, ...props }) => {
  return <h5 className={`text-lg font-semibold mb-1 ${className || ''}`} {...props}>{children}</h5>;
};

export default Alert;