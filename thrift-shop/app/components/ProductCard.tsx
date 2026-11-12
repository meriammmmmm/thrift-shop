import { Product } from '../types';
import Image from 'next/image';
import { useTheme } from '../../lib/theme';
import LoveButton from './LoveButton';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onToggleWishlist: (productId: number) => void;
  onViewDetails: (product: Product) => void;
  isWishlisted: boolean;
  isInCart: boolean;
  currencySymbol?: string;
}

/**
 * The product tile.
 *
 * The phone is the hard case: the grid puts two of these side by side, so a
 * card is roughly 170px wide. Everything below the picture is therefore
 * written small and stays inside that width:
 *
 *   - the picture keeps a 3:4 frame instead of a fixed 500px height, so a
 *     phone never opens on one enormous photo;
 *   - the description is hidden under `sm` — it does not fit two columns and
 *     the full text is one tap away in the details sheet;
 *   - the two buttons collapse into one "Add to Bag", because "Details" and
 *     "Add to Bag" side by side need 340px between them. The picture and the
 *     title both open the details.
 */
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
      className="group rounded-xl sm:rounded-2xl overflow-hidden border relative bg-white shadow-sm hover:shadow-xl transition-all duration-300 scroll-animate scroll-fadeInUp"
      style={{ borderColor: '#e5e7eb' }}
    >
      {/* Wishlist Heart */}
      <button
        onClick={() => onToggleWishlist(product.id)}
        aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20 p-3 sm:p-2.5 rounded-full bg-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110"
      >
        {isWishlisted ? (
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill={theme.primary}
            viewBox="0 0 24 24"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        ) : (
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 hover:text-gray-400 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        )}
      </button>

      {/* Status Badges - Show only one based on priority */}
      {product.reservation_status === 'sold' || !product.inStock ? (
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-20 px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-bold text-white bg-red-600">
          SOLD OUT
        </div>
      ) : product.reservation_status === 'reserved' ? (
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-20 px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-bold text-white bg-orange-500">
          RESERVED
        </div>
      ) : discountPercentage > 0 ? (
        <div
          className="absolute top-2 left-2 sm:top-3 sm:left-3 z-20 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-bold text-white"
          style={{ backgroundColor: theme.primary }}
        >
          -{discountPercentage}%
        </div>
      ) : null}

      {/* Image Container — a 3:4 frame, so the tile keeps its shape at every width */}
      <div
        data-spotlight
        className="relative aspect-[3/4] w-full cursor-pointer overflow-hidden bg-white"
        onClick={() => onViewDetails(product)}
      >
        <Image
          src={product.images && product.images.length > 0 && product.images[0] ? product.images[0] : 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop'}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* Product Info */}
      <div className="p-2.5 sm:p-4 bg-white">
        {/* Brand/Category and Size */}
        <div className="flex items-center justify-between gap-1 mb-1.5 sm:mb-2">
          <p className="text-[10px] sm:text-xs font-medium text-gray-600 truncate">{product.brand}</p>
          <span
            className="shrink-0 text-[9px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded text-white"
            style={{
              backgroundColor: theme.accent,
              opacity: 0.9
            }}
          >
            {product.size}
          </span>
        </div>

        {/* Product Name — also the way into the details on a phone */}
        <button
          type="button"
          onClick={() => onViewDetails(product)}
          className="block w-full text-left font-medium text-gray-900 text-[13px] sm:text-sm mb-2 sm:mb-3 line-clamp-2 min-h-[2.25rem] sm:min-h-[2.5rem] py-0.5 hover:text-gray-600 active:text-gray-700 transition-colors"
        >
          {product.name}
        </button>

        {/* Description — too much text for a two-column phone tile */}
        <p className="hidden sm:block text-xs text-gray-500 mb-4 line-clamp-2 leading-relaxed">
          {product.description || `${product.condition} condition. ${product.material || 'Quality materials'}.`}
        </p>

        {/* Price + how many people loved the piece */}
        <div className="flex items-center justify-between gap-1.5 mb-3 sm:mb-4">
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span className="text-[15px] sm:text-lg font-bold text-gray-900 whitespace-nowrap">
              {currencySymbol}{product.price.toFixed(2)}
            </span>
            {product.originalPrice && (
              /* On a phone the two-column tile has no room for both prices —
                 the discount badge on the picture already says it. */
              <span className="hidden sm:inline text-sm text-gray-400 line-through">
                {currencySymbol}{product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          <LoveButton
            productId={product.id}
            likes={product.likes ?? 0}
            liked={product.liked_by_me ?? false}
            size="sm"
          />
        </div>

        {/* Buttons — one on a phone, two from the tablet up */}
        <div className="flex gap-2">
          <button
            onClick={() => onViewDetails(product)}
            className="hidden sm:flex sm:flex-1 items-center justify-center px-4 py-2.5 border-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-50"
            style={{
              borderColor: theme.primary,
              color: theme.primary
            }}
          >
            Details
          </button>
          <button
            onClick={() => onAddToCart(product)}
            disabled={!product.inStock || isInCart || product.reservation_status === 'reserved' || product.reservation_status === 'sold'}
            className={`flex-1 px-2 sm:px-4 py-3 sm:py-2.5 rounded-lg text-[13px] sm:text-sm font-medium text-white transition-all duration-200 ${
              !product.inStock || isInCart || product.reservation_status === 'reserved' || product.reservation_status === 'sold'
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:opacity-90'
            }`}
            style={{ backgroundColor: theme.primary }}
          >
            {product.reservation_status === 'reserved'
              ? 'Reserved'
              : product.reservation_status === 'sold' || !product.inStock
              ? 'Sold Out'
              : isInCart
              ? 'In Cart'
              : 'Add to Bag'}
          </button>
        </div>
      </div>
    </div>
  );
}
