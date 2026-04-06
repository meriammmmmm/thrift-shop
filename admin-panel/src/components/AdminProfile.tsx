import React, { useState, useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';

interface AdminProfileProps {
  authToken: string;
  user: {
    id: number;
    name: string;
    email: string;
    company?: {
      id: number;
      name: string;
      description?: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      country?: string;
      currency?: string;
      logo?: string;
    };
  };
}

interface CustomSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; group?: string }[];
  placeholder?: string;
  required?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ 
  label, 
  value, 
  onChange, 
  options, 
  placeholder = "Select an option", 
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedOptions = filteredOptions.reduce((acc, option) => {
    const group = option.group || 'Other';
    if (!acc[group]) acc[group] = [];
    acc[group].push(option);
    return acc;
  }, {} as Record<string, typeof options>);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-4 text-left focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all duration-200 flex items-center justify-between hover:border-[var(--color-primary)] hover:shadow-md"
        >
          <span className={selectedOption ? "text-gray-900 font-medium" : "text-gray-500"}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <i className={`fas fa-chevron-down transition-transform duration-200 text-[var(--color-primary)] ${isOpen ? 'rotate-180' : ''}`}></i>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <input
                type="text"
                placeholder="🔍 Search countries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all duration-200"
              />
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {Object.entries(groupedOptions).map(([group, groupOptions]) => (
                <div key={group} className="p-4">
                  <div className="text-xs font-bold text-[var(--color-primary)] mb-3 uppercase tracking-wider">
                    {group}
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {groupOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          onChange(option.value);
                          setIsOpen(false);
                          setSearchTerm('');
                        }}
                        className={`p-3 rounded-lg text-left transition-all duration-200 border-2 ${
                          value === option.value 
                            ? 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] text-white border-[var(--color-primary)] shadow-lg transform scale-105' 
                            : 'bg-gray-50 hover:bg-[var(--color-primary)] hover:text-white border-gray-200 hover:border-[var(--color-primary)] hover:shadow-md hover:transform hover:scale-102'
                        }`}
                      >
                        <div className="font-medium">{option.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              
              {filteredOptions.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <i className="fas fa-search text-2xl mb-2 opacity-50"></i>
                  <div>No countries found</div>
                  <div className="text-sm">Try a different search term</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setIsOpen(false);
            setSearchTerm('');
          }}
        />
      )}
    </div>
  );
};

const API_BASE_URL = 'https://mertrosebackend-meec580k.b4a.run/api';

const AdminProfile: React.FC<AdminProfileProps> = ({ authToken, user }) => {
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    // Admin personal info
    admin_name: user.name || '',
    admin_email: user.email || '',
    admin_password: '',
    confirm_password: '',
    
    // Company info
    company_name: user.company?.name || '',
    company_description: user.company?.description || '',
    company_email: user.company?.email || '',
    company_phone: user.company?.phone || '',
    company_address: user.company?.address || '',
    company_city: user.company?.city || '',
    company_country: user.company?.country || '',
    company_currency: user.company?.currency || 'USD',
    company_logo: user.company?.logo || ''
  });

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
    'HU': { currency: 'HUF', symbol: 'Ft' },
    'RO': { currency: 'RON', symbol: 'lei' },
    'BG': { currency: 'BGN', symbol: 'лв' },
    'HR': { currency: 'EUR', symbol: '€' },
    'SI': { currency: 'EUR', symbol: '€' },
    'SK': { currency: 'EUR', symbol: '€' },
    'EE': { currency: 'EUR', symbol: '€' },
    'LV': { currency: 'EUR', symbol: '€' },
    'LT': { currency: 'EUR', symbol: '€' },
    'FI': { currency: 'EUR', symbol: '€' },
    'AT': { currency: 'EUR', symbol: '€' },
    'BE': { currency: 'EUR', symbol: '€' },
    'LU': { currency: 'EUR', symbol: '€' },
    'IE': { currency: 'EUR', symbol: '€' },
    'PT': { currency: 'EUR', symbol: '€' },
    'GR': { currency: 'EUR', symbol: '€' },
    'CY': { currency: 'EUR', symbol: '€' },
    'MT': { currency: 'EUR', symbol: '€' },
    'BR': { currency: 'BRL', symbol: 'R$' },
    'MX': { currency: 'MXN', symbol: '$' },
    'AR': { currency: 'ARS', symbol: '$' },
    'CL': { currency: 'CLP', symbol: '$' },
    'CO': { currency: 'COP', symbol: '$' },
    'PE': { currency: 'PEN', symbol: 'S/' },
    'IN': { currency: 'INR', symbol: '₹' },
    'CN': { currency: 'CNY', symbol: '¥' },
    'KR': { currency: 'KRW', symbol: '₩' },
    'SG': { currency: 'SGD', symbol: 'S$' },
    'HK': { currency: 'HKD', symbol: 'HK$' },
    'TW': { currency: 'TWD', symbol: 'NT$' },
    'MY': { currency: 'MYR', symbol: 'RM' },
    'TH': { currency: 'THB', symbol: '฿' },
    'ID': { currency: 'IDR', symbol: 'Rp' },
    'PH': { currency: 'PHP', symbol: '₱' },
    'VN': { currency: 'VND', symbol: '₫' },
    'ZA': { currency: 'ZAR', symbol: 'R' },
    'EG': { currency: 'EGP', symbol: 'E£' },
    'NG': { currency: 'NGN', symbol: '₦' },
    'KE': { currency: 'KES', symbol: 'KSh' },
    'MA': { currency: 'MAD', symbol: 'DH' },
    'TN': { currency: 'TND', symbol: 'DT' },
    'AE': { currency: 'AED', symbol: 'د.إ' },
    'SA': { currency: 'SAR', symbol: 'ر.س' },
    'QA': { currency: 'QAR', symbol: 'ر.ق' },
    'KW': { currency: 'KWD', symbol: 'د.ك' },
    'BH': { currency: 'BHD', symbol: '.د.ب' },
    'OM': { currency: 'OMR', symbol: 'ر.ع.' },
    'JO': { currency: 'JOD', symbol: 'د.ا' },
    'LB': { currency: 'LBP', symbol: 'ل.ل' },
    'TR': { currency: 'TRY', symbol: '₺' },
    'RU': { currency: 'RUB', symbol: '₽' },
    'UA': { currency: 'UAH', symbol: '₴' }
  };

  const handleCountryChange = (countryCode: string) => {
    const currencyInfo = countryToCurrency[countryCode];
    setProfileData(prev => ({
      ...prev,
      company_country: countryCode,
      company_currency: currencyInfo ? currencyInfo.currency : 'USD'
    }));
  };

  const getCurrentCurrencySymbol = () => {
    const currencyInfo = countryToCurrency[profileData.company_country];
    return currencyInfo ? currencyInfo.symbol : '$';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setProfileData(prev => ({ ...prev, company_logo: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate password confirmation if password is being changed
      if (profileData.admin_password && profileData.admin_password !== profileData.confirm_password) {
        showError('Error', 'Passwords do not match');
        setLoading(false);
        return;
      }

      // Prepare update data
      const updateData: any = {
        admin_name: profileData.admin_name,
        admin_email: profileData.admin_email,
        company_name: profileData.company_name,
        company_description: profileData.company_description,
        company_email: profileData.company_email,
        company_phone: profileData.company_phone,
        company_address: profileData.company_address,
        company_city: profileData.company_city,
        company_country: profileData.company_country,
        company_currency: profileData.company_currency,
        company_logo: profileData.company_logo
      };

      // Only include password if it's being changed
      if (profileData.admin_password) {
        updateData.admin_password = profileData.admin_password;
      }

      const response = await fetch(`${API_BASE_URL}/admin/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        showSuccess('Success', 'Profile updated successfully!');
        setIsEditing(false);
        // Clear password fields
        setProfileData(prev => ({ ...prev, admin_password: '', confirm_password: '' }));
        
        // Dispatch custom event to notify other components about profile update
        window.dispatchEvent(new CustomEvent('profileUpdated'));
      } else {
        const error = await response.json();
        showError('Error', error.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      showError('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    // Reset form data
    setProfileData({
      admin_name: user.name || '',
      admin_email: user.email || '',
      admin_password: '',
      confirm_password: '',
      company_name: user.company?.name || '',
      company_description: user.company?.description || '',
      company_email: user.company?.email || '',
      company_phone: user.company?.phone || '',
      company_address: user.company?.address || '',
      company_city: user.company?.city || '',
      company_country: user.company?.country || '',
      company_currency: user.company?.currency || 'USD',
      company_logo: user.company?.logo || ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-1">Manage your account and brand information</p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-6 py-3 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
          >
            <i className="fas fa-edit mr-2"></i>
            Edit Profile
          </button>
        ) : (
          <div className="flex space-x-3">
            <button
              onClick={cancelEdit}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200"
            >
              <i className="fas fa-times mr-2"></i>
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save mr-2"></i>
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Brand Overview Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center space-x-6 mb-6">
            {profileData.company_logo ? (
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[var(--color-primary)] shadow-lg">
                <img src={profileData.company_logo} alt="Brand Logo" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] flex items-center justify-center shadow-lg">
                <i className="fas fa-store text-white text-2xl"></i>
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{profileData.company_name || 'Your Brand'}</h2>
              <p className="text-gray-600">{profileData.company_description || 'No description provided'}</p>
              <div className="flex items-center mt-2 text-sm text-gray-500">
                <i className="fas fa-envelope mr-2"></i>
                {profileData.admin_email}
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                <i className="fas fa-image mr-2 text-[var(--color-primary)]"></i>
                Update Brand Logo
              </h3>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg cursor-pointer transition-colors inline-flex items-center"
                >
                  <i className="fas fa-upload mr-2"></i>
                  {profileData.company_logo ? 'Change Logo' : 'Upload Logo'}
                </label>
                <p className="text-sm text-gray-500">PNG, JPG or GIF (recommended: 200x200px)</p>
              </div>
            </div>
          )}
        </div>

        {/* Admin Account Information */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-3">
            <i className="fas fa-user-shield mr-2 text-[var(--color-primary)]"></i>
            Admin Account
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="admin_name"
                  value={profileData.admin_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                  placeholder="Your full name"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">{profileData.admin_name || 'Not provided'}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              {isEditing ? (
                <input
                  type="email"
                  name="admin_email"
                  value={profileData.admin_email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                  placeholder="admin@yourbrand.com"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">{profileData.admin_email}</div>
              )}
            </div>

            {isEditing && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <input
                    type="password"
                    name="admin_password"
                    value={profileData.admin_password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                    placeholder="Leave blank to keep current password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirm_password"
                    value={profileData.confirm_password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                    placeholder="Confirm new password"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Brand Information */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-3">
            <i className="fas fa-store mr-2 text-[var(--color-primary)]"></i>
            Brand Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Brand Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="company_name"
                  value={profileData.company_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                  placeholder="Your brand name"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">{profileData.company_name || 'Not provided'}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Brand Email</label>
              {isEditing ? (
                <input
                  type="email"
                  name="company_email"
                  value={profileData.company_email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                  placeholder="brand@example.com"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">{profileData.company_email || 'Not provided'}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              {isEditing ? (
                <input
                  type="tel"
                  name="company_phone"
                  value={profileData.company_phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                  placeholder="+1-555-0123"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">{profileData.company_phone || 'Not provided'}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              {isEditing ? (
                <input
                  type="text"
                  name="company_address"
                  value={profileData.company_address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                  placeholder="Street address"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">{profileData.company_address || 'Not provided'}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              {isEditing ? (
                <input
                  type="text"
                  name="company_city"
                  value={profileData.company_city}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                  placeholder="City"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">{profileData.company_city || 'Not provided'}</div>
              )}
            </div>

            <div>
              {isEditing ? (
                <CustomSelect
                  label="Country"
                  value={profileData.company_country}
                  onChange={handleCountryChange}
                  placeholder="Select Country"
                  required={false}
                  options={[
                    // North America
                    { value: "US", label: "United States", group: "🌎 North America" },
                    { value: "CA", label: "Canada", group: "🌎 North America" },
                    { value: "MX", label: "Mexico", group: "🌎 North America" },
                    
                    // Europe
                    { value: "GB", label: "United Kingdom", group: "🇪🇺 Europe" },
                    { value: "DE", label: "Germany", group: "🇪🇺 Europe" },
                    { value: "FR", label: "France", group: "🇪🇺 Europe" },
                    { value: "IT", label: "Italy", group: "🇪🇺 Europe" },
                    { value: "ES", label: "Spain", group: "🇪🇺 Europe" },
                    { value: "NL", label: "Netherlands", group: "🇪🇺 Europe" },
                    { value: "CH", label: "Switzerland", group: "🇪🇺 Europe" },
                    { value: "SE", label: "Sweden", group: "🇪🇺 Europe" },
                    { value: "NO", label: "Norway", group: "🇪🇺 Europe" },
                    { value: "DK", label: "Denmark", group: "🇪🇺 Europe" },
                    { value: "PL", label: "Poland", group: "🇪🇺 Europe" },
                    { value: "CZ", label: "Czech Republic", group: "🇪🇺 Europe" },
                    { value: "AT", label: "Austria", group: "🇪🇺 Europe" },
                    { value: "BE", label: "Belgium", group: "🇪🇺 Europe" },
                    { value: "IE", label: "Ireland", group: "🇪🇺 Europe" },
                    { value: "PT", label: "Portugal", group: "🇪🇺 Europe" },
                    { value: "FI", label: "Finland", group: "🇪🇺 Europe" },
                    { value: "GR", label: "Greece", group: "🇪🇺 Europe" },
                    { value: "HU", label: "Hungary", group: "🇪🇺 Europe" },
                    { value: "RO", label: "Romania", group: "🇪🇺 Europe" },
                    { value: "BG", label: "Bulgaria", group: "🇪🇺 Europe" },
                    { value: "HR", label: "Croatia", group: "🇪🇺 Europe" },
                    { value: "SI", label: "Slovenia", group: "🇪🇺 Europe" },
                    { value: "SK", label: "Slovakia", group: "🇪🇺 Europe" },
                    { value: "EE", label: "Estonia", group: "🇪🇺 Europe" },
                    { value: "LV", label: "Latvia", group: "🇪🇺 Europe" },
                    { value: "LT", label: "Lithuania", group: "🇪🇺 Europe" },
                    { value: "LU", label: "Luxembourg", group: "🇪🇺 Europe" },
                    { value: "CY", label: "Cyprus", group: "🇪🇺 Europe" },
                    { value: "MT", label: "Malta", group: "🇪🇺 Europe" },
                    
                    // Asia Pacific
                    { value: "JP", label: "Japan", group: "🌏 Asia Pacific" },
                    { value: "AU", label: "Australia", group: "🌏 Asia Pacific" },
                    { value: "NZ", label: "New Zealand", group: "🌏 Asia Pacific" },
                    { value: "SG", label: "Singapore", group: "🌏 Asia Pacific" },
                    { value: "HK", label: "Hong Kong", group: "🌏 Asia Pacific" },
                    { value: "KR", label: "South Korea", group: "🌏 Asia Pacific" },
                    { value: "CN", label: "China", group: "🌏 Asia Pacific" },
                    { value: "IN", label: "India", group: "🌏 Asia Pacific" },
                    { value: "TH", label: "Thailand", group: "🌏 Asia Pacific" },
                    { value: "MY", label: "Malaysia", group: "🌏 Asia Pacific" },
                    { value: "ID", label: "Indonesia", group: "🌏 Asia Pacific" },
                    { value: "PH", label: "Philippines", group: "🌏 Asia Pacific" },
                    { value: "VN", label: "Vietnam", group: "🌏 Asia Pacific" },
                    { value: "TW", label: "Taiwan", group: "🌏 Asia Pacific" },
                    { value: "BD", label: "Bangladesh", group: "🌏 Asia Pacific" },
                    { value: "PK", label: "Pakistan", group: "🌏 Asia Pacific" },
                    { value: "LK", label: "Sri Lanka", group: "🌏 Asia Pacific" },
                    { value: "MM", label: "Myanmar", group: "🌏 Asia Pacific" },
                    { value: "KH", label: "Cambodia", group: "🌏 Asia Pacific" },
                    { value: "LA", label: "Laos", group: "🌏 Asia Pacific" },
                    { value: "BN", label: "Brunei", group: "🌏 Asia Pacific" },
                    { value: "MN", label: "Mongolia", group: "🌏 Asia Pacific" },
                    
                    // South America
                    { value: "BR", label: "Brazil", group: "🌎 South America" },
                    { value: "AR", label: "Argentina", group: "🌎 South America" },
                    { value: "CL", label: "Chile", group: "🌎 South America" },
                    { value: "CO", label: "Colombia", group: "🌎 South America" },
                    { value: "PE", label: "Peru", group: "🌎 South America" },
                    { value: "VE", label: "Venezuela", group: "🌎 South America" },
                    { value: "EC", label: "Ecuador", group: "🌎 South America" },
                    { value: "UY", label: "Uruguay", group: "🌎 South America" },
                    { value: "PY", label: "Paraguay", group: "🌎 South America" },
                    { value: "BO", label: "Bolivia", group: "🌎 South America" },
                    { value: "GY", label: "Guyana", group: "🌎 South America" },
                    { value: "SR", label: "Suriname", group: "🌎 South America" },
                    
                    // Middle East & Africa
                    { value: "TN", label: "Tunisia", group: "🌍 Middle East & Africa" },
                    { value: "AE", label: "United Arab Emirates", group: "🌍 Middle East & Africa" },
                    { value: "SA", label: "Saudi Arabia", group: "🌍 Middle East & Africa" },
                    { value: "ZA", label: "South Africa", group: "🌍 Middle East & Africa" },
                    { value: "EG", label: "Egypt", group: "🌍 Middle East & Africa" },
                    { value: "MA", label: "Morocco", group: "🌍 Middle East & Africa" },
                    { value: "NG", label: "Nigeria", group: "🌍 Middle East & Africa" },
                    { value: "KE", label: "Kenya", group: "🌍 Middle East & Africa" },
                    { value: "GH", label: "Ghana", group: "🌍 Middle East & Africa" },
                    { value: "ET", label: "Ethiopia", group: "🌍 Middle East & Africa" },
                    { value: "TR", label: "Turkey", group: "🌍 Middle East & Africa" },
                    { value: "JO", label: "Jordan", group: "🌍 Middle East & Africa" },
                    { value: "LB", label: "Lebanon", group: "🌍 Middle East & Africa" },
                    { value: "QA", label: "Qatar", group: "🌍 Middle East & Africa" },
                    { value: "KW", label: "Kuwait", group: "🌍 Middle East & Africa" },
                    { value: "BH", label: "Bahrain", group: "🌍 Middle East & Africa" },
                    { value: "OM", label: "Oman", group: "🌍 Middle East & Africa" }
                  ]}
                />
              ) : (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">{profileData.company_country || 'Not provided'}</div>
                </>
              )}
            </div>

            {/* Currency Display */}
            {isEditing && profileData.company_country && (
              <div className="md:col-span-2">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <i className="fas fa-coins text-blue-600 mr-3 text-lg"></i>
                    <div>
                      <h4 className="font-semibold text-blue-900">Currency Updated</h4>
                      <p className="text-blue-700 text-sm">
                        Your brand will use <strong>{getCurrentCurrencySymbol()} {profileData.company_currency}</strong> for all product pricing
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Brand Description</label>
            {isEditing ? (
              <textarea
                name="company_description"
                value={profileData.company_description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                placeholder="Brief description of your brand"
              />
            ) : (
              <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">{profileData.company_description || 'No description provided'}</div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminProfile;