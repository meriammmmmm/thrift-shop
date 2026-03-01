'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from '../../lib/theme';
import { api } from '../../lib/api';

export default function OrderSuccessPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<{id: number, name: string} | null>(null);

  useEffect(() => {
    loadCompany();
    if (orderId) {
      loadOrder();
    } else {
      setLoading(false);
    }
  }, [orderId]);

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

  const loadOrder = async () => {
    try {
      const orderData = await api.getOrder(orderId!);
      setOrder(orderData);
    } catch (error) {
      console.error('Failed to load order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: theme.primary }}></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <button 
            onClick={() => router.push('/')}
            className="text-2xl font-bold tracking-widest text-gray-900 hover:scale-105 transition-all duration-300"
          >
            {company?.name?.toUpperCase() || 'MERY ROSE'}
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Success Animation */}
        <div className="text-center mb-8 animate-fadeIn">
          <div className="w-24 h-24 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center animate-bounceIn">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Order Confirmed!</h1>
          <p className="text-xl text-gray-600 mb-2">Thank you for your purchase</p>
          {orderId && (
            <p className="text-sm text-gray-500">Order ID: #{orderId}</p>
          )}
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: theme.primary }}>
              ✓
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Your order is confirmed</h2>
              <p className="text-gray-600">We'll send you a confirmation email shortly</p>
            </div>
          </div>

          {order && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="font-bold text-gray-900 mb-4">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900 font-semibold">{Number(order.subtotal || 0).toFixed(2)} DT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-gray-900 font-semibold">
                      {Number(order.shipping || 0) === 0 ? 'FREE' : `${Number(order.shipping || 0).toFixed(2)} DT`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="text-gray-900 font-semibold">{Number(order.tax || 0).toFixed(2)} DT</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold border-t border-gray-200 pt-3 mt-3">
                    <span>Total</span>
                    <span style={{ color: theme.primary }}>{Number(order.total || 0)} DT</span>
                  </div>
                </div>
              </div>

              {order.shipping_address && (
                <div className="bg-gray-50 rounded-2xl p-6">
                  <h3 className="font-bold text-gray-900 mb-3">Delivery Address</h3>
                  <div className="text-sm text-gray-700">
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
            </div>
          )}

          {/* What's Next */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4">What happens next?</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: theme.primary }}>
                  1
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Order Confirmation</p>
                  <p className="text-sm text-gray-600">You'll receive an email confirmation shortly</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: theme.primary }}>
                  2
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Processing</p>
                  <p className="text-sm text-gray-600">We'll prepare your items for shipment</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: theme.primary }}>
                  3
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Delivery</p>
                  <p className="text-sm text-gray-600">Your order will be delivered to your address</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => router.push('/orders')}
            className="flex-1 px-6 py-4 text-white rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 shadow-lg"
            style={{ backgroundColor: theme.primary }}
          >
            View My Orders
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-colors"
          >
            Continue Shopping
          </button>
        </div>

        {/* Support Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Need help? Contact us at{' '}
            <a href="mailto:support@example.com" className="underline" style={{ color: theme.primary }}>
              support@example.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
