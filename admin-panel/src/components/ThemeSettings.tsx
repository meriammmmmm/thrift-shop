import React, { useState, useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';

interface ThemeSettingsProps {
  authToken: string;
}

const API_BASE_URL = 'http://localhost:5001/api';

const presetThemes = [
  { id: 'teal', name: 'Teal', primary: '#0d9488', description: 'Default theme' },
  { id: 'blue', name: 'Ocean Blue', primary: '#2563eb', description: 'Professional blue' },
  { id: 'purple', name: 'Royal Purple', primary: '#7c3aed', description: 'Creative purple' },
  { id: 'green', name: 'Forest Green', primary: '#16a34a', description: 'Natural green' },
  { id: 'orange', name: 'Sunset Orange', primary: '#ea580c', description: 'Energetic orange' },
  { id: 'pink', name: 'Rose Pink', primary: '#e11d48', description: 'Modern pink' },
  { id: 'indigo', name: 'Deep Indigo', primary: '#4f46e5', description: 'Rich indigo' },
  { id: 'emerald', name: 'Emerald Green', primary: '#059669', description: 'Fresh emerald' },
  { id: 'red', name: 'Cherry Red', primary: '#dc2626', description: 'Bold red' },
  { id: 'amber', name: 'Golden Amber', primary: '#d97706', description: 'Warm amber' },
  { id: 'cyan', name: 'Electric Cyan', primary: '#0891b2', description: 'Vibrant cyan' },
  { id: 'violet', name: 'Soft Violet', primary: '#8b5cf6', description: 'Elegant violet' },
  { id: 'lime', name: 'Fresh Lime', primary: '#65a30d', description: 'Bright lime' },
  { id: 'fuchsia', name: 'Hot Fuchsia', primary: '#c026d3', description: 'Electric fuchsia' },
  { id: 'sky', name: 'Sky Blue', primary: '#0284c7', description: 'Light sky blue' },
  { id: 'slate', name: 'Modern Slate', primary: '#475569', description: 'Professional slate' },
  { id: 'yellow', name: 'Sunny Yellow', primary: '#eab308', description: 'Bright yellow' },
  { id: 'rose', name: 'Blush Rose', primary: '#f43f5e', description: 'Soft rose' }
];

const ThemeSettings: React.FC<ThemeSettingsProps> = ({ authToken }) => {
  const [selectedTheme, setSelectedTheme] = useState('teal');
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotifications();

  const applyTheme = async (themeId: string) => {
    const theme = presetThemes.find(t => t.id === themeId);
    if (!theme) return;

    setLoading(true);
    try {
      const themeData = {
        primary: theme.primary,
        primaryHover: adjustColor(theme.primary, -20),
        primaryLight: adjustColor(theme.primary, 40),
        secondary: '#64748b',
        accent: '#f59e0b',
        background: '#ffffff',
        text: '#1f2937',
        textLight: '#6b7280',
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
      };

      const response = await fetch(`${API_BASE_URL}/settings/theme`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ theme: themeData })
      });

      if (response.ok) {
        showSuccess('Success', `${theme.name} theme applied successfully!`);
        applyThemeToDOM(themeData);
        setSelectedTheme(themeId);
      } else {
        showError('Error', 'Failed to apply theme');
      }
    } catch (error) {
      console.error('Apply theme error:', error);
      showError('Error', 'Failed to apply theme');
    } finally {
      setLoading(false);
    }
  };

  const adjustColor = (color: string, amount: number) => {
    const usePound = color[0] === '#';
    const col = usePound ? color.slice(1) : color;
    const num = parseInt(col, 16);
    let r = (num >> 16) + amount;
    let g = (num >> 8 & 0x00FF) + amount;
    let b = (num & 0x0000FF) + amount;
    r = r > 255 ? 255 : r < 0 ? 0 : r;
    g = g > 255 ? 255 : g < 0 ? 0 : g;
    b = b > 255 ? 255 : b < 0 ? 0 : b;
    return (usePound ? '#' : '') + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
  };

  const applyThemeToDOM = (theme: any) => {
    const root = document.documentElement;
    Object.entries(theme).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, value as string);
    });
    
    // Convert hex to RGB for rgba usage
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? 
        `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
        '13, 148, 136';
    };
    
    root.style.setProperty('--color-primary-rgb', hexToRgb(theme.primary));
  };

  const previewWebsite = () => {
    window.open('http://localhost:3000', '_blank');
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] bg-clip-text text-transparent mb-2">
            Theme Settings
          </h2>
          <p className="text-gray-600">Choose a color theme for your thrift shop</p>
        </div>
        <button 
          onClick={previewWebsite}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center"
        >
          <i className="fas fa-external-link-alt mr-2"></i>Preview Website
        </button>
      </div>

      {/* Theme Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {presetThemes.map((theme) => (
          <div
            key={theme.id}
            className={`modern-card p-6 cursor-pointer transition-all duration-200 hover:shadow-xl relative ${
              selectedTheme === theme.id 
                ? 'ring-2 ring-offset-2 shadow-lg' 
                : 'hover:shadow-lg'
            }`}
            style={selectedTheme === theme.id ? {
              '--tw-ring-color': theme.primary
            } as React.CSSProperties : {}}
            onClick={() => applyTheme(theme.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-12 h-12 rounded-full shadow-lg"
                  style={{ backgroundColor: theme.primary }}
                ></div>
                <div>
                  <h3 className="font-semibold text-lg">{theme.name}</h3>
                  <p className="text-sm text-gray-500">{theme.description}</p>
                </div>
              </div>
              {selectedTheme === theme.id && (
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <i className="fas fa-check text-white text-xs"></i>
                </div>
              )}
            </div>

            {/* Theme Preview */}
            <div className="space-y-3">
              <div className="flex space-x-2">
                <div 
                  className="w-8 h-8 rounded"
                  style={{ backgroundColor: theme.primary }}
                ></div>
                <div 
                  className="w-8 h-8 rounded"
                  style={{ backgroundColor: adjustColor(theme.primary, -20) }}
                ></div>
                <div 
                  className="w-8 h-8 rounded"
                  style={{ backgroundColor: adjustColor(theme.primary, 40) }}
                ></div>
              </div>
              
              <div className="space-y-2">
                <button 
                  className="w-full py-2 px-4 rounded-lg text-white text-sm font-medium transition-colors"
                  style={{ backgroundColor: theme.primary }}
                >
                  Sample Button
                </button>
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: theme.primary }}>Sample Link</span>
                  <span className="text-gray-500">Regular Text</span>
                </div>
              </div>
            </div>

            {loading && selectedTheme === theme.id && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                <div className="loading-spinner"></div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Current Theme Info */}
      <div className="modern-card p-6">
        <h3 className="text-xl font-semibold mb-4">Current Theme</h3>
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--color-primary)] shadow-lg"></div>
          <div>
            <h4 className="font-semibold text-lg">
              {presetThemes.find(t => t.id === selectedTheme)?.name || 'Custom Theme'}
            </h4>
            <p className="text-gray-600">
              {presetThemes.find(t => t.id === selectedTheme)?.description || 'Custom color scheme'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Primary Color: {presetThemes.find(t => t.id === selectedTheme)?.primary || 'Custom'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeSettings;