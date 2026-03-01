'use client';

import { useState, useEffect } from 'react';
import ProductCard from './components/ProductCard';
import Cart from './components/Cart';
import Wishlist from './components/Wishlist';
import Notification from './components/Notification';
import ProductDetails from './components/ProductDetails';
import UserOrders from './components/UserOrders';
import { Product, User } from './types';
import { api } from '../lib/api';
import { useTheme, useThemeStyles } from '../lib/theme';

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
  const [testimonials, setTestimonials] = useState<any[]>([]);
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

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type, isVisible: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, isVisible: false }));
    }, 3000);
  };

  // Load products from API
  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || '1';
      
      const response = await api.getCompanyProducts(parseInt(companyId), { limit: 50 });
      
      if (response.company) {
        setCompany(response.company);
        setShowTestimonialsSection(response.company.show_testimonials !== 0);
        
        if (response.company.country) {
          const currencyInfo = currencyConfig[response.company.country] || { currency: 'USD', symbol: '$' };
          setCompanyCurrency(currencyInfo);
        }
      }
      
      if (response.products) {
        const transformedProducts = response.products.map((product: any) => ({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          originalPrice: product.original_price,
          images: Array.isArray(product.images) ? product.images : (product.images ? [product.images] : []),
          brand: product.brand,
          size: product.size,
          category: product.category,
          condition: product.condition,
          color: product.color,
          inStock: product.in_stock === 1 || product.in_stock === true || product.in_stock === '1' || product.in_stock === undefined || product.in_stock === null,
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
        }));
        setProducts(transformedProducts);
      }
      
      await loadTestimonials(companyId);
    } catch (error) {
      console.error('Failed to load products:', error);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadTestimonials = async (companyId: string) => {
    try {
      const response = await fetch(`https://thrift-shop-backend-production.up.railway.app/api/testimonials/active?companyId=${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setTestimonials(data.testimonials || []);
      }
    } catch (error) {
      console.error('Failed to load testimonials:', error);
    }
  };

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

  // Weekly products for Daily Edit
  const weeklyProducts = products.filter(product => {
    const productDate = new Date(product.dateAdded);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return productDate >= oneWeekAgo;
  });

  useEffect(() => {
    const token = localStorage.getItem('auth-token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
      loadUserCart();
      loadUserWishlist();
    }
    loadProducts();
    loadProfilePicture();
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

  // Webflow-style scroll animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          // Add revealed class for reveal-on-scroll elements
          if (entry.target.classList.contains('reveal-on-scroll')) {
            entry.target.classList.add('revealed');
          }
          // Add zoomed class for zoom-on-scroll elements
          if (entry.target.classList.contains('zoom-on-scroll')) {
            entry.target.classList.add('zoomed');
          }
        }
      });
    }, observerOptions);

    // Observe all scroll-animate elements
    const animateElements = document.querySelectorAll('.scroll-animate, .reveal-on-scroll, .zoom-on-scroll');
    animateElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [products, testimonials]);

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
      image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1400&h=700&fit=crop"
    }
  ];

  if (themeLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading theme...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: theme.primary }}></div>
          <p className="text-gray-600">Loading {company?.name || 'company'} products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load Products</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadProducts}
            className="px-6 py-3 rounded-lg font-medium text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: theme.primary }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
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
                <button 
                  onClick={() => window.location.href = '/daily-edit'}
                  className="text-[9px] sm:text-xs md:text-sm font-semibold text-gray-900 hover:text-gray-600 transition-colors whitespace-nowrap tracking-wide"
                >
                  DAILY
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
                  className="relative p-1 sm:p-1.5 text-gray-700 hover:text-gray-900 transition-colors"
                  aria-label="Wishlist"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
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
                  className="relative p-1 sm:p-1.5 text-gray-700 hover:text-gray-900 transition-colors"
                  aria-label="Shopping cart"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z" />
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
      <section className="relative bg-white overflow-hidden">
        <div className="relative h-[250px] sm:h-[400px] md:h-[600px]">
          <div className="absolute inset-0">
            <img 
              key={currentHeroSlide}
              src={heroSlides[currentHeroSlide].image}
              alt="Hero"
              className="w-full h-full object-cover animate-fadeIn"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent"></div>
          </div>
          
          <div className="relative z-10 h-full flex items-end pb-6 sm:pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
              <div key={currentHeroSlide} className="max-w-xl animate-slideInLeft">
                <p className="text-white/80 text-[9px] sm:text-xs md:text-sm font-medium mb-1 sm:mb-3 tracking-[0.1em] sm:tracking-[0.2em] uppercase animate-fadeIn stagger-1">
                  {heroSlides[currentHeroSlide].subtitle}
                </p>
                <h1 className="text-xl sm:text-3xl md:text-5xl lg:text-6xl font-light text-white mb-2 sm:mb-5 leading-tight tracking-tight animate-fadeIn stagger-2">
                  {heroSlides[currentHeroSlide].title}
                </h1>
                <p className="text-white/85 text-[10px] sm:text-sm md:text-base mb-3 sm:mb-8 leading-relaxed font-light animate-fadeIn stagger-3 hidden sm:block">
                  {heroSlides[currentHeroSlide].description}
                </p>
                <button 
                  onClick={() => window.location.href = '/products'}
                  className="px-4 sm:px-10 py-2 sm:py-3.5 text-white font-medium text-[9px] sm:text-xs tracking-[0.1em] sm:tracking-[0.15em] uppercase border border-white/80 hover:bg-white hover:text-gray-900 transition-all duration-300 animate-fadeIn stagger-4"
                >
                  {heroSlides[currentHeroSlide].buttonText}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories - Elegant Mery Rose Style */}
      <section className="relative py-6 sm:py-16 md:py-20 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          {/* Header */}
          <div className="text-center mb-4 sm:mb-8">
            <h2 className="text-lg sm:text-2xl md:text-3xl font-light text-gray-900 mb-1 sm:mb-2 tracking-tight px-4">
              Shop by <span className="font-serif italic" style={{ color: '#8B1538' }}>Occasion</span>
            </h2>
            <p className="text-gray-500 text-[10px] sm:text-sm max-w-xl mx-auto px-4">
              Find the perfect look for every moment
            </p>
          </div>
          
          {/* Cards Grid - Small on mobile, bigger on desktop */}
          <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 sm:gap-4 md:gap-8 mb-6 sm:mb-12">
            {[
              { 
                name: 'Night Out', 
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
                  </svg>
                )
              },
              { 
                name: 'Casual', 
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                  </svg>
                )
              },
              { 
                name: 'Work', 
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                )
              },
              { 
                name: 'Date Night', 
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                  </svg>
                )
              },
              { 
                name: 'Weekend', 
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                )
              },
              { 
                name: 'Events', 
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                )
              }
            ].map((category, index) => (
              <div 
                key={category.name} 
                className="group cursor-pointer"
                onClick={() => window.location.href = `/products?occasion=${encodeURIComponent(category.name.toUpperCase())}`}
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
                  <div className="mx-auto mb-1 sm:mb-3 md:mb-6 flex items-center justify-center text-gray-600 group-hover:scale-110 transition-transform duration-300 scale-75 sm:scale-100">
                    {category.icon}
                  </div>
                  
                  {/* Category name - smaller on mobile */}
                  <p className="text-center text-[8px] sm:text-[10px] md:text-sm tracking-tight text-gray-700 leading-tight">
                    {category.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Bottom CTA */}
          <div className="text-center">
            <button 
              onClick={() => window.location.href = '/products'}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-10 py-2 sm:py-3.5 text-white font-semibold text-[10px] sm:text-sm uppercase tracking-wide rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 hover:opacity-90"
              style={{ backgroundColor: '#8B1538' }}
            >
              <span>Explore All Collections</span>
              <svg className="w-2.5 h-2.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Trending Now Section */}
      <section className="py-8 sm:py-10 bg-gradient-to-b from-gray-50 to-white overflow-hidden relative">
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
                {sortedProducts.slice(0, 3).map((product, index) => (
                  <div 
                    key={product.id}
                    className="w-full flex-shrink-0 px-2"
                  >
                    <div 
                      className="group cursor-pointer shadow-md rounded-lg overflow-hidden bg-white max-w-[280px] mx-auto"
                      onClick={() => handleViewDetails(product)}
                    >
                      <div className={`relative ${index === 1 ? 'bg-white' : 'bg-gray-50'} aspect-[3/4] ${!product.inStock ? 'opacity-60' : ''}`}>
                        <img 
                          src={product.images && product.images.length > 0 ? product.images[0] : 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&h=500&fit=crop'}
                          alt={product.name}
                          className={`w-full h-full ${index === 1 ? 'object-contain' : 'object-cover'}`}
                        />
                        {/* Sold Out Overlay */}
                        {!product.inStock && (
                          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                            <div className="bg-white px-4 py-2 rounded-lg shadow-2xl">
                              <p className="text-red-600 font-bold text-lg">SOLD OUT</p>
                            </div>
                          </div>
                        )}
                        {/* Sold Out Badge */}
                        {!product.inStock && (
                          <div className="absolute top-3 left-3 z-20 px-3 py-1.5 rounded-lg text-sm font-bold text-white bg-red-600 shadow-lg">
                            SOLD OUT
                          </div>
                        )}
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
            {sortedProducts.slice(0, 3).map((product, index) => (
              <div 
                key={product.id}
                className={`group cursor-pointer scroll-animate scroll-slideInScale stagger-${index + 1} shadow-lg hover:shadow-2xl transition-shadow duration-300 rounded-lg card-hover-enhanced`}
                onClick={() => handleViewDetails(product)}
              >
                <div className={`relative overflow-hidden rounded-lg ${index === 1 ? 'bg-white' : 'bg-gray-100'} aspect-[3/4] mb-4 ${!product.inStock ? 'opacity-60' : ''}`}>
                  <img 
                    src={product.images && product.images.length > 0 ? product.images[0] : 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&h=500&fit=crop'}
                    alt={product.name}
                    className={`w-full h-full ${index === 1 ? 'object-contain' : 'object-cover'} group-hover:scale-105 transition-transform duration-700`}
                  />
                  {/* Sold Out Overlay */}
                  {!product.inStock && (
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                      <div className="bg-white px-4 py-2 rounded-lg shadow-2xl">
                        <p className="text-red-600 font-bold text-lg">SOLD OUT</p>
                      </div>
                    </div>
                  )}
                  {/* Sold Out Badge */}
                  {!product.inStock && (
                    <div className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-lg text-sm font-bold text-white bg-red-600 shadow-lg">
                      SOLD OUT
                    </div>
                  )}
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

      {/* Clean Out Service Section */}
     

      {/* Daily Edit Section - Overlapping Circles Carousel */}
      <section className="relative py-12 sm:py-16 md:py-20 text-white overflow-hidden animate-fadeIn" style={{ backgroundColor: theme.primary }}>
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1600&h=500&fit=crop" 
            alt="Daily Edit background"
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${theme.primary}99, ${theme.primary}aa)` }}></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
          {/* Overlapping Product Circles Carousel */}
          <div className="flex items-center justify-center mb-8 sm:mb-12">
            {/* Left Arrow */}
            <button 
              onClick={() => {
                const products = weeklyProducts.length > 0 ? weeklyProducts : sortedProducts;
                setCurrentDailyEditIndex(prev => {
                  const newIndex = prev - 1;
                  return newIndex < 0 ? products.length - 1 : newIndex;
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
                const products = weeklyProducts.length > 0 ? weeklyProducts : sortedProducts;
                if (products.length === 0) return null;
                
                const displayProducts = [];
                
                // Get 5 products centered around currentDailyEditIndex (3 on mobile)
                const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
                const range = isMobile ? 1 : 2;
                
                for (let i = -range; i <= range; i++) {
                  let index = (currentDailyEditIndex + i + products.length) % products.length;
                  const product = products[index];
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
                        className={`rounded-full overflow-hidden bg-white/80 backdrop-blur-md relative ${!product.inStock ? 'opacity-50' : ''}`}
                        style={{
                          width: `${baseSize}px`,
                          height: `${baseSize}px`,
                          boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                        }}
                      >
                        <img 
                          src={product.images && product.images.length > 0 ? product.images[0] : 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=300&h=300&fit=crop'} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                        {/* Sold Out Overlay for circular images */}
                        {!product.inStock && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full">
                            <div className="bg-white px-2 py-1 rounded text-xs font-bold text-red-600">
                              SOLD
                            </div>
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
                const products = weeklyProducts.length > 0 ? weeklyProducts : sortedProducts;
                setCurrentDailyEditIndex(prev => {
                  const newIndex = prev + 1;
                  return newIndex >= products.length ? 0 : newIndex;
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
            <h2 className="text-xl sm:text-3xl md:text-4xl font-light mb-1.5 sm:mb-3 tracking-tight">Daily Edit</h2>
            <p className="text-[9px] sm:text-xs mb-4 sm:mb-8 opacity-80 tracking-wide">
              Shop {weeklyProducts.length > 0 ? weeklyProducts.length : sortedProducts.length} finds curated just for you, refreshed daily.
            </p>
            
            <button 
              onClick={() => window.location.href = '/daily-edit'}
              className="px-4 sm:px-9 py-1.5 sm:py-3 border border-white/80 text-white font-medium text-[9px] sm:text-xs tracking-[0.1em] sm:tracking-[0.15em] uppercase hover:bg-white hover:text-gray-900 transition-all duration-300"
            >
              Shop Your Edit
            </button>
          </div>
        </div>
      </section>

      {/* Why Thrift Section */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-16 reveal-on-scroll">
            <p className="text-xs font-medium uppercase tracking-[0.2em] mb-4" style={{ color: theme.primary }}>
              WHY THRIFT?
            </p>
            <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-6">
              Fashion That <span className="italic font-serif">Matters</span>
            </h2>
            <p className="text-gray-600 text-base max-w-3xl mx-auto leading-relaxed">
              We believe the most sustainable garment is the one already made. Our mission is to make secondhand shopping effortless, stylish, and accessible.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {/* Circular Fashion */}
            <div className="bg-gray-50 rounded-2xl p-10 border border-gray-100 hover:shadow-lg transition-all duration-300 scroll-animate scroll-fadeInLeft stagger-1 card-hover-enhanced">
              <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center animate-float" style={{ backgroundColor: `${theme.primary}15` }}>
                <svg className="w-8 h-8" style={{ color: theme.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 text-center mb-4">
                Circular Fashion
              </h3>
              <p className="text-gray-600 text-sm text-center leading-relaxed">
                Every piece we sell extends the life of a garment, keeping it out of landfills and in your wardrobe.
              </p>
            </div>

            {/* Curated with Care */}
            <div className="bg-gray-50 rounded-2xl p-10 border border-gray-100 hover:shadow-lg transition-all duration-300 scroll-animate scroll-fadeInUp stagger-2 card-hover-enhanced">
              <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center animate-float" style={{ backgroundColor: `${theme.primary}15`, animationDelay: '0.5s' }}>
                <svg className="w-8 h-8" style={{ color: theme.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 text-center mb-4">
                Curated with Care
              </h3>
              <p className="text-gray-600 text-sm text-center leading-relaxed">
                Each item is hand-selected, inspected, and styled by our team of vintage fashion experts.
              </p>
            </div>

            {/* Planet First */}
            <div className="bg-gray-50 rounded-2xl p-10 border border-gray-100 hover:shadow-lg transition-all duration-300 scroll-animate scroll-fadeInRight stagger-3 card-hover-enhanced">
              <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center animate-float" style={{ backgroundColor: `${theme.primary}15`, animationDelay: '1s' }}>
                <svg className="w-8 h-8" style={{ color: theme.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 text-center mb-4">
                Planet First
              </h3>
              <p className="text-gray-600 text-sm text-center leading-relaxed">
                Buying secondhand saves an average of 700 gallons of water per garment compared to buying new.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section - Fashion, meet Forever */}
      {showTestimonialsSection && testimonials.length > 0 && (
        <section className="py-12 sm:py-24 relative overflow-hidden scroll-animate scroll-fadeInUp" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
          {/* Decorative Background Elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-72 h-72 rounded-full animate-float animate-blob" style={{ background: `radial-gradient(circle, ${theme.primary}40 0%, transparent 70%)` }}></div>
            <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full animate-float animate-blob" style={{ background: `radial-gradient(circle, ${theme.primary}30 0%, transparent 70%)`, animationDelay: '1s' }}></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 relative z-10">
            {/* Header */}
            <div className="text-center mb-10 sm:mb-16 reveal-on-scroll">
              <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-3 tracking-tight">
                Fashion, meet Forever
              </h2>
              <p className="text-gray-500 text-sm tracking-wide">
                Real stories from our community
              </p>
            </div>

            {/* Testimonials Grid */}
            {testimonials.length <= 3 ? (
              <div className={`flex items-stretch justify-center gap-8 max-w-7xl mx-auto ${testimonials.length === 1 ? 'flex-col' : testimonials.length === 2 ? 'flex-row' : 'flex-row'}`}>
                {testimonials.map((testimonial, index) => (
                  <div 
                    key={testimonial.id}
                    className={`group flex-shrink-0 ${testimonials.length === 3 && index === 1 ? 'w-[320px] sm:w-[380px]' : 'w-[280px] sm:w-[340px]'} scroll-animate scroll-zoomIn stagger-${index + 1}`}
                  >
                    <div className="bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 relative overflow-hidden h-full card-hover-enhanced">
                      {/* Quote Icon - Top Left Corner */}
                      <div className="absolute top-0 left-0 rounded-tl-3xl" style={{ backgroundColor: theme.primary }}>
                        <div className="w-16 h-16 flex items-center justify-center">
                          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
                          </svg>
                        </div>
                      </div>
                      
                      <div className="p-8 pt-20">
                        {/* Image */}
                        <div className="flex justify-center mb-6">
                          <div className="relative">
                            <div className="absolute inset-0 rounded-full blur-xl opacity-30 animate-pulse" style={{ backgroundColor: theme.primary }}></div>
                            <div className={`relative ${testimonials.length === 3 && index === 1 ? 'w-20 h-20 sm:w-24 sm:h-24' : 'w-16 h-16 sm:w-20 sm:h-20'} rounded-full overflow-hidden ring-4 ring-white shadow-xl`}>
                              <img 
                                src={testimonial.image || 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face'} 
                                alt={testimonial.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face';
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-sm font-medium text-gray-900 text-center mb-4 uppercase tracking-wide">
                          {testimonial.title}
                        </h3>

                        {/* Description */}
                        <p className="text-gray-500 text-xs text-center leading-relaxed">
                          "{testimonial.description}"
                        </p>

                        {/* Decorative Line */}
                        <div className="mt-6 flex justify-center">
                          <div className="w-16 h-1 rounded-full" style={{ backgroundColor: theme.primary }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="relative">
                <div 
                  className="flex gap-8 overflow-x-auto pb-8 px-4 snap-x snap-mandatory scrollbar-hide"
                >
                  {testimonials.map((testimonial, index) => (
                    <div 
                      key={testimonial.id}
                      className={`flex-shrink-0 w-[280px] sm:w-[340px] md:w-96 snap-center group scroll-animate scroll-zoomIn stagger-${Math.min(index + 1, 6)}`}
                    >
                      <div className="bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 relative overflow-hidden card-hover-enhanced">
                        {/* Quote Icon - Top Left Corner */}
                        <div className="absolute top-0 left-0 rounded-tl-3xl" style={{ backgroundColor: theme.primary }}>
                          <div className="w-16 h-16 flex items-center justify-center">
                            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
                            </svg>
                          </div>
                        </div>
                        
                        <div className="p-8 pt-20">
                          {/* Image */}
                          <div className="flex justify-center mb-6">
                            <div className="relative">
                              <div className="absolute inset-0 rounded-full blur-xl opacity-30 animate-pulse" style={{ backgroundColor: theme.primary }}></div>
                              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden ring-4 ring-white shadow-xl">
                                <img 
                                  src={testimonial.image || 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face'} 
                                  alt={testimonial.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face';
                                  }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Title */}
                          <h3 className="text-sm font-medium text-gray-900 text-center mb-4 uppercase tracking-wide">
                            {testimonial.title}
                          </h3>

                          {/* Description */}
                          <p className="text-gray-500 text-xs text-center leading-relaxed">
                            "{testimonial.description}"
                          </p>

                          {/* Decorative Line */}
                          <div className="mt-6 flex justify-center">
                            <div className="w-16 h-1 rounded-full" style={{ backgroundColor: theme.primary }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                {company?.description || 'Sustainable fashion for conscious consumers.'}
              </p>
              <div className="flex space-x-3">
                <a href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all" aria-label="Instagram">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/>
                    <path d="M12 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all" aria-label="Facebook">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all" aria-label="Pinterest">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.627 0-12 5.372-12 12 0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.535 3.554.535 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            {/* Shop Section */}
            <div>
              <h4 className="text-sm font-bold mb-4 tracking-wider">SHOP</h4>
              <ul className="space-y-3 text-sm">
                <li><button onClick={() => window.location.href = '/products'} className="text-gray-400 hover:text-white transition-colors">All Products</button></li>
                <li><button onClick={() => window.location.href = '/daily-edit'} className="text-gray-400 hover:text-white transition-colors">Daily Edit</button></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">New Arrivals</a></li>
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
    </div>
  );
}
