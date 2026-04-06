import React, { useState, useEffect } from 'react';
import ConfirmationModal from './ConfirmationModal';
import { useNotifications } from '../hooks/useNotifications';

interface ProductDetailsProps {
  productId: number;
  authToken: string;
  onBack: () => void;
}

interface ProductDetails {
  id: number;
  name: string;
  brand: string;
  price: number;
  original_price?: number;
  category: string;
  occasions?: string[]; // Array of occasion names
  in_stock: boolean;
  visible?: boolean;
  images?: string[];
  description?: string;
  created_at?: string;
  updated_at?: string;
  size?: string;
  condition?: string;
  country?: string;
  currency?: string;
}

interface CustomSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; group?: string }[];
  placeholder?: string;
  required?: boolean;
  aiLoading?: boolean;
  aiText?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ 
  label, 
  value, 
  onChange, 
  options, 
  placeholder = "Select an option", 
  required = false,
  aiLoading = false,
  aiText = ""
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
        {aiLoading && aiText && (
          <span className="ml-2 text-xs text-purple-600">
            <i className="fas fa-magic animate-pulse mr-1"></i>
            {aiText}
          </span>
        )}
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
                placeholder="🔍 Search options..."
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
                  <div>No options found</div>
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

const ProductDetails: React.FC<ProductDetailsProps> = ({ productId, authToken, onBack }) => {
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<ProductDetails>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [customCategories, setCustomCategories] = useState<Array<{name: string, description?: string, icon?: string}>>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  const [draggedExistingImageIndex, setDraggedExistingImageIndex] = useState<number | null>(null);
  const [companyCurrency, setCompanyCurrency] = useState({ currency: 'USD', symbol: '$' });
  const [occasions, setOccasions] = useState<Array<{id: number, name: string, icon?: string}>>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<number[]>([]);
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

  // Get company currency from API when component loads
  useEffect(() => {
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
  }, [authToken]);

  const getCurrentCurrencySymbol = () => {
    return companyCurrency.symbol;
  };

  useEffect(() => {
    if (productId) {
      loadProductDetails();
      loadCustomCategories();
      loadOccasions();
      loadProductOccasions();
    }
  }, [productId]);

  const loadCustomCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/categories`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCustomCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Failed to load custom categories:', error);
    }
  };

  const loadProductDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Ensure price is a number
        if (data.price !== undefined && data.price !== null) {
          data.price = parseFloat(data.price);
        }
        setProduct(data);
        setEditForm(data);
        // Set existing images as URLs for editing
        if (data.images && data.images.length > 0) {
          setImageUrls(data.images.join('\n'));
        }
      } else {
        showError('Error', 'Failed to load product details');
      }
    } catch (error) {
      console.error('Load product details error:', error);
      showError('Error', 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const loadOccasions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const companyId = data.user.admin_company_id;
        
        const categoriesResponse = await fetch(`${API_BASE_URL}/admin/categories/public/${companyId}`);
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setOccasions(categoriesData.categories || []);
        }
      }
    } catch (error) {
      console.error('Failed to load occasions:', error);
    }
  };

  const loadProductOccasions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/products/${productId}/categories`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const categoryIds = data.categories.map((cat: any) => cat.id);
        setSelectedOccasions(categoryIds);
      }
    } catch (error) {
      console.error('Failed to load product occasions:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  // Compress image to reduce size while maintaining quality
  const compressImage = (file: File, maxSizeKB: number = 800): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions (max 1920px on longest side for better quality)
          const maxDimension = 1920;
          if (width > height && width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          
          // Enable image smoothing for better quality
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          
          // Start with higher quality and reduce if needed
          let quality = 0.92;
          let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          
          // Reduce quality until size is acceptable, but don't go below 0.6 (60%)
          while (compressedDataUrl.length > maxSizeKB * 1024 && quality > 0.6) {
            quality -= 0.05;
            compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          }
          
          const sizeKB = (compressedDataUrl.length / 1024).toFixed(2);
          console.log(`🖼️ Compressed image: ${sizeKB} KB (quality: ${(quality * 100).toFixed(0)}%)`);
          
          resolve(compressedDataUrl);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const currentPreviewCount = imagePreviews.length;
    
    if (files.length === 0) return;
    
    // Show loading state
    showSuccess('Processing', `Compressing ${files.length} image(s)...`);
    
    setSelectedImages(prev => [...prev, ...files]);
    
    // Process each file with compression
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      try {
        const compressedImage = await compressImage(file, 800); // Max 800KB per image for better quality
        
        setImagePreviews(prev => {
          const newPreviews = [...prev, compressedImage];
          
          // Trigger AI generation automatically for the VERY FIRST uploaded image only
          if (currentPreviewCount === 0 && index === 0) {
            setTimeout(() => {
              generateAIDescriptionFromImage(compressedImage);
            }, 500);
          }
          
          return newPreviews;
        });
      } catch (error) {
        console.error('Image compression error:', error);
        showError('Error', `Failed to compress image: ${file.name}`);
      }
    }
    
    // Reset the input so the same file can be selected again if needed
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageDragStart = (index: number) => {
    setDraggedImageIndex(index);
  };

  const handleImageDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedImageIndex === null || draggedImageIndex === index) return;

    const newPreviews = [...imagePreviews];
    const newFiles = [...selectedImages];
    
    const draggedPreview = newPreviews[draggedImageIndex];
    const draggedFile = newFiles[draggedImageIndex];
    
    newPreviews.splice(draggedImageIndex, 1);
    newPreviews.splice(index, 0, draggedPreview);
    
    newFiles.splice(draggedImageIndex, 1);
    newFiles.splice(index, 0, draggedFile);

    setImagePreviews(newPreviews);
    setSelectedImages(newFiles);
    setDraggedImageIndex(index);
  };

  const handleImageDragEnd = () => {
    setDraggedImageIndex(null);
  };

  const handleExistingImageDragStart = (index: number) => {
    setDraggedExistingImageIndex(index);
  };

  const handleExistingImageDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedExistingImageIndex === null || draggedExistingImageIndex === index) return;

    if (!product || !product.images) return;

    const newImages = [...product.images];
    const draggedImage = newImages[draggedExistingImageIndex];
    
    newImages.splice(draggedExistingImageIndex, 1);
    newImages.splice(index, 0, draggedImage);

    setProduct(prev => prev ? { ...prev, images: newImages } : null);
    setImageUrls(newImages.join('\n'));
    setDraggedExistingImageIndex(index);
  };

  const handleExistingImageDragEnd = () => {
    setDraggedExistingImageIndex(null);
  };

  const generateAIDescriptionFromImage = async (imageBase64: string) => {
    setAiLoading(true);
    try {
      const requestData = {
        image: imageBase64,
        productName: '', // Empty - let AI generate the name
        category: '',
        brand: '',
        additionalInfo: ''
      };

      const response = await fetch(`${API_BASE_URL}/admin/ai/generate-description`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const result = await response.json();
        const aiData = result.data;

        // Update form with image analyser output
        const desc = aiData.style_notes
          ? `${aiData.description || ''}\n\nStyle notes: ${aiData.style_notes}`.trim()
          : (aiData.description || '');
        setEditForm(prev => ({
          ...prev,
          name: aiData.title || prev.name,
          description: desc || prev.description,
          condition: aiData.condition || prev.condition,
          category: aiData.category_suggestion || prev.category,
          brand: aiData.brand_suggestion || prev.brand,
          size: aiData.size_suggestion || prev.size,
          price: aiData.suggested_price_min != null ? aiData.suggested_price_min : prev.price
        }));

        showSuccess('Success', '🤖 Image analyser: AI analyzed your photo and updated product details!');
      } else {
        const error = await response.json();
        showError('Error', `Failed to analyze image: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('AI image analysis error:', error);
      showError('Error', 'Failed to analyze image with AI');
    } finally {
      setAiLoading(false);
    }
  };

  const generateAIDescription = async () => {
    if (!imagePreviews[0] && !editForm.name) {
      showError('Error', 'Please upload an image or enter a product name to generate AI description');
      return;
    }

    if (imagePreviews[0]) {
      // Use the image-based generation
      await generateAIDescriptionFromImage(imagePreviews[0]);
    } else {
      // Use text-based generation
      setAiLoading(true);
      try {
        const requestData = {
          image: null,
          productName: editForm.name,
          category: editForm.category,
          brand: editForm.brand,
          additionalInfo: `Current description: ${editForm.description}`
        };

        const response = await fetch(`${API_BASE_URL}/admin/ai/generate-description`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(requestData)
        });

        if (response.ok) {
          const result = await response.json();
          const aiData = result.data;

          // Update form with AI-generated data
          const textDesc = aiData.style_notes
            ? `${aiData.description || ''}\n\nStyle notes: ${aiData.style_notes}`.trim()
            : (aiData.description || '');
          setEditForm(prev => ({
            ...prev,
            name: aiData.title || prev.name,
            description: textDesc || prev.description,
            condition: aiData.condition || prev.condition,
            category: aiData.category_suggestion || prev.category,
            brand: aiData.brand_suggestion || prev.brand,
            size: aiData.size_suggestion || prev.size,
            price: aiData.suggested_price_min != null ? aiData.suggested_price_min : prev.price
          }));

          showSuccess('Success', 'AI description generated successfully!');
        } else {
          const error = await response.json();
          showError('Error', `Failed to generate AI description: ${error.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('AI generation error:', error);
        showError('Error', 'Failed to generate AI description');
      } finally {
        setAiLoading(false);
      }
    }
  };

  const handleSave = async () => {
    try {
      // Process URL-based images
      const urlImages = imageUrls
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);

      // Process uploaded files (convert to base64)
      const uploadedImages: string[] = [];
      for (const file of selectedImages) {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
        uploadedImages.push(base64);
      }

      // Combine both URL images and uploaded images
      const allImages = [...urlImages, ...uploadedImages];

      const updatedForm = {
        ...editForm,
        images: allImages.length > 0 ? allImages : editForm.images
      };

      const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(updatedForm)
      });

      if (response.ok) {
        // Get current occasions for this product
        const currentOccasionsResponse = await fetch(`${API_BASE_URL}/admin/products/${productId}/categories`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        const currentOccasionsData = await currentOccasionsResponse.json();
        const currentOccasionIds = currentOccasionsData.categories?.map((c: any) => c.id) || [];
        
        // Determine which occasions to add and which to remove
        const occasionsToAdd = selectedOccasions.filter(id => !currentOccasionIds.includes(id));
        const occasionsToRemove = currentOccasionIds.filter((id: number) => !selectedOccasions.includes(id));
        
        let occasionsSaved = 0;
        let occasionsFailed = 0;
        
        // Add product to new occasions
        for (const occasionId of occasionsToAdd) {
          try {
            // Get current products in this occasion
            const categoryResponse = await fetch(`${API_BASE_URL}/admin/categories/${occasionId}`, {
              headers: {
                'Authorization': `Bearer ${authToken}`
              }
            });
            
            if (categoryResponse.ok) {
              const categoryData = await categoryResponse.json();
              const currentProductIds = categoryData.category?.product_ids || [];
              
              // Add this product to the list
              const updatedProductIds = [...currentProductIds, Number(productId)];
              
              // Update the category with the new product list
              const assignResponse = await fetch(`${API_BASE_URL}/admin/categories/${occasionId}/products`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ productIds: updatedProductIds })
              });

              if (assignResponse.ok) {
                occasionsSaved++;
              } else {
                occasionsFailed++;
                console.error(`Failed to assign product to occasion ${occasionId}`);
              }
            }
          } catch (err) {
            occasionsFailed++;
            console.error(`Error assigning product to occasion ${occasionId}:`, err);
          }
        }
        
        // Remove product from unselected occasions
        for (const occasionId of occasionsToRemove) {
          try {
            // Get current products in this occasion
            const categoryResponse = await fetch(`${API_BASE_URL}/admin/categories/${occasionId}`, {
              headers: {
                'Authorization': `Bearer ${authToken}`
              }
            });
            
            if (categoryResponse.ok) {
              const categoryData = await categoryResponse.json();
              const currentProductIds = categoryData.category?.product_ids || [];
              
              // Remove this product from the list
              const updatedProductIds = currentProductIds.filter((id: number) => id !== Number(productId));
              
              // Update the category with the new product list
              const assignResponse = await fetch(`${API_BASE_URL}/admin/categories/${occasionId}/products`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ productIds: updatedProductIds })
              });

              if (!assignResponse.ok) {
                console.error(`Failed to remove product from occasion ${occasionId}`);
              }
            }
          } catch (err) {
            console.error(`Error removing product from occasion ${occasionId}:`, err);
          }
        }

        if (occasionsFailed > 0) {
          showSuccess('Partial Success', `Product updated! ${occasionsSaved} occasions assigned, ${occasionsFailed} failed.`);
        } else if (occasionsToAdd.length > 0 || occasionsToRemove.length > 0) {
          showSuccess('Success', `Product updated! Occasions updated successfully.`);
        } else {
          showSuccess('Success', 'Product updated successfully!');
        }
        
        setIsEditing(false);
        // Clear upload states
        setSelectedImages([]);
        setImagePreviews([]);
        loadProductDetails();
      } else {
        const error = await response.json();
        showError('Error', `Failed to update product: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Update product error:', error);
      showError('Error', 'Failed to update product');
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        showSuccess('Success', 'Product deleted successfully!');
        setTimeout(() => onBack(), 1500);
      } else {
        const error = await response.json();
        showError('Error', `Failed to delete product: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Delete product error:', error);
      showError('Error', 'Failed to delete product');
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

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Product not found</p>
        <button onClick={onBack} className="btn-modern mt-4">
          <i className="fas fa-arrow-left mr-2"></i>Back to Products
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
              {isEditing ? 'Edit Product' : 'Product Details'}
            </h2>
            <p className="text-gray-600">View and manage product information</p>
          </div>
        </div>
        <div className="flex space-x-3">
          {isEditing ? (
            <>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setSelectedImages([]);
                  setImagePreviews([]);
                  setImageUrls(product?.images?.join('\n') || '');
                }}
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
                <i className="fas fa-edit mr-2"></i>Edit Product
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center"
              >
                <i className="fas fa-trash mr-2"></i>Delete Product
              </button>
            </>
          )}
        </div>
      </div>

      {/* Product Image and Basic Info */}
      <div className="modern-card p-6">
        <div className="flex items-center space-x-6">
          <div className="w-24 h-24 bg-gray-200 rounded-xl overflow-hidden flex-shrink-0">
            {product.images && product.images.length > 0 ? (
              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <i className="fas fa-image text-gray-400 text-3xl"></i>
              </div>
            )}
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-gray-900">
              {product.name || 'Unnamed Product'}
            </h3>
            <p className="text-gray-600 text-lg">{product.brand || 'No Brand'}</p>
            <div className="flex items-center space-x-3 mt-2">
              {isEditing ? (
                <>
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-500 mb-1">Original Price</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                        {getCurrentCurrencySymbol()}
                      </span>
                      <input
                        type="number"
                        name="original_price"
                        value={editForm.original_price || ''}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="w-32 pl-6 pr-2 py-1 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-500 mb-1">Current Price</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                        {getCurrentCurrencySymbol()}
                      </span>
                      <input
                        type="number"
                        name="price"
                        value={editForm.price || 0}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        className="w-32 pl-6 pr-2 py-1 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {product.original_price && parseFloat(product.original_price as any) > 0 && (
                    <span className="text-lg text-gray-400 line-through">{getCurrentCurrencySymbol()}{(parseFloat(product.original_price as any) || 0).toFixed(2)}</span>
                  )}
                  <span className="text-2xl font-bold text-green-600">{getCurrentCurrencySymbol()}{(parseFloat(product.price as any) || 0).toFixed(2)}</span>
                </>
              )}
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                product.in_stock !== false 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {product.in_stock !== false ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="modern-card p-6">
          <h4 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h4>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name
                {aiLoading && (
                  <span className="ml-2 text-xs text-purple-600">
                    <i className="fas fa-magic animate-pulse mr-1"></i>
                    AI updating...
                  </span>
                )}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={editForm.name || ''}
                  onChange={handleInputChange}
                  className="modern-input w-full"
                />
              ) : (
                <p className="text-gray-900 text-lg">{product.name || 'Not provided'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
              {isEditing ? (
                <input
                  type="text"
                  name="brand"
                  value={editForm.brand || ''}
                  onChange={handleInputChange}
                  className="modern-input w-full"
                />
              ) : (
                <p className="text-gray-900 text-lg">{product.brand || 'Not provided'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
                {aiLoading && (
                  <span className="ml-2 text-xs text-purple-600">
                    <i className="fas fa-magic animate-pulse mr-1"></i>
                    AI detecting...
                  </span>
                )}
              </label>
              {isEditing ? (
                <CustomSelect
                  label=""
                  value={editForm.category || ''}
                  onChange={(value) => setEditForm(prev => ({ ...prev, category: value }))}
                  placeholder="Select Category"
                  aiLoading={aiLoading}
                  aiText="AI detecting..."
                  options={[
                    // Clothing
                    { value: "Jackets", label: "🧥 Jackets & Coats", group: "👕 Clothing" },
                    { value: "Dresses", label: "👗 Dresses", group: "👕 Clothing" },
                    { value: "Jeans", label: "👖 Jeans & Pants", group: "👕 Clothing" },
                    { value: "Sweaters", label: "🧶 Sweaters & Knitwear", group: "👕 Clothing" },
                    { value: "Tops", label: "👚 Tops & Blouses", group: "👕 Clothing" },
                    { value: "Skirts", label: "🩱 Skirts", group: "👕 Clothing" },
                    { value: "Suits", label: "🤵 Suits & Formal", group: "👕 Clothing" },
                    { value: "Activewear", label: "🏃 Activewear & Sports", group: "👕 Clothing" },
                    
                    // Footwear
                    { value: "Sneakers", label: "👟 Sneakers", group: "👠 Footwear" },
                    { value: "Boots", label: "🥾 Boots", group: "👠 Footwear" },
                    { value: "Heels", label: "👠 Heels & Pumps", group: "👠 Footwear" },
                    { value: "Flats", label: "🥿 Flats & Loafers", group: "👠 Footwear" },
                    { value: "Sandals", label: "👡 Sandals", group: "👠 Footwear" },
                    
                    // Accessories
                    { value: "Bags", label: "👜 Bags & Purses", group: "👜 Accessories" },
                    { value: "Jewelry", label: "💍 Jewelry", group: "👜 Accessories" },
                    { value: "Watches", label: "⌚ Watches", group: "👜 Accessories" },
                    { value: "Sunglasses", label: "🕶️ Sunglasses", group: "👜 Accessories" },
                    { value: "Belts", label: "🔗 Belts", group: "👜 Accessories" },
                    { value: "Scarves", label: "🧣 Scarves & Wraps", group: "👜 Accessories" },
                    { value: "Hats", label: "🎩 Hats & Caps", group: "👜 Accessories" },
                    
                    // Electronics
                    { value: "Phones", label: "📱 Phones & Tablets", group: "📱 Electronics" },
                    { value: "Headphones", label: "🎧 Headphones & Audio", group: "📱 Electronics" },
                    { value: "Cameras", label: "📷 Cameras", group: "📱 Electronics" },
                    
                    // Other
                    { value: "Books", label: "📚 Books", group: "🏠 Other" },
                    { value: "Home", label: "🏠 Home Decor", group: "🏠 Other" },
                    { value: "Vintage", label: "🕰️ Vintage Items", group: "🏠 Other" },
                    { value: "Other", label: "🔖 Other", group: "🏠 Other" }
                  ]}
                />
              ) : (
                <p className="text-gray-900 text-lg">{product.category || 'Not categorized'}</p>
              )}
            </div>

            {/* Occasions/Categories Multi-Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Occasions (Select all that apply)
              </label>
              {isEditing ? (
                <div className="border-2 border-gray-200 rounded-xl p-4 bg-gray-50 max-h-64 overflow-y-auto">
                  {occasions.length > 0 ? (
                    <div className="space-y-2">
                      {occasions.map((occasion) => (
                        <label
                          key={occasion.id}
                          className="flex items-center p-3 bg-white rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-gray-200"
                        >
                          <input
                            type="checkbox"
                            checked={selectedOccasions.includes(occasion.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedOccasions(prev => [...prev, occasion.id]);
                              } else {
                                setSelectedOccasions(prev => prev.filter(id => id !== occasion.id));
                              }
                            }}
                            className="w-4 h-4 text-[var(--color-primary)] border-gray-300 rounded focus:ring-[var(--color-primary)]"
                          />
                          <div className="ml-3 flex items-center">
                            {occasion.icon && <span className="text-lg mr-2">{occasion.icon}</span>}
                            <span className="text-sm font-medium text-gray-900">{occasion.name}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No occasions available. Create occasions in Category Management first.
                    </p>
                  )}
                  {occasions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        {selectedOccasions.length} occasion(s) selected
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedOccasions.length > 0 ? (
                    occasions
                      .filter(occ => selectedOccasions.includes(occ.id))
                      .map(occ => (
                        <span key={occ.id} className="px-3 py-1 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-full text-sm font-medium">
                          {occ.icon} {occ.name}
                        </span>
                      ))
                  ) : (
                    <p className="text-gray-500">No occasions assigned</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modern-card p-6">
          <h4 className="text-xl font-semibold text-gray-900 mb-6">Pricing & Availability</h4>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price ({getCurrentCurrencySymbol()})</label>
              {isEditing ? (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                    {getCurrentCurrencySymbol()}
                  </span>
                  <input
                    type="number"
                    name="price"
                    value={editForm.price || 0}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="modern-input w-full pl-8"
                  />
                </div>
              ) : (
                <p className="text-gray-900 text-lg">{getCurrentCurrencySymbol()}{(parseFloat(product.price as any) || 0).toFixed(2)}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Currency: {companyCurrency.currency}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Original Price ({getCurrentCurrencySymbol()}) <span className="text-gray-400 text-xs">(Optional)</span></label>
              {isEditing ? (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                    {getCurrentCurrencySymbol()}
                  </span>
                  <input
                    type="number"
                    name="original_price"
                    value={editForm.original_price || ''}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    placeholder="Leave empty if no discount"
                    className="modern-input w-full pl-8"
                  />
                </div>
              ) : (
                <p className="text-gray-900 text-lg">
                  {product.original_price ? (
                    <span className="line-through text-gray-500">{getCurrentCurrencySymbol()}{(parseFloat(product.original_price as any) || 0).toFixed(2)}</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stock Status</label>
              {isEditing ? (
                <CustomSelect
                  label=""
                  value={editForm.in_stock ? 'true' : 'false'}
                  onChange={(value) => setEditForm(prev => ({ ...prev, in_stock: value === 'true' }))}
                  placeholder="Select Stock Status"
                  options={[
                    { value: "true", label: "✅ In Stock (Available for purchase)", group: "Stock Status" },
                    { value: "false", label: "❌ Out of Stock (Sold or unavailable)", group: "Stock Status" }
                  ]}
                />
              ) : (
                <p className="text-gray-900 text-lg">{product.in_stock !== false ? 'In Stock' : 'Out of Stock'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
              {isEditing ? (
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setEditForm(prev => ({ ...prev, visible: !prev.visible }))}
                    className={`relative inline-flex h-10 w-20 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      editForm.visible !== false
                        ? 'bg-gradient-to-r from-green-500 to-green-600 focus:ring-green-500' 
                        : 'bg-gray-300 focus:ring-gray-400'
                    }`}
                  >
                    <span
                      className={`inline-block h-8 w-8 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                        editForm.visible !== false ? 'translate-x-11' : 'translate-x-1'
                      }`}
                    >
                      <i className={`fas ${editForm.visible !== false ? 'fa-check' : 'fa-times'} text-sm flex items-center justify-center h-full ${
                        editForm.visible !== false ? 'text-green-600' : 'text-gray-400'
                      }`}></i>
                    </span>
                  </button>
                  <span className="text-gray-700">
                    {editForm.visible !== false ? (
                      <><i className="fas fa-eye text-green-600 mr-1"></i>Visible to customers</>
                    ) : (
                      <><i className="fas fa-eye-slash text-gray-400 mr-1"></i>Hidden (draft)</>
                    )}
                  </span>
                </div>
              ) : (
                <p className="text-gray-900 text-lg">
                  {product.visible !== false ? (
                    <><i className="fas fa-eye text-green-600 mr-2"></i>Visible</>
                  ) : (
                    <><i className="fas fa-eye-slash text-gray-400 mr-2"></i>Hidden</>
                  )}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product ID</label>
              <p className="text-gray-900 text-lg">#{product.id}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size
                {aiLoading && isEditing && (
                  <span className="ml-2 text-xs text-purple-600">
                    <i className="fas fa-magic animate-pulse mr-1"></i>
                    AI detecting...
                  </span>
                )}
              </label>
              {isEditing ? (
                <CustomSelect
                  label=""
                  value={editForm.size || ''}
                  onChange={(value) => setEditForm(prev => ({ ...prev, size: value }))}
                  placeholder="Select Size"
                  aiLoading={aiLoading}
                  aiText="AI detecting..."
                  options={[
                    // Clothing Sizes
                    { value: "XXS", label: "XXS (Extra Extra Small)", group: "👕 Clothing Sizes" },
                    { value: "XS", label: "XS (Extra Small)", group: "👕 Clothing Sizes" },
                    { value: "S", label: "S (Small)", group: "👕 Clothing Sizes" },
                    { value: "M", label: "M (Medium)", group: "👕 Clothing Sizes" },
                    { value: "L", label: "L (Large)", group: "👕 Clothing Sizes" },
                    { value: "XL", label: "XL (Extra Large)", group: "👕 Clothing Sizes" },
                    { value: "XXL", label: "XXL (Extra Extra Large)", group: "👕 Clothing Sizes" },
                    { value: "XXXL", label: "XXXL (3X Large)", group: "👕 Clothing Sizes" },
                    
                    // Pants & Jeans
                    { value: "26", label: "26\" Waist", group: "👖 Pants & Jeans (Waist)" },
                    { value: "28", label: "28\" Waist", group: "👖 Pants & Jeans (Waist)" },
                    { value: "30", label: "30\" Waist", group: "👖 Pants & Jeans (Waist)" },
                    { value: "32", label: "32\" Waist", group: "👖 Pants & Jeans (Waist)" },
                    { value: "34", label: "34\" Waist", group: "👖 Pants & Jeans (Waist)" },
                    { value: "36", label: "36\" Waist", group: "👖 Pants & Jeans (Waist)" },
                    { value: "38", label: "38\" Waist", group: "👖 Pants & Jeans (Waist)" },
                    { value: "40", label: "40\" Waist", group: "👖 Pants & Jeans (Waist)" },
                    { value: "42", label: "42\" Waist", group: "👖 Pants & Jeans (Waist)" },
                    
                    // Shoe Sizes
                    { value: "5", label: "US 5", group: "👠 Shoe Sizes (US)" },
                    { value: "5.5", label: "US 5.5", group: "👠 Shoe Sizes (US)" },
                    { value: "6", label: "US 6", group: "👠 Shoe Sizes (US)" },
                    { value: "6.5", label: "US 6.5", group: "👠 Shoe Sizes (US)" },
                    { value: "7", label: "US 7", group: "👠 Shoe Sizes (US)" },
                    { value: "7.5", label: "US 7.5", group: "👠 Shoe Sizes (US)" },
                    { value: "8", label: "US 8", group: "👠 Shoe Sizes (US)" },
                    { value: "8.5", label: "US 8.5", group: "👠 Shoe Sizes (US)" },
                    { value: "9", label: "US 9", group: "👠 Shoe Sizes (US)" },
                    { value: "9.5", label: "US 9.5", group: "👠 Shoe Sizes (US)" },
                    { value: "10", label: "US 10", group: "👠 Shoe Sizes (US)" },
                    { value: "10.5", label: "US 10.5", group: "👠 Shoe Sizes (US)" },
                    { value: "11", label: "US 11", group: "👠 Shoe Sizes (US)" },
                    { value: "11.5", label: "US 11.5", group: "👠 Shoe Sizes (US)" },
                    { value: "12", label: "US 12", group: "👠 Shoe Sizes (US)" },
                    { value: "13", label: "US 13", group: "👠 Shoe Sizes (US)" },
                    
                    // Other
                    { value: "One Size", label: "One Size Fits All", group: "🔖 Other" },
                    { value: "Adjustable", label: "Adjustable", group: "🔖 Other" },
                    { value: "Custom", label: "Custom Size", group: "🔖 Other" }
                  ]}
                />
              ) : (
                <p className="text-gray-900 text-lg">{(editForm.size || product.size) || 'Not specified'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Condition
                {aiLoading && isEditing && (
                  <span className="ml-2 text-xs text-purple-600">
                    <i className="fas fa-magic animate-pulse mr-1"></i>
                    AI detecting...
                  </span>
                )}
              </label>
              {isEditing ? (
                <CustomSelect
                  label=""
                  value={editForm.condition || ''}
                  onChange={(value) => setEditForm(prev => ({ ...prev, condition: value }))}
                  placeholder="Select Condition"
                  aiLoading={aiLoading}
                  aiText="AI detecting..."
                  options={[
                    { value: "New with Tags", label: "✨ New with Tags (Never worn, original tags)", group: "Condition" },
                    { value: "Like New", label: "🌟 Like New (Excellent condition, barely used)", group: "Condition" },
                    { value: "Excellent", label: "⭐ Excellent (Minor signs of wear)", group: "Condition" },
                    { value: "Very Good", label: "👍 Very Good (Light wear, well maintained)", group: "Condition" },
                    { value: "Good", label: "👌 Good (Normal wear, some signs of use)", group: "Condition" },
                    { value: "Fair", label: "⚠️ Fair (Noticeable wear, still functional)", group: "Condition" },
                    { value: "Vintage", label: "🕰️ Vintage (Shows age but authentic character)", group: "Condition" }
                  ]}
                />
              ) : (
                <p className="text-gray-900 text-lg">{(editForm.condition || product.condition) || 'Not specified'}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="modern-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-xl font-semibold text-gray-900">Description</h4>
          {isEditing && (
            <button
              type="button"
              onClick={generateAIDescription}
              disabled={aiLoading}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-purple-600 hover:to-purple-700 shadow-md hover:shadow-lg transition-all duration-200 flex items-center"
            >
              {aiLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <i className="fas fa-magic mr-2"></i>
                  Generate with AI
                </>
              )}
            </button>
          )}
        </div>
        {isEditing ? (
          <div>
            <textarea
              name="description"
              value={editForm.description || ''}
              onChange={handleInputChange}
              rows={6}
              className="modern-input w-full"
              placeholder="Upload a photo above and AI will automatically generate a description!"
            />
            <p className="text-xs text-gray-500 mt-1">
              <i className="fas fa-lightbulb text-yellow-500 mr-1"></i>
              <strong>Auto-AI:</strong> Upload a product photo and AI will instantly update the description and other details!
            </p>
          </div>
        ) : (
          <div className="text-gray-900 text-lg bg-gray-50 p-6 rounded-xl">
            {product.description || 'No description provided'}
          </div>
        )}
      </div>

      {/* Image Upload Section - Only show in edit mode */}
      {isEditing && (
        <div className="modern-card p-6">
          <h4 className="text-xl font-semibold text-gray-900 mb-6">
            <i className="fas fa-images mr-2 text-blue-500"></i>
            Update Product Images
          </h4>
          
          {/* File Upload - Multiple Images Supported */}
          <div className="mb-4">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {aiLoading ? (
                  <>
                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p className="text-sm text-purple-600 font-medium">AI is analyzing your photo...</p>
                    <p className="text-xs text-gray-500">Updating product details automatically</p>
                  </>
                ) : (
                  <>
                    <i className="fas fa-cloud-upload-alt text-gray-400 text-2xl mb-2"></i>
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload additional images</span> (multiple supported)
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF - Auto-compressed to ~800KB each (high quality)</p>
                    <p className="text-xs text-purple-600 mt-1">
                      <i className="fas fa-magic mr-1"></i>
                      First new image: AI will analyze and update details!
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      <i className="fas fa-images mr-1"></i>
                      Additional images: Will be added to product gallery
                    </p>
                  </>
                )}
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                disabled={aiLoading}
              />
            </label>
          </div>

          {/* New Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-sm font-medium text-gray-700">
                  <i className="fas fa-plus-circle mr-2 text-green-500"></i>
                  New Images to Add ({imagePreviews.length})
                </h5>
                <button
                  type="button"
                  onClick={() => {
                    setImagePreviews([]);
                    setSelectedImages([]);
                  }}
                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  <i className="fas fa-trash mr-1"></i>Clear All New
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div 
                    key={index} 
                    className="relative group cursor-move"
                    draggable
                    onDragStart={() => handleImageDragStart(index)}
                    onDragOver={(e) => handleImageDragOver(e, index)}
                    onDragEnd={handleImageDragEnd}
                  >
                    <img
                      src={preview}
                      alt={`New Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border-2 border-green-300 transition-all duration-200"
                    />
                    {/* Drag handle indicator */}
                    <div className="absolute top-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <i className="fas fa-grip-vertical mr-1"></i>Drag
                    </div>
                    {/* Red overlay when hovering to delete */}
                    <div className="absolute inset-0 bg-red-500 bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-all duration-200 pointer-events-none"></div>
                    
                    {/* Always visible delete button */}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 z-10"
                      title="Delete this image"
                    >
                      <i className="fas fa-times text-sm"></i>
                    </button>
                    
                    {/* Image number and NEW badge */}
                    <div className="absolute bottom-1 left-1 bg-green-600 text-white text-xs px-2 py-1 rounded z-10 flex items-center gap-1">
                      NEW #{index + 1}
                      {index === 0 && (
                        <i className="fas fa-magic text-yellow-300" title="AI analyzed this image"></i>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                <i className="fas fa-info-circle mr-1"></i>
                Drag images to reorder them. Click the upload area again to add even more images.
              </p>
            </div>
          )}

          {/* URL Input (Alternative) */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <i className="fas fa-link mr-1"></i>
              Or update image URLs (one per line)
            </label>
            <textarea
              value={imageUrls}
              onChange={(e) => setImageUrls(e.target.value)}
              rows={4}
              className="modern-input w-full"
              placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg&#10;https://example.com/image3.jpg"
            />
            <p className="text-xs text-gray-500 mt-1">
              <i className="fas fa-lightbulb text-yellow-500 mr-1"></i>
              <strong>Pro Tip:</strong> This will replace existing images. Leave empty to keep current images and only add uploaded files.
            </p>
          </div>
        </div>
      )}

      {/* Images */}
      {product.images && product.images.length > 0 && (
        <div className="modern-card p-6">
          <h4 className="text-xl font-semibold text-gray-900 mb-6">
            <i className="fas fa-images mr-2 text-blue-500"></i>
            Product Images
            {isEditing && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                <i className="fas fa-grip-vertical mr-1"></i>
                Drag to reorder
              </span>
            )}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {product.images.map((image, index) => (
              <div 
                key={index} 
                className={`relative group aspect-square bg-gray-200 rounded-xl overflow-hidden ${isEditing ? 'cursor-move' : ''}`}
                draggable={isEditing}
                onDragStart={() => isEditing && handleExistingImageDragStart(index)}
                onDragOver={(e) => isEditing && handleExistingImageDragOver(e, index)}
                onDragEnd={() => isEditing && handleExistingImageDragEnd()}
              >
                <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                
                {/* Drag handle indicator */}
                {isEditing && (
                  <div className="absolute top-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <i className="fas fa-grip-vertical mr-1"></i>Drag
                  </div>
                )}
                
                {/* Show delete functionality only in edit mode */}
                {isEditing && (
                  <>
                    {/* Red overlay when hovering to delete */}
                    <div className="absolute inset-0 bg-red-500 bg-opacity-0 group-hover:bg-opacity-30 rounded-xl transition-all duration-200 pointer-events-none"></div>
                    
                    {/* Always visible delete button */}
                    <button
                      type="button"
                      onClick={() => {
                        // Remove image from imageUrls
                        const currentUrls = imageUrls.split('\n').filter(url => url.trim());
                        const updatedUrls = currentUrls.filter((_, i) => i !== index);
                        setImageUrls(updatedUrls.join('\n'));
                        
                        // Update the product state to reflect the change
                        if (product.images) {
                          const updatedImages = product.images.filter((_, i) => i !== index);
                          setProduct(prev => prev ? { ...prev, images: updatedImages } : null);
                        }
                      }}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 z-10"
                      title="Delete this image"
                    >
                      <i className="fas fa-times text-sm"></i>
                    </button>
                    
                    {/* Image number */}
                    <div className="absolute bottom-1 left-1 bg-blue-600 text-white text-xs px-2 py-1 rounded z-10">
                      #{index + 1}
                      {index === 0 && <i className="fas fa-star ml-1" title="Main image"></i>}
                    </div>
                  </>
                )}
                
                {/* Show image number in view mode too */}
                {!isEditing && (
                  <div className="absolute bottom-1 left-1 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded z-10">
                    #{index + 1}
                    {index === 0 && <i className="fas fa-star ml-1" title="Main image"></i>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timestamps */}
      {(product.created_at || product.updated_at) && (
        <div className="modern-card p-6">
          <h4 className="text-xl font-semibold text-gray-900 mb-6">Timestamps</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {product.created_at && (
              <div className="bg-blue-50 p-6 rounded-xl">
                <div className="text-sm text-blue-600 font-medium mb-1">Created</div>
                <div className="text-blue-800 text-lg">{new Date(product.created_at).toLocaleString()}</div>
              </div>
            )}
            {product.updated_at && (
              <div className="bg-green-50 p-6 rounded-xl">
                <div className="text-sm text-green-600 font-medium mb-1">Last Updated</div>
                <div className="text-green-800 text-lg">{new Date(product.updated_at).toLocaleString()}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Delete Product"
        message={`Are you sure you want to delete product "${product?.name}"? This action cannot be undone.`}
        confirmText="DELETE PRODUCT"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        icon="fas fa-box"
        iconColor="text-red-500"
      />
    </div>
  );
};

export default ProductDetails;