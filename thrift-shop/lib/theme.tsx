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
  primary: '#731528', // logo burgundy
  primaryHover: '#5A1020', // deeper burgundy
  primaryLight: '#F6E8EB', // pale wine tint
  secondary: '#9B3550', // muted wine
  accent: '#C98C9C', // dusty rose accent
  background: '#ffffff',
  text: '#3f2a30', // deep plum-brown
  textLight: '#8B6B6B', // soft rose-brown
  success: '#10b981', // emerald-500
  error: '#ef4444', // red-500
  warning: '#f59e0b', // amber-500
  info: '#3b82f6' // blue-500
};

const THEME_CACHE_KEY = 'app-theme-cache';
const THEME_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function getCachedTheme(): ThemeColors | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(THEME_CACHE_KEY);
    if (!raw) return null;
    const { theme, ts } = JSON.parse(raw);
    if (Date.now() - ts < THEME_CACHE_TTL) return theme as ThemeColors;
    return null;
  } catch {
    return null;
  }
}

function setCachedTheme(theme: ThemeColors) {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(THEME_CACHE_KEY, JSON.stringify({ theme, ts: Date.now() }));
  } catch {
    // ignore
  }
}

const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  isLoading: false,
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

const applyThemeToDocument = (themeColors: ThemeColors) => {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
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

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Start with cached or default theme — NO loading delay, page renders instantly
  const [theme, setTheme] = useState<ThemeColors>(() => {
    const cached = getCachedTheme();
    return cached || defaultTheme;
  });
  // isLoading is always false — we never block rendering on theme
  const [isLoading, setIsLoading] = useState(false);

  const loadTheme = async () => {
    try {
      // Apply what we have immediately first
      applyThemeToDocument(theme);

      const response = await api.getSetting('theme');
      if (response.theme) {
        setTheme(response.theme);
        applyThemeToDocument(response.theme);
        setCachedTheme(response.theme);
      } else {
        applyThemeToDocument(defaultTheme);
      }
    } catch {
      // Backend unreachable — keep using default/cached theme silently
      applyThemeToDocument(theme);
    }
  };

  const refreshTheme = async () => {
    setIsLoading(true);
    try {
      await loadTheme();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Apply theme immediately on mount (no await, no blocking)
    applyThemeToDocument(theme);

    // Then fetch updated theme from backend in background — does NOT block render
    loadTheme().catch(() => {/* silently ignore */});
    // eslint-disable-next-line react-hooks/exhaustive-deps
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