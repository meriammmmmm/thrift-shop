import React, { useState, useEffect } from 'react';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

interface NotificationSystemProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({ notifications, onRemove }) => {
  useEffect(() => {
    notifications.forEach(notification => {
      if (notification.duration !== 0) {
        const timer = setTimeout(() => {
          onRemove(notification.id);
        }, notification.duration || 5000);

        return () => clearTimeout(timer);
      }
    });
  }, [notifications, onRemove]);

  const getNotificationStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-200/50 text-green-800';
      case 'error':
        return 'border-red-200/50 text-red-800';
      case 'warning':
        return 'border-yellow-200/50 text-yellow-800';
      case 'info':
        return 'border-blue-200/50 text-blue-800';
      default:
        return 'border-gray-200/50 text-gray-800';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return 'fas fa-check-circle text-green-500';
      case 'error':
        return 'fas fa-exclamation-circle text-red-500';
      case 'warning':
        return 'fas fa-exclamation-triangle text-yellow-500';
      case 'info':
        return 'fas fa-info-circle text-blue-500';
      default:
        return 'fas fa-bell text-gray-500';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`max-w-sm w-full border rounded-lg shadow-lg p-4 transform transition-all duration-300 ease-in-out backdrop-blur-md bg-white/90 ${getNotificationStyles(notification.type)}`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <i className={`${getNotificationIcon(notification.type)} text-lg`}></i>
            </div>
            <div className="ml-3 w-0 flex-1">
              <p className="text-sm font-semibold">{notification.title}</p>
              <p className="text-sm mt-1">{notification.message}</p>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                onClick={() => onRemove(notification.id)}
                className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <i className="fas fa-times text-sm"></i>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationSystem;