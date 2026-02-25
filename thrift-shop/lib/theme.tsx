'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

interface ThemeColors {
  primary: string;
  primaryHover: string;
  primaryLight: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  textLight: string;
  success: string;
  error: string;
  warning: string;
  info: string;
}

interface ThemeContextType {
  theme: ThemeColors;
  isLoading: boolean;
  refreshTheme: () => Promise<void>;
}

const defaultTheme: ThemeColors = {
  primary: '#0d9488', // teal-600
  primaryHover: '#0f766e', // teal-700
  primaryLight: '#5eead4', // teal-300
  secondary: '#64748b', // slate-500
  accent: '#f59e0b', // amber-500
  background: '#ffffff',
  text: '#1f2937', // gray-800
  textLight: '#6b7280', // gray-500
  success: '#10b981', // emerald-500
  error: '#ef4444', // red-500
  warning: '#f59e0b', // amber-500
  info: '#3b82f6' // blue-500
};

const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  isLoading: true,
  refreshTheme: async () => {}
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeColors>(defaultTheme);
  const [isLoading, setIsLoading] = useState(true);

  const loadTheme = async () => {
    try {
      setIsLoading(true);
      const response = await api.getSetting('theme');
      if (response.theme) {
        setTheme(response.theme);
        applyThemeToDocument(response.theme);
      } else {
        // If no theme is set, use default
        setTheme(defaultTheme);
        applyThemeToDocument(defaultTheme);
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
      // Use default theme on error
      setTheme(defaultTheme);
      applyThemeToDocument(defaultTheme);
    } finally {
      setIsLoading(false);
    }
  };

  const applyThemeToDocument = (themeColors: ThemeColors) => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      
      // Set CSS custom properties for the theme colors
      root.style.setProperty('--color-primary', themeColors.primary);
      root.style.setProperty('--color-primary-hover', themeColors.primaryHover);
      root.style.setProperty('--color-primary-light', themeColors.primaryLight);
      root.style.setProperty('--color-secondary', themeColors.secondary);
      root.style.setProperty('--color-accent', themeColors.accent);
      root.style.setProperty('--color-background', themeColors.background);
      root.style.setProperty('--color-text', themeColors.text);
      root.style.setProperty('--color-text-light', themeColors.textLight);
      root.style.setProperty('--color-success', themeColors.success);
      root.style.setProperty('--color-error', themeColors.error);
      root.style.setProperty('--color-warning', themeColors.warning);
      root.style.setProperty('--color-info', themeColors.info);
    }
  };

  const refreshTheme = async () => {
    await loadTheme();
  };

  useEffect(() => {
    loadTheme();
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, isLoading, refreshTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Utility function to get theme-aware Tailwind classes
export const getThemeClasses = (theme: ThemeColors) => ({
  // Button classes
  primaryButton: 'text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200',
  primaryButtonHover: 'hover:opacity-90',
  
  // Link classes
  primaryLink: 'font-medium transition-colors duration-200',
  
  // Background classes
  primaryBg: 'text-white',
  primaryLightBg: 'text-gray-800',
  
  // Text classes
  primaryText: '',
  secondaryText: 'text-gray-600',
  
  // Border classes
  primaryBorder: 'border-2',
});

// Hook to get theme-aware inline styles
export const useThemeStyles = () => {
  const { theme } = useTheme();
  
  return {
    primaryButton: {
      backgroundColor: theme.primary,
      color: '#ffffff',
    },
    primaryButtonHover: {
      backgroundColor: theme.primaryHover,
    },
    primaryLink: {
      color: theme.primary,
    },
    primaryLinkHover: {
      color: theme.primaryHover,
    },
    primaryText: {
      color: theme.primary,
    },
    primaryBg: {
      backgroundColor: theme.primary,
    },
    primaryLightBg: {
      backgroundColor: theme.primaryLight,
    },
    primaryBorder: {
      borderColor: theme.primary,
    },
  };
};