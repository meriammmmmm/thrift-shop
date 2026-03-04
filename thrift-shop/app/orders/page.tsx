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
    product_in_stock?: number;
    product_reservation_status?: string;
  }>;
}

export default function OrdersPage() {
  const { theme } = useTheme();
  const router = useRouter();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error' | 'confirm';
    onConfirm?: () => void;
  }>({
    title: '',
    message: '',
    type: 'success'
  });

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
      setModalConfig({
        title: 'Error',
        message: 'Failed to load orders. Please try refreshing the page.',
        type: 'error'
      });
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOrder = async (orderId: number) => {
    setModalConfig({
      title: 'Confirm Order',
      message: 'Are you sure you want to confirm this order?',
      type: 'confirm',
      onConfirm: async () => {
        setShowModal(false);
        // Call API to confirm order
        setModalConfig({
          title: 'Success',
          message: 'Order confirmed successfully!',
          type: 'success'
        });
        setShowModal(true);
        setTimeout(() => setShowModal(false), 2000);
        loadOrders();
      }
    });
    setShowModal(true);
  };

  const handleCancelOrder = async (orderId: number) => {
    setModalConfig({
      title: 'Cancel Order',
      message: 'Are you sure you want to cancel this order? This action cannot be undone.',
      type: 'confirm',
      onConfirm: async () => {
        setShowModal(false);
        try {
          await api.updateOrderStatus(orderId.toString(), 'CANCELLED');
          setModalConfig({
            title: 'Success',
            message: 'Order cancelled successfully!',
            type: 'success'
          });
          setShowModal(true);
          setTimeout(() => setShowModal(false), 2000);
          loadOrders();
        } catch (error) {
          console.error('Failed to cancel order:', error);
          setModalConfig({
            title: 'Error',
            message: 'Failed to cancel order. Please try again.',
            type: 'error'
          });
          setShowModal(true);
        }
      }
    });
    setShowModal(true);
  };

  const handleMarkDelivered = async (orderId: number) => {
    setModalConfig({
      title: 'Mark as Delivered',
      message: 'Confirm that you have received this order?',
      type: 'confirm',
      onConfirm: async () => {
        setShowModal(false);
        try {
          await api.markOrderDelivered(orderId);
          setModalConfig({
            title: 'Success',
            message: 'Order marked as delivered!',
            type: 'success'
          });
          setShowModal(true);
          setTimeout(() => setShowModal(false), 2000);
          loadOrders();
        } catch (error) {
          console.error('Failed to mark order as delivered:', error);
          setModalConfig({
            title: 'Error',
            message: 'Failed to update order status. Please try again.',
            type: 'error'
          });
          setShowModal(true);
        }
      }
    });
    setShowModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'PROCESSING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'SHIPPED': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'DELIVERED': return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'Reserved';
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: theme.primary }}></div>
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fadeIn border border-gray-200">
            <div className="text-center">
              {/* Icon */}
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                modalConfig.type === 'success' ? 'bg-green-100' :
                modalConfig.type === 'error' ? 'bg-red-100' :
                'bg-blue-100'
              }`}>
                {modalConfig.type === 'success' && (
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {modalConfig.type === 'error' && (
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                {modalConfig.type === 'confirm' && (
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 mb-2">{modalConfig.title}</h3>
              
              {/* Message */}
              <p className="text-gray-600 mb-6">{modalConfig.message}</p>

              {/* Buttons */}
              <div className="flex gap-3">
                {modalConfig.type === 'confirm' ? (
                  <>
                    <button
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={modalConfig.onConfirm}
                      className="flex-1 px-4 py-2.5 text-white rounded-lg font-medium transition-colors"
                      style={{ backgroundColor: theme.primary }}
                    >
                      OK
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-full px-4 py-2.5 text-white rounded-lg font-medium transition-colors"
                    style={{ backgroundColor: theme.primary }}
                  >
                    OK
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
          </div>
          <p className="text-sm text-gray-600 ml-11">View your order history and track their status</p>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-600 mb-6">You haven't placed any orders yet</p>
            <button 
              onClick={() => router.push('/')}
              className="px-6 py-3 rounded-lg font-medium text-white transition-all duration-300"
              style={{ backgroundColor: theme.primary }}
            >
              Start shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                {/* Order Header */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">My Order</h3>
                      <div className={`flex items-center space-x-1 px-3 py-1 text-xs rounded-full border ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="font-medium">{getStatusText(order.status)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">{Number(order.total || 0).toFixed(2)} DT</p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Ordered items</h4>
                  <div className="space-y-3">
                    {order.items?.map((item, index) => (
                      <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg relative">
                        <div className="flex-shrink-0 w-16 h-16 relative">
                          <img 
                            src={item.product_images?.[0] || 'https://via.placeholder.com/64'} 
                            alt={item.product_name}
                            className="w-full h-full object-cover rounded border border-gray-200"
                          />
                          {/* Status Badge on Image */}
                          {item.product_reservation_status === 'reserved' && (
                            <div className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-orange-500 text-white text-[9px] font-bold rounded">
                              RESERVED
                            </div>
                          )}
                          {(item.product_reservation_status === 'sold' || item.product_in_stock === 0) && item.product_reservation_status !== 'reserved' && (
                            <div className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-red-600 text-white text-[9px] font-bold rounded">
                              SOLD
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-sm font-medium text-gray-900 truncate">{item.product_name}</h5>
                          <p className="text-xs text-gray-500">Quantity: {item.quantity}</p>
                          {/* Status Text */}
                          {item.product_reservation_status === 'reserved' && (
                            <p className="text-xs text-orange-600 font-medium mt-1">• Reserved</p>
                          )}
                          {(item.product_reservation_status === 'sold' || item.product_in_stock === 0) && item.product_reservation_status !== 'reserved' && (
                            <p className="text-xs text-red-600 font-medium mt-1">• Sold Out</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">{Number(item.price || 0).toFixed(2)} DT</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Summary */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total</span>
                      <span className="font-bold text-gray-900">{Number(order.total || 0).toFixed(2)} DT</span>
                    </div>
                  </div>

                  {/* Order Actions */}
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                      className="flex-1 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {selectedOrder?.id === order.id ? 'Hide details' : 'View details'}
                    </button>
                    
                    {order.status === 'CONFIRMED' && (
                      <>
                        <button
                          onClick={() => handleMarkDelivered(order.id)}
                          className="flex-1 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Mark delivered
                        </button>
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>

                  {/* Expanded Details */}
                  {selectedOrder?.id === order.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {order.shipping_address && (
                          <div>
                            <h5 className="text-sm font-semibold text-gray-900 mb-2">Shipping address</h5>
                            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-700">
                              <p className="font-medium">{order.shipping_address.name}</p>
                              <p>{order.shipping_address.street}</p>
                              <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip}</p>
                              <p>{order.shipping_address.country}</p>
                              {order.shipping_address.phone && (
                                <p className="mt-1 text-gray-600">Phone: {order.shipping_address.phone}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {order.billing_address && (
                          <div>
                            <h5 className="text-sm font-semibold text-gray-900 mb-2">Billing address</h5>
                            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-700">
                              <p className="font-medium">{order.billing_address.name}</p>
                              <p>{order.billing_address.street}</p>
                              <p>{order.billing_address.city}, {order.billing_address.state} {order.billing_address.zip}</p>
                              <p>{order.billing_address.country}</p>
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
        <div className="mt-8 text-center">
          <div className="inline-flex gap-3">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Continue shopping
            </button>
            <button
              onClick={() => router.push('/profile')}
              className="px-6 py-2.5 text-white rounded-lg text-sm font-medium transition-colors"
              style={{ backgroundColor: theme.primary }}
            >
              My profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}