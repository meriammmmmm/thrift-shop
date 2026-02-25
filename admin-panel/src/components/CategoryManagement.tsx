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

const API_BASE_URL = 'https://thrift-shop-backend-production.up.railway.app/api';

const CategoryManagement: React.FC<CategoryManagementProps> = ({ authToken }) => {
  const [categories, setCategories] = useState<Category[]>([]);
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

  // Predefined category suggestions
  const categoryPresets = [
    { name: 'Party & Night Out', icon: '🎉', description: 'Glamorous outfits for parties and nightlife' },
    { name: 'Casual Everyday', icon: '👕', description: 'Comfortable daily wear and casual outfits' },
    { name: 'Work & Office', icon: '💼', description: 'Professional attire for workplace' },
    { name: 'Date Night', icon: '💕', description: 'Romantic and stylish outfits for dates' },
    { name: 'Weekend Vibes', icon: '🌟', description: 'Relaxed weekend and leisure wear' },
    { name: 'Special Events', icon: '✨', description: 'Formal wear for special occasions' },
    { name: 'Trendy', icon: '🔥', description: 'Latest fashion trends and viral styles' },
    { name: 'Vintage', icon: '🕰️', description: 'Classic and retro fashion pieces' },
    { name: 'Accessories', icon: '👜', description: 'Bags, jewelry, and fashion accessories' },
    { name: 'Shoes', icon: '👠', description: 'All types of footwear' },
    { name: 'Dresses', icon: '👗', description: 'All dress styles and lengths' },
    { name: 'Tops', icon: '👚', description: 'Shirts, blouses, and upper wear' }
  ];

  useEffect(() => {
    loadCategories();
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
        showSuccess('Success', `Category ${editingCategory ? 'updated' : 'created'} successfully!`);
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
    setEditingCategory(null);
    setShowAddForm(false);
  };

  const usePreset = (preset: typeof categoryPresets[0]) => {
    setFormData({
      name: preset.name,
      description: preset.description,
      icon: preset.icon,
      parent_id: ''
    });
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
            <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Presets:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {categoryPresets.map((preset, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => usePreset(preset)}
                  className="p-3 text-left border border-gray-200 rounded-lg hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-all duration-200"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{preset.icon}</span>
                    <span className="text-sm font-medium text-gray-900">{preset.name}</span>
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
                  Icon (Emoji)
                </label>
                <input
                  type="text"
                  name="icon"
                  value={formData.icon}
                  onChange={handleInputChange}
                  className="modern-input w-full"
                  placeholder="🎉"
                />
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

      {/* Categories List */}
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
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-[var(--color-primary)]/10 to-[var(--color-primary)]/20 flex items-center justify-center">
                      <span className="text-xl">{category.icon || '📁'}</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{category.name}</h4>
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