'use client';

import React from 'react';
import { useTheme } from '../../lib/theme';

interface ThemeButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

const ThemeButton: React.FC<ThemeButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = ''
}) => {
  const { theme } = useTheme();

  const baseClasses = 'font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: disabled ? '#9ca3af' : theme.primary,
          color: '#ffffff',
          borderColor: disabled ? '#9ca3af' : theme.primary,
          ':hover': {
            backgroundColor: disabled ? '#9ca3af' : theme.primaryHover,
          }
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: disabled ? '#9ca3af' : theme.primary,
          borderColor: disabled ? '#9ca3af' : theme.primary,
          border: '2px solid',
          ':hover': {
            backgroundColor: disabled ? 'transparent' : theme.primary,
            color: disabled ? '#9ca3af' : '#ffffff',
          }
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: disabled ? '#9ca3af' : theme.primary,
          ':hover': {
            backgroundColor: disabled ? 'transparent' : `${theme.primary}10`,
          }
        };
      default:
        return {};
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${sizeClasses[size]} ${className}`}
      style={variantStyles}
      onMouseEnter={(e) => {
        if (!disabled && variant === 'primary') {
          e.currentTarget.style.backgroundColor = theme.primaryHover;
        } else if (!disabled && variant === 'outline') {
          e.currentTarget.style.backgroundColor = theme.primary;
          e.currentTarget.style.color = '#ffffff';
        } else if (!disabled && variant === 'ghost') {
          e.currentTarget.style.backgroundColor = `${theme.primary}10`;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && variant === 'primary') {
          e.currentTarget.style.backgroundColor = theme.primary;
        } else if (!disabled && variant === 'outline') {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = theme.primary;
        } else if (!disabled && variant === 'ghost') {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      {children}
    </button>
  );
};

export default ThemeButton;