import React from 'react';
import { createPortal } from 'react-dom';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  icon?: string;
  iconColor?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  icon = 'fas fa-exclamation-triangle',
  iconColor = 'text-red-500'
}) => {
  if (!isOpen) return null;

  const modalContent = (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      {/* Backdrop - very light so you can see the content behind */}
      <div 
        onClick={onCancel}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)'
        }}
      />
      
      {/* Modal */}
      <div 
        style={{
          position: 'relative',
          backgroundColor: 'white',
          borderRadius: '16px',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          zIndex: 100000
        }}
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: '#9CA3AF'
          }}
        >
          ✕
        </button>
        
        <div style={{ padding: '24px' }}>
          {/* Icon */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            margin: '0 auto 16px',
            borderRadius: '50%',
            backgroundColor: '#FEF2F2'
          }}>
            <i className={`${icon} ${iconColor} text-xl`}></i>
          </div>
          
          {/* Content */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '8px'
            }}>{title}</h3>
            <p style={{
              color: '#6B7280',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>{message}</p>
          </div>
          
          {/* Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={onConfirm}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#EF4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              {confirmText}
            </button>
            <button
              onClick={onCancel}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: 'transparent',
                color: '#374151',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ConfirmationModal;