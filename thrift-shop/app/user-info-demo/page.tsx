'use client';

import { useState } from 'react';
import UserInfoForm from '../components/UserInfoForm';
import UserInfoDisplay from '../components/UserInfoDisplay';
import { useTheme } from '../../lib/theme';

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

export default function UserInfoDemoPage() {
  const { theme } = useTheme();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submittedData, setSubmittedData] = useState<UserInfo | null>(null);

  const handleFormSubmit = (data: UserInfo) => {
    setSubmittedData(data);
    console.log('User Info Submitted:', data);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-wider text-gray-900">
              User Information Form Demo
            </h1>
            <button 
              onClick={() => window.location.href = '/'}
              className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Back to Home
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">User Information Form</h2>
            <p className="text-gray-600 mb-6">
              This form collects user's full name, address, email, phone number, and optional secondary phone number.
              It includes validation and matches the design style from your image.
            </p>
            
            <button
              onClick={() => setIsFormOpen(true)}
              className="px-8 py-4 rounded-lg font-bold text-lg text-white transition-all duration-300 hover:scale-105 shadow-lg"
              style={{ backgroundColor: theme.primary }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.primaryHover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.primary}
            >
              Open User Information Form
            </button>
          </div>

          {/* Features List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">Form Features:</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0" style={{ backgroundColor: theme.primary }}></span>
                  Full name input with validation
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0" style={{ backgroundColor: theme.primary }}></span>
                  Email validation with proper format checking
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0" style={{ backgroundColor: theme.primary }}></span>
                  Primary phone number (required)
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0" style={{ backgroundColor: theme.primary }}></span>
                  Optional secondary phone number
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0" style={{ backgroundColor: theme.primary }}></span>
                  Complete address with city, state/governorate, and postal code
                </li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">Validation Features:</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0" style={{ backgroundColor: theme.primary }}></span>
                  Real-time field validation
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0" style={{ backgroundColor: theme.primary }}></span>
                  Error messages with tooltips
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0" style={{ backgroundColor: theme.primary }}></span>
                  Required field indicators
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0" style={{ backgroundColor: theme.primary }}></span>
                  Phone number format validation
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0" style={{ backgroundColor: theme.primary }}></span>
                  Dropdown for governorates (Tunisia regions)
                </li>
              </ul>
            </div>
          </div>

          {/* Submitted Data Display */}
          {submittedData && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Information Display Component:</h3>
              <UserInfoDisplay
                userInfo={submittedData}
                onEdit={() => setIsFormOpen(true)}
                title="Informations soumises"
                showEditButton={true}
              />
            </div>
          )}

          {/* Usage Instructions */}
          <div className="mt-8 p-6 border border-gray-200 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">How to Use:</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>Click "Open User Information Form" to see the modal</li>
              <li>Fill in all required fields (marked with red asterisks)</li>
              <li>The form validates input in real-time</li>
              <li>Optional phone number can be left empty</li>
              <li>Select your governorate from the dropdown</li>
              <li>Click "Enregistrer" (Save) to submit the form</li>
              <li>The submitted data will appear below</li>
            </ol>
          </div>

          {/* Integration Notes */}
          <div className="mt-8 p-6 bg-blue-50 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Integration:</h3>
            <p className="text-gray-700 mb-4">
              This form is integrated into the checkout process and user profile page. It can be used anywhere in your application where you need to collect user information.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => window.location.href = '/checkout'}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                View in Checkout
              </button>
              <button
                onClick={() => window.location.href = '/profile'}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                View in Profile
              </button>
              <button
                onClick={() => window.location.href = '/orders'}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                View Orders Page
              </button>
            </div>
          </div>

          {/* New Feature: Product Images */}
          <div className="mt-8 p-6 bg-green-50 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">✨ New: Product Images in Cart & Orders</h3>
            <p className="text-gray-700 mb-4">
              Product images are now displayed in the shopping cart and order history for a better visual experience.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-semibold text-gray-900 mb-2">Shopping Cart</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Product images (64x64px)</li>
                  <li>• Brand, size, and condition info</li>
                  <li>• Individual and total pricing</li>
                  <li>• Improved layout with images</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-semibold text-gray-900 mb-2">Order History</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Product images (48x48px)</li>
                  <li>• Order status with colors</li>
                  <li>• Item details with images</li>
                  <li>• Better visual organization</li>
                </ul>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              <strong>Note:</strong> Images include fallback placeholders for missing product images.
            </p>
          </div>
        </div>
      </div>

      {/* User Info Form Modal */}
      <UserInfoForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={submittedData || {}}
        title={submittedData ? "Modifier les informations" : "Ajouter les informations"}
        isEditing={!!submittedData}
      />
    </div>
  );
}