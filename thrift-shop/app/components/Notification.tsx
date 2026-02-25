import { useTheme } from '../../lib/theme';

interface NotificationProps {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
}

export default function Notification({ message, type, isVisible, onClose }: NotificationProps) {
  const { theme } = useTheme();
  
  if (!isVisible) return null;

  return (
    <div 
      className="fixed top-20 right-4 text-white px-4 py-3 rounded-lg shadow-2xl z-50 modal-slide-left hover:scale-105 transition-all duration-300"
      style={{ 
        backgroundColor: type === 'success' ? theme.primary : 
                        type === 'error' ? '#ef4444' : 
                        '#14b8a6' 
      }}
    >
      <div className="flex items-center justify-between space-x-3">
        <div className="flex items-center space-x-2">
          {type === 'success' && (
            <svg className="w-5 h-5 animate-bounceIn" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {type === 'error' && (
            <svg className="w-5 h-5 animate-bounceIn" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {type === 'info' && (
            <svg className="w-5 h-5 animate-bounceIn" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <span className="text-sm font-medium">{message}</span>
        </div>
        <button 
          onClick={onClose}
          className="ml-3 text-white hover:text-gray-200 p-1 hover:bg-white/20 rounded transition-all duration-200"
        >
          ✕
        </button>
      </div>
    </div>
  );
}