import React, { ReactNode } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) => {
  const baseStyle = 'font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed';
  
  let variantStyle = '';
  switch (variant) {
    case 'primary':
      variantStyle = 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500';
      break;
    case 'secondary': // Adjusted to be a lighter, less prominent button
      variantStyle = 'bg-secondary-200 hover:bg-secondary-300 text-secondary-700 focus:ring-secondary-400 border border-secondary-300';
      break;
    case 'danger':
      variantStyle = 'bg-error-600 hover:bg-error-700 text-white focus:ring-error-500';
      break;
    case 'ghost':
      variantStyle = 'bg-transparent hover:bg-primary-100 text-primary-600 focus:ring-primary-500 shadow-none';
      break;
    case 'outline':
      variantStyle = 'bg-transparent hover:bg-primary-50 text-primary-600 border border-primary-600 focus:ring-primary-500 shadow-none';
      break;
  }

  let sizeStyle = '';
  let iconSizeClass = 'h-5 w-5'; // Default for md
  switch (size) {
    case 'sm':
      sizeStyle = 'px-3 py-1.5 text-sm';
      iconSizeClass = 'h-4 w-4';
      break;
    case 'md':
      sizeStyle = 'px-4 py-2 text-base';
      break;
    case 'lg':
      sizeStyle = 'px-6 py-3 text-lg';
      iconSizeClass = 'h-6 w-6';
      break;
  }

  return (
    <button
      type="button"
      className={`${baseStyle} ${variantStyle} ${sizeStyle} ${className}`}
      {...props}
    >
      {leftIcon && <span className={`mr-2 ${iconSizeClass}`}>{React.cloneElement(leftIcon as React.ReactElement<{ className?: string }>, { className: iconSizeClass })}</span>}
      {children}
      {rightIcon && <span className={`ml-2 ${iconSizeClass}`}>{React.cloneElement(rightIcon as React.ReactElement<{ className?: string }>, { className: iconSizeClass })}</span>}
    </button>
  );
};