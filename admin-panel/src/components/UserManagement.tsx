import React, { useState, useEffect } from 'react';
import CreateUser from './CreateUser';
import UserDetails from './UserDetails';
import ConfirmationModal from './ConfirmationModal';
import { useNotifications } from '../hooks/useNotifications';

interface UserManagementProps {
  authToken: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  order_count: number;
  total_spent: number;
  created_at: string;
  profile_picture?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
}

const API_BASE_URL = 'https://mertrosebackend-meec580k.b4a.run/api/';

const UserManagement: React.FC<UserManagementProps> = ({ authToken }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: number; email: string } | null>(null);
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
    if (!showCreateUser) {
      loadUsers();
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
  }, [authToken, showCreateUser]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        const errorData = await response.json();
        console.error('Users API error:', errorData);
      }
    } catch (error) {
      console.error('Users load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: number, userEmail: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        showSuccess('Success', result.message);
        loadUsers();
      } else {
        const error = await response.json();
        showError('Error', error.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Delete user error:', error);
      showError('Error', 'Failed to delete user');
    }
    
    setShowDeleteConfirm(false);
    setUserToDelete(null);
  };

  const handleDeleteClick = (userId: number, userEmail: string) => {
    setUserToDelete({ id: userId, email: userEmail });
    setShowDeleteConfirm(true);
  };

  const viewUserDetails = (userId: number) => {
    setSelectedUserId(userId);
    setShowUserDetails(true);
  };

  const editUser = (userId: number) => {
    setSelectedUserId(userId);
    setShowUserDetails(true);
  };

  const handleUserUpdated = () => {
    loadUsers();
  };

  const handleBackToUsers = () => {
    setShowUserDetails(false);
    setSelectedUserId(null);
    loadUsers();
  };

  // Show UserDetails component if requested
  if (showUserDetails && selectedUserId) {
    return (
      <UserDetails 
        userId={selectedUserId}
        authToken={authToken}
        onBack={handleBackToUsers}
      />
    );
  }

  // Show CreateUser component if requested
  if (showCreateUser) {
    return (
      <CreateUser 
        authToken={authToken} 
        onBack={() => setShowCreateUser(false)} 
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center compact-spacing space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] bg-clip-text text-transparent mb-2">
            User Management
          </h2>
          <p className="text-gray-600">Manage users, view profiles, and track user activity</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setShowCreateUser(true)}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center"
          >
            <i className="fas fa-plus mr-2"></i>Create User
          </button>
          <button 
            onClick={loadUsers}
            className="px-6 py-3 bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--color-primary)] text-white font-semibold rounded-xl hover:from-[var(--color-primary)] hover:to-[var(--color-primary-hover)] shadow-lg hover:shadow-xl transition-all duration-200 flex items-center"
          >
            <i className="fas fa-refresh mr-2"></i>Refresh
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="modern-table">
        <table className="min-w-full">
          <thead className="bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--color-primary)] text-white">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Orders</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Total Spent</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Joined</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
                    <span className="ml-2">Loading users...</span>
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <i className="fas fa-users text-4xl mb-4 text-gray-300"></i>
                    <p className="text-lg font-medium">No users found</p>
                    <p className="text-sm">Create some users to get started</p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-all duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-12 w-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        {user.profile_picture ? (
                          <img 
                            src={user.profile_picture} 
                            alt={user.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <i className="fas fa-user text-gray-400"></i>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900">{user.name || 'No name'}</div>
                        <div className="text-xs text-gray-500">ID: {user.id}</div>
                        {user.phone && (
                          <div className="text-xs text-gray-500">
                            <i className="fas fa-phone mr-1"></i>{user.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{user.email}</div>
                    {user.address && (
                      <div className="text-xs text-gray-500">
                        <i className="fas fa-map-marker-alt mr-1"></i>
                        {user.city ? `${user.city}, ${user.country || ''}` : user.address}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      user.role === 'ADMIN' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.order_count || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getCurrentCurrencySymbol()}{(parseFloat(user.total_spent as any) || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => viewUserDetails(user.id)}
                        className="px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-200 flex items-center"
                        title="View Details"
                      >
                        <i className="fas fa-eye text-sm"></i>
                      </button>
                      <button
                        onClick={() => editUser(user.id)}
                        className="px-3 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700 shadow-md hover:shadow-lg transition-all duration-200 flex items-center"
                        title="Edit User"
                      >
                        <i className="fas fa-edit text-sm"></i>
                      </button>
                      {user.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleDeleteClick(user.id, user.email)}
                          className="px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg transition-all duration-200 flex items-center"
                          title="Delete User"
                        >
                          <i className="fas fa-trash text-sm"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Delete User"
        message={`Are you sure you want to delete user "${userToDelete?.email}"? This action cannot be undone.`}
        confirmText="DELETE USER"
        cancelText="Cancel"
        onConfirm={() => userToDelete && deleteUser(userToDelete.id, userToDelete.email)}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setUserToDelete(null);
        }}
        icon="fas fa-user-times"
        iconColor="text-red-500"
      />
    </div>
  );
};

export default UserManagement;