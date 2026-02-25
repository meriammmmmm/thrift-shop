'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UserInfoForm from '../components/UserInfoForm';
import UserInfoDisplay from '../components/UserInfoDisplay';
import { useTheme } from '../../lib/theme';
import { api } from '../../lib/api';

interface UserInfo {
  fullName: string;
  email: string;
  phone: string;
  optionalPhone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  profile_picture?: string;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  images: string[];
  brand: string;
  size: string;
  condition: string;
}

export default function CheckoutPage() {
  const { theme } = useTheme();
  const router = useRouter();
  
  const [isUserInfoFormOpen, setIsUserInfoFormOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  // Company info for current store
  const [company, setCompany] = useState<{id: number, name: string, description: string} | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('auth-token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
    loadCart();
    loadCompany();
  }, [router]);

  const loadCompany = async () => {
    try {
      const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || '1';
      const response = await api.getCompanyProducts(parseInt(companyId), { limit: 1 });
      
      if (response.company) {
        setCompany(response.company);
      }
    } catch (error) {
      console.error('Failed to load company:', error);
    }
  };

  const loadCart = async () => {
    try {
      setLoading(true);
      const cartData = await api.getCart();
      setCart(cartData.items || []);
    } catch (error) {
      console.error('Failed to load cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserInfoSubmit = async (info: UserInfo) => {
    try {
      // Convert frontend format to backend format
      const backendInfo = {
        fullName: info.fullName,
        email: info.email,
        phone: info.phone,
        optionalPhone: info.optionalPhone,
        address: info.address,
        city: info.city,
        state: info.state,
        zipCode: info.zipCode,
        country: info.country,
        profile_picture: info.profile_picture
      };

      const response = userInfo 
        ? await api.updateUserInfo(backendInfo)
        : await api.saveUserInfo(backendInfo);

      if (response.success) {
        setUserInfo(info);
        setIsUserInfoFormOpen(false);
        
        // Also save to localStorage as backup
        localStorage.setItem('user-info', JSON.stringify(info));
      }
    } catch (error) {
      console.error('Failed to save user info:', error);
      alert('Erreur lors de la sauvegarde. Veuillez réessayer.');
    }
  };

  // Load saved user info on component mount
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const response = await api.getUserInfo();
        if (response.success && response.userInfo) {
          // Convert backend field names to frontend format
          const backendInfo = response.userInfo;
          const frontendInfo: UserInfo = {
            fullName: backendInfo.full_name || '',
            email: backendInfo.email || '',
            phone: backendInfo.phone || '',
            optionalPhone: backendInfo.optional_phone || '',
            address: backendInfo.address || '',
            city: backendInfo.city || '',
            state: backendInfo.state || '',
            zipCode: backendInfo.zip_code || '',
            country: backendInfo.country || 'Tunisia',
            profile_picture: backendInfo.profile_picture || ''
          };
          setUserInfo(frontendInfo);
        }
      } catch (error) {
        console.error('Failed to load user info:', error);
        // Fallback to localStorage
        const savedUserInfo = localStorage.getItem('user-info');
        if (savedUserInfo) {
          setUserInfo(JSON.parse(savedUserInfo));
        }
      }
    };

    if (user) {
      loadUserInfo();
    }
  }, [user]);

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
    const shipping = subtotal > 50 ? 0 : 9.99; // Free shipping over $50
    const tax = subtotal * 0.08; // 8% tax
    return {
      subtotal,
      shipping,
      tax,
      total: subtotal + shipping + tax
    };
  };

  const handlePlaceOrder = async () => {
    if (!userInfo) {
      alert('Veuillez ajouter vos informations de livraison d\'abord');
      return;
    }

    if (cart.length === 0) {
      alert('Votre panier est vide');
      return;
    }

    setIsProcessingOrder(true);

    try {
      const orderData = {
        items: cart.map(item => ({
          product_id: item.id,
          quantity: 1
        })),
        shipping_address: {
          name: userInfo.fullName,
          street: userInfo.address,
          city: userInfo.city,
          state: userInfo.state,
          zip: userInfo.zipCode,
          country: userInfo.country,
          phone: userInfo.phone,
          optional_phone: userInfo.optionalPhone
        },
        billing_address: {
          name: userInfo.fullName,
          street: userInfo.address,
          city: userInfo.city,
          state: userInfo.state,
          zip: userInfo.zipCode,
          country: userInfo.country,
          phone: userInfo.phone,
          email: userInfo.email
        },
        payment_method: "credit_card",
        contact_info: {
          email: userInfo.email,
          phone: userInfo.phone,
          optional_phone: userInfo.optionalPhone
        }
      };

      const response = await api.createOrder(orderData);
      
      // Clear cart after successful order
      await api.clearCart();
      
      // Redirect to success page
      router.push(`/order-success?orderId=${response.order.id}`);
      
    } catch (error) {
      console.error('Order creation failed:', error);
      alert('Échec de la commande. Veuillez réessayer.');
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const totals = calculateTotal();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: theme.primary }}></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🛍️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some items to your cart to proceed with checkout</p>
          <button 
            onClick={() => router.push('/')}
            className="px-6 py-3 rounded-lg font-medium text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: theme.primary }}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => router.push('/')}
              className="text-2xl font-bold tracking-widest text-gray-900 hover:scale-105 transition-all duration-300 hover:tracking-[0.3em]"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              {company?.name?.toUpperCase() || 'MERY ROSE'}
            </button>
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 bg-green-50 px-4 py-2 rounded-full border border-green-200">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Secure Checkout
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - User Information */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl shadow-xl p-4 border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-base" style={{ backgroundColor: theme.primary }}>
                  1
                </div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Checkout</h2>
              </div>
              
              {/* User Information Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5" style={{ color: theme.primary }} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                  <h3 className="text-xl font-bold text-gray-900">Shipping Information</h3>
                </div>
                
                {userInfo ? (
                  <UserInfoDisplay
                    userInfo={userInfo}
                    onEdit={() => setIsUserInfoFormOpen(true)}
                    title="Adresse de livraison"
                    showEditButton={true}
                  />
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 hover:border-gray-400 transition-colors">
                    <div className="text-center py-4">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <p className="mb-4 text-gray-700 font-medium text-base">Veuillez ajouter vos informations de livraison pour continuer</p>
                      <button
                        onClick={() => setIsUserInfoFormOpen(true)}
                        className="px-6 py-3 rounded-xl font-bold text-white transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl text-base"
                        style={{ backgroundColor: theme.primary }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.primaryHover}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.primary}
                      >
                        ✨ Ajouter mes informations
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="border-2 border-gray-200 rounded-2xl p-4 mt-4 bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5" style={{ color: theme.primary }} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                  </svg>
                  <h3 className="text-xl font-bold text-gray-900">Payment Method</h3>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center p-3 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 transition-all hover:shadow-md bg-white">
                    <input type="radio" name="payment" value="credit_card" defaultChecked className="mr-4 w-5 h-5" style={{ accentColor: theme.primary }} />
                    <div className="flex items-center gap-3 flex-1">
                      <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                        <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                      </svg>
                      <span className="font-semibold text-gray-900">Credit Card</span>
                    </div>
                  </label>
                  <label className="flex items-center p-3 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 transition-all hover:shadow-md bg-white">
                    <input type="radio" name="payment" value="paypal" className="mr-4 w-5 h-5" style={{ accentColor: theme.primary }} />
                    <div className="flex items-center gap-3 flex-1">
                      <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .76-.653h8.538c2.24 0 4.283.74 5.328 2.24 1.045 1.5 1.045 3.48.24 5.64-.806 2.16-2.24 3.72-4.283 4.68-2.043.96-4.283 1.2-6.326 1.2H7.076z"/>
                      </svg>
                      <span className="font-semibold text-gray-900">PayPal</span>
                    </div>
                  </label>
                  <label className="flex items-center p-3 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 transition-all hover:shadow-md bg-white">
                    <input type="radio" name="payment" value="apple_pay" className="mr-4 w-5 h-5" style={{ accentColor: theme.primary }} />
                    <div className="flex items-center gap-3 flex-1">
                      <svg className="w-6 h-6 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                      </svg>
                      <span className="font-semibold text-gray-900">Apple Pay</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl shadow-xl p-4 border border-gray-100 sticky top-24 hover:shadow-2xl transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-base" style={{ backgroundColor: theme.primary }}>
                  2
                </div>
                <h3 className="text-xl font-bold text-gray-900">Order Summary</h3>
              </div>
              
              {/* Cart Items */}
              <div className="space-y-3 mb-5 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {cart.map((item) => (
                  <div key={item.id} className="group flex items-center space-x-3 p-3 border-2 border-gray-200 rounded-2xl hover:border-gray-300 transition-all bg-gradient-to-br from-white to-gray-50 hover:shadow-lg">
                    <div className="relative">
                      <img 
                        src={item.images?.[0] || 'https://via.placeholder.com/80x80/f3f4f6/9ca3af?text=No+Image'} 
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-xl border-2 border-gray-200 group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/80x80/f3f4f6/9ca3af?text=No+Image';
                        }}
                      />
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg" style={{ backgroundColor: theme.primary }}>
                        1
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-base mb-1 group-hover:text-gray-700 transition-colors">{item.name}</h4>
                      <p className="text-sm font-semibold text-gray-600 mb-1">{item.brand}</p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-1 bg-gray-200 rounded-full font-medium text-gray-700">{item.size}</span>
                        <span className="px-2 py-1 bg-gray-200 rounded-full font-medium text-gray-700">{item.condition}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 text-xl">${item.price.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Totals */}
              <div className="border-t-2 border-gray-200 pt-3 space-y-2 bg-gradient-to-br from-gray-50 to-white p-4 rounded-2xl mb-3">
                <div className="flex justify-between text-base font-semibold">
                  <span className="text-gray-700">Subtotal</span>
                  <span className="text-gray-900">${totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold">
                  <span className="text-gray-700">Shipping</span>
                  <span className="text-gray-900">
                    {totals.shipping === 0 ? (
                      <span className="text-green-600 font-bold flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        FREE
                      </span>
                    ) : (
                      `$${totals.shipping.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-base font-semibold">
                  <span className="text-gray-700">Tax</span>
                  <span className="text-gray-900">${totals.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold border-t-2 border-gray-300 pt-3 mt-2">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900" style={{ color: theme.primary }}>${totals.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={!userInfo || isProcessingOrder}
                className="w-full mt-2 px-6 py-4 rounded-2xl font-bold text-lg text-white transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-xl hover:shadow-2xl relative overflow-hidden group"
                style={{ 
                  backgroundColor: (!userInfo || isProcessingOrder) ? '#9ca3af' : theme.primary 
                }}
                onMouseEnter={(e) => {
                  if (userInfo && !isProcessingOrder) {
                    e.currentTarget.style.backgroundColor = theme.primaryHover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (userInfo && !isProcessingOrder) {
                    e.currentTarget.style.backgroundColor = theme.primary;
                  }
                }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isProcessingOrder ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      Processing Order...
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Place Order
                    </>
                  )}
                </span>
                {!isProcessingOrder && userInfo && (
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                )}
              </button>

              {!userInfo && (
                <p className="text-sm text-gray-600 text-center mt-3 font-medium">
                  ⚠️ Veuillez ajouter vos informations de livraison pour passer commande
                </p>
              )}

              {/* Trust Badges */}
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="flex flex-col items-center">
                    <svg className="w-8 h-8 mb-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs font-semibold text-gray-700">Secure Payment</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <svg className="w-8 h-8 mb-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                      <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                    </svg>
                    <span className="text-xs font-semibold text-gray-700">Fast Delivery</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <svg className="w-8 h-8 mb-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs font-semibold text-gray-700">Quality Guaranteed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Info Form Modal */}
      <UserInfoForm
        isOpen={isUserInfoFormOpen}
        onClose={() => setIsUserInfoFormOpen(false)}
        onSubmit={handleUserInfoSubmit}
        initialData={userInfo || {}}
        title={userInfo ? "Modifier l'adresse de livraison" : "Ajouter l'adresse de livraison"}
        isEditing={!!userInfo}
      />
    </div>
  );
}