'use client';

import { useEffect } from 'react';
import { useTheme } from '../../lib/theme';

interface SuccessNotificationProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function SuccessNotification({ 
  message, 
  isVisible, 
  onClose, 
  duration = 3000 
}: SuccessNotificationProps) {
  const { theme } = useTheme();

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-4 max-w-sm">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${theme.primary}20` }}>
              <svg className="w-5 h-5" style={{ color: theme.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Succès!</p>
            <p className="text-sm text-gray-600 mt-1">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}