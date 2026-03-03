'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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

export default function ProductsPage() {
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
  const [selectedOccasion, setSelectedOccasion] = useState('All');
  const [selectedCondition, setSelectedCondition] = useState('All');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [isSizeSelectorOpen, setIsSizeSelectorOpen] = useState(false);
  const [priceRange, setPriceRange] = useState('All');
  const [isPriceDropdownOpen, setIsPriceDropdownOpen] = useState(false);
  const [isConditionDropdownOpen, setIsConditionDropdownOpen] = useState(false);
  const [isOccasionDropdownOpen, setIsOccasionDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [companyCurrency, setCompanyCurrency] = useState({ currency: 'USD', symbol: '$' });
  const [customPriceMin, setCustomPriceMin] = useState('');
  const [customPriceMax, setCustomPriceMax] = useState('');
  const [sortBy, setSortBy] = useState('newest');
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

  // Company info for current store
  const [company, setCompany] = useState<{id: number, name: string, description: string} | null>(null);

  // Memoized currency configuration
  const currencyConfig = useMemo(() => ({
    'US': { currency: 'USD', symbol: '$' },
    'CA': { currency: 'CAD', symbol: 'C$' },
    'GB': { currency: 'GBP', symbol: '£' },
    'EU': { currency: 'EUR', symbol: '€' },
    'DE': { currency: 'EUR', symbol: '€' },
    'FR': { currency: 'EUR', symbol: '€' },
    'IT': { currency: 'EUR', symbol: '€' },
    'ES': { currency: 'EUR', symbol: '€' },
    'NL': { currency: 'EUR', symbol: '€' },
    'JP': { currency: 'JPY', symbol: '¥' },
    'AU': { currency: 'AUD', symbol: 'A$' },
    'NZ': { currency: 'NZD', symbol: 'NZ$' },
    'CH': { currency: 'CHF', symbol: 'CHF' },
    'SE': { currency: 'SEK', symbol: 'kr' },
    'NO': { currency: 'NOK', symbol: 'kr' },
    'DK': { currency: 'DKK', symbol: 'kr' },
    'PL': { currency: 'PLN', symbol: 'zł' },
    'CZ': { currency: 'CZK', symbol: 'Kč' },
    'TN': { currency: 'TND', symbol: 'DT ' },
    'AE': { currency: 'AED', symbol: 'د.إ' },
    'SA': { currency: 'SAR', symbol: 'ر.س' },
    'EG': { currency: 'EGP', symbol: 'E£' },
    'MA': { currency: 'MAD', symbol: 'DH' },
    'BR': { currency: 'BRL', symbol: 'R$' },
    'MX': { currency: 'MXN', symbol: '$' },
    'IN': { currency: 'INR', symbol: '₹' },
    'CN': { currency: 'CNY', symbol: '¥' },
    'KR': { currency: 'KRW', symbol: '₩' },
    'TR': { currency: 'TRY', symbol: '₺' }
  }), []);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type, isVisible: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, isVisible: false }));
    }, 3000);
  };

  // Optimized load products function
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || '1';
      const response = await api.getCompanyProducts(parseInt(companyId), { limit: 100 });
      
      if (response.company) {
        setCompany(response.company);
        
        if (response.company.country) {
          const currencyInfo = currencyConfig[response.company.country as keyof typeof currencyConfig] || { currency: 'USD', symbol: '$' };
          setCompanyCurrency(currencyInfo);
        }
      }
      
      if (response.products) {
        const transformedProducts = response.products.map((product: any) => {
          const inStockValue = product.in_stock === true || product.in_stock === 1 || product.in_stock === '1';
          
          return {
            id: product.id,
            name: product.name,
            description: product.description,
            price: parseFloat(product.price),
            originalPrice: product.original_price ? parseFloat(product.original_price) : undefined,
            images: Array.isArray(product.images) ? product.images : (product.images ? [product.images] : []),
            brand: product.brand,
            size: product.size,
            category: product.category,
            condition: product.condition,
            color: product.color,
            inStock: inStockValue,
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
          };
        });
        
        setProducts(transformedProducts);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currencyConfig]);

  // Memoized price range parser
  const priceRangeMap = useMemo(() => {
    const { currency } = companyCurrency;
    
    const maps = {
      TND: {
        'Under 30': { min: 0, max: 30 },
        '30 - 75': { min: 30, max: 75 },
        '75 - 150': { min: 75, max: 150 },
        '150 - 300': { min: 150, max: 300 },
        '300+': { min: 300, max: Infinity }
      },
      JPY: {
        'Under 1000': { min: 0, max: 1000 },
        '1000 - 2500': { min: 1000, max: 2500 },
        '2500 - 5000': { min: 2500, max: 5000 },
        '5000 - 10000': { min: 5000, max: 10000 },
        '10000+': { min: 10000, max: Infinity }
      },
      INR: {
        'Under 500': { min: 0, max: 500 },
        '500 - 1500': { min: 500, max: 1500 },
        '1500 - 3000': { min: 1500, max: 3000 },
        '3000 - 6000': { min: 3000, max: 6000 },
        '6000+': { min: 6000, max: Infinity }
      },
      AED: {
        'Under 40': { min: 0, max: 40 },
        '40 - 100': { min: 40, max: 100 },
        '100 - 200': { min: 100, max: 200 },
        '200 - 400': { min: 200, max: 400 },
        '400+': { min: 400, max: Infinity }
      },
      GBP: {
        'Under 8': { min: 0, max: 8 },
        '8 - 20': { min: 8, max: 20 },
        '20 - 40': { min: 20, max: 40 },
        '40 - 80': { min: 40, max: 80 },
        '80+': { min: 80, max: Infinity }
      }
    } as const;

    return maps[currency as keyof typeof maps] || {
      'Under 10': { min: 0, max: 10 },
      '10 - 25': { min: 10, max: 25 },
      '25 - 50': { min: 25, max: 50 },
      '50 - 100': { min: 50, max: 100 },
      '100+': { min: 100, max: Infinity }
    };
  }, [companyCurrency]);

  // Optimized filtering logic with memoization
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.brand.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Flexible category matching
      let matchesCategory = selectedCategory === 'All';
      if (!matchesCategory) {
        const productCategory = product.category.toLowerCase();
        const selectedCategoryLower = selectedCategory.toLowerCase();
        
        if (productCategory === selectedCategoryLower) {
          matchesCategory = true;
        } else if (selectedCategoryLower === 'bags') {
          // Match any category containing "bag" or "bags"
          matchesCategory = productCategory.includes('bag');
        } else if (selectedCategoryLower === 'shoes') {
          matchesCategory = ['sneakers', 'boots', 'heels', 'flats', 'sandals'].includes(productCategory) || productCategory.includes('shoe') || productCategory.includes('boot');
        } else if (selectedCategoryLower === 'accessories') {
          matchesCategory = ['jewelry', 'watches', 'sunglasses', 'belts', 'scarves', 'hats'].includes(productCategory) || productCategory.includes('accessories');
        } else if (selectedCategoryLower === 'tops') {
          matchesCategory = ['tops', 'sweaters', 'jackets'].includes(productCategory) || productCategory.includes('top');
        } else if (selectedCategoryLower === 'dresses') {
          matchesCategory = ['dresses', 'skirts'].includes(productCategory) || productCategory.includes('dress');
        }
      }
      
      // Occasion matching - map occasions to product tags or categories
      let matchesOccasion = selectedOccasion === 'All';
      if (!matchesOccasion) {
        const productTags = product.tags ? product.tags.map(tag => tag.toLowerCase()) : [];
        const occasionLower = selectedOccasion.toLowerCase();
        
        if (occasionLower === 'night out') {
          matchesOccasion = productTags.some(tag => ['party', 'night', 'club', 'evening', 'cocktail'].includes(tag)) ||
                           ['dresses', 'heels', 'jewelry'].includes(product.category.toLowerCase());
        } else if (occasionLower === 'casual') {
          matchesOccasion = productTags.some(tag => ['casual', 'everyday', 'comfort', 'relaxed'].includes(tag)) ||
                           ['jeans', 'sneakers', 'tops', 't-shirts'].includes(product.category.toLowerCase());
        } else if (occasionLower === 'work & office') {
          matchesOccasion = productTags.some(tag => ['work', 'office', 'professional', 'business'].includes(tag)) ||
                           ['blazers', 'dress pants', 'button-down'].includes(product.category.toLowerCase());
        } else if (occasionLower === 'date night') {
          matchesOccasion = productTags.some(tag => ['date', 'romantic', 'elegant', 'chic'].includes(tag)) ||
                           ['dresses', 'heels', 'jewelry'].includes(product.category.toLowerCase());
        } else if (occasionLower === 'weekend vibes') {
          matchesOccasion = productTags.some(tag => ['weekend', 'relaxed', 'fun', 'leisure'].includes(tag)) ||
                           ['jeans', 'sneakers', 'casual tops'].includes(product.category.toLowerCase());
        } else if (occasionLower === 'special events') {
          matchesOccasion = productTags.some(tag => ['formal', 'special', 'event', 'gala', 'wedding'].includes(tag)) ||
                           ['formal dresses', 'suits', 'heels'].includes(product.category.toLowerCase());
        }
      }
      
      const matchesCondition = selectedCondition === 'All' || product.condition === selectedCondition;
      const matchesSize = selectedSizes.length === 0 || selectedSizes.includes(product.size);
      
      // Price range filter
      let matchesPrice = true;
      if (priceRange === 'Custom' && (customPriceMin || customPriceMax)) {
        const minPrice = customPriceMin ? parseFloat(customPriceMin) : 0;
        const maxPrice = customPriceMax ? parseFloat(customPriceMax) : Infinity;
        matchesPrice = product.price >= minPrice && product.price <= maxPrice;
      } else if (priceRange !== 'All' && priceRange !== 'Custom') {
        const range = priceRangeMap[priceRange as keyof typeof priceRangeMap] as { min: number; max: number } | undefined;
        if (range) {
          matchesPrice = product.price >= range.min && product.price <= range.max;
        }
      }
      
      return matchesSearch && matchesCategory && matchesOccasion && matchesCondition && matchesSize && matchesPrice;
    });
  }, [products, searchQuery, selectedCategory, selectedOccasion, selectedCondition, selectedSizes, priceRange, customPriceMin, customPriceMax, priceRangeMap]);

  // Optimized sorting with memoization
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
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
  }, [filteredProducts, sortBy]);

  // Memoized categories and sizes
  const categories = useMemo(() => ['All', ...Array.from(new Set(products.map(p => p.category)))], [products]);
  const sizes = useMemo(() => ['All', ...Array.from(new Set(products.map(p => p.size))).sort()], [products]);

  // Check if user is logged in on component mount
  useEffect(() => {
    const token = localStorage.getItem('auth-token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
      loadUserCart();
      loadUserWishlist();
    }
    
    // Check URL parameters for filters
    const urlParams = new URLSearchParams(window.location.search);
    const occasionParam = urlParams.get('occasion');
    if (occasionParam) {
      setSelectedOccasion(occasionParam);
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

  // Optimized dropdown handlers
  const closeAllDropdowns = useCallback(() => {
    setIsPriceDropdownOpen(false);
    setIsConditionDropdownOpen(false);
    setIsOccasionDropdownOpen(false);
    setIsSortDropdownOpen(false);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        closeAllDropdowns();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeAllDropdowns]);

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

  const handleDropdownToggle = useCallback((dropdown: string) => {
    closeAllDropdowns();
    switch (dropdown) {
      case 'price':
        setIsPriceDropdownOpen(prev => !prev);
        break;
      case 'condition':
        setIsConditionDropdownOpen(prev => !prev);
        break;
      case 'occasion':
        setIsOccasionDropdownOpen(prev => !prev);
        break;
      case 'sort':
        setIsSortDropdownOpen(prev => !prev);
        break;
    }
  }, [closeAllDropdowns]);

  // Memoized price ranges based on currency
  const priceRanges = useMemo(() => {
    const { symbol, currency } = companyCurrency;
    
    const ranges = {
      TND: [
        { value: 'All', label: 'All Prices' },
        { value: 'Under 30', label: `Under ${symbol}30` },
        { value: '30 - 75', label: `${symbol}30 - ${symbol}75` },
        { value: '75 - 150', label: `${symbol}75 - ${symbol}150` },
        { value: '150 - 300', label: `${symbol}150 - ${symbol}300` },
        { value: '300+', label: `${symbol}300+` },
        { value: 'Custom', label: 'Custom Range' }
      ],
      EUR: [
        { value: 'All', label: 'All Prices' },
        { value: 'Under 10', label: `Under ${symbol}10` },
        { value: '10 - 25', label: `${symbol}10 - ${symbol}25` },
        { value: '25 - 50', label: `${symbol}25 - ${symbol}50` },
        { value: '50 - 100', label: `${symbol}50 - ${symbol}100` },
        { value: '100+', label: `${symbol}100+` },
        { value: 'Custom', label: 'Custom Range' }
      ],
      GBP: [
        { value: 'All', label: 'All Prices' },
        { value: 'Under 8', label: `Under ${symbol}8` },
        { value: '8 - 20', label: `${symbol}8 - ${symbol}20` },
        { value: '20 - 40', label: `${symbol}20 - ${symbol}40` },
        { value: '40 - 80', label: `${symbol}40 - ${symbol}80` },
        { value: '80+', label: `${symbol}80+` },
        { value: 'Custom', label: 'Custom Range' }
      ],
      JPY: [
        { value: 'All', label: 'All Prices' },
        { value: 'Under 1000', label: `Under ${symbol}1,000` },
        { value: '1000 - 2500', label: `${symbol}1,000 - ${symbol}2,500` },
        { value: '2500 - 5000', label: `${symbol}2,500 - ${symbol}5,000` },
        { value: '5000 - 10000', label: `${symbol}5,000 - ${symbol}10,000` },
        { value: '10000+', label: `${symbol}10,000+` },
        { value: 'Custom', label: 'Custom Range' }
      ],
      INR: [
        { value: 'All', label: 'All Prices' },
        { value: 'Under 500', label: `Under ${symbol}500` },
        { value: '500 - 1500', label: `${symbol}500 - ${symbol}1,500` },
        { value: '1500 - 3000', label: `${symbol}1,500 - ${symbol}3,000` },
        { value: '3000 - 6000', label: `${symbol}3,000 - ${symbol}6,000` },
        { value: '6000+', label: `${symbol}6,000+` },
        { value: 'Custom', label: 'Custom Range' }
      ],
      AED: [
        { value: 'All', label: 'All Prices' },
        { value: 'Under 40', label: `Under ${symbol}40` },
        { value: '40 - 100', label: `${symbol}40 - ${symbol}100` },
        { value: '100 - 200', label: `${symbol}100 - ${symbol}200` },
        { value: '200 - 400', label: `${symbol}200 - ${symbol}400` },
        { value: '400+', label: `${symbol}400+` },
        { value: 'Custom', label: 'Custom Range' }
      ]
    };

    return ranges[currency as keyof typeof ranges] || [
      { value: 'All', label: 'All Prices' },
      { value: 'Under 10', label: `Under ${symbol}10` },
      { value: '10 - 25', label: `${symbol}10 - ${symbol}25` },
      { value: '25 - 50', label: `${symbol}25 - ${symbol}50` },
      { value: '50 - 100', label: `${symbol}50 - ${symbol}100` },
      { value: '100+', label: `${symbol}100+` },
      { value: 'Custom', label: 'Custom Range' }
    ];
  }, [companyCurrency]);

  // Show loading state while theme is loading
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

  // Show loading state while products are loading
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
      {/* Hero Section with Background Image */}
      <section className="relative py-16 text-white overflow-hidden"
               style={{ 
                 background: `linear-gradient(to right, ${theme.primary}dd, ${theme.primaryHover}dd)` 
               }}>
        <div className="absolute inset-0">
          <img 
            src="/images/premium-7ba67846.webp" 
            alt="Products background"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center flex flex-col items-center">
          <h1 className="text-6xl font-bold mb-4 animate-fade-in">
            {company?.name ? `${company.name} Products` : 'Mery Rose Products'}
          </h1>
          <p className="text-2xl mb-8 opacity-90 animate-slide-up text-center" style={{ animationDelay: '200ms' }}>
            Discover our complete collection of premium secondhand items
          </p>
          <p className="text-lg opacity-80 max-w-2xl mx-auto">
            {company?.description || 'Discover the latest arrivals from the past 7 days. Curated finds that just hit our virtual shelves.'}
          </p>
        </div>
      </section>

      {/* Filters Section - Optimized & Clean */}
      <section className="py-8 bg-gradient-to-b from-gray-50 to-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          {/* Category Pills - Streamlined */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {['All', 'Dresses', 'Shoes', 'Accessories', 'Tops', 'Bags'].map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 hover:scale-105 ${
                  selectedCategory === category
                    ? 'text-white shadow-lg transform scale-105'
                    : 'bg-white text-gray-600 hover:text-gray-800 shadow-sm hover:shadow-md border border-gray-200'
                }`}
                style={{
                  backgroundColor: selectedCategory === category ? theme.primary : undefined
                }}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Compact Filter Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 max-w-4xl mx-auto">
            {/* Price Filter */}
            <div className="relative dropdown-container">
              <button
                onClick={() => handleDropdownToggle('price')}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-sm text-black focus:outline-none focus:ring-2 focus:ring-opacity-30 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-between"
              >
                <span className="text-left">
                  {priceRange === 'All' ? 'All Prices' : 
                   priceRanges.find(range => range.value === priceRange)?.label || priceRange}
                </span>
                <svg className={`w-4 h-4 text-black transition-transform duration-200 ${isPriceDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isPriceDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2">
                  {priceRanges.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setPriceRange(option.value === 'All' ? 'All' : option.value);
                        setIsPriceDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm text-black hover:bg-gray-50 transition-colors ${
                        priceRange === option.value ? 'font-medium' : ''
                      }`}
                      style={{ color: priceRange === option.value ? theme.primary : 'black' }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Size Filter */}
            <button
              onClick={() => setIsSizeSelectorOpen(true)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-sm text-black focus:outline-none hover:border-gray-300 transition-all duration-200 flex items-center justify-between shadow-sm hover:shadow-md"
            >
              <span className="text-left">
                {selectedSizes.length === 0 
                  ? 'All Sizes' 
                  : selectedSizes.length === 1 
                    ? selectedSizes[0]
                    : `${selectedSizes.length} sizes`
                }
              </span>
              <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Condition Filter */}
            <div className="relative dropdown-container">
              <button
                onClick={() => handleDropdownToggle('condition')}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-sm text-black focus:outline-none focus:ring-2 focus:ring-opacity-30 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-between"
              >
                <span className="text-left">{selectedCondition === 'All' ? 'All Conditions' : selectedCondition}</span>
                <svg className={`w-4 h-4 text-black transition-transform duration-200 ${isConditionDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isConditionDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2">
                  {['All', 'New with tags', 'Excellent', 'Very Good', 'Good', 'Fair'].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSelectedCondition(option === 'All' ? 'All' : option);
                        setIsConditionDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm text-black hover:bg-gray-50 transition-colors ${
                        selectedCondition === option ? 'font-medium' : ''
                      }`}
                      style={{ color: selectedCondition === option ? theme.primary : 'black' }}
                    >
                      {option === 'All' ? 'All Conditions' : option}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Occasion Filter */}
            <div className="relative dropdown-container">
              <button
                onClick={() => handleDropdownToggle('occasion')}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-sm text-black focus:outline-none focus:ring-2 focus:ring-opacity-30 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-between"
              >
                <span className="text-left">{selectedOccasion === 'All' ? 'All Occasions' : selectedOccasion}</span>
                <svg className={`w-4 h-4 text-black transition-transform duration-200 ${isOccasionDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isOccasionDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2">
                  {['All', 'Party & Night Out', 'Casual Everyday', 'Work & Office', 'Date Night', 'Weekend Vibes', 'Special Events'].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSelectedOccasion(option === 'All' ? 'All' : option);
                        setIsOccasionDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm text-black hover:bg-gray-50 transition-colors ${
                        selectedOccasion === option ? 'font-medium' : ''
                      }`}
                      style={{ color: selectedOccasion === option ? theme.primary : 'black' }}
                    >
                      {option === 'All' ? 'All Occasions' : option}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sort Filter */}
            <div className="relative dropdown-container">
              <button
                onClick={() => handleDropdownToggle('sort')}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-sm text-black focus:outline-none focus:ring-2 focus:ring-opacity-30 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-between"
              >
                <span className="text-left">
                  {sortBy === 'newest' ? 'Newest First' :
                   sortBy === 'price-low' ? 'Price: Low to High' :
                   sortBy === 'price-high' ? 'Price: High to Low' :
                   sortBy === 'brand' ? 'Brand A-Z' :
                   sortBy === 'popular' ? 'Most Popular' : 'Newest First'}
                </span>
                <svg className={`w-4 h-4 text-black transition-transform duration-200 ${isSortDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isSortDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2">
                  {[
                    { value: 'newest', label: 'Newest First' },
                    { value: 'price-low', label: 'Price: Low to High' },
                    { value: 'price-high', label: 'Price: High to Low' },
                    { value: 'brand', label: 'Brand A-Z' },
                    { value: 'popular', label: 'Most Popular' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value);
                        setIsSortDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm text-black hover:bg-gray-50 transition-colors ${
                        sortBy === option.value ? 'font-medium' : ''
                      }`}
                      style={{ color: sortBy === option.value ? theme.primary : 'black' }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Custom Price Range - Improved */}
          {priceRange === 'Custom' && (
            <div className="flex items-center justify-center space-x-4 mt-6 p-4 bg-white rounded-xl shadow-sm border border-gray-200 max-w-md mx-auto">
              <span className="text-sm font-medium text-gray-600">Price Range:</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">{companyCurrency.symbol}</span>
                <input
                  type="number"
                  placeholder="0"
                  value={customPriceMin}
                  onChange={(e) => setCustomPriceMin(e.target.value)}
                  className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-opacity-30 text-center"
                />
                <span className="text-sm text-gray-400">to</span>
                <span className="text-sm text-gray-500">{companyCurrency.symbol}</span>
                <input
                  type="number"
                  placeholder="∞"
                  value={customPriceMax}
                  onChange={(e) => setCustomPriceMax(e.target.value)}
                  className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-opacity-30 text-center"
                />
              </div>
              <div className="text-xs text-gray-500">
                {companyCurrency.currency}
              </div>
            </div>
          )}

          {/* Active Filters & Clear Button */}
          {(selectedCategory !== 'All' || selectedCondition !== 'All' || selectedOccasion !== 'All' || selectedSizes.length > 0 || priceRange !== 'All' || customPriceMin || customPriceMax || searchQuery) && (
            <div className="text-center mt-6">
              <div className="inline-flex items-center space-x-3 px-6 py-3 bg-white rounded-full shadow-md border border-gray-200">
                <span className="text-sm text-gray-600">
                  {[
                    selectedCategory !== 'All' && selectedCategory,
                    selectedOccasion !== 'All' && selectedOccasion,
                    selectedCondition !== 'All' && selectedCondition,
                    selectedSizes.length > 0 && `Size: ${selectedSizes.join(', ')}`,
                    priceRange !== 'All' && priceRange !== 'Custom' && 
                      priceRanges.find(range => range.value === priceRange)?.label,
                    priceRange === 'Custom' && (customPriceMin || customPriceMax) && 
                      `${companyCurrency.symbol}${customPriceMin || '0'} - ${companyCurrency.symbol}${customPriceMax || '∞'}`,
                    searchQuery && `"${searchQuery}"`
                  ].filter(Boolean).join(' • ')}
                </span>
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setSelectedCondition('All');
                    setSelectedOccasion('All');
                    setSelectedSizes([]);
                    setPriceRange('All');
                    setCustomPriceMin('');
                    setCustomPriceMax('');
                    setSearchQuery('');
                  }}
                  className="inline-flex items-center space-x-1 px-3 py-1 text-xs font-medium text-white rounded-full hover:scale-105 transition-all duration-200"
                  style={{ backgroundColor: theme.primary }}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Clear</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          {/* Results Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                {sortedProducts.length} Products
              </h2>
              <p className="text-gray-600 mt-1">
                {selectedCategory !== 'All' && `${selectedCategory} • `}
                {selectedOccasion !== 'All' && `${selectedOccasion} • `}
                {selectedSizes.length > 0 && `Size${selectedSizes.length > 1 ? 's' : ''} ${selectedSizes.join(', ')} • `}
                {selectedCondition !== 'All' && `${selectedCondition} condition • `}
                {priceRange !== 'All' && priceRange !== 'Custom' && `${priceRange} • `}
                {priceRange === 'Custom' && (customPriceMin || customPriceMax) && 
                  `$${customPriceMin || '0'} - $${customPriceMax || '∞'} • `}
                {selectedCategory === 'All' && selectedCondition === 'All' && selectedOccasion === 'All' && selectedSizes.length === 0 && priceRange === 'All' && !customPriceMin && !customPriceMax ? 'All products' : 'Filtered results'}
              </p>
            </div>
          </div>

          {/* Products Grid */}
          {sortedProducts.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Items Found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || selectedCategory !== 'All' || selectedCondition !== 'All' || priceRange !== 'All'
                  ? 'Try adjusting your filters or search terms'
                  : 'No products available at the moment. Check back soon!'
                }
              </p>
              {(searchQuery || selectedCategory !== 'All' || selectedCondition !== 'All' || priceRange !== 'All') && (
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                    setSelectedCondition('All');
                    setPriceRange('All');
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

          {/* Load More / Pagination */}
          {sortedProducts.length > 0 && (
            <div className="text-center mt-12">
              <p className="text-gray-600 mb-4">
                Showing all {sortedProducts.length} items
              </p>
              <div className="flex justify-center space-x-4">
                <button 
                  onClick={() => window.location.href = '/daily-edit'}
                  className="px-6 py-3 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  View {company?.name || 'Daily'} Edit
                </button>
                <button 
                  onClick={() => window.location.href = '/'}
                  className="px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl text-white"
                  style={{ backgroundColor: theme.primary }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.primaryHover}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.primary}
                >
                  Back to Home
                </button>
              </div>
            </div>
          )}
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