'use client';

import { Product } from '../types';
import { useTheme } from '../../lib/theme';
import { useEffect, useState } from 'react';

interface WishlistProps {
  isOpen: boolean;
  onClose: () => void;
  wishlist: Product[];
  onRemove: (productId: number) => void;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  currencySymbol?: string;
}

export default function Wishlist({ 
  isOpen, 
  onClose, 
  wishlist, 
  onRemove, 
  onAddToCart,
  onViewDetails,
  currencySymbol = '$'
}: WishlistProps) {
  const { theme } = useTheme();
  if (!isOpen) return null;

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
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-white to-gray-50">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                {wishlist.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                    {wishlist.length}
                  </div>
                )}
              </div>
              <h2 className="text-xl font-semibold text-gray-900">My Wishlist</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200 hover:rotate-90">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {wishlist.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <svg className="w-16 h-16 text-gray-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Your wishlist is empty</h3>
                <p className="text-gray-500 mb-6 max-w-sm">Save items you love by clicking the heart icon on any product</p>
                <button onClick={onClose} className="px-6 py-3 rounded-lg text-white font-medium transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl" style={{ backgroundColor: theme.primary }}>
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {wishlist.map((product, index) => (
                  <div key={product.id} className="flex space-x-4 p-4 border rounded-lg hover:shadow-lg transition-all duration-300">
                    <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden cursor-pointer" onClick={() => onViewDetails(product)}>
                      {product.images && product.images.length > 0 ? (
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate cursor-pointer" onClick={() => onViewDetails(product)}>{product.name}</h3>
                      <p className="text-sm text-gray-500 truncate">{product.brand}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="font-semibold text-gray-900">{currencySymbol}{product.price.toFixed(2)}</span>
                        {product.originalPrice && (
                          <span className="text-sm text-gray-400 line-through">{currencySymbol}{product.originalPrice.toFixed(2)}</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-3">
                        <button onClick={() => onAddToCart(product)} className="flex-1 px-3 py-2 text-sm rounded-lg text-white font-medium" style={{ backgroundColor: theme.primary }}>Add to Cart</button>
                        <button onClick={() => onRemove(product.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Remove from wishlist">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {wishlist.length > 0 && (
            <div className="border-t p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-600">{wishlist.length} item{wishlist.length !== 1 ? 's' : ''} saved</span>
              </div>
              <button onClick={onClose} className="w-full py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50">Continue Shopping</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
