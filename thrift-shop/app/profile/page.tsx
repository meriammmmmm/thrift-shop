// Force rebuild - input text color fix
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SuccessNotification from '../components/SuccessNotification';
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

export default function ProfilePage() {
  const { theme } = useTheme();
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editingUserInfo, setEditingUserInfo] = useState<UserInfo>({
    fullName: '',
    email: '',
    phone: '',
    optionalPhone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Tunisia'
  });
  const [loading, setLoading] = useState(true);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [isLoadingUserInfo, setIsLoadingUserInfo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);

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
    loadUserInfo();
    loadProfilePicture();
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

  const loadUserInfo = async () => {
    try {
      setIsLoadingUserInfo(true);
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
        setEditingUserInfo(frontendInfo);
        
        // Set profile picture from backend if available
        if (backendInfo.profile_picture) {
          setProfilePicture(backendInfo.profile_picture);
        }
      }
    } catch (error: any) {
      // 404 is expected for new users who haven't added their info yet
      if (error?.status !== 404) {
        console.error('Failed to load user info:', error);
      }
      // User info doesn't exist yet, which is fine for new users
    } finally {
      setIsLoadingUserInfo(false);
      setLoading(false);
    }
  };

  const loadProfilePicture = () => {
    const savedPicture = localStorage.getItem('profile-picture');
    if (savedPicture) {
      setProfilePicture(savedPicture);
    }
  };

  const handleProfilePictureChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    try {
      setIsUploadingPicture(true);
      
      // Convert to base64 for storage
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64String = e.target?.result as string;
        setProfilePicture(base64String);
        
        // Save to localStorage as backup
        localStorage.setItem('profile-picture', base64String);
        
        // Save to backend via user profile update
        try {
          const response = await api.updateUserProfile({ 
            name: user?.name, 
            profile_picture: base64String 
          });
          if (response) {
            setShowSuccessNotification(true);
          }
        } catch (error) {
          console.error('Failed to save profile picture to backend:', error);
          // Still show success since it's saved locally
          setShowSuccessNotification(true);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to upload profile picture:', error);
      alert('Failed to upload profile picture. Please try again.');
    } finally {
      setIsUploadingPicture(false);
    }
  };

  const removeProfilePicture = async () => {
    setProfilePicture(null);
    localStorage.removeItem('profile-picture');
    
    // Remove from backend too
    try {
      await api.updateUserProfile({ 
        name: user?.name, 
        profile_picture: null 
      });
    } catch (error) {
      console.error('Failed to remove profile picture from backend:', error);
    }
    
    setShowSuccessNotification(true);
  };

  const handleUserInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      
      // Convert frontend format to backend format
      const backendInfo = {
        fullName: editingUserInfo.fullName,
        email: editingUserInfo.email,
        phone: editingUserInfo.phone,
        optionalPhone: editingUserInfo.optionalPhone,
        address: editingUserInfo.address,
        city: editingUserInfo.city,
        state: editingUserInfo.state,
        zipCode: editingUserInfo.zipCode,
        country: editingUserInfo.country,
        profile_picture: profilePicture || undefined
      };

      const response = userInfo 
        ? await api.updateUserInfo(backendInfo)
        : await api.saveUserInfo(backendInfo);

      if (response.success) {
        setUserInfo(editingUserInfo);
        setIsEditingInfo(false);
        setShowSuccessNotification(true);
        
        // Also save to localStorage as backup
        localStorage.setItem('user-info', JSON.stringify(editingUserInfo));
      }
    } catch (error) {
      console.error('Failed to save user info:', error);
      alert('Error saving information. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditStart = () => {
    setEditingUserInfo(userInfo || {
      fullName: '',
      email: '',
      phone: '',
      optionalPhone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Tunisia'
    });
    setIsEditingInfo(true);
  };

  const handleEditCancel = () => {
    setEditingUserInfo(userInfo || {
      fullName: '',
      email: '',
      phone: '',
      optionalPhone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Tunisia'
    });
    setIsEditingInfo(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth-token');
    localStorage.removeItem('user');
    localStorage.removeItem('user-info'); // Clear cached user info
    localStorage.removeItem('profile-picture'); // Clear profile picture
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => router.push('/')}
              className="text-2xl font-bold tracking-wider text-gray-900 hover:scale-105 transition-transform duration-300"
            >
              {company?.name?.toUpperCase() || 'STORE'}
            </button>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold overflow-hidden" style={{ backgroundColor: theme.primary }}>
                  {profilePicture ? (
                    <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    (user?.name || user?.email || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                <span className="text-sm font-medium text-gray-700">Welcome, {user?.name || user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded-md hover:bg-gray-100 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8">
          <div className="relative px-8 py-12" style={{ background: `linear-gradient(135deg, ${theme.primary}15, ${theme.primaryLight}10)` }}>
            <div className="flex items-center space-x-8">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg overflow-hidden" style={{ backgroundColor: theme.primary }}>
                  {profilePicture ? (
                    <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    (user?.name || user?.email || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                
                {/* Profile Picture Upload Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <div className="text-center">
                    <svg className="w-6 h-6 text-white mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-xs text-white">Change</span>
                  </div>
                </div>
                
                {/* Hidden File Input */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isUploadingPicture}
                />
                
                {/* Loading Overlay */}
                {isUploadingPicture && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">My Profile</h1>
                <p className="text-gray-600 text-lg">Manage your account information and preferences</p>
                
                {/* Profile Picture Actions */}
                <div className="flex items-center space-x-4 mt-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    <span>Member since January 2026</span>
                  </div>
                  
                  {profilePicture && (
                    <button
                      onClick={removeProfilePicture}
                      className="text-sm text-red-600 hover:text-red-800 underline"
                    >
                      Remove Picture
                    </button>
                  )}
                  
                  <label className="text-sm text-blue-600 hover:text-blue-800 underline cursor-pointer">
                    {profilePicture ? 'Change Picture' : 'Add Picture'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="hidden"
                      disabled={isUploadingPicture}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Account Information */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <svg className="w-5 h-5 mr-2" style={{ color: theme.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Account Details
              </h2>
              
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl border-l-4" style={{ borderLeftColor: theme.primary }}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <p className="text-gray-900 font-medium">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <svg className="w-5 h-5 mr-2" style={{ color: theme.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Quick Actions
              </h2>
              
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/orders')}
                  className="w-full p-4 text-left rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform" style={{ backgroundColor: `${theme.primary}20` }}>
                      <svg className="w-5 h-5" style={{ color: theme.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">My Orders</h3>
                      <p className="text-sm text-gray-600">View order history</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => router.push('/')}
                  className="w-full p-4 text-left rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform" style={{ backgroundColor: `${theme.primary}20` }}>
                      <svg className="w-5 h-5" style={{ color: theme.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Wishlist</h3>
                      <p className="text-sm text-gray-600">View saved items</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => router.push('/')}
                  className="w-full p-4 text-left rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform" style={{ backgroundColor: `${theme.primary}20` }}>
                      <svg className="w-5 h-5" style={{ color: theme.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Continue Shopping</h3>
                      <p className="text-sm text-gray-600">Browse products</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2" style={{ color: theme.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Personal Information
                </h2>
                {!isEditingInfo && userInfo && (
                  <button
                    onClick={handleEditStart}
                    className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200 hover:scale-105"
                    style={{ backgroundColor: theme.primary }}
                  >
                    Edit Information
                  </button>
                )}
              </div>

              {isLoadingUserInfo ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: theme.primary }}></div>
                  <p className="text-gray-600">Loading information...</p>
                </div>
              ) : !userInfo && !isEditingInfo ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No personal information</h3>
                  <p className="text-gray-600 mb-6">Add your personal information to make checkout easier</p>
                  <button
                    onClick={handleEditStart}
                    className="px-6 py-3 rounded-lg font-medium text-white transition-all duration-300 hover:scale-105"
                    style={{ backgroundColor: theme.primary }}
                  >
                    Add Information
                  </button>
                </div>
              ) : isEditingInfo ? (
                <form onSubmit={handleUserInfoSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={editingUserInfo.fullName}
                        onChange={(e) => setEditingUserInfo({...editingUserInfo, fullName: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all focus:ring-opacity-50 text-gray-900"
                        style={{ '--tw-ring-color': theme.primary } as React.CSSProperties}
                        placeholder="Enter your full name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                      <input
                        type="email"
                        required
                        value={editingUserInfo.email}
                        onChange={(e) => setEditingUserInfo({...editingUserInfo, email: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all focus:ring-opacity-50 text-gray-900"
                        style={{ '--tw-ring-color': theme.primary } as React.CSSProperties}
                        placeholder="Enter your email"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                      <input
                        type="tel"
                        required
                        value={editingUserInfo.phone}
                        onChange={(e) => setEditingUserInfo({...editingUserInfo, phone: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all focus:ring-opacity-50 text-gray-900"
                        style={{ '--tw-ring-color': theme.primary } as React.CSSProperties}
                        placeholder="Enter your phone number"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Optional Phone</label>
                      <input
                        type="tel"
                        value={editingUserInfo.optionalPhone}
                        onChange={(e) => setEditingUserInfo({...editingUserInfo, optionalPhone: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all focus:ring-opacity-50 text-gray-900"
                        style={{ '--tw-ring-color': theme.primary } as React.CSSProperties}
                        placeholder="Optional phone number"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                    <input
                      type="text"
                      required
                      value={editingUserInfo.address}
                      onChange={(e) => setEditingUserInfo({...editingUserInfo, address: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all focus:ring-opacity-50 text-gray-900"
                      style={{ '--tw-ring-color': theme.primary } as React.CSSProperties}
                      placeholder="Enter your address"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                      <input
                        type="text"
                        required
                        value={editingUserInfo.city}
                        onChange={(e) => setEditingUserInfo({...editingUserInfo, city: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all focus:ring-opacity-50 text-gray-900"
                        style={{ '--tw-ring-color': theme.primary } as React.CSSProperties}
                        placeholder="City"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">State/Region *</label>
                      <input
                        type="text"
                        required
                        value={editingUserInfo.state}
                        onChange={(e) => setEditingUserInfo({...editingUserInfo, state: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all focus:ring-opacity-50 text-gray-900"
                        style={{ '--tw-ring-color': theme.primary } as React.CSSProperties}
                        placeholder="State or Region"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code *</label>
                      <input
                        type="text"
                        required
                        value={editingUserInfo.zipCode}
                        onChange={(e) => setEditingUserInfo({...editingUserInfo, zipCode: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all focus:ring-opacity-50 text-gray-900"
                        style={{ '--tw-ring-color': theme.primary } as React.CSSProperties}
                        placeholder="ZIP Code"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    <select
                      value={editingUserInfo.country}
                      onChange={(e) => setEditingUserInfo({...editingUserInfo, country: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all focus:ring-opacity-50 text-gray-900"
                      style={{ '--tw-ring-color': theme.primary } as React.CSSProperties}
                    >
                      <option value="Tunisia">Tunisia</option>
                      <option value="USA">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="UK">United Kingdom</option>
                      <option value="France">France</option>
                      <option value="Germany">Germany</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div className="flex space-x-4 pt-4">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: theme.primary }}
                    >
                      {isSaving ? 'Saving...' : 'Save Information'}
                    </button>
                    <button
                      type="button"
                      onClick={handleEditCancel}
                      disabled={isSaving}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <p className="text-gray-900 font-medium">{userInfo?.fullName}</p>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <p className="text-gray-900 font-medium">{userInfo?.email}</p>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <p className="text-gray-900 font-medium">{userInfo?.phone}</p>
                    </div>
                    
                    {userInfo?.optionalPhone && (
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Optional Phone</label>
                        <p className="text-gray-900 font-medium">{userInfo.optionalPhone}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <p className="text-gray-900 font-medium">{userInfo?.address}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <p className="text-gray-900 font-medium">{userInfo?.city}</p>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <label className="block text-sm font-medium text-gray-700 mb-1">State/Region</label>
                      <p className="text-gray-900 font-medium">{userInfo?.state}</p>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                      <p className="text-gray-900 font-medium">{userInfo?.zipCode}</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <p className="text-gray-900 font-medium">{userInfo?.country}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      <SuccessNotification
        message="Your information has been updated successfully!"
        isVisible={showSuccessNotification}
        onClose={() => setShowSuccessNotification(false)}
      />
    </div>
  );
}