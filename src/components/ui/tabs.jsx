import React, { useState, useEffect } from 'react';

export const Tabs = ({ children, defaultValue, value, onValueChange, className, ...props }) => {
  const [activeTab, setActiveTab] = useState(value || defaultValue || "");
  
  useEffect(() => {
    if (value !== undefined) {
      setActiveTab(value);
    }
  }, [value]);

  const handleTabChange = (newValue) => {
    setActiveTab(newValue);
    if (onValueChange) {
      onValueChange(newValue);
    }
  };

  // Clone children and inject active state
  const enhancedChildren = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        activeTab,
        onTabChange: handleTabChange,
      });
    }
    return child;
  });

  return (
    <div className={className || ''} {...props}>
      {enhancedChildren}
    </div>
  );
};

export const Tab = ({ children, value, activeTab, onTabChange, className, ...props }) => {
  const isActive = activeTab === value;
  
  return (
    <button
      type="button"
      onClick={() => onTabChange && onTabChange(value)}
      className={`${className || ''} ${isActive ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
      {...props}
    >
      {children}
    </button>
  );
};