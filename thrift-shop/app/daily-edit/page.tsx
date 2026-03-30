'use client';

import { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import Cart from '../components/Cart';
import Wishlist from '../components/Wishlist';
import Notification from '../components/Notification';
import ProductDetails from '../components/ProductDetails';
import UserOrders from '../components/UserOrders';
import SizeSelector from '../components/SizeSelector';
import { Product, User } from '../types';
import { api } from '../../lib/api';
import { useTheme } from '../../lib/theme';

export default function DailyEditPage() {
  const { theme, isLoading: themeLoading } = useTheme();
  
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
  const [selectedCondition, setSelectedCondition] = useState('All');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [isSizeSelectorOpen, setIsSizeSelectorOpen] = useState(false);
  const [priceRange, setPriceRange] = useState('All');
  const [customPriceMin, setCustomPriceMin] = useState('');
  const [customPriceMax, setCustomPriceMax] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductDetailsOpen, setIsProductDetailsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | 'info', isVisible: boolean}>({
    message: '',
    type: 'success',
    isVisible: false
  });
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  // Real products from API
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companyCurrency, setCompanyCurrency] = useState({ currency: 'USD', symbol: '$' });

  // Company info for current store
  const [company, setCompany] = useState<{id: number, name: string, description: string} | null>(null);

  // Currency configuration
  const currencyConfig: Record<string, { currency: string; symbol: string }> = {
    'US': { currency: 'USD', symbol: '$' },
    'CA': { currency: 'CAD', symbol: 'C$' },
    'GB': { currency: 'GBP', symbol: '£' },
    'EU': { currency: 'EUR', symbol: '€' },
    'TN': { currency: 'TND', symbol: 'DT ' },
  };

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
      
      // Get company ID from environment variable
      const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || '2';
      
      const response = await api.getCompanyProducts(parseInt(companyId), { limit: 50 });
      
      if (response.company) {
        // Set company info for branding
        setCompany(response.company);
        
        // Set currency based on company country
        if (response.company.country) {
          const currencyInfo = currencyConfig[response.company.country] || { currency: 'USD', symbol: '$' };
          setCompanyCurrency(currencyInfo);
        }
      }
      
      if (response.products) {
        // Transform API products to match our Product interface
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
          inStock: product.in_stock === 1 || product.in_stock === true || product.in_stock === '1',
          material: product.material,
          measurements: product.measurements || {},
          careInstructions: Array.isArray(product.care_instructions) ? product.care_instructions : [],
          tags: Array.isArray(product.tags) ? product.tags : [],
          seller: {
            name: product.seller_name || 'Unknown',
            rating: product.seller_rating || 4.5,
            location: product.seller_location || 'Unknown'
          },
          dateAdded: product.created_at,
          views: product.views || 0,
          likes: product.likes || 0
        }));
        setProducts(transformedProducts);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter products for this week (Daily Edit)
  const weeklyProducts = products.filter(product => {
    const productDate = new Date(product.dateAdded);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return productDate >= oneWeekAgo;
  });

  // Filter and search logic for weekly products
  const filteredProducts = weeklyProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesCondition = selectedCondition === 'All' || product.condition === selectedCondition;
    const matchesSize = selectedSizes.length === 0 || selectedSizes.includes(product.size);
    
    // Price range filter
    let matchesPrice = true;
    if (priceRange === 'Custom' && (customPriceMin || customPriceMax)) {
      const minPrice = customPriceMin ? parseFloat(customPriceMin) : 0;
      const maxPrice = customPriceMax ? parseFloat(customPriceMax) : Infinity;
      matchesPrice = product.price >= minPrice && product.price <= maxPrice;
    } else if (priceRange !== 'All' && priceRange !== 'Custom') {
      switch (priceRange) {
        case 'Under $10':
          matchesPrice = product.price < 10;
          break;
        case '$10 - $25':
          matchesPrice = product.price >= 10 && product.price <= 25;
          break;
        case '$25 - $50':
          matchesPrice = product.price >= 25 && product.price <= 50;
          break;
        case '$50 - $100':
          matchesPrice = product.price >= 50 && product.price <= 100;
          break;
        case '$100+':
          matchesPrice = product.price > 100;
          break;
      }
    }
    
    return matchesSearch && matchesCategory && matchesCondition && matchesSize && matchesPrice;
  });

  // Sort logic
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
        return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime(); // newest first
    }
  });

  const categories = ['All', ...Array.from(new Set(weeklyProducts.map(p => p.category)))];
  const sizes = ['All', ...Array.from(new Set(weeklyProducts.map(p => p.size))).sort()];

  // Check if user is logged in on component mount
  useEffect(() => {
    const token = localStorage.getItem('auth-token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
      loadUserCart();
      loadUserWishlist();
    }
    // Load products from API
    loadProducts();
    loadProfilePicture();
  }, []);

  const loadProfilePicture = () => {
    const savedPicture = localStorage.getItem('profile-picture');
    if (savedPicture) {
      setProfilePicture(savedPicture);
    }
  };

  // Load user's cart from API
  const loadUserCart = async () => {
    try {
      const cartData = await api.getCart();
      const items = cartData.items || [];
      setCart(items);
      setCartTotal(cartData.total || 0);
      // Track which product IDs are in cart
      const itemIds = new Set<number>(items.map((item: any) => item.id));
      setCartItemIds(itemIds);
    } catch (error) {
      console.error('Load cart error:', error);
      // If cart loading fails, keep local cart
    }
  };

  // Load user's wishlist from API
  const loadUserWishlist = async () => {
    try {
      const response = await api.getWishlistIds();
      if (response.success) {
        setWishlist(response.wishlistIds);
      }
    } catch (error) {
      console.error('Failed to load wishlist:', error);
    }
  };

  // Scroll effect for header
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
          if (entry.target.classList.contains('reveal-on-scroll')) {
            entry.target.classList.add('revealed');
          }
          if (entry.target.classList.contains('zoom-on-scroll')) {
            entry.target.classList.add('zoomed');
          }
        }
      });
    }, observerOptions);

    const animateElements = document.querySelectorAll('.scroll-animate, .reveal-on-scroll, .zoom-on-scroll');
    animateElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [sortedProducts]);

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

    // Check if item is already in cart
    if (cartItemIds.has(product.id)) {
      showNotification('This item is already in your cart', 'info');
      return;
    }

    try {
      await api.addToCart(product.id);
      // Reload cart from API to get accurate state
      await loadUserCart();
      showNotification(`${product.name} added to bag!`, 'success');
    } catch (error: any) {
      console.error('Add to cart error:', error);
      if (error.message?.includes('already in cart')) {
        showNotification('This item is already in your cart', 'info');
        // Reload cart to sync state
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
      // Reload cart from API to get accurate state
      await loadUserCart();
      showNotification('Item removed from bag', 'info');
    } catch (error) {
      console.error('Remove from cart error:', error);
      showNotification('Failed to remove item from bag', 'error');
    }
  };

  const toggleWishlist = async (productId: number) => {
    if (!user) {
      showNotification('Please create an account or sign in to save items to your wishlist', 'info');
      window.location.href = '/login';
      return;
    }
    
    try {
      const product = products.find(p => p.id === productId);
      
      if (wishlist.includes(productId)) {
        // Remove from wishlist
        await api.removeFromWishlist(productId);
        setWishlist(wishlist.filter(id => id !== productId));
        showNotification(`Removed from wishlist`, 'info');
      } else {
        // Add to wishlist
        await api.addToWishlist(productId);
        setWishlist([...wishlist, productId]);
        showNotification(`${product?.name} added to wishlist!`, 'success');
      }
    } catch (error) {
      console.error('Wishlist toggle error:', error);
      showNotification('Failed to update wishlist. Please try again.', 'error');
    }
  };

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setIsProductDetailsOpen(true);
    // Simulate view tracking
    product.views += 1;
  };

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
      
      showNotification(`Order #${response.order.id} created successfully! Your order is confirmed and waiting for delivery.`, 'success');
      setIsCartOpen(false);
      
    } catch (error) {
      console.error('Checkout error:', error);
      showNotification('Checkout failed. Please try again.', 'error');
    }
  };

  const cartCount = cart.length;

  // Show loading state while theme is loading
  if (themeLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <img 
          src="/images/mery-rose-logo.png" 
          alt="Loading..." 
          className="w-48 h-auto animate-pulse"
        />
      </div>
    );
  }

  // Show loading state while products are loading
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <img 
          src="/images/mery-rose-logo.png" 
          alt="Loading..." 
          className="w-48 h-auto animate-pulse"
        />
      </div>
    );
  }

  // Show error state if products failed to load
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
      <section className="relative py-12 sm:py-16 md:py-20 lg:py-24 text-white overflow-hidden"
               style={{ 
                 background: `linear-gradient(to right, ${theme.primary}dd, ${theme.primaryHover}dd)` 
               }}>
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&h=400&fit=crop" 
            alt="Daily Edit background"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 animate-fade-in leading-tight">
            {company?.name || 'Mery Rose'} Edit
          </h1>
          <p className="text-xl sm:text-2xl md:text-3xl mb-6 sm:mb-8 opacity-90 animate-slide-up leading-relaxed" style={{ animationDelay: '200ms' }}>
            This Week's Fresh Drops - {weeklyProducts.length} New Items
          </p>
          <p className="text-base sm:text-lg md:text-xl opacity-80 max-w-2xl mx-auto px-4">
            Discover the latest arrivals from the past 7 days. Curated finds that just hit our virtual shelves.
          </p>
        </div>
      </section>

      {/* Filters Section */}
      <section className="py-8 bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4">
          {/* Category Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            {['All', 'Dresses', 'Shoes', 'Accessories', 'Tops', 'Bags'].map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedCategory === category
                    ? 'text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
                style={{
                  backgroundColor: selectedCategory === category ? theme.primary : undefined
                }}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Price and Condition Filters */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Price Range Filter */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Price:</span>
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                >
                  <option value="All">All Prices</option>
                  <option value="Under $10">Under $10</option>
                  <option value="$10 - $25">$10 - $25</option>
                  <option value="$25 - $50">$25 - $50</option>
                  <option value="$50 - $100">$50 - $100</option>
                  <option value="$100+">$100+</option>
                  <option value="Custom">Custom Range</option>
                </select>
              </div>

              {/* Custom Price Range Inputs */}
              {priceRange === 'Custom' && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">$</span>
                  <input
                    type="number"
                    placeholder="Min"
                    value={customPriceMin}
                    onChange={(e) => setCustomPriceMin(e.target.value)}
                    className="w-20 px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                  <span className="text-sm text-gray-600">to</span>
                  <span className="text-sm text-gray-600">$</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={customPriceMax}
                    onChange={(e) => setCustomPriceMax(e.target.value)}
                    className="w-20 px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                </div>
              )}

              {/* Size Filter */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Size:</span>
                <button
                  onClick={() => setIsSizeSelectorOpen(true)}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none hover:bg-gray-50 transition-colors flex items-center space-x-2"
                >
                  <span>
                    {selectedSizes.length === 0 
                      ? 'All Sizes' 
                      : selectedSizes.length === 1 
                        ? selectedSizes[0]
                        : `${selectedSizes.length} sizes`
                    }
                  </span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Condition Filter */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Condition:</span>
                <select
                  value={selectedCondition}
                  onChange={(e) => setSelectedCondition(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                >
                  <option value="All">All Conditions</option>
                  <option value="New with tags">New with tags</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Very Good">Very Good</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                </select>
              </div>

              {/* Clear Filters */}
              {(selectedCategory !== 'All' || selectedCondition !== 'All' || selectedSizes.length > 0 || priceRange !== 'All' || customPriceMin || customPriceMax || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setSelectedCondition('All');
                    setSelectedSizes([]);
                    setPriceRange('All');
                    setCustomPriceMin('');
                    setCustomPriceMax('');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="brand">Brand A-Z</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          {/* Results Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {sortedProducts.length} Items Found
              </h2>
              <p className="text-gray-600 mt-1">
                New arrivals from the past 7 days
                {selectedCategory !== 'All' && ` • ${selectedCategory}`}
                {selectedSizes.length > 0 && ` • Size${selectedSizes.length > 1 ? 's' : ''} ${selectedSizes.join(', ')}`}
                {selectedCondition !== 'All' && ` • ${selectedCondition} condition`}
                {priceRange !== 'All' && priceRange !== 'Custom' && ` • ${priceRange}`}
                {priceRange === 'Custom' && (customPriceMin || customPriceMax) && 
                  ` • $${customPriceMin || '0'} - $${customPriceMax || '∞'}`}
              </p>
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">View:</span>
              <button className="p-2 bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Products Grid */}
          {sortedProducts.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Items Found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || selectedCategory !== 'All' || selectedCondition !== 'All' || selectedSizes.length > 0 || priceRange !== 'All' || customPriceMin || customPriceMax
                  ? 'Try adjusting your filters or search terms'
                  : 'No new items have been added this week. Check back soon!'
                }
              </p>
              {(searchQuery || selectedCategory !== 'All' || selectedCondition !== 'All' || selectedSizes.length > 0 || priceRange !== 'All' || customPriceMin || customPriceMax) && (
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                    setSelectedCondition('All');
                    setSelectedSizes([]);
                    setPriceRange('All');
                    setCustomPriceMin('');
                    setCustomPriceMax('');
                  }}
                  className="px-6 py-3 rounded-lg font-medium text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: theme.primary }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={addToCart}
                  onToggleWishlist={toggleWishlist}
                  onViewDetails={handleViewDetails}
                  isWishlisted={wishlist.includes(product.id)}
                  isInCart={cartItemIds.has(product.id)}
                  currencySymbol={companyCurrency.symbol}
                />
              ))}
            </div>
          )}

          {/* Load More Button */}
          {/* {sortedProducts.length > 0 && (
            <div className="text-center mt-12">
              <p className="text-gray-600 mb-4">
                Showing all {sortedProducts.length} items from this week
              </p>
              <button 
                onClick={() => window.location.href = '/'}
                className="px-8 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl text-white"
                style={{ backgroundColor: theme.primary }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.primaryHover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.primary}
              >
                Browse All Products
              </button>
            </div>
          )} */}
        </div>
      </section>

      {/* Product Details Modal */}
      <ProductDetails
        product={selectedProduct}
        isOpen={isProductDetailsOpen}
        onClose={() => setIsProductDetailsOpen(false)}
        onAddToCart={addToCart}
        onToggleWishlist={toggleWishlist}
        isWishlisted={selectedProduct ? wishlist.includes(selectedProduct.id) : false}
        isInCart={selectedProduct ? cartItemIds.has(selectedProduct.id) : false}
        currencySymbol={companyCurrency.symbol}
      />

      {/* Notification */}
      <Notification 
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={() => setNotification(prev => ({ ...prev, isVisible: false }))}
      />

      {/* Cart Modal */}
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

      {/* Wishlist Modal */}
      <Wishlist
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlist={products.filter(p => wishlist.includes(p.id))}
        onAddToCart={addToCart}
        onRemove={toggleWishlist}
        onViewDetails={(product) => {
          setSelectedProduct(product);
          setIsProductDetailsOpen(true);
          setIsWishlistOpen(false);
        }}
        currencySymbol={companyCurrency.symbol}
      />

      {/* User Orders Modal */}
      <UserOrders 
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
        user={user}
      />

      {/* Size Selector Modal */}
      <SizeSelector
        isOpen={isSizeSelectorOpen}
        onClose={() => setIsSizeSelectorOpen(false)}
        selectedSizes={selectedSizes}
        onSizeChange={setSelectedSizes}
        availableSizes={sizes}
      />
    </div>
  );
}