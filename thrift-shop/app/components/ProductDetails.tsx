import { useState, useEffect } from 'react';
import { Product } from '../types';
import Image from 'next/image';
import SizeGuide from './SizeGuide';
import { useTheme } from '../../lib/theme';

interface ProductDetailsProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  onToggleWishlist: (productId: number) => void;
  isWishlisted: boolean;
  isInCart: boolean;
  currencySymbol?: string;
}

export default function ProductDetails({ 
  product, 
  isOpen, 
  onClose, 
  onAddToCart, 
  onToggleWishlist, 
  isWishlisted,
  isInCart,
  currencySymbol = '$'
}: ProductDetailsProps) {
  const { theme } = useTheme();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'details' | 'measurements' | 'care'>('details');
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && product) {
      // Swipe left - next image
      setSelectedImageIndex(prev => (prev + 1) % product.images.length);
      setIsAutoPlaying(false);
    }
    
    if (isRightSwipe && product) {
      // Swipe right - previous image
      setSelectedImageIndex(prev => prev === 0 ? product.images.length - 1 : prev - 1);
      setIsAutoPlaying(false);
    }
  };

  const onMouseDown = (e: React.MouseEvent) => {
    setTouchEnd(null);
    setTouchStart(e.clientX);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (touchStart === null) return;
    setTouchEnd(e.clientX);
  };

  const onMouseUp = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && product) {
      setSelectedImageIndex(prev => (prev + 1) % product.images.length);
      setIsAutoPlaying(false);
    }
    
    if (isRightSwipe && product) {
      setSelectedImageIndex(prev => prev === 0 ? product.images.length - 1 : prev - 1);
      setIsAutoPlaying(false);
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  if (!isOpen || !product) return null;

  const discountPercentage = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 backdrop-fade"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl modal-fade-scale"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid md:grid-cols-2 gap-0">
          {/* Image Gallery */}
          <div className="relative bg-white">
            <div 
              className="relative h-[617px] overflow-hidden bg-white cursor-grab active:cursor-grabbing select-none"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={() => {
                setTouchStart(null);
                setTouchEnd(null);
              }}
            >
              {/* Main Image */}
              <div 
                className="flex transition-transform duration-500 ease-out h-full"
                style={{ transform: `translateX(-${selectedImageIndex * 100}%)` }}
              >
                {product.images.map((image, index) => (
                  <div key={index} className="flex-shrink-0 w-full h-full relative bg-white pointer-events-none">
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      fill
                      className="object-cover object-top"
                      draggable={false}
                    />
                  </div>
                ))}
              </div>
              
              {/* Swipe Indicator */}
              {product.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <i className="fas fa-hand-pointer mr-1"></i>
                  Swipe or drag to view more
                </div>
              )}
              
              {/* Navigation Arrows */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={() => {
                      setSelectedImageIndex(prev => prev === 0 ? product.images.length - 1 : prev - 1);
                      setIsAutoPlaying(false);
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all"
                  >
                    <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedImageIndex(prev => (prev + 1) % product.images.length);
                      setIsAutoPlaying(false);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all"
                  >
                    <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}

              {/* Wishlist Heart */}
              <button
                onClick={() => onToggleWishlist(product.id)}
                className="absolute top-4 right-4 p-2.5 rounded-full bg-white shadow-md hover:scale-110 transition-all duration-200"
              >
                {isWishlisted ? (
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                )}
              </button>

              {/* Discount Badge */}
              {discountPercentage > 0 && (
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-white text-sm font-bold" style={{ backgroundColor: theme.primary }}>
                  -{discountPercentage}%
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-2 p-4 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedImageIndex(index);
                      setIsAutoPlaying(false);
                    }}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all ${
                      selectedImageIndex === index ? 'ring-2 opacity-100' : 'opacity-50 hover:opacity-75'
                    }`}
                    style={{ 
                      borderColor: selectedImageIndex === index ? theme.primary : undefined,
                      borderWidth: selectedImageIndex === index ? '2px' : undefined
                    }}
                  >
                    <Image src={image} alt="" width={64} height={64} className="object-cover w-full h-full" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="p-8 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">{product.brand}</p>
                <h1 className="text-xl font-semibold text-gray-900 leading-tight">{product.name}</h1>
              </div>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 ml-4 p-2 hover:bg-gray-100 rounded-full transition-all duration-200 hover:rotate-90"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">{currencySymbol} {product.price.toFixed(2)}</span>
                {product.originalPrice && (
                  <span className="text-base text-gray-400 line-through">{currencySymbol}{product.originalPrice.toFixed(2)}</span>
                )}
              </div>
              {discountPercentage > 0 && (
                <p className="text-xs font-medium mt-1" style={{ color: theme.primary }}>
                  Save {currencySymbol}{(product.originalPrice! - product.price).toFixed(2)} ({discountPercentage}% off)
                </p>
              )}
            </div>

            {/* Key Details */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-6">
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Size</span>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">{product.size}</p>
                  <button 
                    onClick={() => setShowSizeGuide(true)}
                    className="text-xs underline"
                    style={{ color: theme.primary }}
                  >
                    Guide
                  </button>
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Condition</span>
                <p className="text-sm font-medium text-gray-900">{product.condition}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Color</span>
                <p className="text-sm font-medium text-gray-900">{product.color}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Material</span>
                <p className="text-sm font-medium text-gray-900">{product.material || 'Not specified'}</p>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button 
              onClick={() => onAddToCart(product)}
              disabled={!product.inStock || isInCart}
              className={`w-full py-3 rounded-lg font-medium text-sm mb-4 transition-all duration-300 hover:scale-105 magnetic-btn shadow-lg hover:shadow-xl ${
                !product.inStock || isInCart
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'text-white hover:opacity-90'
              }`}
              style={{ backgroundColor: product.inStock && !isInCart ? theme.primary : undefined }}
            >
              {!product.inStock ? 'Sold Out' : isInCart ? 'In Cart' : 'Add to Bag'}
            </button>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-4">
              <nav className="flex gap-6">
                {[
                  { id: 'details', label: 'Details' },
                  { id: 'measurements', label: 'Measurements' },
                  { id: 'care', label: 'Care' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-2 border-b-2 text-xs font-medium transition-colors ${
                      activeTab === tab.id ? '' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                    style={{
                      borderColor: activeTab === tab.id ? theme.primary : 'transparent',
                      color: activeTab === tab.id ? theme.primary : undefined
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto text-sm">
              {activeTab === 'details' && (
                <div>
                  <p className="text-gray-700 leading-relaxed text-sm mb-3">{product.description}</p>
                  {product.tags && (
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'measurements' && (
                <div>
                  {product.measurements ? (
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(product.measurements).map(([key, value]) => (
                        <div key={key}>
                          <span className="text-xs text-gray-500 capitalize">{key}</span>
                          <p className="text-sm font-medium text-gray-900">{value}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No measurements available</p>
                  )}
                </div>
              )}

              {activeTab === 'care' && (
                <div>
                  {product.careInstructions ? (
                    <ul className="space-y-2">
                      {product.careInstructions.map((instruction, index) => (
                        <li key={index} className="flex items-start text-sm">
                          <span className="mr-2 text-xs" style={{ color: theme.primary }}>•</span>
                          <span className="text-gray-700">{instruction}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-sm">No care instructions available</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Size Guide Modal */}
        <SizeGuide 
          isOpen={showSizeGuide}
          onClose={() => setShowSizeGuide(false)}
          category={product.category}
        />
      </div>
    </div>
  );
}
