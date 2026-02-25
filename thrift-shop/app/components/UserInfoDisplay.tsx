'use client';

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
}

interface UserInfoDisplayProps {
  userInfo: UserInfo;
  onEdit: () => void;
  title?: string;
  showEditButton?: boolean;
}

export default function UserInfoDisplay({ 
  userInfo, 
  onEdit, 
  title = "Personal Information",
  showEditButton = true 
}: UserInfoDisplayProps) {
  const { theme } = useTheme();

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {showEditButton && (
            <button
              onClick={onEdit}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 hover:scale-105"
              style={{ 
                backgroundColor: `${theme.primary}20`,
                color: theme.primary 
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Modifier</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Details */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 text-sm uppercase tracking-wide">Contact Information</h4>
            
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 mt-0.5" style={{ backgroundColor: `${theme.primary}20` }}>
                  <svg className="w-4 h-4" style={{ color: theme.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Nom complet</p>
                  <p className="text-gray-900">{userInfo.fullName}</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 mt-0.5" style={{ backgroundColor: `${theme.primary}20` }}>
                  <svg className="w-4 h-4" style={{ color: theme.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Email</p>
                  <p className="text-gray-900">{userInfo.email}</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 mt-0.5" style={{ backgroundColor: `${theme.primary}20` }}>
                  <svg className="w-4 h-4" style={{ color: theme.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Téléphone</p>
                  <p className="text-gray-900">{userInfo.phone}</p>
                </div>
              </div>

              {userInfo.optionalPhone && (
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 mt-0.5" style={{ backgroundColor: `${theme.primary}20` }}>
                    <svg className="w-4 h-4" style={{ color: theme.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Téléphone optionnel</p>
                    <p className="text-gray-900">{userInfo.optionalPhone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Address Details */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 text-sm uppercase tracking-wide">Adresse de livraison</h4>
            
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 mt-0.5" style={{ backgroundColor: `${theme.primary}20` }}>
                  <svg className="w-4 h-4" style={{ color: theme.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Adresse complète</p>
                  <div className="text-gray-900 space-y-1">
                    <p>{userInfo.address}</p>
                    <p>{userInfo.city}, {userInfo.state} {userInfo.zipCode}</p>
                    <p>{userInfo.country}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Edit Button (Mobile) */}
        {showEditButton && (
          <div className="mt-6 pt-6 border-t border-gray-200 md:hidden">
            <button
              onClick={onEdit}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105"
              style={{ 
                backgroundColor: theme.primary,
                color: 'white'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.primaryHover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.primary}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Modifier mes informations</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}