import { Product } from '../types';
import Image from 'next/image';
import { useTheme } from '../../lib/theme';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onToggleWishlist: (productId: number) => void;
  onViewDetails: (product: Product) => void;
  isWishlisted: boolean;
  isInCart: boolean;
  currencySymbol?: string;
}

export default function ProductCard({ product, onAddToCart, onToggleWishlist, onViewDetails, isWishlisted, isInCart, currencySymbol = '$' }: ProductCardProps) {
  const { theme } = useTheme();
  const discountPercentage = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;
  
  // Check if product is new (added within last 7 days)
  const isNew = product.dateAdded && new Date(product.dateAdded) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  // Check if product is trending (high likes)
  const isTrending = product.likes && product.likes > 10;

  return (
    <div 
      className="group rounded-2xl overflow-hidden border relative bg-white shadow-sm hover:shadow-xl transition-all duration-300 scroll-animate scroll-fadeInUp"
      style={{ borderColor: '#e5e7eb' }}
    >
      {/* Wishlist Heart */}
      <button
        onClick={() => onToggleWishlist(product.id)}
        className="absolute top-3 right-3 z-20 p-2.5 rounded-full bg-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110"
      >
        {isWishlisted ? (
          <svg 
            className="w-5 h-5" 
            fill={theme.primary} 
            viewBox="0 0 24 24"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        ) : (
          <svg 
            className="w-5 h-5 text-gray-300 hover:text-gray-400 transition-colors" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        )}
      </button>

      {/* Discount Badge */}
      {discountPercentage > 0 && product.inStock && (
        <div 
          className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded text-xs font-bold text-white"
          style={{ backgroundColor: theme.primary }}
        >
          -{discountPercentage}%
        </div>
      )}

      {/* Sold Out Badge - Clean and minimal */}
      {!product.inStock && (
        <div className="absolute top-3 left-3 z-20 px-3 py-1 rounded-md text-xs font-bold text-white bg-red-600">
          SOLD OUT
        </div>
      )}

      {/* Image Container */}
      <div 
        className="relative h-72 cursor-pointer overflow-hidden bg-gray-50"
        onClick={() => onViewDetails(product)}
      >
        <Image 
          src={product.images && product.images.length > 0 && product.images[0] ? product.images[0] : 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop'} 
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      
      {/* Product Info */}
      <div className="p-4 bg-white">
        {/* Brand/Category and Size */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-gray-600">{product.brand}</p>
          <span 
            className="text-xs font-medium px-2 py-0.5 rounded text-white"
            style={{ 
              backgroundColor: theme.accent,
              opacity: 0.9
            }}
          >
            {product.size}
          </span>
        </div>

        {/* Product Name */}
        <h3 className="font-medium text-gray-900 text-sm mb-3 line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* Description */}
        <p className="text-xs text-gray-500 mb-4 line-clamp-2 leading-relaxed">
          {product.description || `${product.condition} condition. ${product.material || 'Quality materials'}.`}
        </p>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-lg font-bold text-gray-900">
            {currencySymbol}{product.price.toFixed(2)}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-gray-400 line-through">
              {currencySymbol}{product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button 
            onClick={() => onViewDetails(product)}
            className="flex-1 px-4 py-2.5 border-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-50"
            style={{ 
              borderColor: theme.primary,
              color: theme.primary
            }}
          >
            Details
          </button>
          <button 
            onClick={() => onAddToCart(product)}
            disabled={!product.inStock || isInCart}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-all duration-200 ${
              !product.inStock || isInCart
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:opacity-90'
            }`}
            style={{ backgroundColor: theme.primary }}
          >
            {!product.inStock ? 'Sold Out' : isInCart ? 'In Cart' : 'Add to Bag'}
          </button>
        </div>
      </div>
    </div>
  );
}
