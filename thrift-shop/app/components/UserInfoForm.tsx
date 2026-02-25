'use client';

import { useState } from 'react';
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

interface UserInfoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userInfo: UserInfo) => void;
  initialData?: Partial<UserInfo>;
  title?: string;
  isEditing?: boolean;
}

export default function UserInfoForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData = {},
  title = "Informations",
  isEditing = false
}: UserInfoFormProps) {
  const { theme } = useTheme();
  
  const [formData, setFormData] = useState<UserInfo>({
    fullName: initialData.fullName || '',
    email: initialData.email || '',
    phone: initialData.phone || '',
    optionalPhone: initialData.optionalPhone || '',
    address: initialData.address || '',
    city: initialData.city || '',
    state: initialData.state || '',
    zipCode: initialData.zipCode || '',
    country: initialData.country || 'USA',
    profile_picture: initialData.profile_picture || ''
  });

  const [errors, setErrors] = useState<Partial<UserInfo>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileImagePreview, setProfileImagePreview] = useState<string>(initialData.profile_picture || '');

  const validateForm = (): boolean => {
    const newErrors: Partial<UserInfo> = {};

    // Required fields validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Please fill out this field.';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Please fill out this field.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Please fill out this field.';
    } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number.';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Please fill out this field.';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'Please fill out this field.';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'Please fill out this field.';
    }

    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'Please fill out this field.';
    }

    // Optional phone validation (if provided)
    if (formData.optionalPhone.trim() && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.optionalPhone.replace(/[\s\-\(\)]/g, ''))) {
      newErrors.optionalPhone = 'Please enter a valid phone number.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof UserInfo, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProfileImagePreview(result);
        setFormData(prev => ({ ...prev, profile_picture: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
              {isEditing && (
                <p className="text-sm text-gray-600 mt-1">Modify your information below</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Information Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            
            {/* Profile Picture */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photo de profil
              </label>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {profileImagePreview ? (
                      <img 
                        src={profileImagePreview} 
                        alt="Profile Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                  <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Téléchargez votre photo de profil</p>
                  <p className="text-xs text-gray-500">Formats acceptés: JPG, PNG, GIF (max 5MB)</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom et prénom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Nom et prénom"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    errors.fullName 
                      ? 'border-red-500 focus:ring-red-200' 
                      : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                  }`}
                />
                {errors.fullName && (
                  <div className="mt-1 px-2 py-1 bg-gray-800 text-white text-sm rounded">
                    {errors.fullName}
                  </div>
                )}
              </div>

              {/* Phone */}
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Téléphone"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    errors.phone 
                      ? 'border-red-500 focus:ring-red-200' 
                      : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                  }`}
                />
                {errors.phone && (
                  <div className="mt-1 px-2 py-1 bg-gray-800 text-white text-sm rounded">
                    {errors.phone}
                  </div>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="your.email@example.com"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  errors.email 
                    ? 'border-red-500 focus:ring-red-200' 
                    : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                }`}
              />
              {errors.email && (
                <div className="mt-1 px-2 py-1 bg-gray-800 text-white text-sm rounded">
                  {errors.email}
                </div>
              )}
            </div>

            {/* Optional Phone */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone optionnel
              </label>
              <input
                type="tel"
                value={formData.optionalPhone}
                onChange={(e) => handleInputChange('optionalPhone', e.target.value)}
                placeholder="Numéro de téléphone supplémentaire (optionnel)"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  errors.optionalPhone 
                    ? 'border-red-500 focus:ring-red-200' 
                    : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                }`}
              />
              {errors.optionalPhone && (
                <div className="mt-1 px-2 py-1 bg-gray-800 text-white text-sm rounded">
                  {errors.optionalPhone}
                </div>
              )}
            </div>
          </div>

          {/* Delivery Address Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Adresse de livraison</h3>
            
            {/* Address */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Adresse"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  errors.address 
                    ? 'border-red-500 focus:ring-red-200' 
                    : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                }`}
              />
              {errors.address && (
                <div className="mt-1 px-2 py-1 bg-gray-800 text-white text-sm rounded">
                  {errors.address}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ville <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Ville"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    errors.city 
                      ? 'border-red-500 focus:ring-red-200' 
                      : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                  }`}
                />
                {errors.city && (
                  <div className="mt-1 px-2 py-1 bg-gray-800 text-white text-sm rounded">
                    {errors.city}
                  </div>
                )}
              </div>

              {/* State/Province */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gouvernerat <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-black ${
                    errors.state 
                      ? 'border-red-500 focus:ring-red-200' 
                      : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                  }`}
                >
                  <option value="" className="text-gray-400">Gouvernerat</option>
                  <option value="Tunis" className="text-black">Tunis</option>
                  <option value="Ariana" className="text-black">Ariana</option>
                  <option value="Ben Arous" className="text-black">Ben Arous</option>
                  <option value="Manouba" className="text-black">Manouba</option>
                  <option value="Nabeul" className="text-black">Nabeul</option>
                  <option value="Zaghouan" className="text-black">Zaghouan</option>
                  <option value="Bizerte" className="text-black">Bizerte</option>
                  <option value="Béja" className="text-black">Béja</option>
                  <option value="Jendouba" className="text-black">Jendouba</option>
                  <option value="Kef" className="text-black">Kef</option>
                  <option value="Siliana" className="text-black">Siliana</option>
                  <option value="Kairouan" className="text-black">Kairouan</option>
                  <option value="Kasserine" className="text-black">Kasserine</option>
                  <option value="Sidi Bouzid" className="text-black">Sidi Bouzid</option>
                  <option value="Sousse" className="text-black">Sousse</option>
                  <option value="Monastir" className="text-black">Monastir</option>
                  <option value="Mahdia" className="text-black">Mahdia</option>
                  <option value="Sfax" className="text-black">Sfax</option>
                  <option value="Gafsa" className="text-black">Gafsa</option>
                  <option value="Tozeur" className="text-black">Tozeur</option>
                  <option value="Kebili" className="text-black">Kebili</option>
                  <option value="Gabès" className="text-black">Gabès</option>
                  <option value="Médenine" className="text-black">Médenine</option>
                  <option value="Tataouine" className="text-black">Tataouine</option>
                </select>
                {errors.state && (
                  <div className="mt-1 px-2 py-1 bg-gray-800 text-white text-sm rounded">
                    {errors.state}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* ZIP Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code postal <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  placeholder="Code postal"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    errors.zipCode 
                      ? 'border-red-500 focus:ring-red-200' 
                      : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                  }`}
                />
                {errors.zipCode && (
                  <div className="mt-1 px-2 py-1 bg-gray-800 text-white text-sm rounded">
                    {errors.zipCode}
                  </div>
                )}
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pays <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 text-black"
                >
                  <option value="Tunisia" className="text-black">Tunisia</option>
                  <option value="France" className="text-black">France</option>
                  <option value="USA" className="text-black">United States</option>
                  <option value="Canada" className="text-black">Canada</option>
                  <option value="UK" className="text-black">United Kingdom</option>
                  <option value="Germany" className="text-black">Germany</option>
                  <option value="Italy" className="text-black">Italy</option>
                  <option value="Spain" className="text-black">Spain</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 text-white rounded-lg font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: isSubmitting ? '#9ca3af' : theme.primary
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor = theme.primaryHover;
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor = theme.primary;
                }
              }}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {isEditing ? 'Mise à jour...' : 'Enregistrement...'}
                </div>
              ) : (
                isEditing ? 'Mettre à jour' : 'Enregistrer'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}