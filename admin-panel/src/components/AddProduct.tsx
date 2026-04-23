import React, { useState, useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';

interface AddProductProps {
  authToken: string;
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

const API_BASE_URL = 'https://mery-rose-backend.onrender.com/api';

const AddProduct: React.FC<AddProductProps> = ({ authToken }) => {
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    price: '',
    originalPrice: '',
    category: '',
    size: '',
    condition: '',
    color: '',
    description: '',
    images: '',
    material: '',
    seller: '',
    visible: true,
    most_lovable: false
  });
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiImageLoading, setAiImageLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [companyCurrency, setCompanyCurrency] = useState({ currency: 'USD', symbol: '$' });
  const [customCategories, setCustomCategories] = useState<Array<{name: string, description?: string, icon?: string}>>([]);
  const [occasions, setOccasions] = useState<Array<{id: number, name: string, description?: string, icon?: string}>>([]);
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
    'TN': { currency: 'TND', symbol: 'DT ' },
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
    
    const fetchCustomCategories = async () => {
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
        console.error('Failed to fetch custom categories:', error);
      }
    };
    
    const fetchOccasions = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/admin/categories`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          console.log('📋 Loaded occasions/categories:', data.categories);
          setOccasions(data.categories || []);
        } else {
          console.error('Failed to fetch occasions:', response.status);
        }
      } catch (error) {
        console.error('Failed to fetch occasions:', error);
      }
    };
    
    fetchCompanyCurrency();
    fetchCustomCategories();
    fetchOccasions();
    
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Compress image to reduce size while maintaining quality
  const compressImage = (file: File, maxSizeKB: number = 800): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Validate file size (max 10MB before compression)
      if (file.size > 10 * 1024 * 1024) {
        reject(new Error(`File too large: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum 10MB.`));
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
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
          } catch (canvasError) {
            console.error('Canvas processing error:', canvasError);
            reject(new Error(`Failed to process image: ${file.name}`));
          }
        };
        img.onerror = () => {
          console.error('Failed to load image:', file.name, file.type);
          reject(new Error(`Failed to load image: ${file.name}. Please ensure it's a valid image file (JPG, PNG, WebP).`));
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        console.error('Failed to read file:', file.name);
        reject(new Error(`Failed to read file: ${file.name}`));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const currentPreviewCount = imagePreviews.length;
    
    if (files.length === 0) return;
    
    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type.toLowerCase()));
    
    if (invalidFiles.length > 0) {
      showError('Invalid File Type', `Please upload only image files (JPG, PNG, WebP, GIF). Invalid: ${invalidFiles.map(f => f.name).join(', ')}`);
      return;
    }
    
    // Show loading state
    showSuccess('Processing', `Compressing ${files.length} image(s)...`);
    
    setSelectedImages(prev => [...prev, ...files]);
    
    // Process each file with compression
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      try {
        const compressedImage = await compressImage(file, 800); // Max 800KB per image for better quality
        
        setImagePreviews(prev => {
          // Avoid adding duplicate images
          if (prev.includes(compressedImage)) {
            return prev;
          }
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

      console.log('🤖 Sending image to AI for analysis...');
      const response = await fetch(`${API_BASE_URL}/admin/ai/generate-description`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(requestData)
      });

      console.log('📡 AI Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ AI Result:', result);
        const aiData = result.data;

        if (!aiData) {
          console.error('❌ No data in AI response');
          showError('Error', 'AI returned no data');
          return;
        }

        // Update form with AI-generated data (image analyser output)
        const desc = aiData.style_notes
          ? `${aiData.description || ''}\n\nStyle notes: ${aiData.style_notes}`.trim()
          : (aiData.description || '');
        
        console.log('📝 Setting form data with AI results:', {
          name: aiData.title,
          category: aiData.category_suggestion,
          brand: aiData.brand_suggestion,
          price: aiData.suggested_price_min
        });

        setFormData(prev => ({
          ...prev,
          name: aiData.title || prev.name,
          description: desc || prev.description,
          condition: aiData.condition || prev.condition,
          category: aiData.category_suggestion || prev.category,
          brand: aiData.brand_suggestion || prev.brand,
          price: aiData.suggested_price_min != null ? String(aiData.suggested_price_min) : prev.price,
          originalPrice: aiData.suggested_price_max != null ? String(aiData.suggested_price_max) : prev.originalPrice,
          color: aiData.color || prev.color,
          material: aiData.material || prev.material
        }));
        
        // Update selected sizes if AI detected a size
        if (aiData.size_suggestion) {
          setSelectedSizes([aiData.size_suggestion]);
        }

        showSuccess('Success', '🤖 Image analyser: AI analyzed your photo and generated product details!');
      } else {
        const error = await response.json();
        console.error('❌ AI Error:', error);
        showError('Error', `Failed to analyze image: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ AI image analysis error:', error);
      showError('Error', 'Failed to analyze image with AI');
    } finally {
      setAiLoading(false);
    }
  };

  const generateAIDescription = async () => {
    if (!imagePreviews[0] && !formData.name) {
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
          productName: formData.name,
          category: formData.category,
          brand: formData.brand,
          additionalInfo: `Color: ${formData.color}, Material: ${formData.material}, Size: ${formData.size}`
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
          setFormData(prev => ({
            ...prev,
            name: aiData.title || prev.name,
            description: textDesc || prev.description,
            condition: aiData.condition || prev.condition,
            category: aiData.category_suggestion || prev.category,
            brand: aiData.brand_suggestion || prev.brand,
            price: aiData.suggested_price_min != null ? String(aiData.suggested_price_min) : prev.price,
            originalPrice: aiData.suggested_price_max != null ? String(aiData.suggested_price_max) : prev.originalPrice,
            color: aiData.color || prev.color,
            material: aiData.material || prev.material
          }));
          
          // Update selected sizes if AI detected a size
          if (aiData.size_suggestion) {
            setSelectedSizes([aiData.size_suggestion]);
          }

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

  const generateAIImage = async () => {
    if (!formData.name && !formData.category) {
      showError('Error', 'Please enter a product name or category to generate AI images');
      return;
    }

    setAiImageLoading(true);
    try {
      // Create a detailed prompt for image generation
      const prompt = `${formData.name || 'fashion item'} ${formData.category ? `${formData.category}` : ''} ${formData.brand ? `by ${formData.brand}` : ''} ${formData.color ? `in ${formData.color}` : ''} ${formData.material ? `made of ${formData.material}` : ''}`.trim();

      console.log('🎨 Generating AI image with prompt:', prompt);

      const response = await fetch(`${API_BASE_URL}/ai/generate-product-mockup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          productName: formData.name || 'Fashion Item',
          category: formData.category || 'Clothing',
          style: 'realistic',
          background: 'clean white background',
          lighting: 'professional studio lighting'
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.imageUrl) {
          // Add the generated image to previews (avoid duplicates)
          setImagePreviews(prev => {
            if (prev.includes(result.imageUrl)) {
              return prev; // Don't add if already exists
            }
            return [...prev, result.imageUrl];
          });
          
          console.log('🖼️ AI image generated successfully, now analyzing...');
          
          // Now analyze the generated image to populate form data
          setTimeout(async () => {
            try {
              setAiLoading(true);
              
              // Use the generated image for AI analysis
              await generateAIDescriptionFromImage(result.imageUrl);
              
              showSuccess('Success', `🎨✨ AI generated image and analyzed it! All details filled automatically! (${result.service})`);
            } catch (analysisError) {
              console.error('AI analysis error:', analysisError);
              showSuccess('Success', `🎨 AI generated image! (${result.service}) - Manual analysis needed`);
            } finally {
              setAiLoading(false);
            }
          }, 1000); // Small delay to ensure image is loaded
          
          if (result.note) {
            console.log('AI Image Note:', result.note);
          }
        } else {
          showError('Error', 'Failed to generate AI image');
        }
      } else {
        const error = await response.json();
        showError('Error', `Failed to generate AI image: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('AI image generation error:', error);
      showError('Error', 'Failed to generate AI image');
    } finally {
      setAiImageLoading(false);
    }
  };

  const clearForm = () => {
    setFormData({
      name: '',
      brand: '',
      price: '',
      originalPrice: '',
      category: '',
      size: '',
      condition: '',
      color: '',
      description: '',
      images: '',
      material: '',
      seller: '',
      visible: true,
      most_lovable: false
    });
    setSelectedImages([]);
    setImagePreviews([]);
    setSelectedOccasions([]);
    setSelectedSizes([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Categories that don't need size selection
    const noSizeCategories = ['Bags', 'Jewelry', 'Watches', 'Sunglasses', 'Belts', 'Scarves', 'Hats', 'Books', 'Home', 'Vintage', 'Other', 'Phones', 'Headphones', 'Cameras'];
    const needsSize = !noSizeCategories.includes(formData.category);
    
    // Validate that at least one size is selected (only for categories that need size)
    if (needsSize && selectedSizes.length === 0) {
      showError('Error', 'Please select at least one size');
      return;
    }
    
    setLoading(true);

    try {
      // Process URL-based images from textarea
      const imageUrls = formData.images
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);

      // Get all uploaded/generated images from previews (includes base64 and URLs)
      const uploadedImages = imagePreviews.filter(preview => {
        // Include all previews (both http:// URLs and data:image base64)
        return preview.startsWith('http') || preview.startsWith('data:image');
      });

      // Combine all images and remove duplicates
      const allImagesWithDuplicates = [...imageUrls, ...uploadedImages];
      const allImages = Array.from(new Set(allImagesWithDuplicates)); // Remove duplicates

      if (allImages.length === 0) {
        showError('Error', 'Please add at least one image (upload, URL, or AI-generated)');
        setLoading(false);
        return;
      }

      const productData = {
        name: formData.name,
        brand: formData.brand,
        price: parseFloat(formData.price),
        original_price: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        category: formData.category,
        size: selectedSizes.length > 0 ? selectedSizes.join(', ') : 'N/A', // Join multiple sizes or N/A for accessories
        condition: formData.condition,
        color: formData.color,
        description: formData.description,
        images: allImages,
        material: formData.material,
        seller: formData.seller,
        in_stock: true,
        visible: formData.visible,
        most_lovable: formData.most_lovable
      };

      const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(productData)
      });

      if (response.ok) {
        const result = await response.json();
        const newProductId = result.id;
        
        // Assign product to selected occasions
        let occasionAssignmentSuccess = 0;
        let occasionAssignmentFailed = 0;
        
        if (selectedOccasions.length > 0) {
          for (const occasionId of selectedOccasions) {
            // Skip invalid occasion IDs
            if (!occasionId || occasionId <= 0) {
              console.warn('Skipping invalid occasion ID:', occasionId);
              occasionAssignmentFailed++;
              continue;
            }
            
            try {
              // Get current products in this occasion
              const categoryResponse = await fetch(`${API_BASE_URL}/admin/categories/${occasionId}/products`, {
                headers: {
                  'Authorization': `Bearer ${authToken}`
                }
              });
              
              if (categoryResponse.ok) {
                const categoryData = await categoryResponse.json();
                const currentProductIds = categoryData.products?.map((p: any) => p.id) || [];
                
                // Add the new product to the list
                const updatedProductIds = [...currentProductIds, newProductId];
                
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
                  occasionAssignmentSuccess++;
                } else {
                  occasionAssignmentFailed++;
                  console.error(`Failed to assign product to occasion ${occasionId}`);
                }
              } else {
                occasionAssignmentFailed++;
              }
            } catch (err) {
              console.error(`Error assigning product to occasion ${occasionId}:`, err);
              occasionAssignmentFailed++;
            }
          }
        }
        
        // Show appropriate success message
        if (occasionAssignmentFailed > 0 && occasionAssignmentSuccess === 0) {
          showSuccess('Product Added', `Product created successfully! However, occasion assignment failed. Please assign occasions manually in the Categories section.`);
        } else if (occasionAssignmentFailed > 0) {
          showSuccess('Partial Success', `Product added! ${occasionAssignmentSuccess} occasion(s) assigned, ${occasionAssignmentFailed} failed.`);
        } else if (selectedOccasions.length > 0) {
          showSuccess('Success', `Product added and assigned to ${occasionAssignmentSuccess} occasion(s)!`);
        } else {
          showSuccess('Success', 'Product added successfully!');
        }
        
        clearForm();
      } else {
        const error = await response.json();
        showError('Error', `Failed to add product: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Add product error:', error);
      showError('Error', 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="compact-spacing">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-[var(--color-primary)]  bg-clip-text text-transparent mb-2">
          Add New Article
        </h2>
        <p className="text-gray-600">Add new products to your thrift shop inventory</p>
      </div>
      
      <div className="modern-card p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Product Images - FIRST FIELD */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Product Images</label>
              <button
                type="button"
                onClick={generateAIImage}
                disabled={aiImageLoading || (!formData.name && !formData.category)}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-pink-600 hover:to-purple-700 shadow-md hover:shadow-lg transition-all duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {aiImageLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating & Analyzing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-magic mr-2"></i>
                    AI: Generate + Analyze
                  </>
                )}
              </button>
            </div>
            
            {/* File Upload - Multiple Images Supported */}
            <div className="mb-4">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {aiLoading ? (
                    <>
                      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                      <p className="text-sm text-purple-600 font-medium">AI is analyzing the image...</p>
                      <p className="text-xs text-gray-500">Extracting product details automatically</p>
                    </>
                  ) : aiImageLoading ? (
                    <>
                      <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                      <p className="text-sm text-pink-600 font-medium">AI is creating your product image...</p>
                      <p className="text-xs text-gray-500">Then it will analyze it automatically!</p>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-cloud-upload-alt text-gray-400 text-2xl mb-2"></i>
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload product images</span> (multiple supported)
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF - Auto-compressed to ~800KB each (high quality)</p>
                      <p className="text-xs text-purple-600 mt-1">
                        <i className="fas fa-magic mr-1"></i>
                        First image: AI will analyze and auto-fill details!
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
                  disabled={aiLoading || aiImageLoading}
                />
              </label>
            </div>

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-sm font-medium text-gray-700">
                    <i className="fas fa-images mr-2 text-blue-500"></i>
                    Uploaded Images ({imagePreviews.length})
                  </h5>
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreviews([]);
                      setSelectedImages([]);
                    }}
                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    <i className="fas fa-trash mr-1"></i>Clear All
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border-2 border-gray-200 transition-all duration-200"
                      />
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
                      
                      {/* Image number and AI badge */}
                      <div className="absolute bottom-1 left-1 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded z-10 flex items-center gap-1">
                        #{index + 1}
                        {index === 0 && (
                          <i className="fas fa-magic text-purple-400" title="AI analyzed this image"></i>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  <i className="fas fa-info-circle mr-1"></i>
                  Click the upload area again to add more images. First image was analyzed by AI.
                </p>
              </div>
            )}

            {/* URL Input (Alternative) */}
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <i className="fas fa-link mr-1"></i>
                Or add image URLs (one per line)
              </label>
              <textarea
                name="images"
                value={formData.images}
                onChange={handleInputChange}
                rows={3}
                className="modern-input w-full"
                placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg&#10;https://example.com/image3.jpg"
              />
              <p className="text-xs text-gray-500 mt-2">
                <i className="fas fa-lightbulb text-yellow-500 mr-1"></i>
                <strong>Pro Tips:</strong> You can mix uploaded images, URLs, and AI-generated images! All will be saved together.
              </p>
            </div>
          </div>

          {/* Occasions Selector - PROMINENT POSITION */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-200">
            <label className="block text-lg font-bold text-gray-800 mb-2">
              <i className="fas fa-calendar-star mr-2 text-purple-600"></i>
              Select Occasions for This Product
            </label>
            <p className="text-sm text-gray-600 mb-4">
              Choose which occasions this product is perfect for. Customers can browse by occasion to find the right outfit!
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {occasions.map((occasion) => (
                <button
                  key={occasion.id}
                  type="button"
                  onClick={() => {
                    setSelectedOccasions(prev => 
                      prev.includes(occasion.id) 
                        ? prev.filter(id => id !== occasion.id)
                        : [...prev, occasion.id]
                    );
                  }}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    selectedOccasions.includes(occasion.id)
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-600 shadow-lg transform scale-105'
                      : 'bg-white hover:bg-purple-100 border-gray-300 hover:border-purple-400 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {occasion.icon && (
                      <div 
                        className={`w-6 h-6 flex-shrink-0 ${selectedOccasions.includes(occasion.id) ? 'text-white' : 'text-purple-600'}`}
                        dangerouslySetInnerHTML={{ __html: occasion.icon }}
                      />
                    )}
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{occasion.name}</div>
                      {occasion.description && (
                        <div className={`text-xs mt-1 ${selectedOccasions.includes(occasion.id) ? 'opacity-90' : 'text-gray-500'}`}>
                          {occasion.description}
                        </div>
                      )}
                    </div>
                    {selectedOccasions.includes(occasion.id) && (
                      <i className="fas fa-check-circle text-lg"></i>
                    )}
                  </div>
                </button>
              ))}
            </div>
            {occasions.length === 0 && (
              <div className="text-center py-8 bg-white rounded-xl border-2 border-dashed border-purple-300">
                <i className="fas fa-calendar-plus text-4xl text-purple-400 mb-3"></i>
                <p className="text-gray-700 font-semibold mb-1">No occasions created yet</p>
                <p className="text-gray-500 text-sm mb-3">Create occasions in the Categories section first</p>
                <button
                  type="button"
                  onClick={() => {
                    // Navigate to categories section
                    const sidebar = document.querySelector('[data-section="categories"]') as HTMLElement;
                    if (sidebar) sidebar.click();
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                  <i className="fas fa-arrow-right mr-2"></i>
                  Go to Categories
                </button>
              </div>
            )}
            {selectedOccasions.length > 0 && (
              <div className="mt-4 p-4 bg-white rounded-lg border-2 border-purple-300 shadow-sm">
                <p className="text-sm text-purple-800 font-medium">
                  <i className="fas fa-check-circle mr-2 text-green-500"></i>
                  <strong>{selectedOccasions.length} occasion(s) selected:</strong>
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {occasions.filter(o => selectedOccasions.includes(o.id)).map(o => (
                    <span key={o.id} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                      {o.icon && <span dangerouslySetInnerHTML={{ __html: o.icon }} className="w-4 h-4 inline-block mr-1" />}
                      {o.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
                {aiLoading && (
                  <span className="ml-2 text-xs text-purple-600">
                    <i className="fas fa-magic animate-pulse mr-1"></i>
                    AI generating...
                  </span>
                )}
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="modern-input w-full"
                placeholder="Upload a photo and AI will generate the name!"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Brand *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                required
                className="modern-input w-full"
                placeholder="Enter brand name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                  {getCurrentCurrencySymbol()}
                </span>
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  className="modern-input w-full pl-8"
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Currency: {companyCurrency.currency}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Original Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                  {getCurrentCurrencySymbol()}
                </span>
                <input
                  type="number"
                  step="0.01"
                  name="originalPrice"
                  value={formData.originalPrice}
                  onChange={handleInputChange}
                  className="modern-input w-full pl-8"
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Currency: {companyCurrency.currency}</p>
            </div>
            <CustomSelect
              label="Category"
              value={formData.category}
              onChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              placeholder="Select Category"
              required={true}
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
                { value: "Hats", label: "� Hats & Caps", group: "👜 Accessories" },
                
                // Electronics
                { value: "Phones", label: "📱 Phones & Tablets", group: "📱 Electronics" },
                { value: "Headphones", label: "� Headphones & Audio", group: "📱 Electronics" },
                { value: "Cameras", label: "📷 Cameras", group: "📱 Electronics" },
                
                // Other
                { value: "Books", label: "📚 Books", group: "� Other" },
                { value: "Home", label: "� Home Decor", group: "� Other" },
                { value: "Vintage", label: "🕰️ Vintage Items", group: "� Other" },
                { value: "Other", label: "🔖 Other", group: "� Other" }
              ]}
            />
            
            {/* Multi-Select Size Field - Category Based */}
            <div>
              {(() => {
                // Categories that don't need size selection
                const noSizeCategories = ['Bags', 'Jewelry', 'Watches', 'Sunglasses', 'Belts', 'Scarves', 'Hats', 'Books', 'Home', 'Vintage', 'Other', 'Phones', 'Headphones', 'Cameras'];
                const needsSize = !noSizeCategories.includes(formData.category);
                
                if (!needsSize) {
                  return (
                    <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                      <p className="text-sm text-gray-600">
                        <i className="fas fa-info-circle mr-2 text-blue-500"></i>
                        Size selection is not required for <strong>{formData.category || 'this category'}</strong>
                      </p>
                    </div>
                  );
                }
                
                return (
                  <>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Size (Multiple Selection) *
                      {aiLoading && (
                        <span className="ml-2 text-xs text-purple-600">
                          <i className="fas fa-magic animate-pulse mr-1"></i>
                          AI detecting...
                        </span>
                      )}
                    </label>
                    <div className="space-y-3">
                      {/* Selected Sizes Display */}
                      {selectedSizes.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                          {selectedSizes.map((size) => (
                            <span
                              key={size}
                              className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium"
                            >
                              {size}
                              <button
                                type="button"
                                onClick={() => setSelectedSizes(prev => prev.filter(s => s !== size))}
                                className="hover:bg-blue-700 rounded-full p-1 transition-colors"
                              >
                                <i className="fas fa-times text-xs"></i>
                              </button>
                            </span>
                          ))}
                          <button
                            type="button"
                            onClick={() => setSelectedSizes([])}
                            className="text-xs text-red-600 hover:text-red-700 font-medium px-2"
                          >
                            Clear All
                          </button>
                        </div>
                      )}
                      
                      {/* Size Selection Grid */}
                      <div className="border-2 border-gray-200 rounded-xl p-4 max-h-96 overflow-y-auto">
                        {/* Clothing Sizes */}
                        {!['Sneakers', 'Boots', 'Heels', 'Flats', 'Sandals'].includes(formData.category) && (
                          <>
                            <div className="mb-4">
                              <div className="text-xs font-bold text-blue-600 mb-2 uppercase tracking-wider">
                                👕 Clothing Sizes
                              </div>
                              <div className="grid grid-cols-4 gap-2">
                                {["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"].map((size) => (
                                  <button
                                    key={size}
                                    type="button"
                                    onClick={() => {
                                      setSelectedSizes(prev => 
                                        prev.includes(size) 
                                          ? prev.filter(s => s !== size)
                                          : [...prev, size]
                                      );
                                    }}
                                    className={`p-2 rounded-lg text-sm font-medium transition-all duration-200 border-2 ${
                                      selectedSizes.includes(size)
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                                        : 'bg-gray-50 hover:bg-blue-100 border-gray-200 hover:border-blue-400'
                                    }`}
                                  >
                                    {size}
                                  </button>
                                ))}
                              </div>
                            </div>
                            
                            {/* Pants & Jeans */}
                            <div className="mb-4">
                              <div className="text-xs font-bold text-blue-600 mb-2 uppercase tracking-wider">
                                👖 Pants & Jeans (Waist)
                              </div>
                              <div className="grid grid-cols-5 gap-2">
                                {["26", "28", "30", "32", "34", "36", "38", "40", "42"].map((size) => (
                                  <button
                                    key={size}
                                    type="button"
                                    onClick={() => {
                                      setSelectedSizes(prev => 
                                        prev.includes(size) 
                                          ? prev.filter(s => s !== size)
                                          : [...prev, size]
                                      );
                                    }}
                                    className={`p-2 rounded-lg text-sm font-medium transition-all duration-200 border-2 ${
                                      selectedSizes.includes(size)
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                                        : 'bg-gray-50 hover:bg-blue-100 border-gray-200 hover:border-blue-400'
                                    }`}
                                  >
                                    {size}"
                                  </button>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                        
                        {/* Shoe Sizes - EU 30-48 */}
                        {['Sneakers', 'Boots', 'Heels', 'Flats', 'Sandals'].includes(formData.category) && (
                          <div className="mb-4">
                            <div className="text-xs font-bold text-blue-600 mb-2 uppercase tracking-wider">
                              👠 Shoe Sizes (EU)
                            </div>
                            <div className="grid grid-cols-6 gap-2">
                              {Array.from({ length: 19 }, (_, i) => (30 + i).toString()).map((size) => (
                                <button
                                  key={size}
                                  type="button"
                                  onClick={() => {
                                    setSelectedSizes(prev => 
                                      prev.includes(size) 
                                        ? prev.filter(s => s !== size)
                                        : [...prev, size]
                                    );
                                  }}
                                  className={`p-2 rounded-lg text-sm font-medium transition-all duration-200 border-2 ${
                                    selectedSizes.includes(size)
                                      ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                                      : 'bg-gray-50 hover:bg-blue-100 border-gray-200 hover:border-blue-400'
                                  }`}
                                >
                                  {size}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Other Sizes */}
                        <div>
                          <div className="text-xs font-bold text-blue-600 mb-2 uppercase tracking-wider">
                            🔖 Other
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {["One Size", "Adjustable", "Custom"].map((size) => (
                              <button
                                key={size}
                                type="button"
                                onClick={() => {
                                  setSelectedSizes(prev => 
                                    prev.includes(size) 
                                      ? prev.filter(s => s !== size)
                                      : [...prev, size]
                                  );
                                }}
                                className={`p-2 rounded-lg text-sm font-medium transition-all duration-200 border-2 ${
                                  selectedSizes.includes(size)
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                                    : 'bg-gray-50 hover:bg-blue-100 border-gray-200 hover:border-blue-400'
                                }`}
                              >
                                {size}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {selectedSizes.length === 0 && (
                        <p className="text-xs text-red-500 mt-1">
                          <i className="fas fa-exclamation-circle mr-1"></i>
                          Please select at least one size
                        </p>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
            <CustomSelect
              label="Condition"
              value={formData.condition}
              onChange={(value) => setFormData(prev => ({ ...prev, condition: value }))}
              placeholder="Select Condition"
              required={true}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                className="modern-input w-full"
                placeholder="Enter color"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Description *</label>
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
                    Re-generate with AI
                  </>
                )}
              </button>
            </div>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={3}
              maxLength={300}
              className="modern-input w-full resize-none"
              placeholder="Upload a photo above and AI will automatically generate a short description!"
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">
                <i className="fas fa-lightbulb text-yellow-500 mr-1"></i>
                <strong>Keep it short:</strong> Max 300 characters
              </p>
              <p className="text-xs text-gray-400">
                {formData.description.length}/300
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Material</label>
              <input
                type="text"
                name="material"
                value={formData.material}
                onChange={handleInputChange}
                className="modern-input w-full"
                placeholder="Enter material"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Seller Name</label>
              <input
                type="text"
                name="seller"
                value={formData.seller}
                onChange={handleInputChange}
                className="modern-input w-full"
                placeholder="Enter seller name"
              />
            </div>
          </div>

          {/* Product Visibility Toggle */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="block text-lg font-bold text-gray-800 mb-1">
                  <i className={`fas ${formData.visible ? 'fa-eye' : 'fa-eye-slash'} mr-2 ${formData.visible ? 'text-green-600' : 'text-gray-400'}`}></i>
                  Product Visibility
                </label>
                <p className="text-sm text-gray-600">
                  {formData.visible 
                    ? '✅ This product will be visible to customers in your storefront' 
                    : '🔒 This product will be hidden from customers (draft mode)'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, visible: !prev.visible }))}
                className={`relative inline-flex h-12 w-24 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  formData.visible 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 focus:ring-green-500' 
                    : 'bg-gray-300 focus:ring-gray-400'
                }`}
              >
                <span
                  className={`inline-block h-10 w-10 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                    formData.visible ? 'translate-x-12' : 'translate-x-1'
                  }`}
                >
                  <i className={`fas ${formData.visible ? 'fa-check' : 'fa-times'} text-lg flex items-center justify-center h-full ${
                    formData.visible ? 'text-green-600' : 'text-gray-400'
                  }`}></i>
                </span>
              </button>
            </div>
            <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
              <p className="text-xs text-gray-600">
                <i className="fas fa-info-circle mr-1 text-blue-500"></i>
                <strong>Tip:</strong> Use this to create draft products or temporarily hide items without deleting them.
              </p>
            </div>
          </div>

          {/* Most Lovable Toggle */}
          <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-6 rounded-xl border-2 border-pink-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="block text-lg font-bold text-gray-800 mb-1">
                  <i className={`fas fa-heart mr-2 ${formData.most_lovable ? 'text-pink-600' : 'text-gray-400'}`}></i>
                  Most Lovable Product
                </label>
                <p className="text-sm text-gray-600">
                  {formData.most_lovable 
                    ? '💖 This product will appear in the "Most Loved Pieces" section on homepage' 
                    : '🤍 This product will not be featured in "Most Loved Pieces"'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, most_lovable: !prev.most_lovable }))}
                className={`relative inline-flex h-12 w-24 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  formData.most_lovable 
                    ? 'bg-gradient-to-r from-pink-500 to-rose-600 focus:ring-pink-500' 
                    : 'bg-gray-300 focus:ring-gray-400'
                }`}
              >
                <span
                  className={`inline-block h-10 w-10 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                    formData.most_lovable ? 'translate-x-12' : 'translate-x-1'
                  }`}
                >
                  <i className={`fas ${formData.most_lovable ? 'fa-heart' : 'fa-heart-broken'} text-lg flex items-center justify-center h-full ${
                    formData.most_lovable ? 'text-pink-600' : 'text-gray-400'
                  }`}></i>
                </span>
              </button>
            </div>
            <div className="mt-4 p-3 bg-white rounded-lg border border-pink-200">
              <p className="text-xs text-gray-600">
                <i className="fas fa-info-circle mr-1 text-pink-500"></i>
                <strong>Tip:</strong> Enable this to feature your best products in the "Most Loved Pieces" section. Only products with this enabled will show there!
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={clearForm}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Clear Form
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-modern px-6 py-2 flex items-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <i className="fas fa-plus mr-2"></i>
              )}
              Add Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;