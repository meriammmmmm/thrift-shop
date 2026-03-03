'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../lib/theme';
import { api } from '../../lib/api';

interface Order {
  id: number;
  status: string;
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  created_at: string;
  shipping_address: any;
  billing_address: any;
  items: Array<{
    id: number;
    product_name: string;
    product_images: string[];
    quantity: number;
    price: number;
  }>;
}

export default function OrdersPage() {
  const { theme } = useTheme();
  const router = useRouter();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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
    loadOrders();
    loadCompany();
  }, [router]);

  // Webflow-style scroll animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          if (entry.target.classList.contains('reveal-on-scroll')) {
            entry.target.classList.add('revealed');
          }
        }
      });
    }, observerOptions);

    const animateElements = document.querySelectorAll('.scroll-animate, .reveal-on-scroll');
    animateElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [orders]);

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

  const loadOrders = async () => {
    try {
      setLoading(true);
      console.log('Loading orders...');
      const response = await api.getOrders();
      console.log('Orders response:', response);
      setOrders(response.orders || []);
    } catch (error: any) {
      console.error('Load orders error:', error);
      console.error('Error details:', {
        status: error.status,
        message: error.message,
        response: error.response
      });
      
      // Handle authentication errors
      if (error.status === 401 || error.message?.includes('token') || error.message?.includes('Invalid credentials')) {
        console.log('Authentication error, redirecting to login...');
        localStorage.removeItem('auth-token');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }
      
      // Show error to user
      alert('Failed to load orders. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOrder = async (orderId: number) => {
    if (!confirm('Are you sure you want to confirm this order?')) return;
    
    try {
      // Call API to confirm order
      alert('Order confirmed successfully!');
      loadOrders(); // Reload orders
    } catch (error) {
      console.error('Failed to confirm order:', error);
      alert('Failed to confirm order. Please try again.');
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm('Are you sure you want to cancel this order? This action cannot be undone.')) return;
    
    try {
      await api.updateOrderStatus(orderId.toString(), 'CANCELLED');
      alert('Order cancelled successfully!');
      loadOrders();
    } catch (error) {
      console.error('Failed to cancel order:', error);
      alert('Failed to cancel order. Please try again.');
    }
  };

  const handleMarkDelivered = async (orderId: number) => {
    try {
      await api.markOrderDelivered(orderId);
      alert('Order marked as delivered!');
      loadOrders();
    } catch (error) {
      console.error('Failed to mark order as delivered:', error);
      alert('Failed to update order status. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PROCESSING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'SHIPPED': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'DELIVERED': return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'Confirmed';
      case 'PROCESSING': return 'Processing';
      case 'SHIPPED': return 'Shipped';
      case 'DELIVERED': return 'Delivered';
      case 'CANCELLED': return 'Cancelled';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'PROCESSING':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'SHIPPED':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        );
      case 'DELIVERED':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'CANCELLED':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: theme.primary }}></div>
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => router.push('/')}
              className="text-2xl font-bold tracking-wider text-gray-900 hover:scale-105 transition-transform duration-300"
            >
              {company?.name?.toUpperCase() || 'MERY ROSE'}
            </button>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Hello, {user?.name || user?.email}</span>
              <button
                onClick={() => router.push('/profile')}
                className="text-sm text-gray-600 hover:text-gray-900 underline"
              >
                My Profile
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          </div>
          <p className="text-gray-600">View your order history and track their status</p>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16 scroll-animate scroll-fadeInUp">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center animate-float">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-600 mb-6">You haven't placed any orders yet</p>
            <button 
              onClick={() => router.push('/')}
              className="px-6 py-3 rounded-lg font-medium text-white transition-all duration-300 hover:scale-105 magnetic-btn"
              style={{ backgroundColor: theme.primary }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.primaryHover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.primary}
            >
              Start shopping
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order, index) => (
              <div key={order.id} className={`bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 scroll-animate scroll-fadeInUp stagger-${Math.min(index + 1, 6)} card-hover-enhanced`}>
                {/* Order Header */}
                <div className="px-6 py-4 border-b border-gray-200 reveal-on-scroll" style={{ background: `linear-gradient(135deg, ${theme.primaryLight}10, ${theme.primary}05)` }}>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center space-x-4 mb-4 md:mb-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-xl font-bold text-gray-900">My Order</h3>
                        <div className={`flex items-center space-x-1 px-3 py-1 text-sm rounded-full border ${getStatusColor(order.status)} animate-bounceIn`}>
                          {getStatusIcon(order.status)}
                          <span className="font-medium">{getStatusText(order.status)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{Number(order.total || 0).toFixed(2)} DT</p>
                      <p className="text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Ordered items</h4>
                  <div className="space-y-4">
                    {order.items?.map((item, index) => (
                      <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                        {/* Product Image */}
                        <div className="flex-shrink-0 w-16 h-16">
                          <img 
                            src={item.product_images?.[0] || 'https://via.placeholder.com/64x64/f3f4f6/9ca3af?text=No+Image'} 
                            alt={item.product_name}
                            className="w-full h-full object-cover rounded-lg border border-gray-200"
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/64x64/f3f4f6/9ca3af?text=No+Image';
                            }}
                          />
                        </div>
                        
                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-gray-900 truncate">{item.product_name}</h5>
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                          <p className="text-sm text-gray-500">{Number(item.price || 0).toFixed(2)} DT each</p>
                        </div>
                        
                        {/* Item Total */}
                        <div className="flex-shrink-0 text-right">
                          <p className="font-semibold text-gray-900">{(Number(item.price || 0) * item.quantity).toFixed(2)} DT</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Summary */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="font-semibold text-gray-900 mb-3">Order summary</h5>
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span>{Number(order.total || 0).toFixed(2)} DT</span>
                      </div>
                    </div>
                  </div>

                  {/* Order Actions */}
                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                    >
                      {selectedOrder?.id === order.id ? 'Hide details' : 'View details'}
                    </button>
                    
                    {order.status === 'CONFIRMED' && (
                      <>
                        <button
                          onClick={() => handleMarkDelivered(order.id)}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium text-sm transition-all duration-300 hover:bg-green-700"
                        >
                          Mark as delivered
                        </button>
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium text-sm transition-all duration-300 hover:bg-red-700"
                        >
                          Cancel order
                        </button>
                      </>
                    )}
                    
                    {order.status === 'DELIVERED' && (
                      <button
                        className="flex-1 px-4 py-2 text-white rounded-lg font-medium text-sm transition-all duration-300 hover:scale-105"
                        style={{ backgroundColor: theme.primary }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.primaryHover}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.primary}
                      >
                        Leave a review
                      </button>
                    )}
                  </div>

                  {/* Expanded Order Details */}
                  {selectedOrder?.id === order.id && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Shipping Address */}
                        {order.shipping_address && (
                          <div>
                            <h5 className="font-semibold text-gray-900 mb-3">Shipping address</h5>
                            <div className="bg-gray-50 rounded-lg p-4 text-sm">
                              <p className="font-medium">{order.shipping_address.name}</p>
                              <p>{order.shipping_address.street}</p>
                              <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip}</p>
                              <p>{order.shipping_address.country}</p>
                              {order.shipping_address.phone && (
                                <p className="mt-2 text-gray-600">Phone: {order.shipping_address.phone}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Billing Address */}
                        {order.billing_address && (
                          <div>
                            <h5 className="font-semibold text-gray-900 mb-3">Billing address</h5>
                            <div className="bg-gray-50 rounded-lg p-4 text-sm">
                              <p className="font-medium">{order.billing_address.name}</p>
                              <p>{order.billing_address.street}</p>
                              <p>{order.billing_address.city}, {order.billing_address.state} {order.billing_address.zip}</p>
                              <p>{order.billing_address.country}</p>
                              {order.billing_address.email && (
                                <p className="mt-2 text-gray-600">Email: {order.billing_address.email}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-12 text-center">
          <div className="inline-flex space-x-4">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Continue shopping
            </button>
            <button
              onClick={() => router.push('/profile')}
              className="px-6 py-3 text-white rounded-lg font-medium transition-all duration-300 hover:scale-105"
              style={{ backgroundColor: theme.primary }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.primaryHover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.primary}
            >
              My profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}