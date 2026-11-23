import { useState, useEffect, useRef } from 'react';
import { Product } from '../types';
import Image from 'next/image';
import SizeGuide from './SizeGuide';
import LoveButton from './LoveButton';

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

/**
 * The details of a piece.
 *
 * The modal carries the same rules as the grid: no bordered boxes, no pills,
 * no grey chips. The picture stands on the same sheet of paper the tiles
 * stand on and is never cropped; the type does the rest — the house of the
 * piece, the name, the price, the facts. The only solid thing on the page
 * is the button that puts the piece in the bag.
 *
 * It arrives as a sequence rather than a pop: the picture wipes down into
 * its frame, the type rises line by line, and the thumbnails come last.
 */
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
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'details' | 'measurements' | 'care'>('details');
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  // The sheet that scrolls — on a phone it is the whole modal.
  const panelRef = useRef<HTMLDivElement>(null);

  // Reset scroll position when product changes or modal opens
  useEffect(() => {
    if (isOpen && product) {
      // Reset scroll to top
      if (panelRef.current) {
        panelRef.current.scrollTop = 0;
      }
      // Reset image index
      setSelectedImageIndex(0);
      // Reset to details tab
      setActiveTab('details');
    }
  }, [isOpen, product?.id]);

  // Escape closes the sheet.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  /* The page behind must not scroll while the sheet is open — on a phone
     the whole page used to drift along behind the picture. */
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

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
    }

    if (isRightSwipe && product) {
      // Swipe right - previous image
      setSelectedImageIndex(prev => prev === 0 ? product.images.length - 1 : prev - 1);
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
    }

    if (isRightSwipe && product) {
      setSelectedImageIndex(prev => prev === 0 ? product.images.length - 1 : prev - 1);
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  if (!isOpen || !product) return null;

  const discountPercentage = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  /* Only the pictures that are really pictures are shown. */
  const photographs = product.images.filter((image) => {
    try {
      if (!image || typeof image !== 'string') return false;
      new URL(image);
      return true;
    } catch {
      return false;
    }
  });

  const sold = product.reservation_status === 'sold' || !product.inStock;
  const reserved = product.reservation_status === 'reserved';
  const canBuy = !sold && !reserved;
  const inBag = isInCart;

  return (
    <div
      className="fixed inset-0 bg-black/45 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 backdrop-fade"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        className="bg-white rounded-t-3xl sm:rounded-[22px] max-w-5xl w-full max-h-[92vh] max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain modal-fade-scale relative product-modal__panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid md:grid-cols-2 gap-0">
          {/* Close */}
          <button
            onClick={onClose}
            aria-label="Close product details"
            className="product-modal__chip product-modal__close absolute top-3 right-3 sm:top-4 sm:right-4 z-50"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* The picture */}
          <div className="relative product-modal__paper">
            {/* On a phone this is a sheet — say so with a quiet grabber */}
            <span aria-hidden="true" className="product-modal__handle sm:hidden" />

            <div
              className="product-modal__media relative h-[36svh] min-h-[220px] sm:h-[440px] md:h-[520px] lg:h-[560px] xl:h-[620px] overflow-hidden cursor-grab active:cursor-grabbing select-none"
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
              {/* The photographs, side by side — the sheet slides between them */}
              <div
                className="flex transition-transform duration-500 ease-out h-full"
                style={{ transform: `translateX(-${selectedImageIndex * 100}%)` }}
              >
                {photographs.map((image, index) => (
                  <div key={index} className="flex-shrink-0 w-full h-full relative pointer-events-none">
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 512px"
                      className="product-modal__photo object-contain"
                      draggable={false}
                    />
                  </div>
                ))}
              </div>

              {/* The arrows */}
              {photographs.length > 1 && (
                <>
                  <button
                    onClick={() => {
                      setSelectedImageIndex(prev => prev === 0 ? photographs.length - 1 : prev - 1);
                    }}
                    aria-label="Previous photograph"
                    className="product-modal__chip absolute left-3 top-1/2 -translate-y-1/2"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedImageIndex(prev => (prev + 1) % photographs.length);
                    }}
                    aria-label="Next photograph"
                    className="product-modal__chip absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}

              {/* The wishlist heart — it takes the left corner so it never
                  crowds the close button on a narrow screen. */}
              <button
                onClick={() => onToggleWishlist(product.id)}
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                title={isWishlisted ? 'In your wishlist' : 'Add to wishlist'}
                className="product-modal__chip absolute top-3 left-3 sm:top-4 sm:left-4"
                style={isWishlisted ? { color: 'var(--color-primary, #731528)' } : undefined}
              >
                <svg
                  fill={isWishlisted ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth={1.8}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 20.5 4.8 13.4a4.6 4.6 0 0 1 6.5-6.5l.7.7.7-.7a4.6 4.6 0 0 1 6.5 6.5L12 20.5Z" />
                </svg>
              </button>

              {/* What the piece is doing — said quietly */}
              {sold ? (
                <span className="product-modal__status">Sold out</span>
              ) : reserved ? (
                <span className="product-modal__status">Reserved</span>
              ) : discountPercentage > 0 ? (
                <span className="product-modal__status product-modal__status--sale">
                  -{discountPercentage}%
                </span>
              ) : null}
            </div>

            {/* The thumbnails */}
            {photographs.length > 1 && (
              <div className="product-modal__thumbs flex gap-2.5 p-3 sm:p-4 overflow-x-auto">
                {photographs.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    aria-label={`Photograph ${index + 1}`}
                    className={`product-modal__thumb w-14 h-14 sm:w-16 sm:h-16 ${
                      selectedImageIndex === index ? 'is-active' : ''
                    }`}
                  >
                    <Image
                      src={image}
                      alt=""
                      width={64}
                      height={64}
                      className="object-contain w-full h-full p-1"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* The type of the piece */}
          <div className="p-5 sm:p-8 pb-0 sm:pb-0 md:pb-8 flex flex-col justify-between">
            <div>
              <div className="product-modal__line product-modal__line--1">
                <p className="product-modal__brand">{product.brand}</p>
                <h1 className="product-modal__title mt-1.5">{product.name}</h1>
              </div>

              <div className="product-modal__line product-modal__line--2 mt-4 sm:mt-5">
                <div className="flex items-baseline gap-2.5">
                  <span className="product-modal__price">
                    {currencySymbol}
                    {product.price.toFixed(2)}
                  </span>
                  {product.originalPrice && product.originalPrice !== product.price && (
                    <span className="product-modal__was">
                      {currencySymbol}
                      {product.originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>
                {discountPercentage > 0 && (
                  <p className="product-modal__save mt-1.5">
                    Save {currencySymbol}
                    {(product.originalPrice! - product.price).toFixed(2)} ({discountPercentage}% off)
                  </p>
                )}
              </div>

              {/* How many people loved this piece */}
              <div className="product-modal__line product-modal__line--3 mt-3">
                <LoveButton
                  productId={product.id}
                  likes={product.likes ?? 0}
                  liked={product.liked_by_me ?? false}
                  variant="bare"
                  size="sm"
                />
              </div>

              {/* The facts */}
              <div className="product-modal__line product-modal__line--4 product-modal__meta mt-5">
                <div>
                  <span className="product-modal__label">Size</span>
                  <div className="flex items-center gap-2.5">
                    <p className="product-modal__value">{product.size}</p>
                    <button
                      onClick={() => setShowSizeGuide(true)}
                      className="product-modal__guide"
                    >
                      Guide
                    </button>
                  </div>
                </div>
                <div>
                  <span className="product-modal__label">Condition</span>
                  <p className="product-modal__value">{product.condition}</p>
                </div>
                <div>
                  <span className="product-modal__label">Color</span>
                  <p className="product-modal__value">{product.color}</p>
                </div>
                <div>
                  <span className="product-modal__label">Material</span>
                  <p className="product-modal__value">{product.material || 'Not specified'}</p>
                </div>
              </div>
            </div>

            {/* The tabs and what they say */}
            <div className="product-modal__line product-modal__line--6 flex-1 pt-6">
              <div className="product-modal__tabs">
                {[
                  { id: 'details', label: 'Details' },
                  { id: 'measurements', label: 'Measurements' },
                  { id: 'care', label: 'Care' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`product-modal__tab ${activeTab === tab.id ? 'is-active' : ''}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="pt-4">
                {activeTab === 'details' && (
                  <div>
                    <p className="product-modal__note">{product.description}</p>
                    {product.tags && product.tags.length > 0 && (
                      <div className="product-modal__tags mt-4">
                        {product.tags.map((tag, index) => (
                          <span key={index} className="product-modal__tag">
                            {tag}
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
                            <span className="product-modal__label">{key}</span>
                            <p className="product-modal__value">{value}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="product-modal__note">No measurements available</p>
                    )}
                  </div>
                )}

                {activeTab === 'care' && (
                  <div>
                    {product.careInstructions ? (
                      <ul className="space-y-2">
                        {product.careInstructions.map((instruction, index) => (
                          <li key={index} className="product-modal__note flex items-start gap-2">
                            <span aria-hidden="true">—</span>
                            <span>{instruction}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="product-modal__note">No care instructions available</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* The one solid thing on the page.
                On a phone it is the last thing in the sheet, so it rides at the
                foot of the screen while the customer reads the description.
                On a wide screen it settles at the foot of the column, where
                the eye expects it. */}
            <button
              onClick={() => onAddToCart(product)}
              disabled={!canBuy || inBag}
              className="product-modal__line product-modal__line--7 product-modal__cta"
            >
              {reserved ? 'Reserved' : sold ? 'Sold out' : inBag ? 'In your bag' : 'Add to bag'}
            </button>
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
