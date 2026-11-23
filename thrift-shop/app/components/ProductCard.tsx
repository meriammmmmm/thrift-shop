import { Product } from '../types';
import Image from 'next/image';

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
 * A modern collection is a wall of pictures, not a wall of boxes. The piece
 * stands on a sheet of soft paper — the same tone on every tile, so the grid
 * reads as one surface instead of a row of different frames — and underneath
 * there is nothing but type: the house of the piece, the price, the name.
 *
 * Two things wait for the pointer. The second photograph fades in over the
 * first, if the piece has one, and a slim "quick add" rises from the bottom
 * of the picture. The heart in the corner is the wishlist.
 *
 * The picture and the name both open the details, which is where the full
 * description, the sizes, the condition and the love counter live.
 */
export default function ProductCard({
  product,
  onAddToCart,
  onToggleWishlist,
  onViewDetails,
  isWishlisted,
  isInCart,
  currencySymbol = '$',
}: ProductCardProps) {
  const discountPercentage = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const photographs = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
  const photograph =
    photographs[0] ?? 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop';
  const secondPhotograph = photographs[1] ?? null;

  const sold = !product.inStock || product.reservation_status === 'sold';
  const reserved = product.reservation_status === 'reserved';
  const canBuy = !sold && !reserved;

  return (
    <article
      data-cinematic="catalogue-card"
      data-product-id={product.id}
      className="product-tile group relative flex flex-col"
    >
      {/* The picture */}
      <div
        data-spotlight
        data-cinematic="card-media"
        className="product-tile__frame relative aspect-[3/4] w-full overflow-hidden"
        onClick={() => onViewDetails(product)}
      >
        <Image
          src={photograph}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
          /*
           * `contain` and not `cover`: the customer is buying the piece,
           * so the whole piece has to be on the card. `cover` cut the item
           * off at the edge of the frame and hid what was being sold.
           */
          className="product-tile__photo object-contain"
        />

        {secondPhotograph && (
          <Image
            src={secondPhotograph}
            alt=""
            aria-hidden="true"
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
            className="product-tile__photo product-tile__photo--alt object-contain"
          />
        )}

        {/* The heart — the piece goes on the wishlist */}
        <button
          onClick={(event) => {
            event.stopPropagation();
            onToggleWishlist(product.id);
          }}
          data-liked={isWishlisted ? 'true' : 'false'}
          aria-label={
            isWishlisted
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
          title={isWishlisted ? 'In your wishlist' : 'Add to wishlist'}
          className="product-tile__heart"
        >
          <svg
            className="h-[18px] w-[18px]"
            fill={isWishlisted ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={1.7}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 20.5 4.8 13.4a4.6 4.6 0 0 1 6.5-6.5l.7.7.7-.7a4.6 4.6 0 0 1 6.5 6.5L12 20.5Z" />
          </svg>
        </button>

        {/* The discount, said quietly */}
        {discountPercentage > 0 && canBuy && (
          <span className="product-tile__tag">-{discountPercentage}%</span>
        )}

        {/* The quick add — the bag, in one tap */}
        {canBuy && (
          <button
            onClick={(event) => {
              event.stopPropagation();
              onAddToCart(product);
            }}
            disabled={isInCart}
            aria-label={isInCart ? `${product.name} is in your bag` : `Add ${product.name} to bag`}
            className="product-tile__add"
          >
            <span className="product-tile__add-label">
              {isInCart ? 'In your bag' : 'Quick add'}
            </span>
            {isInCart ? (
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            )}
          </button>
        )}

        {(sold || reserved) && (
          <>
            <div className="product-tile__veil" />
            <span className="product-tile__state">{sold ? 'Sold out' : 'Reserved'}</span>
          </>
        )}
      </div>

      {/* The type */}
      <div data-cinematic="card-info" className="product-tile__meta">
        <div className="product-tile__head">
          <p className="product-tile__brand truncate">{product.brand}</p>
          <div className="product-tile__prices">
            <p className="product-tile__price">
              {currencySymbol}
              {product.price.toFixed(2)}
            </p>
            {product.originalPrice && (
              <p className="product-tile__was">
                {currencySymbol}
                {product.originalPrice.toFixed(2)}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onViewDetails(product)}
          className="product-tile__name mt-1.5 block w-full text-left line-clamp-2"
        >
          {product.name}
        </button>
      </div>
    </article>
  );
}
