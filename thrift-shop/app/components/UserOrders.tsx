import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

interface Order {
  id: number;
  status: string;
  total: number;
  created_at: string;
  items: Array<{
    id: number;
    product_name: string;
    product_images: string[];
    quantity: number;
    price: number;
  }>;
}

interface UserOrdersProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export default function UserOrders({ isOpen, onClose, user }: UserOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [actionType, setActionType] = useState<'confirm' | 'cancel' | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setTimeout(() => setIsAnimating(true), 10);
      if (user) {
        loadOrders();
      }
    } else {
      setIsAnimating(false);
      setTimeout(() => setIsVisible(false), 300);
    }
  }, [isOpen, user]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await api.getOrders();
      setOrders(response.orders || []);
    } catch (error) {
      console.error('Load orders error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
      case 'PROCESSING': return 'bg-yellow-100 text-yellow-800';
      case 'SHIPPED': return 'bg-purple-100 text-purple-800';
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'Confirmed - Waiting for delivery';
      case 'PROCESSING': return 'Processing';
      case 'SHIPPED': return 'Shipped';
      case 'DELIVERED': return 'Delivered';
      case 'CANCELLED': return 'Cancelled';
      default: return status;
    }
  };

  const handleConfirmOrder = (orderId: number) => {
    setSelectedOrderId(orderId);
    setActionType('confirm');
    setShowConfirmModal(true);
  };

  const handleCancelOrder = (orderId: number) => {
    setSelectedOrderId(orderId);
    setActionType('cancel');
    setShowConfirmModal(true);
  };

  const executeAction = async () => {
    if (!selectedOrderId) return;

    try {
      if (actionType === 'cancel') {
        // Call API to cancel order
        alert('Order cancelled successfully!');
      } else if (actionType === 'confirm') {
        // Call API to confirm order
        alert('Order confirmed successfully!');
      }
      
      setShowConfirmModal(false);
      setSelectedOrderId(null);
      setActionType(null);
      loadOrders(); // Reload orders
    } catch (error) {
      console.error('Failed to update order:', error);
      alert('Failed to update order. Please try again.');
    }
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setSelectedOrderId(null);
    setActionType(null);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        className={`absolute inset-0 backdrop-blur-sm bg-black/20 backdrop-fade-in ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      ></div>
      
      <div 
        className={`absolute inset-0 flex items-start justify-center pt-16 ${
          isAnimating ? 'modal-slide-down' : 'opacity-0 -translate-y-4'
        }`}
      >
        <div 
          className="bg-white rounded-2xl max-w-4xl w-full mx-4 max-h-[85vh] overflow-y-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b bg-gradient-to-r from-white to-gray-50 sticky top-0 z-10 modal-content-item">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <svg className="w-6 h-6 animate-wiggle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>My Orders</span>
              </h2>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-xl p-2 hover:bg-gray-100 rounded-full transition-all duration-200 hover:rotate-90"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-6">
          {loading ? (
            <div className="text-center py-12 scroll-animate scroll-fadeInUp">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)] mx-auto mb-4"></div>
              <p className="text-gray-500">Loading your orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 scroll-animate scroll-fadeInUp">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center animate-float">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-500 mb-4 font-medium">No orders found</p>
              <p className="text-gray-400 text-sm mb-6">Your order history will appear here</p>
              <button 
                onClick={onClose}
                className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white px-6 py-2 rounded-lg font-medium text-sm transition-all duration-300 hover:scale-105 magnetic-btn shadow-lg hover:shadow-xl"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order, index) => (
                <div key={order.id} className={`border rounded-lg p-4 bg-gray-50 scroll-animate scroll-fadeInUp stagger-${Math.min(index + 1, 6)} hover:shadow-lg transition-all duration-300 card-hover-enhanced`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">My Order</h3>
                      <p className="text-sm text-gray-600">
                        Placed on {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">DT {order.total.toFixed(2)}</p>
                      <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(order.status)} animate-bounceIn`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                  </div>
                  
                  {order.items && order.items.length > 0 && (
                    <div className="mt-3">
                      <h4 className="font-medium text-sm text-gray-700 mb-3">Items:</h4>
                      <div className="space-y-3">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex items-center space-x-3 bg-white p-3 rounded-lg border">
                            {/* Product Image */}
                            <div className="flex-shrink-0 w-12 h-12">
                              <img 
                                src={item.product_images?.[0] || 'https://via.placeholder.com/48x48/f3f4f6/9ca3af?text=No+Image'} 
                                alt={item.product_name}
                                className="w-full h-full object-cover rounded-md border border-gray-200"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://via.placeholder.com/48x48/f3f4f6/9ca3af?text=No+Image';
                                }}
                              />
                            </div>
                            
                            {/* Product Details */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {item.product_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                Quantity: {item.quantity}
                              </p>
                            </div>
                            
                            {/* Price */}
                            <div className="flex-shrink-0">
                              <p className="text-sm font-semibold text-gray-900">
                                DT {(item.price * item.quantity).toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500">
                                DT {item.price.toFixed(2)} each
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-4 flex gap-2">
                    {order.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium text-sm transition-all duration-300 hover:bg-red-700"
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[60] overflow-hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeConfirmModal}></div>
          
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-scaleIn">
            <div className="text-center mb-6">
              <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                actionType === 'cancel' ? 'bg-red-100' : 'bg-green-100'
              }`}>
                {actionType === 'cancel' ? (
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {actionType === 'cancel' ? 'Cancel Order?' : 'Confirm Order?'}
              </h3>
              <p className="text-gray-600">
                {actionType === 'cancel' 
                  ? 'Are you sure you want to cancel this order? This action cannot be undone.' 
                  : 'Are you sure you want to confirm this order?'}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeConfirmModal}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                No, Go Back
              </button>
              <button
                onClick={executeAction}
                className={`flex-1 px-6 py-3 text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105 ${
                  actionType === 'cancel' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {actionType === 'cancel' ? 'Yes, Cancel' : 'Yes, Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}