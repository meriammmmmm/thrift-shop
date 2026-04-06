import React, { useState, useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';

interface CategoryManagementProps {
  authToken: string;
}

interface Category {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  parent_id?: number;
  created_at: string;
  updated_at: string;
}

interface Product {
  id: number;
  name: string;
  brand?: string;
  price: number;
  images?: string[];
  category?: string;
}

const API_BASE_URL = 'https://mertrosebackend-7wop5nev.b4a.run/api';

const CategoryManagement: React.FC<CategoryManagementProps> = ({ authToken }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    parent_id: ''
  });
  const { showSuccess, showError } = useNotifications();

  // Predefined category suggestions (matching frontend occasions with SVG icons)
  const categoryPresets = [
    { 
      name: 'Night Out', 
      icon: '🌙',
      svgIcon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>',
      description: 'Glamorous outfits for parties and nightlife' 
    },
    { 
      name: 'Casual', 
      icon: '🏠',
      svgIcon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>',
      description: 'Comfortable daily wear and casual outfits' 
    },
    { 
      name: 'Work', 
      icon: '📋',
      svgIcon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>',
      description: 'Professional attire for workplace' 
    },
    { 
      name: 'Date Night', 
      icon: '✨',
      svgIcon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>',
      description: 'Romantic and stylish outfits for dates' 
    },
    { 
      name: 'Weekend', 
      icon: '😊',
      svgIcon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
      description: 'Relaxed weekend and leisure wear' 
    },
    { 
      name: 'Events', 
      icon: '📅',
      svgIcon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>',
      description: 'Formal wear for special occasions' 
    }
  ];

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/categories`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      } else {
        showError('Error', 'Failed to load categories');
      }
    } catch (error) {
      console.error('Load categories error:', error);
      showError('Error', 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      console.log('🔍 Loading products for category assignment...');
      let allProducts: Product[] = [];
      let currentPage = 1;
      let hasMorePages = true;

      // Fetch all pages of products with authentication
      while (hasMorePages) {
        const response = await fetch(`${API_BASE_URL}/products?page=${currentPage}&limit=50`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const products = data.products || [];
          allProducts = [...allProducts, ...products];
          
          // Check if there are more pages
          const pagination = data.pagination || {};
          hasMorePages = pagination.page < pagination.pages;
          currentPage++;
          
          console.log(`📦 Loaded page ${pagination.page}/${pagination.pages} (${products.length} products)`);
        } else {
          console.error('Failed to load products page', currentPage);
          break;
        }
      }

      // Filter to only show products that actually exist
      const validProducts = allProducts.filter((p: any) => p && p.id && p.name);
      setProducts(validProducts);
      console.log('✅ Loaded all products for category assignment:', validProducts.length);
      console.log('📋 Product names:', validProducts.map((p: any) => p.name).join(', '));
    } catch (error) {
      console.error('Load products error:', error);
    }
  };

  const loadCategoryProducts = async (categoryId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/categories/${categoryId}/products`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const productIds = data.products.map((p: Product) => p.id);
        setSelectedProducts(productIds);
      }
    } catch (error) {
      console.error('Load category products error:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingCategory 
        ? `${API_BASE_URL}/admin/categories/${editingCategory.id}`
        : `${API_BASE_URL}/admin/categories`;
      
      const method = editingCategory ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          icon: formData.icon,
          parent_id: formData.parent_id ? parseInt(formData.parent_id) : null
        })
      });

      if (response.ok) {
        const result = await response.json();
        const categoryId = editingCategory ? editingCategory.id : result.category.id;

        // Save product assignments
        console.log('📦 Assigning products to category:', categoryId, selectedProducts);
        const assignResponse = await fetch(`${API_BASE_URL}/admin/categories/${categoryId}/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            productIds: selectedProducts
          })
        });

        if (assignResponse.ok) {
          const assignResult = await assignResponse.json();
          console.log('✅ Products assigned successfully:', assignResult);
          showSuccess('Success', `Category ${editingCategory ? 'updated' : 'created'} successfully! ${assignResult.assignedCount} products assigned.`);
        } else {
          const assignError = await assignResponse.json();
          console.error('❌ Failed to assign products:', assignError);
          showError('Warning', `Category saved but failed to assign products: ${assignError.error}`);
        }

        resetForm();
        loadCategories();
      } else {
        const error = await response.json();
        showError('Error', error.error || 'Failed to save category');
      }
    } catch (error) {
      console.error('Save category error:', error);
      showError('Error', 'Failed to save category');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '',
      parent_id: category.parent_id ? category.parent_id.toString() : ''
    });
    loadCategoryProducts(category.id);
    setShowAddForm(true);
  };

  const handleDelete = async (categoryId: number) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        showSuccess('Success', 'Category deleted successfully!');
        loadCategories();
      } else {
        const error = await response.json();
        showError('Error', error.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Delete category error:', error);
      showError('Error', 'Failed to delete category');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: '',
      parent_id: ''
    });
    setSelectedProducts([]);
    setEditingCategory(null);
    setShowAddForm(false);
  };

  const usePreset = (preset: typeof categoryPresets[0]) => {
    setFormData({
      name: preset.name,
      description: preset.description,
      icon: preset.svgIcon, // Save the SVG icon
      parent_id: ''
    });
  };

  const createAllPresets = async () => {
    try {
      setLoading(true);
      let successCount = 0;
      let skippedCount = 0;

      for (const preset of categoryPresets) {
        // Check if category already exists
        const exists = categories.some(cat => cat.name.toLowerCase() === preset.name.toLowerCase());
        if (exists) {
          skippedCount++;
          continue;
        }

        // Create the category
        const response = await fetch(`${API_BASE_URL}/admin/categories`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            name: preset.name,
            description: preset.description,
            icon: preset.svgIcon,
            parent_id: null
          })
        });

        if (response.ok) {
          successCount++;
        }
      }

      await loadCategories();
      
      if (successCount > 0) {
        showSuccess('Success', `Created ${successCount} occasion categories! ${skippedCount > 0 ? `(${skippedCount} already existed)` : ''}`);
      } else if (skippedCount > 0) {
        showSuccess('Info', 'All occasion categories already exist!');
      }
    } catch (error) {
      console.error('Create all presets error:', error);
      showError('Error', 'Failed to create some categories');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-[var(--color-primary)] bg-clip-text text-transparent mb-2">
            Category Management
          </h2>
          <p className="text-gray-600">Create and manage custom categories for your products</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-6 py-3 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] text-white font-medium rounded-lg hover:shadow-lg transition-all duration-200 flex items-center"
        >
          <i className="fas fa-plus mr-2"></i>
          Add Category
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="modern-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h3>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          {/* Category Presets */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">Quick Presets (Click to use):</h4>
              <button
                type="button"
                onClick={createAllPresets}
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 shadow-md hover:shadow-lg transition-all duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-magic mr-2"></i>
                    Create All 6 Occasions
                  </>
                )}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categoryPresets.map((preset, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => usePreset(preset)}
                  className="p-4 text-left border-2 border-gray-200 rounded-lg hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-8 h-8 flex-shrink-0"
                      style={{ color: '#6b7280' }}
                      dangerouslySetInnerHTML={{ __html: preset.svgIcon }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900">{preset.name}</div>
                      <div className="text-xs text-gray-500 truncate">{preset.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="modern-input w-full"
                  placeholder="e.g., Party & Night Out"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon (Emoji or SVG)
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    name="icon"
                    value={formData.icon}
                    onChange={handleInputChange}
                    className="modern-input flex-1"
                    placeholder="🎉 or paste SVG code"
                  />
                  {formData.icon && (
                    <div 
                      className="w-10 h-10 flex items-center justify-center border-2 border-gray-200 rounded-lg"
                      dangerouslySetInnerHTML={{ 
                        __html: formData.icon.startsWith('<svg') 
                          ? formData.icon 
                          : `<span style="font-size: 24px">${formData.icon}</span>`
                      }}
                    />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Use emoji (🎉) or click a preset to use SVG icons</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="modern-input w-full"
                placeholder="Describe what products belong in this category..."
              />
            </div>

            {/* Product Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign Products to this Category
              </label>
              <div className="border-2 border-gray-200 rounded-xl p-4 bg-gray-50 max-h-96 overflow-y-auto">
                {products.length > 0 ? (
                  <div className="space-y-2">
                    {products.map((product) => (
                      <label
                        key={product.id}
                        className="flex items-center p-3 bg-white rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-gray-200"
                      >
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProducts(prev => [...prev, product.id]);
                            } else {
                              setSelectedProducts(prev => prev.filter(id => id !== product.id));
                            }
                          }}
                          className="w-4 h-4 text-[var(--color-primary)] border-gray-300 rounded focus:ring-[var(--color-primary)]"
                        />
                        <div className="ml-3 flex items-center flex-1">
                          {product.images && product.images.length > 0 && (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded-lg mr-3"
                            />
                          )}
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            <div className="text-xs text-gray-500">
                              {product.brand && `${product.brand} • `}
                              ${product.price.toFixed(2)}
                              {product.category && ` • ${product.category}`}
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No products available. Add products first to assign them to categories.
                  </p>
                )}
                {products.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      {selectedProducts.length} product(s) selected
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] text-white font-medium rounded-lg hover:shadow-lg transition-all duration-200"
              >
                {editingCategory ? 'Update Category' : 'Create Category'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List - Simple List View */}
      <div className="modern-card">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Current Categories</h3>
          <p className="text-sm text-gray-600 mt-1">
            {categories.length} categories configured
          </p>
        </div>

        {categories.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">📂</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Categories Yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first category to organize your products better
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] text-white font-medium rounded-lg hover:shadow-lg transition-all duration-200"
            >
              Create First Category
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {categories.map((category) => (
              <div key={category.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-2xl">
                      {category.icon && category.icon.startsWith('<svg') ? (
                        <div 
                          className="w-6 h-6"
                          style={{ color: '#6b7280' }}
                          dangerouslySetInnerHTML={{ __html: category.icon }}
                        />
                      ) : (
                        <span>{category.icon || '📁'}</span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-gray-900">{category.name}</h4>
                      {category.description && (
                        <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Created {new Date(category.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="p-2 text-gray-400 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded-lg transition-all duration-200"
                      title="Edit category"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                      title="Delete category"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryManagement;