import { Product } from '../types';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  cart: Product[];
  onRemove: (productId: number) => void;
  total: number;
  onCheckout: () => void;
  user: any;
}

export default function Cart({ isOpen, onClose, cart, onRemove, total, onCheckout, user }: CartProps) {
  const router = useRouter();
  if (!isOpen) return null;

  const handleCheckout = () => {
    if (!user) {
      // User not logged in, redirect to login
      window.location.href = '/login';
      return;
    }
    
    if (cart.length === 0) {
      return;
    }
    
    // Close cart and redirect to checkout page
    onClose();
    router.push('/checkout');
  };

  const cartItems = cart.reduce((acc, item) => {
    const existing = acc.find(i => i.id === item.id);
    if (existing) {
      existing.quantity++;
    } else {
      acc.push({ ...item, quantity: 1 });
    }
    return acc;
  }, [] as (Product & { quantity: number })[]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        className="absolute inset-0 backdrop-blur-sm bg-black/20 backdrop-fade"
        onClick={onClose}
      ></div>
      
      <div 
        className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl modal-fade-slide"
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b bg-gradient-to-r from-white to-gray-50 sticky top-0 z-10">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z" />
                </svg>
                <span>Shopping Bag</span>
                {cart.length > 0 && (
                  <span className="bg-[var(--color-primary)] text-white text-xs rounded-full px-2 py-0.5 animate-pulse">
                    {cart.length}
                  </span>
                )}
              </h2>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-xl p-2 hover:bg-gray-100 rounded-full transition-all duration-200 hover:rotate-90"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z" />
                </svg>
              </div>
              <p className="text-gray-500 mb-4 font-medium">Your bag is empty</p>
              <p className="text-gray-400 text-sm mb-6">Add some items to get started</p>
              <button 
                onClick={onClose}
                className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white px-6 py-2 rounded-lg font-medium text-sm transition-all duration-300 hover:scale-105 magnetic-btn"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <>
              {cartItems.map((item, index) => (
                <div key={item.id} className="flex items-start py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 rounded-lg transition-all duration-200 px-2">
                  {/* Product Image */}
                  <div className="flex-shrink-0 w-16 h-16 mr-4">
                    <img 
                      src={item.images?.[0] || 'https://via.placeholder.com/64x64/f3f4f6/9ca3af?text=No+Image'} 
                      alt={item.name}
                      className="w-full h-full object-cover rounded-lg border border-gray-200"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/64x64/f3f4f6/9ca3af?text=No+Image';
                      }}
                    />
                  </div>
                  
                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm truncate">
                      {item.name}
                    </h4>
                    <p className="text-gray-500 text-xs mt-1">
                      {item.brand} • {item.size}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {item.condition}
                    </p>
                    <p className="text-gray-600 text-sm mt-1 font-medium">
                      ${item.price.toFixed(2)} × {item.quantity}
                    </p>
                  </div>
                  
                  {/* Price and Remove */}
                  <div className="flex flex-col items-end ml-4">
                    <span className="font-semibold text-gray-900 text-sm mb-2">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                    <button 
                      onClick={() => onRemove(item.id)}
                      className="text-gray-400 hover:text-red-500 text-xs underline transition-all duration-200 hover:scale-105"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              <div className="pt-4 mt-4 border-t">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-semibold text-gray-900">Total:</span>
                  <span className="font-bold text-lg text-gray-900">${total.toFixed(2)}</span>
                </div>

                <button 
                  onClick={handleCheckout}
                  className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white py-3 rounded-md font-medium transition-all duration-300 hover:scale-105 magnetic-btn shadow-lg hover:shadow-xl"
                >
                  {user ? 'Proceed to Checkout' : 'Sign In to Checkout'}
                </button>
                
                {!user && (
                  <p className="text-xs text-gray-500 text-center mt-2">
                    You need to create an account to complete your purchase
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
