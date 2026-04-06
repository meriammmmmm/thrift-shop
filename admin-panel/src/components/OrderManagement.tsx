import React, { useState, useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';

interface OrderManagementProps {
  authToken: string;
}

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_images: string[];
  quantity: number;
  price: number;
  product_category?: string;
  product_brand?: string;
}

interface Order {
  id: number;
  user: { name: string; email: string };
  item_count: number;
  total: number;
  status: string;
  created_at: string;
  items?: OrderItem[];
}

const API_BASE_URL = 'https://mertrosebackend-meec580k.b4a.run/api/';

const OrderManagement: React.FC<OrderManagementProps> = ({ authToken }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
  const [companyCurrency, setCompanyCurrency] = useState({ currency: 'USD', symbol: '$' });
  const { showSuccess, showError } = useNotifications();

  // Country to currency mapping
  const countryToCurrency: Record<string, { currency: string; symbol: string }> = {
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
    'TN': { currency: 'TND', symbol: 'DT' },
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
  };

  const getCurrentCurrencySymbol = () => {
    return companyCurrency.symbol;
  };

  useEffect(() => {
    loadOrders();
    
    // Get company currency from API when component loads
    const fetchCompanyCurrency = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.user.company && data.user.company.country) {
            const currencyInfo = countryToCurrency[data.user.company.country] || { currency: 'USD', symbol: '$' };
            setCompanyCurrency(currencyInfo);
          }
        }
      } catch (error) {
        console.error('Failed to fetch company currency:', error);
      }
    };
    
    fetchCompanyCurrency();
    
    // Add event listener for profile updates
    const handleProfileUpdate = () => {
      fetchCompanyCurrency();
    };
    
    window.addEventListener('profileUpdated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [authToken]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/orders`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        const ordersData = data.orders || data;
        // Normalize total to always be a number
        const normalizedOrders = ordersData.map((order: Order) => ({
          ...order,
          total: Number(order.total) || 0
        }));
        setOrders(normalizedOrders);
      }
    } catch (error) {
      console.error('Orders load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch(status) {
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'SHIPPED': return 'bg-blue-100 text-blue-800';
      case 'PROCESSING': return 'bg-purple-100 text-purple-800';
      case 'CONFIRMED': return 'bg-indigo-100 text-indigo-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        showSuccess('Success', 'Order status updated successfully!');
        loadOrders();
      } else {
        showError('Error', 'Failed to update order status');
      }
    } catch (error) {
      console.error('Update order status error:', error);
      showError('Error', 'Failed to update order status');
    }
  };

  const toggleOrderExpansion = (orderId: number) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center compact-spacing">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] bg-clip-text text-transparent mb-2">
            Orders Management
          </h2>
          <p className="text-gray-600">Track and manage customer orders</p>
        </div>
        <button 
          onClick={loadOrders} 
          className="btn-modern bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--color-primary)] text-white px-6 py-3 rounded-xl hover:from-[var(--color-primary)] hover:to-[var(--color-primary-hover)] flex items-center"
        >
          <i className="fas fa-refresh mr-2"></i>Refresh
        </button>
      </div>

      <div className="modern-table">
        <table className="min-w-full">
          <thead className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] text-white">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Items</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <i className="fas fa-shopping-cart text-4xl mb-4 text-gray-300"></i>
                    <p className="text-lg font-medium">No orders found</p>
                    <p className="text-sm">Orders will appear here when customers make purchases</p>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <React.Fragment key={order.id}>
                  <tr className="hover:bg-gray-50 transition-all duration-200">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      <button
                        onClick={() => toggleOrderExpansion(order.id)}
                        className="flex items-center gap-2 hover:text-[var(--color-primary)]"
                      >
                        <i className={`fas fa-chevron-${expandedOrders.has(order.id) ? 'down' : 'right'} text-xs`}></i>
                        #{order.id}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {order.user ? (order.user.name || order.user.email) : 'Unknown Customer'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{order.item_count || 0} items</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{getCurrentCurrencySymbol()}{(parseFloat(order.total as any) || 0).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getOrderStatusColor(order.status || 'PENDING')}`}>
                        {order.status || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Unknown'}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        value={order.status || 'PENDING'}
                        className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="PROCESSING">Processing</option>
                        <option value="SHIPPED">Shipped</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                  {expandedOrders.has(order.id) && order.items && order.items.length > 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 bg-gray-50">
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-700 mb-3">Order Items:</h4>
                          <div className="grid gap-3">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-4 bg-white p-3 rounded-lg border border-gray-200">
                                {item.product_images && item.product_images.length > 0 && (
                                  <img 
                                    src={item.product_images[0]} 
                                    alt={item.product_name}
                                    className="w-16 h-16 object-cover rounded"
                                  />
                                )}
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{item.product_name}</p>
                                  {item.product_brand && (
                                    <p className="text-sm text-gray-600">Brand: {item.product_brand}</p>
                                  )}
                                  {item.product_category && (
                                    <p className="text-sm text-gray-600">Category: {item.product_category}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                                  <p className="font-medium text-gray-900">{getCurrentCurrencySymbol()}{(parseFloat(item.price as any) || 0).toFixed(2)}</p>
                                  <p className="text-sm text-gray-600">Total: {getCurrentCurrencySymbol()}{((parseFloat(item.price as any) || 0) * item.quantity).toFixed(2)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderManagement;