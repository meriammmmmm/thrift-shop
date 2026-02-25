'use client';

import { useState } from 'react';
import { useTheme } from '../../lib/theme';

interface SizeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSizes: string[];
  onSizeChange: (sizes: string[]) => void;
  availableSizes: string[];
}

export default function SizeSelector({ isOpen, onClose, selectedSizes, onSizeChange, availableSizes }: SizeSelectorProps) {
  const { theme } = useTheme();
  const [tempSelectedSizes, setTempSelectedSizes] = useState<string[]>(selectedSizes);
  const [activeTab, setActiveTab] = useState('Tops & Dresses');

  if (!isOpen) return null;

  // Size categories like ThredUp
  const sizeCategories = {
    'Tops & Dresses': {
      sizes: ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '0X', '1X', '2X'],
      description: 'Shirts, blouses, dresses, jackets'
    },
    'Bottoms': {
      sizes: ['0', '2', '4', '6', '8', '10', '12', '14', '16', '18', '20', '22', '24', '26', '28', '30', '32'],
      description: 'Pants, jeans, skirts, shorts'
    },
    'Waist': {
      sizes: ['24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '36', '38', '40', '42'],
      description: 'Waist measurements in inches'
    },
    'Shoes': {
      sizes: ['5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12'],
      description: 'US women\'s shoe sizes'
    }
  };

  // Filter categories to show all categories (not just those with available sizes)
  const availableCategories = Object.entries(sizeCategories);

  const handleSizeToggle = (size: string) => {
    if (tempSelectedSizes.includes(size)) {
      setTempSelectedSizes(tempSelectedSizes.filter(s => s !== size));
    } else {
      setTempSelectedSizes([...tempSelectedSizes, size]);
    }
  };

  const handleSave = () => {
    onSizeChange(tempSelectedSizes);
    onClose();
  };

  const handleClear = () => {
    setTempSelectedSizes([]);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Make shopping easier by saving your sizes.</h2>
            <p className="text-sm text-gray-600 mt-1">We'll show you what fits.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex">
            {availableCategories.map(([category]) => (
              <button
                key={category}
                onClick={() => handleTabChange(category)}
                className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === category
                    ? ''
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                style={{
                  borderColor: activeTab === category ? theme.primary : 'transparent',
                  color: activeTab === category ? theme.primary : undefined
                }}
              >
                {category}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {availableCategories.map(([category, data]) => (
            <div key={category} className={activeTab === category ? 'block' : 'hidden'}>
              <p className="text-sm text-gray-600 mb-4">{data.description}</p>
              
              <div className={`grid gap-2 ${
                category === 'Bottoms' || category === 'Waist' || category === 'Shoes' 
                  ? 'grid-cols-6' 
                  : 'grid-cols-5'
              }`}>
                {data.sizes.map((size) => {
                  const isAvailable = availableSizes.includes(size);
                  const isSelected = tempSelectedSizes.includes(size);
                  
                  return (
                    <button
                      key={size}
                      onClick={() => isAvailable && handleSizeToggle(size)}
                      disabled={!isAvailable}
                      className={`py-3 px-2 border rounded-lg text-sm font-medium transition-all duration-200 ${
                        isSelected && isAvailable
                          ? 'text-white border-2'
                          : isAvailable
                            ? 'text-gray-700 border-gray-300 hover:border-gray-400'
                            : 'text-gray-300 border-gray-200 cursor-not-allowed bg-gray-50'
                      }`}
                      style={{
                        backgroundColor: isSelected && isAvailable ? theme.primary : undefined,
                        borderColor: isSelected && isAvailable ? theme.primary : undefined
                      }}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>

              {/* Special sections for shoes */}
              {category === 'Shoes' && (
                <div className="mt-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Petite</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Tall</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Maternity</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Selected Count */}
          {tempSelectedSizes.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>{tempSelectedSizes.length}</strong> size{tempSelectedSizes.length !== 1 ? 's' : ''} selected
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                {tempSelectedSizes.map(size => (
                  <span 
                    key={size}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-800"
                  >
                    {size}
                    <button
                      onClick={() => handleSizeToggle(size)}
                      className="ml-1 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <button
            onClick={handleClear}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
          >
            Clear All
          </button>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-8 py-2 rounded-lg font-medium text-white transition-all duration-200 hover:opacity-90"
              style={{ backgroundColor: theme.primary }}
            >
              Save Sizes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}