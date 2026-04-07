import React, { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';

interface CreateUserProps {
  authToken: string;
  onBack: () => void;
}

const API_BASE_URL = 'https://thrift-shop-backend-production-9cad.up.railway.app/api';

const CreateUser: React.FC<CreateUserProps> = ({ authToken, onBack }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER',
    phone: '',
    phone2: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: ''
  });
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>('');
  const { showSuccess, showError } = useNotifications();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        showSuccess('Success', 'User created successfully!');
        setTimeout(() => onBack(), 1500); // Go back to user management after showing success
      } else {
        const error = await response.json();
        showError('Error', `Failed to create user: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Create user error:', error);
      showError('Error', 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'USER',
      phone: '',
      phone2: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: ''
    });
    setProfileImage(null);
    setProfileImagePreview('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between compact-spacing">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] bg-clip-text text-transparent mb-2">
            Create New User
          </h2>
          <p className="text-gray-600">Add a new user to the system with complete information</p>
        </div>
        <button
          onClick={onBack}
          className="btn-modern bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-xl hover:from-gray-600 hover:to-gray-700 flex items-center"
        >
          <i className="fas fa-arrow-left mr-2"></i>Back to Users
        </button>
      </div>

      <div className="modern-card p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Picture</h3>
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--color-primary)] flex items-center justify-center overflow-hidden">
                  {profileImagePreview ? (
                    <img src={profileImagePreview} alt="Profile Preview" className="w-full h-full object-cover" />
                  ) : (
                    <i className="fas fa-user text-white text-3xl"></i>
                  )}
                </div>
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
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Upload a profile picture for the user</p>
                <p className="text-xs text-gray-500">Recommended: Square image, at least 200x200px</p>
                {profileImage && (
                  <p className="text-xs text-green-600 mt-1">
                    <i className="fas fa-check mr-1"></i>
                    {profileImage.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="modern-input w-full"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="modern-input w-full"
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="modern-input w-full"
                  placeholder="Enter password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                  className="modern-input w-full"
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="modern-input w-full"
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Alternative Phone</label>
                <input
                  type="tel"
                  name="phone2"
                  value={formData.phone2}
                  onChange={handleInputChange}
                  className="modern-input w-full"
                  placeholder="Enter alternative phone"
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="modern-input w-full"
                  placeholder="Enter street address"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="modern-input w-full"
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State/Province</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="modern-input w-full"
                    placeholder="Enter state or province"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    className="modern-input w-full"
                    placeholder="Enter postal code"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="modern-input w-full"
                    placeholder="Enter country"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={clearForm}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Clear Form
            </button>
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-modern px-6 py-2 flex items-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <i className="fas fa-user-plus mr-2"></i>
              )}
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUser;