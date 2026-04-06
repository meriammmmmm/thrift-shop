import React, { useState } from 'react';

interface CompanySignupProps {
  onSignupSuccess: () => void;
  onBackToLogin: () => void;
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

const API_BASE_URL = 'https://thrift-shop-meriammmmmm5582-aytejivo.leapcell.dev/api';

const CompanySignup: React.FC<CompanySignupProps> = ({ onSignupSuccess, onBackToLogin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    'IL': { currency: 'ILS', symbol: '₪' },
    'TR': { currency: 'TRY', symbol: '₺' },
    'RU': { currency: 'RUB', symbol: '₽' },
    'UA': { currency: 'UAH', symbol: '₴' }
  };

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    currency: 'USD',
    admin_email: '',
    admin_password: '',
    admin_name: '',
    logo: ''
  });

  const handleCountryChange = (countryCode: string) => {
    const currencyInfo = countryToCurrency[countryCode];
    setFormData(prev => ({
      ...prev,
      country: countryCode,
      currency: currencyInfo ? currencyInfo.currency : 'USD'
    }));
  };

  const getCurrentCurrencySymbol = () => {
    const currencyInfo = countryToCurrency[formData.country];
    return currencyInfo ? currencyInfo.symbol : '$';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setFormData(prev => ({ ...prev, logo: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate required fields
    if (!formData.logo) {
      setError('Brand logo is required. Please upload your brand logo.');
      setLoading(false);
      return;
    }

    try {
      const registrationData = {
        ...formData,
        commission_rate: 0.05 // Default 5%
      };

      const response = await fetch(`${API_BASE_URL}/companies/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registrationData)
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            {formData.logo ? (
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-green-500 mx-auto mb-4">
                <img src={formData.logo} alt="Brand Logo" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-check text-white text-2xl"></i>
              </div>
            )}
            <h2 className="text-3xl font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] bg-clip-text text-transparent">
              Registration Successful!
            </h2>
            <p className="text-gray-600 mt-4 mb-6">
              Your brand "{formData.name}" has been registered successfully! You can now login to your admin dashboard and start managing your products.
            </p>
            <div className="space-y-3">
              <button
                onClick={onBackToLogin}
                className="w-full px-6 py-3 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
              >
                <i className="fas fa-sign-in-alt mr-2"></i>
                Login to Dashboard
              </button>
              <p className="text-sm text-gray-500">
                Use your admin email and password to access your brand dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          {formData.logo ? (
            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-[var(--color-primary)] mx-auto mb-4">
              <img src={formData.logo} alt="Brand Logo" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-store text-white text-2xl"></i>
            </div>
          )}
          <h2 className="text-3xl font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] bg-clip-text text-transparent">
            {formData.logo && formData.name ? formData.name : 'Register Your Brand'}
          </h2>
          <p className="text-gray-600 mt-2">Join our thrift marketplace and start selling today!</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-2xl p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Brand Information */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2">
                <i className="fas fa-building mr-2 text-[var(--color-primary)]"></i>
                Brand Information
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Brand Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                  placeholder="Your Brand Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                  placeholder="Brief description of your thrift brand"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Brand Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                  placeholder="brand@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                  placeholder="+1-555-0123"
                />
              </div>
            </div>

            {/* Location & Admin */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2">
                <i className="fas fa-map-marker-alt mr-2 text-[var(--color-primary)]"></i>
                Location & Admin Account
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                  placeholder="Street address"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                    placeholder="City"
                  />
                </div>
                <CustomSelect
                  label="Country"
                  value={formData.country}
                  onChange={handleCountryChange}
                  placeholder="Select Country"
                  required={true}
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
              </div>

              {/* Currency Display */}
              {formData.country && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <i className="fas fa-coins text-blue-600 mr-3 text-lg"></i>
                    <div>
                      <h4 className="font-semibold text-blue-900">Default Currency Set</h4>
                      <p className="text-blue-700 text-sm">
                        Your brand will use <strong>{getCurrentCurrencySymbol()} {formData.currency}</strong> for all product pricing
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Admin Account</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Admin Email *</label>
                    <input
                      type="email"
                      name="admin_email"
                      value={formData.admin_email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                      placeholder="admin@yourbrand.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Admin Password *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="admin_password"
                        value={formData.admin_password}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                        placeholder="Strong password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                      >
                        <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Admin Name</label>
                    <input
                      type="text"
                      name="admin_name"
                      value={formData.admin_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                      placeholder="Full name"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Brand Logo - Required */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              <i className="fas fa-image mr-2 text-[var(--color-primary)]"></i>
              Brand Logo *
            </h3>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center space-x-6">
                {formData.logo && (
                  <div className="w-24 h-24 rounded-lg overflow-hidden border-4 border-[var(--color-primary)] shadow-lg">
                    <img src={formData.logo} alt="Logo preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                    required
                  />
                  <label
                    htmlFor="logo-upload"
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] text-white rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg"
                  >
                    <i className="fas fa-upload mr-2"></i>
                    {formData.logo ? 'Change Logo' : 'Upload Logo *'}
                  </label>
                  <p className="text-sm text-gray-600 mt-2">
                    <i className="fas fa-info-circle mr-1 text-[var(--color-primary)]"></i>
                    Required: Upload your brand logo (PNG, JPG, or GIF)
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Recommended: 200x200px or larger, square format</p>
                </div>
              </div>
              {!formData.logo && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center">
                    <i className="fas fa-exclamation-triangle text-yellow-600 mr-2"></i>
                    <p className="text-sm text-yellow-800">
                      Your brand logo is required and will be displayed in your admin dashboard and storefront.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={onBackToLogin}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Login
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <i className="fas fa-rocket mr-2"></i>
                  Register Brand
                </>
              ) : (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
                  Registering...
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanySignup;