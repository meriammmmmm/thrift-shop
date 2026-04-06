import React, { useState, useEffect } from 'react';
import ConfirmationModal from './ConfirmationModal';
import { useNotifications } from '../hooks/useNotifications';

interface UserDetailsProps {
  userId: number;
  authToken: string;
  onBack: () => void;
}

interface UserDetails {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
  order_count: number;
  total_spent: number;
  profile_picture?: string;
  // User info fields
  full_name?: string;
  phone?: string;
  optional_phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
}

interface Order {
  id: number;
  total: number;
  status: string;
  created_at: string;
  item_count: number;
}

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_image: string;
  quantity: number;
  price: number;
  size?: string;
}

const API_BASE_URL = 'https://mertrosebackend-meec580k.b4a.run/api/';

const UserDetails: React.FC<UserDetailsProps> = ({ userId, authToken, onBack }) => {
  const [user, setUser] = useState<UserDetails | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserDetails>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>('');
  const [showProducts, setShowProducts] = useState(false);
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
    if (userId) {
      loadUserDetails();
    }
    
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
  }, [userId, authToken]);

  const loadUserDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setOrders(data.orders || []);
        setEditForm(data.user);
      } else {
        showError('Error', 'Failed to load user details');
      }
    } catch (error) {
      console.error('Load user details error:', error);
      showError('Error', 'Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        showSuccess('Success', 'User updated successfully!');
        setIsEditing(false);
        loadUserDetails();
      } else {
        const error = await response.json();
        showError('Error', `Failed to update user: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Update user error:', error);
      showError('Error', 'Failed to update user');
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        showSuccess('Success', 'User deleted successfully!');
        setTimeout(() => onBack(), 1500);
      } else {
        const error = await response.json();
        showError('Error', `Failed to delete user: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Delete user error:', error);
      showError('Error', 'Failed to delete user');
    }
    setShowDeleteConfirm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">User not found</p>
        <button onClick={onBack} className="btn-modern mt-4">
          <i className="fas fa-arrow-left mr-2"></i>Back to Users
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <i className="fas fa-arrow-left text-xl text-gray-600"></i>
          </button>
          <div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] bg-clip-text text-transparent">
              {isEditing ? 'Edit User' : 'User Details'}
            </h2>
            <p className="text-gray-600">View and manage user information</p>
          </div>
        </div>
        <div className="flex space-x-3">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center"
              >
                <i className="fas fa-times mr-2"></i>Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center"
              >
                <i className="fas fa-save mr-2"></i>Save Changes
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center"
              >
                <i className="fas fa-edit mr-2"></i>Edit User
              </button>
              {user.role !== 'ADMIN' && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center"
                >
                  <i className="fas fa-trash mr-2"></i>Delete User
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* User Avatar and Basic Info */}
      <div className="modern-card p-6">
        <div className="flex items-center space-x-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--color-primary)] flex items-center justify-center overflow-hidden">
              {profileImagePreview ? (
                <img src={profileImagePreview} alt="Profile" className="w-full h-full object-cover" />
              ) : user.profile_picture ? (
                <img src={user.profile_picture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <i className="fas fa-user text-white text-3xl"></i>
              )}
            </div>
            {isEditing && (
              <div className="absolute -bottom-2 -right-2">
                <label className="w-8 h-8 bg-[var(--color-primary)] rounded-full flex items-center justify-center cursor-pointer hover:bg-[var(--color-primary-hover)] transition-colors">
                  <i className="fas fa-camera text-white text-sm"></i>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-gray-900">
              {user.name || user.full_name || 'No name'}
            </h3>
            <p className="text-gray-600 text-lg">{user.email}</p>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${
              user.role === 'ADMIN' 
                ? 'bg-purple-100 text-purple-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {user.role}
            </span>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="modern-card p-6">
          <h4 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h4>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={editForm.name || ''}
                  onChange={handleInputChange}
                  className="modern-input w-full"
                />
              ) : (
                <p className="text-gray-900 text-lg">{user.name || 'Not provided'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={editForm.email || ''}
                  onChange={handleInputChange}
                  className="modern-input w-full"
                />
              ) : (
                <p className="text-gray-900 text-lg">{user.email}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              {isEditing ? (
                <select
                  name="role"
                  value={editForm.role || ''}
                  onChange={handleInputChange}
                  className="modern-input w-full"
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              ) : (
                <p className="text-gray-900 text-lg">{user.role}</p>
              )}
            </div>
          </div>
        </div>

        <div className="modern-card p-6">
          <h4 className="text-xl font-semibold text-gray-900 mb-6">Contact Information</h4>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={editForm.phone || ''}
                  onChange={handleInputChange}
                  className="modern-input w-full"
                />
              ) : (
                <p className="text-gray-900 text-lg">{user.phone || 'Not provided'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Alternative Phone</label>
              {isEditing ? (
                <input
                  type="tel"
                  name="optional_phone"
                  value={editForm.optional_phone || ''}
                  onChange={handleInputChange}
                  className="modern-input w-full"
                />
              ) : (
                <p className="text-gray-900 text-lg">{user.optional_phone || 'Not provided'}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div className="modern-card p-6">
        <h4 className="text-xl font-semibold text-gray-900 mb-6">Address Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            {isEditing ? (
              <input
                type="text"
                name="address"
                value={editForm.address || ''}
                onChange={handleInputChange}
                className="modern-input w-full"
              />
            ) : (
              <p className="text-gray-900 text-lg">{user.address || 'Not provided'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
            {isEditing ? (
              <input
                type="text"
                name="city"
                value={editForm.city || ''}
                onChange={handleInputChange}
                className="modern-input w-full"
              />
            ) : (
              <p className="text-gray-900 text-lg">{user.city || 'Not provided'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">State/Province</label>
            {isEditing ? (
              <input
                type="text"
                name="state"
                value={editForm.state || ''}
                onChange={handleInputChange}
                className="modern-input w-full"
              />
            ) : (
              <p className="text-gray-900 text-lg">{user.state || 'Not provided'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
            {isEditing ? (
              <input
                type="text"
                name="country"
                value={editForm.country || ''}
                onChange={handleInputChange}
                className="modern-input w-full"
              />
            ) : (
              <p className="text-gray-900 text-lg">{user.country || 'Not provided'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="modern-card p-6">
        <h4 className="text-xl font-semibold text-gray-900 mb-6">Statistics</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-6 rounded-xl">
            <div className="text-3xl font-bold text-blue-600">{user.order_count || 0}</div>
            <div className="text-blue-600 font-medium">Total Orders</div>
          </div>
          <div className="bg-green-50 p-6 rounded-xl">
            <div className="text-3xl font-bold text-green-600">{getCurrentCurrencySymbol()}{(parseFloat(user.total_spent as any) || 0).toFixed(2)}</div>
            <div className="text-green-600 font-medium">Total Spent</div>
          </div>
          <div className="bg-gray-50 p-6 rounded-xl">
            <div className="text-3xl font-bold text-gray-600">
              {new Date(user.created_at).toLocaleDateString()}
            </div>
            <div className="text-gray-600 font-medium">Member Since</div>
          </div>
        </div>
      </div>

      {/* Products Toggle and Display */}
      <div className="modern-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-xl font-semibold text-gray-900">Order History & Products</h4>
          <label className="flex items-center cursor-pointer">
            <span className="mr-3 text-sm font-medium text-gray-700">Show Products</span>
            <div className="relative">
              <input
                type="checkbox"
                checked={showProducts}
                onChange={(e) => setShowProducts(e.target.checked)}
                className="sr-only"
              />
              <div className={`block w-14 h-8 rounded-full transition-colors ${showProducts ? 'bg-[var(--color-primary)]' : 'bg-gray-300'}`}></div>
              <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${showProducts ? 'transform translate-x-6' : ''}`}></div>
            </div>
          </label>
        </div>

        {showProducts && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <i className="fas fa-shopping-bag text-4xl mb-4 text-gray-300"></i>
                <p>No orders found</p>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-sm font-semibold text-gray-900">Order #{order.id}</span>
                      <span className="ml-3 text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                        order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {order.status}
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        {getCurrentCurrencySymbol()}{parseFloat(order.total as any).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    <i className="fas fa-box mr-1"></i>
                    {order.item_count} {order.item_count === 1 ? 'item' : 'items'}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Delete User"
        message={`Are you sure you want to delete user "${user?.email}"? This action cannot be undone.`}
        confirmText="DELETE USER"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        icon="fas fa-user-times"
        iconColor="text-red-500"
      />
    </div>
  );
};

export default UserDetails;