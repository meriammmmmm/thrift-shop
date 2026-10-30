'use client';

import { useState, useEffect, useMemo } from 'react';
import ProductCard from './components/ProductCard';
import BrandCarousel from './components/BrandCarousel';
import ReviewDialog from './components/ReviewDialog';
import ReviewTrigger from './components/ReviewTrigger';
import ReviewCarousel from './components/ReviewCarousel';
import StarRating from './components/StarRating';
import SafeImage, { normalizeImageList } from './components/SafeImage';
import { buildBrandIndex } from '../lib/brands';
import StyleBoard from './components/StyleBoard';
import LookGallery from './components/LookGallery';
import { LookDefinition, LookState, fetchLooks } from '../lib/looks';
import Cart from './components/Cart';
import Wishlist from './components/Wishlist';
import Notification from './components/Notification';
import ProductDetails from './components/ProductDetails';
import UserOrders from './components/UserOrders';
import ScrollProgress from './components/ScrollProgress';
import MarqueeBand from './components/MarqueeBand';
import StoryScroll from './components/StoryScroll';
import { Product, User } from './types';
import { api } from '../lib/api';
import { toBooleanFlag } from '../lib/flags';
import { getVisitorKey } from '../lib/visitor';
import { useTheme, useThemeStyles } from '../lib/theme';
import { useCinematicScroll, useHeroCinematic } from '../lib/motion/useCinematicMotion';

interface Testimonial {
  id: number;
  /** Who wrote it — customers fill this in, admin-created cards fall back to the title. */
  name: string;
  title: string;
  description: string;
  image?: string | null;
  is_active?: number;
  /** The stars the reviewer gave, 1-5. */
  rating?: number;
  /** How many visitors found this review helpful. */
  likes?: number;
  /** Whether the current visitor already voted. */
  liked_by_me?: boolean;
  /** When the review was written. */
  created_at?: string | null;
}

export default function Home() {
  // Theme hooks
  const { theme, isLoading: themeLoading } = useTheme();
  const themeStyles = useThemeStyles();
  
  const [cart, setCart] = useState<Product[]>([]);
  const [cartTotal, setCartTotal] = useState<number>(0);
  const [cartItemIds, setCartItemIds] = useState<Set<number>>(new Set());
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductDetailsOpen, setIsProductDetailsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'all' | 'new-arrivals' | 'women' | 'designer' | 'premium'>('all');
  const [currentStyleIndex, setCurrentStyleIndex] = useState(0);
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
  const [currentDailyEditIndex, setCurrentDailyEditIndex] = useState(0);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [currentTrendingIndex, setCurrentTrendingIndex] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | 'info', isVisible: boolean}>({
    message: '',
    type: 'success',
    isVisible: false
  });
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [companyCurrency, setCompanyCurrency] = useState({ currency: 'USD', symbol: '$' });

  // Company info
  const [company, setCompany] = useState<{id: number, name: string, description: string, showTestimonials?: boolean} | null>(null);
  
  // Testimonials
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [showTestimonialsSection, setShowTestimonialsSection] = useState<boolean>(true);

  // Currency configuration
  const currencyConfig: Record<string, { currency: string; symbol: string }> = {
    'US': { currency: 'USD', symbol: '$' },
    'CA': { currency: 'CAD', symbol: 'C$' },
    'GB': { currency: 'GBP', symbol: '£' },
    'EU': { currency: 'EUR', symbol: '€' },
    'TN': { currency: 'TND', symbol: 'DT ' },
  };

  // Products
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Brand index for the "Shop by Brand" carousel — de-duplicates casings
  // (SHEIN/shein) and drops placeholder labels.
  const brandIndex = useMemo(() => buildBrandIndex(products), [products]);

  // Mix & Match board (shared with the Shop-the-Look gallery above it)
  const [styledLook, setStyledLook] = useState<LookState>({});
  const [activeLookId, setActiveLookId] = useState<string | null>(null);

  // Looks are managed in the admin panel, not in code.
  const [looks, setLooks] = useState<LookDefinition[]>([]);
  
  // Custom categories (occasions)
  const [customCategories, setCustomCategories] = useState<Array<{id: number, name: string, description?: string, icon?: string}>>([]);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type, isVisible: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, isVisible: false }));
    }, 3000);
  };

  // Load custom categories
  const loadCustomCategories = async () => {
    try {
      const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || '1';
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://thrift-shop-backend-production-dbea.up.railway.app/api';
      const response = await fetch(`${apiUrl}/categories/public/${companyId}`);
      
      if (response.ok) {
        const data = await response.json();
        setCustomCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Failed to load custom categories:', error);
    }
  };

  const CACHE_KEY = 'meryrose_products_cache';

  const transformProduct = (product: any) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    originalPrice: product.original_price,
    images: normalizeImageList(product.images),
    brand: product.brand,
    size: product.size,
    category: product.category,
    condition: product.condition,
    color: product.color,
    inStock: product.in_stock === 1 || product.in_stock === true || product.in_stock === '1',
    reservation_status: product.reservation_status || 'available',
    reserved_by_order_id: product.reserved_by_order_id || null,
    material: product.material,
    measurements: product.measurements || {},
    careInstructions: Array.isArray(product.care_instructions) ? product.care_instructions : [],
    tags: Array.isArray(product.tags) ? product.tags : [],
    seller: {
      name: product.seller_name || 'Unknown',
      rating: product.seller_rating || 4.5,
      location: product.seller_location || 'Unknown'
    },
    company: product.company ? {
      id: product.company.id,
      name: product.company.name,
      description: product.company.description
    } : null,
    dateAdded: product.created_at,
    views: product.views || 0,
    likes: product.likes || 0
  });

  // Load products from API
  const loadProducts = async () => {
    try {
      setError(null);

      // ── Step 1: Check cache — if hit, dismiss splash instantly ──────────
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { products: cachedProducts, company: cachedCompany, currency: cachedCurrency } = JSON.parse(cached);
          if (cachedProducts?.length) {
            setProducts(cachedProducts);
            if (cachedCompany) {
              setCompany(cachedCompany);
              setShowTestimonialsSection(toBooleanFlag(cachedCompany.show_testimonials, true));
            }
            if (cachedCurrency) setCompanyCurrency(cachedCurrency);
            // Cache hit → hide splash immediately, page is ready
            setLoading(false);
          }
        }
      } catch (_) { /* ignore cache read errors */ }

      // ── Step 2: Fetch fresh data (runs even if cache hit, silently) ──────
      const companyIdStr = process.env.NEXT_PUBLIC_COMPANY_ID || '1';
      let companyId = parseInt(companyIdStr);
      if (isNaN(companyId) || companyId <= 0) companyId = 1;

      // The Mix & Match board and the curated looks both need the whole
      // catalogue, not the first page of it — a look can reference an
      // older piece that a short list would leave out.
      const response = await api.getCompanyProducts(companyId, { limit: 100 });

      let freshCurrency = { currency: 'USD', symbol: '$' };
      if (response.company) {
        setCompany(response.company);
        setShowTestimonialsSection(toBooleanFlag(response.company.show_testimonials, true));
        if (response.company.country) {
          freshCurrency = currencyConfig[response.company.country] || freshCurrency;
          setCompanyCurrency(freshCurrency);
        }
      }

      if (response.products) {
        const visibleProducts = response.products.filter((product: any) =>
          product.visible === true || product.visible === 1 || product.visible === '1' || product.visible === null || product.visible === undefined
        );
        const transformedProducts = visibleProducts.map(transformProduct);
        setProducts(transformedProducts);
        console.log('Products loaded successfully:', transformedProducts.length);

        // ── Step 3: Save to cache for next visit ────────────────────────
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            products: transformedProducts,
            company: response.company || null,
            currency: freshCurrency,
          }));
        } catch (_) { /* ignore storage quota errors */ }
      }

      // Looks live in the admin panel — fetch them alongside the products.
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      if (apiUrl) {
        fetchLooks(apiUrl, companyId).then(setLooks).catch(() => setLooks([]));
      }

      // Load testimonials in background without blocking
      loadTestimonials(companyId.toString()).catch(err => {
        console.error('Testimonials load failed:', err);
      });
    } catch (error) {
      console.error('Failed to load products:', error);
      setError('Failed to load products. Please try again.');
    } finally {
      // No cache or cache miss — hide splash after API responds (with real products)
      setLoading(false);
    }
  };

  const loadTestimonials = async (companyId: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-wild-skylark-9834.fly.dev/api';
      // The visitor key tells the API which votes are this browser's, so the
      // "helpful" button comes back already pressed for a review that was
      // voted for before.
      const visitorKey = getVisitorKey();
      const response = await fetch(`${API_URL}/testimonials/active?companyId=${companyId}`, {
        headers: visitorKey ? { 'x-visitor-key': visitorKey } : undefined,
      });
      if (response.ok) {
        const data = await response.json();
        setTestimonials(data.testimonials || []);
      }
    } catch (error) {
      console.error('Failed to load testimonials:', error);
    }
  };

  /**
   * Keep the review list in step with a vote that was cast on a card.
   *
   * The card updates itself right away, so this only makes sure the stored
   * list matches what the card shows.
   */
  const handleToggleLike = (id: number, nextLiked: boolean) => {
    setTestimonials((current) =>
      current.map((testimonial) =>
        testimonial.id === id
          ? {
              ...testimonial,
              liked_by_me: nextLiked,
              likes: Math.max(0, (testimonial.likes ?? 0) + (nextLiked ? 1 : -1)),
            }
          : testimonial
      )
    );
  };

  /**
   * The average score of the live reviews, shown at the top of the section.
   *
   * Reviews written before the star rating existed carry no score, so they
   * are left out of the average rather than counted as zero.
   */
  const averageRating = useMemo(() => {
    const rated = testimonials.filter(
      (testimonial) =>
        typeof testimonial.rating === 'number' && testimonial.rating > 0
    );

    if (rated.length === 0) return 0;

    const total = rated.reduce(
      (sum, testimonial) => sum + (testimonial.rating as number),
      0
    );

    return total / rated.length;
  }, [testimonials]);

  // Filter and search
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesBrand = selectedBrand === 'All' || product.brand === selectedBrand;
    const matchesSection = activeSection === 'all' || 
                          (activeSection === 'new-arrivals' && new Date(product.dateAdded) > new Date('2026-01-15'));
    return matchesSearch && matchesCategory && matchesBrand && matchesSection;
  });

  // Sort
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'brand':
        return a.brand.localeCompare(b.brand);
      case 'popular':
        return b.likes - a.likes;
      default:
        return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
    }
  });

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];
  const brands = ['All', ...Array.from(new Set(products.map(p => p.brand)))];

  // Get newest products (last 2 weeks) for New Arrivals section
  const newArrivals = products
    .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
    .slice(0, 10); // Show top 10 newest products

  useEffect(() => {
    const token = localStorage.getItem('auth-token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
      loadUserCart();
      loadUserWishlist();
    }
    
    // Load products and wait for completion
    loadProducts();
    loadProfilePicture();
    loadCustomCategories();

    // Dismiss the splash screen after 1ms
    setTimeout(() => setLoading(false), 1);
  }, []);

  const loadProfilePicture = () => {
    const savedPicture = localStorage.getItem('profile-picture');
    if (savedPicture) {
      setProfilePicture(savedPicture);
    }
  };

  const loadUserCart = async () => {
    try {
      const cartData = await api.getCart();
      const items = cartData.items || [];
      setCart(items);
      setCartTotal(cartData.total || 0);
      const itemIds = new Set<number>(items.map((item: any) => item.id));
      setCartItemIds(itemIds);
    } catch (error: any) {
      console.error('Load cart error:', error);
      
      // Handle token expiration
      if (error.message?.includes('token') || error.message?.includes('expired') || error.message?.includes('Invalid')) {
        localStorage.removeItem('auth-token');
        localStorage.removeItem('user');
        setUser(null);
      }
    }
  };

  const loadUserWishlist = async () => {
    try {
      const response = await api.getWishlistIds();
      if (response.success) {
        setWishlist(response.wishlistIds);
      }
    } catch (error: any) {
      console.error('Failed to load wishlist:', error);
      
      // Handle token expiration
      if (error.message?.includes('token') || error.message?.includes('expired') || error.message?.includes('Invalid')) {
        localStorage.removeItem('auth-token');
        localStorage.removeItem('user');
        setUser(null);
      }
    }
  };

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cinematic scroll choreography (GSAP + ScrollTrigger).
  // Re-built whenever the page's content changes shape, so every trigger
  // is measured against the layout that is actually on screen.
  useCinematicScroll([products, testimonials, customCategories]);

  // Hero kinetic typography — re-run on every slide change.
  useHeroCinematic(currentHeroSlide);

  // Auto-rotate hero
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroSlide(prev => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll styles
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStyleIndex(prev => (prev + 1) % 6);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCheckout = async () => {
    if (!user) {
      showNotification('Please create an account or sign in to checkout', 'info');
      window.location.href = '/login';
      return;
    }
    
    if (cart.length === 0) {
      showNotification('Your cart is empty', 'error');
      return;
    }
    
    try {
      const orderData = {
        items: cart.map(item => ({
          product_id: item.id,
          quantity: 1
        })),
        shipping_address: {
          name: user.name || user.email,
          street: "123 Main St",
          city: "San Francisco",
          state: "CA",
          zip: "94102",
          country: "USA"
        },
        billing_address: {
          name: user.name || user.email,
          street: "123 Main St", 
          city: "San Francisco",
          state: "CA",
          zip: "94102",
          country: "USA"
        },
        payment_method: "credit_card"
      };

      const response = await api.createOrder(orderData);
      setCart([]);
      await api.clearCart();
      showNotification(`Order #${response.order.id} created successfully!`, 'success');
      setIsCartOpen(false);
    } catch (error: any) {
      console.error('Checkout error:', error);
      
      // Handle token expiration
      if (error.message?.includes('token') || error.message?.includes('expired') || error.message?.includes('Invalid')) {
        localStorage.removeItem('auth-token');
        localStorage.removeItem('user');
        setUser(null);
        showNotification('Your session has expired. Please sign in again.', 'error');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }
      
      showNotification('Checkout failed. Please try again.', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth-token');
    localStorage.removeItem('user');
    setUser(null);
    showNotification('Logged out successfully', 'info');
  };

  const addToCart = async (product: Product) => {
    if (!user) {
      showNotification('Please create an account or sign in to add items to your bag', 'info');
      window.location.href = '/login';
      return;
    }
    
    if (!product.inStock) {
      showNotification('This item is no longer available', 'error');
      return;
    }

    if (cartItemIds.has(product.id)) {
      showNotification('This item is already in your cart', 'info');
      return;
    }

    try {
      await api.addToCart(product.id);
      await loadUserCart();
      showNotification(`${product.name} added to bag!`, 'success');
    } catch (error: any) {
      console.error('Add to cart error:', error);
      
      // Handle token expiration
      if (error.message?.includes('token') || error.message?.includes('expired') || error.message?.includes('Invalid')) {
        localStorage.removeItem('auth-token');
        localStorage.removeItem('user');
        setUser(null);
        showNotification('Your session has expired. Please sign in again.', 'error');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }
      
      if (error.message?.includes('already in cart')) {
        showNotification('This item is already in your cart', 'info');
        await loadUserCart();
      } else {
        showNotification('Failed to add item to bag', 'error');
      }
    }
  };

  const removeFromCart = async (productId: number) => {
    if (!user) return;

    try {
      await api.removeProductFromCart(productId);
      await loadUserCart();
      showNotification('Item removed from bag', 'info');
    } catch (error: any) {
      console.error('Remove from cart error:', error);
      
      // Handle token expiration
      if (error.message?.includes('token') || error.message?.includes('expired') || error.message?.includes('Invalid')) {
        localStorage.removeItem('auth-token');
        localStorage.removeItem('user');
        setUser(null);
        showNotification('Your session has expired. Please sign in again.', 'error');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }
      
      showNotification('Failed to remove item from bag', 'error');
    }
  };

  const toggleWishlist = async (productId: number) => {
    if (!user) {
      showNotification('Please sign in to save items to your wishlist', 'info');
      window.location.href = '/login';
      return;
    }
    
    try {
      const product = products.find(p => p.id === productId);
      
      if (wishlist.includes(productId)) {
        await api.removeFromWishlist(productId);
        setWishlist(wishlist.filter(id => id !== productId));
        showNotification(`Removed from wishlist`, 'info');
      } else {
        await api.addToWishlist(productId);
        setWishlist([...wishlist, productId]);
        showNotification(`${product?.name} added to wishlist!`, 'success');
      }
    } catch (error: any) {
      console.error('Wishlist toggle error:', error);
      
      // Handle token expiration
      if (error.message?.includes('token') || error.message?.includes('expired') || error.message?.includes('Invalid')) {
        localStorage.removeItem('auth-token');
        localStorage.removeItem('user');
        setUser(null);
        showNotification('Your session has expired. Please sign in again.', 'error');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }
      
      showNotification('Failed to update wishlist. Please try again.', 'error');
    }
  };

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setIsProductDetailsOpen(true);
  };

  const cartCount = cart.length;

  const heroSlides = [
    {
      title: "Elegance Redefined",
      subtitle: "MERY ROSE COLLECTION",
      description: "Where timeless sophistication meets modern femininity. Discover pieces that celebrate your unique beauty.",
      buttonText: "SHOP THE COLLECTION",
      image: "/images/hero-closet.webp"
    },
    {
      title: "Bloom with Confidence",
      subtitle: "SUSTAINABLE LUXURY",
      description: "Curated pre-loved designer pieces that make you feel extraordinary. Fashion with purpose.",
      buttonText: "DISCOVER MORE",
      image: "/images/hero-rack.jpg"
    },
    {
      title: "Your Style Story",
      subtitle: "HANDPICKED FOR YOU",
      description: "Every piece tells a story of elegance, grace, and timeless beauty. What will yours be?",
      buttonText: "EXPLORE NOW",
            image: "/images/Hero-Large-f20c429c.webp"

      //image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1400&h=700&fit=crop"
    }
  ];

  // Splash screen — shown for just 1ms then gone
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <img
          src="/images/mery-rose-logo.png"
          alt="Loading..."
          className="w-48 h-auto"
        />
      </div>
    );
  }

  console.log('Page rendering - loading:', loading, 'products:', products.length);

  return (
    <div className="min-h-screen bg-white">
      <ScrollProgress />

      {/* Header */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'shadow-lg' : 'shadow-sm'}`} style={{ backgroundColor: theme.background }}>
        {/* Top Promo Banner */}
        <div className="text-center py-2 px-4 text-xs sm:text-sm font-medium luxury-shimmer text-white overflow-hidden" style={{ backgroundColor: theme.primary }}>
          <span className="inline-block">✨ Next Drop: Friday at 21:00 Tunis Time ✨</span>
        </div>

        {/* Main Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="w-full px-2 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-1 sm:gap-3 md:gap-6 h-20 sm:h-24 md:h-28 lg:h-32">
              {/* Left - Navigation */}
              <div className="flex items-center space-x-1.5 sm:space-x-3 md:space-x-6">
                <button 
                  onClick={() => window.location.href = '/products'}
                  className="text-[9px] sm:text-xs md:text-sm font-semibold text-gray-900 hover:text-gray-600 transition-colors whitespace-nowrap tracking-wide"
                >
                  SHOP
                </button>

                {/* Leave a review — opens the same dialog as the CTA in the reviews section */}
                <button
                  onClick={() => setIsReviewOpen(true)}
                  aria-label="Leave a review"
                  title="Leave a review"
                  className="inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-[9px] font-semibold whitespace-nowrap transition-all duration-300 hover:scale-[1.04] active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 sm:gap-2 sm:px-3.5 sm:py-2 sm:text-xs md:text-sm"
                  style={{ backgroundColor: `${theme.primary}14`, color: theme.primary }}
                >
                  <svg
                    className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M11.48 3.5a.56.56 0 0 1 1.04 0l2.12 5.11 5.52.44c.5.04.71.68.32 1.03l-4.2 3.6 1.28 5.39c.12.5-.42.88-.87.62L12 16.9l-4.69 2.79c-.45.26-.99-.12-.87-.62l1.28-5.39-4.2-3.6c-.39-.35-.18-.99.32-1.03l5.52-.44 2.12-5.11Z" />
                  </svg>
                  <span className="hidden sm:inline">Leave a review</span>
                </button>
              </div>

              {/* Center - Logo */}
              <div 
                onClick={() => window.location.href = '/'}
                className="flex items-center justify-center hover:opacity-90 transition-opacity duration-300 cursor-pointer flex-1"
              >
                <img 
                  src="/images/mery-rose-logo.png" 
                  alt="Mery Rose" 
                  className="w-28 sm:w-44 md:w-56 lg:w-72 h-auto object-contain"
                />
              </div>

              {/* Right - Icons */}
              <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
                {/* Wishlist */}
                <button 
                  onClick={() => setIsWishlistOpen(true)}
                  className="relative p-1 sm:p-1.5 text-gray-700 hover:text-[var(--color-primary)] transition-colors"
                  aria-label="Wishlist"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                  </svg>
                  {wishlist.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 text-white text-[9px] sm:text-[10px] rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 flex items-center justify-center font-bold" style={{ backgroundColor: theme.primary }}>
                      {wishlist.length}
                    </span>
                  )}
                </button>

                {/* Cart */}
                <button 
                  onClick={() => setIsCartOpen(true)}
                  className="relative p-1 sm:p-1.5 text-gray-700 hover:text-[var(--color-primary)] transition-colors"
                  aria-label="Shopping bag"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
                  </svg>
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 text-white text-[9px] sm:text-[10px] rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 flex items-center justify-center font-bold" style={{ backgroundColor: theme.primary }}>
                      {cartCount}
                    </span>
                  )}
                </button>

                {/* User Menu */}
                {user ? (
                  <div className="relative group">
                    <button className="flex items-center p-0.5 sm:p-1 hover:bg-gray-100 rounded-lg transition-colors">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: theme.primary }}>
                        {profilePicture ? (
                          <img src={profilePicture} alt="Profile" className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        )}
                      </div>
                    </button>
                    
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                      <button 
                        onClick={() => window.location.href = '/profile'}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        My Profile
                      </button>
                      <button 
                        onClick={() => window.location.href = '/orders'}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        My Orders
                      </button>
                      <button 
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => window.location.href = '/login'}
                    className="px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 rounded-lg text-[9px] sm:text-xs md:text-sm font-semibold text-white transition-all hover:opacity-90 whitespace-nowrap"
                    style={{ backgroundColor: theme.primary }}
                  >
                    Sign In
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>


      </header>

      {/* Hero Section */}
      <section data-cinematic="hero" className="relative bg-white overflow-hidden">
        <div className="relative h-[250px] sm:h-[400px] md:h-[600px]">
          {/* The media wrapper persists across slides so the scroll
              parallax has a stable target to measure against. */}
          <div data-cinematic="hero-media-wrap" className="absolute inset-0 overflow-hidden">
            <img
              key={currentHeroSlide}
              data-cinematic="hero-media"
              src={heroSlides[currentHeroSlide].image}
              alt={heroSlides[currentHeroSlide].title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent"></div>

          <div className="relative z-10 h-full flex items-end pb-6 sm:pb-16">
            {/* The layer persists across slides so the scroll parallax has
                a stable target; the copy itself is swapped every 5s. */}
            <div data-cinematic="hero-copy-layer" className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
              <div className="relative min-h-[132px] sm:min-h-[200px] md:min-h-[270px] lg:min-h-[290px]">
                <div key={currentHeroSlide} data-cinematic="hero-copy" className="absolute inset-x-0 bottom-0 max-w-xl">
                  <p
                    data-hero-part
                    className="text-white/80 text-[9px] sm:text-xs md:text-sm font-medium mb-1 sm:mb-3 tracking-[0.1em] sm:tracking-[0.2em] uppercase"
                  >
                    {heroSlides[currentHeroSlide].subtitle}
                  </p>
                  <h1
                    data-cinematic="hero-title"
                    className="text-xl sm:text-3xl md:text-5xl lg:text-6xl font-light text-white mb-2 sm:mb-5 leading-tight tracking-tight"
                  >
                    {heroSlides[currentHeroSlide].title}
                  </h1>
                  <p
                    data-hero-part
                    className="text-white/85 text-[10px] sm:text-sm md:text-base mb-3 sm:mb-8 leading-relaxed font-light hidden sm:block"
                  >
                    {heroSlides[currentHeroSlide].description}
                  </p>
                  <button
                    onClick={() => window.location.href = '/products'}
                    data-hero-part
                    className="px-4 sm:px-10 py-2 sm:py-3.5 text-white font-medium text-[9px] sm:text-xs tracking-[0.1em] sm:tracking-[0.15em] uppercase border border-white/80 hover:bg-white hover:text-gray-900 transition-all duration-300"
                  >
                    {heroSlides[currentHeroSlide].buttonText}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll cue */}
          <div
            data-cinematic="hero-cue"
            aria-hidden="true"
            className="hidden sm:flex absolute bottom-6 right-6 sm:right-10 z-20 flex-col items-center gap-2"
          >
            <span className="text-[9px] tracking-[0.25em] uppercase text-white/60">Scroll</span>
            <span className="block w-px h-10 bg-white/60 origin-top animate-pulse" />
          </div>
        </div>
      </section>

      {/* Featured Categories - Elegant Mery Rose Style */}
      {customCategories.length > 0 && (
        <section className="relative py-6 sm:py-16 md:py-20 bg-white overflow-hidden scroll-animate scroll-fadeInUp">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
            {/* Header */}
            <div className="text-center mb-4 sm:mb-8 scroll-animate scroll-fadeInDown">
              <h2 className="text-lg sm:text-2xl md:text-3xl font-light text-gray-900 mb-1 sm:mb-2 tracking-tight px-4">
                Shop by <span className="font-serif italic" style={{ color: theme.primary }}>Occasion</span>
              </h2>
              <p className="text-gray-500 text-[10px] sm:text-sm max-w-xl mx-auto px-4">
                Find the perfect look for every moment
              </p>
            </div>
            
            {/* Cards Grid - Small on mobile, bigger on desktop */}
            <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 sm:gap-4 md:gap-8 mb-6 sm:mb-12">
              {customCategories.map((category, index) => (
                <div 
                  key={category.id} 
                  className={`group cursor-pointer scroll-animate scroll-zoomIn stagger-${Math.min(index + 1, 6)}`}
                  onClick={() => window.location.href = `/products?categoryId=${category.id}`}
                >
                  {/* White card with border and theme colored shadow on hover */}
                  <div 
                    className="bg-white rounded-lg p-2 sm:p-5 md:p-8 border-2 border-gray-200 hover:-translate-y-1 transition-all duration-300"
                    style={{
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = `0 10px 25px ${theme.primary}40`;
                      e.currentTarget.style.borderColor = theme.primary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }}
                  >
                    {/* Icon without background - gray color - smaller on mobile */}
                    <div 
                      className="mx-auto mb-1 sm:mb-3 md:mb-6 flex items-center justify-center text-gray-600 group-hover:scale-110 transition-transform duration-300 scale-75 sm:scale-100"
                      dangerouslySetInnerHTML={{ __html: category.icon || '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>' }}
                    />
                    
                    {/* Category name - smaller on mobile */}
                    <p className="text-center text-[8px] sm:text-[10px] md:text-sm tracking-tight text-gray-700 leading-tight">
                      {category.name}
                    </p>
                    
                    {/* Description - hidden on mobile */}
                    {category.description && (
                      <p className="text-center text-[7px] sm:text-[8px] text-gray-500 mt-1 hidden sm:block">
                        {category.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Bottom CTA */}
            <div className="text-center scroll-animate scroll-fadeInUp">
              <button 
                onClick={() => window.location.href = '/products'}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-10 py-2 sm:py-3.5 text-white font-semibold text-[10px] sm:text-sm uppercase tracking-wide rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 hover:opacity-90"
                style={{ backgroundColor: theme.primary }}
              >
                <span>Explore All Collections</span>
                <svg className="w-2.5 h-2.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Featured Brands Section — swipeable carousel */}
      {brandIndex.length > 0 && (
        <section className="relative py-6 sm:py-16 md:py-20 bg-gray-50 overflow-hidden scroll-animate scroll-fadeInUp">
          <BrandCarousel brands={brandIndex} primary={theme.primary} />
        </section>
      )}

      {/* Trending Now Section - Show only most_lovable products */}
      <section id="products-section" className="py-8 sm:py-10 bg-gradient-to-b from-gray-50 to-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-5" style={{ 
          backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
          backgroundSize: '40px 40px',
          color: theme.primary
        }}></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-6 sm:mb-16 scroll-animate scroll-fadeInDown">
            <span className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.1em] sm:tracking-[0.15em] mb-2 sm:mb-4" style={{ backgroundColor: `${theme.primary}15`, color: theme.primary }}>
              Trending Now
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-gray-900 mb-2 sm:mb-3 tracking-tight">Most Loved Pieces</h2>
            <p className="text-gray-500 text-xs sm:text-sm tracking-wide">Curated favorites from our community</p>
          </div>

          {/* Mobile Slider */}
          <div className="md:hidden relative px-2">
            <div className="overflow-hidden rounded-lg">
              <div 
                className="flex transition-transform duration-300 ease-out"
                style={{ transform: `translateX(-${currentTrendingIndex * 100}%)` }}
              >
                {products
                  .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
                  .slice(0, 3)
                  .map((product, index) => (
                  <div 
                    key={product.id}
                    className="w-full flex-shrink-0 px-2"
                  >
                    <div 
                      className="group cursor-pointer shadow-md rounded-lg overflow-hidden bg-white max-w-[280px] mx-auto"
                      onClick={() => handleViewDetails(product)}
                    >
                      <div className={`relative ${index === 1 ? 'bg-white' : 'bg-gray-50'} aspect-[3/4]`}>
                        <img 
                          src={product.images && product.images.length > 0 ? product.images[0] : 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&h=500&fit=crop'}
                          alt={product.name}
                          className={`w-full h-full ${index === 1 ? 'object-contain' : 'object-cover'}`}
                        />
                        {/* Status Badges - Show only one based on priority */}
                        {product.reservation_status === 'sold' || !product.inStock ? (
                          <div className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-md text-xs font-bold text-white bg-red-600">
                            SOLD OUT
                          </div>
                        ) : product.reservation_status === 'reserved' ? (
                          <div className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-md text-xs font-bold text-white bg-orange-500">
                            RESERVED
                          </div>
                        ) : null}
                        {wishlist.includes(product.id) && (
                          <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md">
                            <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="p-3 space-y-1">
                        <h3 className="font-medium text-gray-900 text-sm line-clamp-2">{product.name}</h3>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">{product.brand}</p>
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-base font-semibold" style={{ color: theme.primary }}>{companyCurrency.symbol}{product.price}</span>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <span className="text-xs text-gray-400 line-through">{companyCurrency.symbol}{product.originalPrice}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Slider Navigation Arrows - Always visible, disabled when at edges */}
            <button 
              onClick={() => currentTrendingIndex > 0 && setCurrentTrendingIndex(prev => prev - 1)}
              disabled={currentTrendingIndex === 0}
              className={`absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-xl flex items-center justify-center transition-all z-10 ${
                currentTrendingIndex === 0 
                  ? 'opacity-40 cursor-not-allowed' 
                  : 'hover:scale-110 cursor-pointer'
              }`}
              style={{ color: currentTrendingIndex === 0 ? '#9ca3af' : theme.primary }}
              aria-label="Previous product"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button 
              onClick={() => currentTrendingIndex < 2 && setCurrentTrendingIndex(prev => prev + 1)}
              disabled={currentTrendingIndex === 2}
              className={`absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-xl flex items-center justify-center transition-all z-10 ${
                currentTrendingIndex === 2 
                  ? 'opacity-40 cursor-not-allowed' 
                  : 'hover:scale-110 cursor-pointer'
              }`}
              style={{ color: currentTrendingIndex === 2 ? '#9ca3af' : theme.primary }}
              aria-label="Next product"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Desktop Grid */}
          <div className="hidden md:grid grid-cols-3 gap-8">
            {products
              .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
              .slice(0, 3)
              .map((product, index) => (
              <div 
                key={product.id}
                className={`group cursor-pointer scroll-animate scroll-slideInScale stagger-${index + 1} shadow-lg hover:shadow-2xl transition-shadow duration-300 rounded-lg card-hover-enhanced`}
                onClick={() => handleViewDetails(product)}
              >
                <div data-spotlight className={`relative overflow-hidden rounded-lg ${index === 1 ? 'bg-white' : 'bg-gray-100'} aspect-[3/4] mb-4`}>
                  <img 
                    src={product.images && product.images.length > 0 ? product.images[0] : 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&h=500&fit=crop'}
                    alt={product.name}
                    className={`w-full h-full ${index === 1 ? 'object-contain' : 'object-cover'} group-hover:scale-105 transition-transform duration-500`}
                  />
                  {/* Status Badges - Show only one based on priority */}
                  {product.reservation_status === 'sold' || !product.inStock ? (
                    <div className="absolute top-4 left-4 z-20 px-2.5 py-1 rounded-md text-xs font-bold text-white bg-red-600">
                      SOLD OUT
                    </div>
                  ) : product.reservation_status === 'reserved' ? (
                    <div className="absolute top-4 left-4 z-20 px-2.5 py-1 rounded-md text-xs font-bold text-white bg-orange-500">
                      RESERVED
                    </div>
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-4 left-4 right-4 transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <button className="w-full py-2.5 px-4 bg-white text-gray-900 rounded font-medium text-xs tracking-wide uppercase hover:bg-gray-100 transition-colors magnetic-btn">
                      Quick View
                    </button>
                  </div>
                  {wishlist.includes(product.id) && (
                    <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-md animate-scaleIn animate-heartbeat">
                      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5 p-2">
                  <h3 className="font-medium text-gray-900 text-sm group-hover:text-gray-600 transition-colors underline-effect">{product.name}</h3>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{product.brand}</p>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-base font-medium" style={{ color: theme.primary }}>{companyCurrency.symbol}{product.price}</span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-xs text-gray-400 line-through">{companyCurrency.symbol}{product.originalPrice}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-6 sm:mt-12 scroll-animate scroll-fadeInUp">
            <button 
              onClick={() => window.location.href = '/products'}
              className="px-6 sm:px-10 py-2 sm:py-3 rounded font-medium text-white text-[10px] sm:text-xs tracking-[0.1em] sm:tracking-[0.15em] uppercase transition-all duration-300 hover:opacity-90 magnetic-btn"
              style={{ backgroundColor: theme.primary }}
            >
              View All Products
            </button>
          </div>
        </div>
      </section>

      {/* Brand band — the ticker leans into the scroll speed */}
      <MarqueeBand />

      {/* Clean Out Service Section */}
     

      {/* New Arrivals Section - With Animated Stars */}
      <section className="relative py-12 sm:py-16 md:py-20 text-white overflow-hidden animate-fadeIn" style={{ backgroundColor: theme.primary }}>
        {/* Original Background Image */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            data-cinematic="parallax-media"
            src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1600&h=500&fit=crop"
            alt="New Arrivals background"
            className="w-full h-full object-cover opacity-50 will-change-transform"
          />
          <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${theme.primary}99, ${theme.primary}aa)` }}></div>
        </div>

        {/* Animated Stars Layer - 4-Pointed Sparkle Stars */}
       <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
  <div data-cinematic="starfield" className="absolute inset-0 will-change-transform">
    {[...Array(80)].map((_, i) => {
      const animations = ['twinkle', 'float', 'pulse', 'drift'];
      const randomAnimation = animations[i % animations.length];
      const size = Math.random() * 10 + 6;
      return (
        <span
          key={`star-${i}`}
          className="absolute select-none"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            fontSize: `${size}px`,
            color: '#ffc2d0',
            animation: `${randomAnimation} ${Math.random() * 5 + 2}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
            lineHeight: 1,
          }}
        >
          ✦
        </span>
      );
    })}
  </div>
</div>
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6">
          {newArrivals.length === 0 ? (
            /* Skeleton shimmer cards while products are loading */
            <div className="flex justify-center gap-4 sm:gap-6 px-4 py-8 overflow-hidden">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-28 sm:w-36 md:w-44 rounded-2xl overflow-hidden"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="w-full aspect-[3/4] bg-white/20 animate-pulse rounded-2xl" />
                  <div className="mt-2 h-3 bg-white/20 animate-pulse rounded-full w-3/4 mx-auto" />
                  <div className="mt-1.5 h-3 bg-white/20 animate-pulse rounded-full w-1/2 mx-auto" />
                </div>
              ))}
            </div>
          ) : (
            /* Regular carousel when products exist */
            <>
          {/* Overlapping Product Circles Carousel */}
          <div className="flex items-center justify-center mb-8 sm:mb-12">
            {/* Left Arrow */}
            <button 
              onClick={() => {
                setCurrentDailyEditIndex(prev => {
                  const newIndex = prev - 1;
                  return newIndex < 0 ? newArrivals.length - 1 : newIndex;
                });
              }}
              className="p-2 sm:p-3 text-white/60 hover:text-white transition-all flex-shrink-0"
              aria-label="Previous products"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            {/* Circles Container - Centered with overlapping circles */}
            <div className="flex items-center justify-center mx-1 sm:mx-2">
              {(() => {
                if (newArrivals.length === 0) return null;
                
                const displayProducts = [];
                
                // Get 5 products centered around currentDailyEditIndex (3 on mobile)
                const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
                const range = isMobile ? 1 : 2;
                
                for (let i = -range; i <= range; i++) {
                  let index = (currentDailyEditIndex + i + newArrivals.length) % newArrivals.length;
                  const product = newArrivals[index];
                  if (product) {
                    displayProducts.push({ product, position: i });
                  }
                }
                
                return displayProducts.map(({ product, position }, index) => {
                  if (!product) return null;
                  
                  const isCenter = position === 0;
                  // Responsive sizes: mobile 110px, tablet 150px, desktop 190px
                  const baseSize = typeof window !== 'undefined' && window.innerWidth < 640 ? 110 : 
                                   typeof window !== 'undefined' && window.innerWidth < 1024 ? 150 : 190;
                  const overlap = typeof window !== 'undefined' && window.innerWidth < 640 ? -32 : -68;
                  
                  return (
                    <div 
                      key={`${product.id}-${position}`}
                      className="flex-shrink-0 transition-all duration-500 ease-out cursor-pointer"
                      style={{ 
                        marginLeft: index === 0 ? '0' : `${overlap}px`,
                        zIndex: isCenter ? 50 : 40 - Math.abs(position) * 5,
                        opacity: isCenter ? 1 : 0.7,
                        transform: isCenter ? 'scale(1.08)' : 'scale(1)'
                      }}
                      onClick={() => handleViewDetails(product)}
                    >
                      <div 
                        className="rounded-full overflow-hidden bg-white/80 backdrop-blur-md relative"
                        style={{
                          width: `${baseSize}px`,
                          height: `${baseSize}px`,
                          boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                        }}
                      >
                        <SafeImage
                          images={product.images}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          loading="eager"
                        />
                        {/* Sold Out Badge for circular images */}
                        {!product.inStock && (
                          <div className="absolute top-1 left-1 bg-red-600 px-1.5 py-0.5 rounded text-[10px] font-bold text-white">
                            SOLD
                          </div>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
            
            {/* Right Arrow */}
            <button 
              onClick={() => {
                setCurrentDailyEditIndex(prev => {
                  const newIndex = prev + 1;
                  return newIndex >= newArrivals.length ? 0 : newIndex;
                });
              }}
              className="p-2 sm:p-3 text-white/60 hover:text-white transition-all flex-shrink-0"
              aria-label="Next products"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="text-center animate-fadeIn px-4">
            <h2 className="text-xl sm:text-3xl md:text-4xl font-light mb-1.5 sm:mb-3 tracking-tight">New Arrivals</h2>
            <p className="text-[9px] sm:text-xs mb-4 sm:mb-8 opacity-80 tracking-wide">
              Discover {newArrivals.length} fresh finds just added to our collection.
            </p>
            
            <button 
              onClick={() => window.location.href = '/products'}
              className="px-4 sm:px-9 py-1.5 sm:py-3 border border-white/80 text-white font-medium text-[9px] sm:text-xs tracking-[0.1em] sm:tracking-[0.15em] uppercase hover:bg-white hover:text-gray-900 transition-all duration-300"
            >
              Shop New Arrivals
            </button>
          </div>
          </>
          )}
        </div>
      </section>

      {/* Complete looks — curated in the admin panel's "Shop the Look" section */}
      {/* <LookGallery
        looks={looks}
        products={products}
        currencySymbol={companyCurrency.symbol}
        activeLookId={activeLookId}
        onPickLook={(lookId, state) => {
          // Load the admin-curated look straight onto the board below.
          setActiveLookId(lookId);
          setStyledLook(state);
        }}
        onSelect={handleViewDetails}
      /> */}

     

      {/* The Craft — scroll-based storytelling */}

      {/* Why Mery Rose Section */}
      <section data-cinematic="why-rose" className="relative py-16 sm:py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-16">
            <p
              data-cinematic="why-rose-eyebrow"
              className="text-[10px] sm:text-xs font-medium uppercase tracking-[0.25em] mb-5"
              style={{ color: theme.primary }}
            >
              Why Mery Rose?
            </p>
            <h2
              data-cinematic="why-rose-heading"
              className="text-3xl sm:text-4xl md:text-5xl font-light text-gray-900 mb-6 leading-[1.15]"
            >
              Luxury Meets{' '}
              <span className="relative inline-block">
                <span data-cinematic="why-rose-accent" className="italic font-serif">
                  Sustainability
                </span>
                <span
                  data-cinematic="why-rose-underline"
                  aria-hidden="true"
                  className="absolute left-0 -bottom-1 h-px w-full origin-left"
                  style={{ backgroundColor: theme.primary, transform: 'scaleX(0)' }}
                />
              </span>
            </h2>
            <p
              data-cinematic="why-rose-lede"
              className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed"
            >
              Every piece in our collection is carefully curated to bring you designer quality at accessible prices, while making a positive impact on our planet.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {/* Hand-Selected Quality */}
            <div data-cinematic="why-rose-card" className="bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:shadow-lg transition-shadow duration-300 card-hover-enhanced">
              <div data-cinematic="why-rose-icon" className="w-14 h-14 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ backgroundColor: `${theme.primary}15` }}>
                <svg className="w-7 h-7" style={{ color: theme.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 text-center mb-3">
                Hand-Selected
              </h3>
              <p className="text-gray-600 text-sm text-center leading-relaxed">
                Every item is personally chosen and inspected for quality, authenticity, and style.
              </p>
            </div>

            {/* Like-New Condition */}
            <div data-cinematic="why-rose-card" className="bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:shadow-lg transition-shadow duration-300 card-hover-enhanced">
              <div data-cinematic="why-rose-icon" className="w-14 h-14 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ backgroundColor: `${theme.primary}15` }}>
                <svg className="w-7 h-7" style={{ color: theme.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 text-center mb-3">
                Like-New Quality
              </h3>
              <p className="text-gray-600 text-sm text-center leading-relaxed">
                Premium pieces in excellent condition that look and feel brand new.
              </p>
            </div>

            {/* Sustainable Fashion */}
            <div data-cinematic="why-rose-card" className="bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:shadow-lg transition-shadow duration-300 card-hover-enhanced">
              <div data-cinematic="why-rose-icon" className="w-14 h-14 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ backgroundColor: `${theme.primary}15` }}>
                <svg className="w-7 h-7" style={{ color: theme.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 text-center mb-3">
                Eco-Friendly
              </h3>
              <p className="text-gray-600 text-sm text-center leading-relaxed">
                Reduce fashion waste and your carbon footprint with every purchase.
              </p>
            </div>

            {/* Designer Brands */}
            <div data-cinematic="why-rose-card" className="bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:shadow-lg transition-shadow duration-300 card-hover-enhanced">
              <div data-cinematic="why-rose-icon" className="w-14 h-14 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ backgroundColor: `${theme.primary}15` }}>
                <svg className="w-7 h-7" style={{ color: theme.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 text-center mb-3">
                Designer Brands
              </h3>
              <p className="text-gray-600 text-sm text-center leading-relaxed">
                Access luxury fashion at a fraction of the original price.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {showTestimonialsSection && (
        <section
          className="relative overflow-hidden scroll-animate scroll-fadeInUp"
          style={{ background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${theme.primary}0f 0%, transparent 70%)` }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Section heading + the score the section is rated at */}
            {testimonials.length > 0 && (
              <div className="text-center pt-12 sm:pt-20 pb-10 sm:pb-12">
                <p
                  className="text-[10px] sm:text-xs font-medium uppercase tracking-[0.25em] mb-5"
                  style={{ color: theme.primary }}
                >
                  Customer Reviews
                </p>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-gray-900 mb-6 leading-[1.15]">
                  What our clients{' '}
                  <span className="italic font-serif">say</span>
                </h2>

                {averageRating > 0 && (
                  <div className="inline-flex flex-col items-center gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl font-light text-gray-900 leading-none">
                        {averageRating.toFixed(1)}
                      </span>
                      <div className="flex flex-col gap-1">
                        <StarRating value={averageRating} size="sm" />
                        <span className="text-xs text-gray-500">
                          {testimonials.length}{' '}
                          {testimonials.length === 1 ? 'review' : 'reviews'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Testimonials carousel — a swipeable track on every screen size */}
            {testimonials.length > 0 && (
              <div className="pb-16 sm:pb-20">
                <ReviewCarousel
                  reviews={testimonials}
                  onToggleLike={handleToggleLike}
                />
              </div>
            )}
          </div>

          {/* Let people add their own review — a full-width band, edge to edge */}
          <div
            className={`relative z-10 border-t border-gray-200/80 ${testimonials.length > 0 ? 'mt-12 sm:mt-16' : ''}`}
          >
            <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
              <ReviewTrigger onOpen={() => setIsReviewOpen(true)} />
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand Section */}
            <div className="sm:col-span-2 lg:col-span-1">
              <h3 className="text-2xl font-bold mb-4 tracking-wide">
                {company?.name?.toUpperCase() || 'MERY ROSE'}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                {company?.description || 'Sustainable fashion for conscious consumers.'}
              </p>
              <a href="mailto:meryroseclothing@gmail.com" className="text-gray-400 hover:text-white text-sm flex items-center gap-2 mb-6 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                meryroseclothing@gmail.com
              </a>
              <div className="flex space-x-3">
                <a href="https://www.instagram.com/meryrose.clothing?igsh=ZGNwcTFieHE2YTVt&utm_source=qr" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all" aria-label="Instagram">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/>
                    <path d="M12 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="https://www.tiktok.com/@meryroseclothing" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all" aria-label="TikTok">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            {/* Shop Section */}
            <div>
              <h4 className="text-sm font-bold mb-4 tracking-wider">SHOP</h4>
              <ul className="space-y-3 text-sm">
                <li><button onClick={() => window.location.href = '/products'} className="text-gray-400 hover:text-white transition-colors">All Products</button></li>
                <li><button onClick={() => window.location.href = '/products?sort=newest'} className="text-gray-400 hover:text-white transition-colors">New Arrivals</button></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Sale</a></li>
              </ul>
            </div>
            
            {/* About Section */}
            <div>
              <h4 className="text-sm font-bold mb-4 tracking-wider">ABOUT</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Our Story</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Sustainability</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Press</a></li>
              </ul>
            </div>
            
            {/* Support Section */}
            <div>
              <h4 className="text-sm font-bold mb-4 tracking-wider">SUPPORT</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Shipping & Returns</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Track Order</a></li>
              </ul>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
              <p className="text-gray-400">
                © 2026 {company?.name || 'Mery Rose'}. All rights reserved.
              </p>
              <div className="flex gap-6 text-gray-400">
                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {selectedProduct && (
        <ProductDetails
          isOpen={isProductDetailsOpen}
          onClose={() => setIsProductDetailsOpen(false)}
          product={selectedProduct}
          onAddToCart={addToCart}
          onToggleWishlist={toggleWishlist}
          isWishlisted={wishlist.includes(selectedProduct.id)}
          isInCart={cartItemIds.has(selectedProduct.id)}
          currencySymbol={companyCurrency.symbol}
        />
      )}

      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={() => setNotification(prev => ({ ...prev, isVisible: false }))}
      />

      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onRemove={removeFromCart}
        total={cartTotal}
        onCheckout={handleCheckout}
        user={user}
        currencySymbol={companyCurrency.symbol}
      />

      <Wishlist
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlist={products.filter(p => wishlist.includes(p.id))}
        onRemove={toggleWishlist}
        onAddToCart={addToCart}
        onViewDetails={(product) => {
          setSelectedProduct(product);
          setIsProductDetailsOpen(true);
          setIsWishlistOpen(false);
        }}
        currencySymbol={companyCurrency.symbol}
      />

      {isOrdersOpen && user && (
        <UserOrders
          isOpen={isOrdersOpen}
          onClose={() => setIsOrdersOpen(false)}
          user={user}
        />
      )}

      {/* Customer review form — opened from the header or the reviews CTA */}
      <ReviewDialog
        open={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        companyId={company?.id}
      />
    </div>
  );
}
