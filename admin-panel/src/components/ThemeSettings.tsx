import React, { useState, useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';

interface ThemeSettingsProps {
  authToken: string;
}

const API_BASE_URL = 'https://mertrosebackend-meec580k.b4a.run/api/';

const presetThemes = [
  { id: 'mery-rose', name: '💋 Mery Rose', primary: '#8B1538', description: 'Bold Burgundy - Your Brand!' },
  { id: 'soft-pink', name: '🌸 Soft Pink', primary: '#F4D7E0', description: 'Logo Background Pink' },
  { id: 'party-glam', name: '✨ Party Glam', primary: '#FF1493', description: 'Hot Pink Party Vibes' },
  { id: 'goth-queen', name: '🖤 Goth Queen', primary: '#6B0F7B', description: 'Deep Purple Gothic' },
  { id: 'gold-luxe', name: '👑 Gold Luxe', primary: '#FFD700', description: 'Glamorous Gold' },
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
  { id: 'rose', name: 'Blush Rose', primary: '#f43f5e', description: 'Soft rose' },
  // New Girly Colors
  { id: 'lavender', name: 'Sweet Lavender', primary: '#b794f6', description: 'Dreamy lavender' },
  { id: 'coral', name: 'Coral Blush', primary: '#ff7f7f', description: 'Soft coral pink' },
  { id: 'peach', name: 'Peachy Keen', primary: '#ffb088', description: 'Warm peach' },
  { id: 'mint', name: 'Mint Cream', primary: '#98d8c8', description: 'Fresh mint' },
  { id: 'lilac', name: 'Lilac Dream', primary: '#c8a2d0', description: 'Gentle lilac' },
  { id: 'bubblegum', name: 'Bubblegum Pink', primary: '#ff6ec7', description: 'Fun bubblegum' },
  { id: 'baby-blue', name: 'Baby Blue', primary: '#89cff0', description: 'Soft baby blue' },
  { id: 'mauve', name: 'Mauve Magic', primary: '#e0b0d5', description: 'Elegant mauve' },
  { id: 'powder-pink', name: 'Powder Pink', primary: '#ffb3d9', description: 'Delicate powder' },
  { id: 'periwinkle', name: 'Periwinkle', primary: '#9999ff', description: 'Soft periwinkle' },
  { id: 'rose-gold', name: 'Rose Gold', primary: '#e0a899', description: 'Luxe rose gold' },
  { id: 'cherry-blossom', name: 'Cherry Blossom', primary: '#ffb7c5', description: 'Spring blossom' },
  { id: 'cotton-candy', name: 'Cotton Candy', primary: '#ffbcd9', description: 'Sweet cotton candy' },
  { id: 'orchid', name: 'Orchid Purple', primary: '#da70d6', description: 'Vibrant orchid' },
  { id: 'seafoam', name: 'Seafoam Green', primary: '#93e9be', description: 'Calm seafoam' },
  { id: 'blush', name: 'Blush Pink', primary: '#ffc0cb', description: 'Classic blush' }
];

const ThemeSettings: React.FC<ThemeSettingsProps> = ({ authToken }) => {
  const [selectedTheme, setSelectedTheme] = useState('teal');
  const [loading, setLoading] = useState(false);
  const [customColor, setCustomColor] = useState('#ff69b4');
  const [colorCategory, setColorCategory] = useState('All');
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

  const applyCustomColor = async () => {
    setLoading(true);
    try {
      const themeData = {
        primary: customColor,
        primaryHover: adjustColor(customColor, -20),
        primaryLight: adjustColor(customColor, 40),
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
        showSuccess('Success', 'Custom color applied successfully!');
        applyThemeToDOM(themeData);
        setSelectedTheme('custom');
      } else {
        showError('Error', 'Failed to apply custom color');
      }
    } catch (error) {
      console.error('Apply custom color error:', error);
      showError('Error', 'Failed to apply custom color');
    } finally {
      setLoading(false);
    }
  };

  const quickColors = [
    // Featured Colors (from image)
    '#c8a2c8', '#808080', '#8fbc8b', '#4682b4', '#daa520',
    // Pinks & Roses
    '#ff69b4', '#ff1493', '#ff6ec7', '#ffc0cb', '#ffb3d9', '#e0b0d5',
    '#da70d6', '#c8a2d0', '#b794f6', '#ff85c1', '#ff4da6', '#e91e63',
    // Purples & Violets
    '#9999ff', '#8b5cf6', '#7c3aed', '#6a0dad', '#9370db', '#ba55d3',
    '#dda0dd', '#ee82ee', '#d8bfd8', '#9966cc', '#8a2be2', '#9400d3',
    // Blues
    '#89cff0', '#6eb5ff', '#4a9eff', '#3b82f6', '#2563eb', '#1d4ed8',
    '#1e90ff', '#4169e1', '#0000ff', '#00bfff', '#87ceeb', '#add8e6',
    // Teals & Cyans
    '#00ced1', '#00ffff', '#40e0d0', '#48d1cc', '#20b2aa', '#008b8b',
    '#5f9ea0', '#00ffef', '#7fffd4', '#66cdaa', '#00fa9a', '#3eb489',
    // Greens & Sage
    '#98fb98', '#90ee90', '#7bed9f', '#4ade80', '#22c55e', '#16a34a',
    '#00ff00', '#32cd32', '#00ff7f', '#2e8b57', '#3cb371', '#8fbc8f',
    '#9caf88', '#bcb88a', '#a8c090', '#87a96b', '#8a9a5b', '#6b8e23',
    // Yellows & Golds
    '#ffd700', '#ffc107', '#ffb300', '#eab308', '#f59e0b', '#d97706',
    '#ffff00', '#ffffe0', '#fffacd', '#fafad2', '#ffefd5', '#ffe4b5',
    // Oranges
    '#ffb088', '#ffa07a', '#ff8c69', '#ff7f50', '#ea580c', '#f97316',
    '#ff8c00', '#ffa500', '#ff6347', '#ff4500', '#ff7043', '#ff5722',
    // Reds
    '#ff7f7f', '#ff6b6b', '#ff5252', '#e11d48', '#dc2626', '#ef4444',
    '#ff0000', '#dc143c', '#b22222', '#8b0000', '#cd5c5c', '#f08080',
    // Browns & Tans
    '#d2691e', '#cd853f', '#daa520', '#b8860b', '#bc8f8f', '#f4a460',
    '#deb887', '#d2b48c', '#f5deb3', '#ffe4c4', '#ffdead', '#faebd7',
    // Grays & Silvers
    '#c0c0c0', '#d3d3d3', '#dcdcdc', '#e8e8e8', '#f5f5f5', '#a9a9a9',
    '#808080', '#696969', '#778899', '#708090', '#2f4f4f', '#36454f',
    // Blacks & Darks
    '#000000', '#1a1a1a', '#2d2d2d', '#404040', '#0a0a0a', '#191970',
    // Neons & Brights
    '#39ff14', '#ff073a', '#fe019a', '#00ffff', '#ff10f0', '#ffff00',
    '#ff6600', '#00ff00', '#ff00ff', '#00ffff', '#ff1493', '#7fff00',
    // Pastels & Lavender
    '#ffb3ba', '#ffdfba', '#ffffba', '#baffc9', '#bae1ff', '#e0bbff',
    '#ffd1dc', '#fff0f5', '#f0e68c', '#e6e6fa', '#ffe4e1', '#f5f5dc',
    '#e6e6fa', '#d8bfd8', '#dda0dd', '#e0b0ff', '#c8a2c8', '#b19cd9',
    // Jewel Tones
    '#e0115f', '#9b111e', '#702963', '#4b0082', '#014421', '#0f4d92',
    '#50c878', '#b57edc', '#ff2400', '#ffbf00', '#0047ab', '#c41e3a',
    // Earthy & Natural Tones
    '#8b4513', '#a0522d', '#6b4423', '#704214', '#966919', '#c19a6b',
    '#e97451', '#cc5500', '#e2725b', '#c04000', '#954535', '#882d17',
    '#556b2f', '#6b8e23', '#808000', '#9acd32', '#adff2f', '#7cfc00',
    // Metallics & Ocean
    '#b87333', '#cd7f32', '#e5aa70', '#c9ae5d', '#e6e8fa', '#aaa9ad',
    '#71706e', '#918151', '#ffd700', '#cfb53b', '#e0b0ff', '#4682b4'
  ];

  // Remove duplicates by converting to Set and back to array
  const uniqueColors = Array.from(new Set(quickColors.map(c => c.toLowerCase())));

  const colorCategories = {
    'All': uniqueColors,
    'Pinks': uniqueColors.filter(c => {
      const pinks = quickColors.slice(5, 17).map(x => x.toLowerCase());
      return pinks.includes(c);
    }),
    'Purples': uniqueColors.filter(c => {
      const purples = quickColors.slice(17, 29).map(x => x.toLowerCase());
      return purples.includes(c);
    }),
    'Blues': uniqueColors.filter(c => {
      const blues = quickColors.slice(29, 41).map(x => x.toLowerCase());
      return blues.includes(c);
    }),
    'Greens': uniqueColors.filter(c => {
      const greens = [...quickColors.slice(41, 65)].map(x => x.toLowerCase());
      return greens.includes(c);
    }),
    'Warm': uniqueColors.filter(c => {
      const warm = [...quickColors.slice(65, 113)].map(x => x.toLowerCase());
      return warm.includes(c);
    }),
    'Cool': uniqueColors.filter(c => {
      const cool = [...quickColors.slice(29, 53)].map(x => x.toLowerCase());
      return cool.includes(c);
    }),
    'Neutrals': uniqueColors.filter(c => {
      const neutrals = [...quickColors.slice(113, 145)].map(x => x.toLowerCase());
      return neutrals.includes(c);
    }),
    'Neons': uniqueColors.filter(c => {
      const neons = quickColors.slice(145, 157).map(x => x.toLowerCase());
      return neons.includes(c);
    })
  };

  const getFilteredColors = () => {
    return colorCategories[colorCategory as keyof typeof colorCategories] || quickColors;
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

      {/* Custom Color Picker Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="text-xl font-bold mb-1 text-gray-800">
          🎨 Custom Color Studio
        </h3>
        <p className="text-xs text-gray-500 mb-4">Pick any color or create your own</p>

        <div className="grid grid-cols-3 gap-4 mb-5">
          {/* Color Picker */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
              Picker
            </label>
            <input
              type="color"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className="w-full h-20 rounded-lg cursor-pointer border border-gray-300 hover:border-purple-400 transition-colors"
            />
          </div>
          
          {/* Hex Input */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
              Hex Code
            </label>
            <input
              type="text"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className="w-full h-20 px-3 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-lg font-mono text-center"
              placeholder="#ff69b4"
            />
          </div>

          {/* Apply Button */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
              Apply
            </label>
            <button
              onClick={applyCustomColor}
              disabled={loading}
              className="w-full h-20 bg-gradient-to-br from-purple-600 to-pink-600 text-white text-sm font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 shadow-sm hover:shadow-md transition-all disabled:opacity-50"
            >
              {loading ? 'Applying...' : 'Apply Color'}
            </button>
          </div>
        </div>

        {/* Color Categories */}
        <div className="mb-4">
          <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider">
            Categories
          </label>
          <div className="flex flex-wrap gap-1.5">
            {['All', 'Pinks', 'Purples', 'Blues', 'Greens', 'Warm', 'Cool', 'Neutrals', 'Neons'].map((cat) => (
              <button
                key={cat}
                onClick={() => setColorCategory(cat)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  colorCategory === cat
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Color Palette */}
        <div>
          <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider">
            Palette ({getFilteredColors().length} colors)
          </label>
          <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
            <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(26px, 1fr))' }}>
              {getFilteredColors().map((color, index) => (
                <button
                  key={index}
                  onClick={() => setCustomColor(color)}
                  className={`w-full aspect-square rounded transition-all hover:scale-110 hover:shadow-lg border-2 ${
                    customColor.toLowerCase() === color.toLowerCase() 
                      ? 'border-purple-600 scale-110 shadow-lg ring-2 ring-purple-300' 
                      : 'border-transparent hover:border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>
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

            {/* Color Palette Display */}
            <div className="space-y-3">
              {/* Main Color Palette - 5 shades */}
              <div className="grid grid-cols-5 gap-1">
                <div 
                  className="h-10 rounded-l transition-transform hover:scale-105"
                  style={{ backgroundColor: adjustColor(theme.primary, 60) }}
                  title="Lightest"
                ></div>
                <div 
                  className="h-10 transition-transform hover:scale-105"
                  style={{ backgroundColor: adjustColor(theme.primary, 30) }}
                  title="Light"
                ></div>
                <div 
                  className="h-10 transition-transform hover:scale-105 ring-2 ring-white"
                  style={{ backgroundColor: theme.primary }}
                  title="Primary"
                ></div>
                <div 
                  className="h-10 transition-transform hover:scale-105"
                  style={{ backgroundColor: adjustColor(theme.primary, -30) }}
                  title="Dark"
                ></div>
                <div 
                  className="h-10 rounded-r transition-transform hover:scale-105"
                  style={{ backgroundColor: adjustColor(theme.primary, -50) }}
                  title="Darkest"
                ></div>
              </div>

              {/* Accent Colors Row */}
              <div className="grid grid-cols-5 gap-1">
                <div 
                  className="h-6 rounded"
                  style={{ backgroundColor: adjustColor(theme.primary, 80) }}
                ></div>
                <div 
                  className="h-6 rounded"
                  style={{ backgroundColor: adjustColor(theme.primary, 50) }}
                ></div>
                <div 
                  className="h-6 rounded"
                  style={{ backgroundColor: adjustColor(theme.primary, 20) }}
                ></div>
                <div 
                  className="h-6 rounded"
                  style={{ backgroundColor: adjustColor(theme.primary, -20) }}
                ></div>
                <div 
                  className="h-6 rounded"
                  style={{ backgroundColor: adjustColor(theme.primary, -40) }}
                ></div>
              </div>
              
              {/* Sample Button */}
              <button 
                className="w-full py-2 px-4 rounded-lg text-white text-sm font-medium transition-all hover:shadow-lg"
                style={{ 
                  backgroundColor: theme.primary,
                  boxShadow: `0 4px 14px 0 ${theme.primary}40`
                }}
              >
                Preview Theme
              </button>
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