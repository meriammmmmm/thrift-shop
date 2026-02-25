'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from '../../lib/theme';

function OrderSuccessContent() {
  const { theme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center animate-bounce"
               style={{ backgroundColor: `${theme.primary}20` }}>
            <svg className="w-10 h-10" style={{ color: theme.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Success Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for your purchase. Your order has been confirmed and is being processed.
          </p>

          {/* Order Details */}
          {orderId && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600">Order Number</p>
              <p className="text-lg font-bold text-gray-900">#{orderId}</p>
            </div>
          )}

          {/* What's Next */}
          <div className="text-left mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">What happens next?</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0" style={{ backgroundColor: theme.primary }}></span>
                You'll receive an email confirmation shortly
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0" style={{ backgroundColor: theme.primary }}></span>
                We'll prepare your items for shipping
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0" style={{ backgroundColor: theme.primary }}></span>
                You'll get tracking information once shipped
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => router.push('/')}
              className="w-full px-6 py-3 rounded-lg font-medium text-white transition-all duration-300 hover:scale-105"
              style={{ backgroundColor: theme.primary }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.primaryHover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.primary}
            >
              Continue Shopping
            </button>
            
            <button
              onClick={() => router.push('/orders')}
              className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              View My Orders
            </button>
          </div>

          {/* Auto Redirect Notice */}
          <p className="text-xs text-gray-500 mt-6">
            Redirecting to home page in {countdown} seconds...
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}