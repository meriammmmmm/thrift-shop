import React, { useState, useEffect } from 'react';
import ProductDetails from './ProductDetails';
import AddProduct from './AddProduct';
import ConfirmationModal from './ConfirmationModal';
import { useNotifications } from '../hooks/useNotifications';

interface ProductManagementProps {
  authToken: string;
}

interface Product {
  id: number;
  name: string;
  brand: string;
  price: number;
  category: string;
  in_stock: boolean;
  images?: string[];
}

const API_BASE_URL = '/api';

const ProductManagement: React.FC<ProductManagementProps> = ({ authToken }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{ id: number; name: string } | null>(null);
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
    loadProducts();
    
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
  }, [authToken]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/products/admin/products?limit=100`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || data);
      }
    } catch (error) {
      console.error('Products load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        showSuccess('Success', 'Product deleted successfully!');
        loadProducts();
      } else {
        const error = await response.json();
        showError('Error', `Failed to delete product: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Delete product error:', error);
      showError('Error', 'Failed to delete product');
    }
    
    setShowDeleteConfirm(false);
    setProductToDelete(null);
  };

  const handleDeleteClick = (productId: number, productName: string) => {
    setProductToDelete({ id: productId, name: productName });
    setShowDeleteConfirm(true);
  };

  const editProduct = (productId: number) => {
    setSelectedProductId(productId);
    setShowProductDetails(true);
  };

  const viewProductDetails = (productId: number) => {
    setSelectedProductId(productId);
    setShowProductDetails(true);
  };

  const handleProductUpdated = () => {
    loadProducts();
  };

  const handleBackToProducts = () => {
    setShowProductDetails(false);
    setShowAddProduct(false);
    setSelectedProductId(null);
    loadProducts();
  };

  // Show AddProduct component if requested
  if (showAddProduct) {
    return (
      <div>
        <div className="mb-6">
          <button
            onClick={handleBackToProducts}
            className="flex items-center text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] font-medium transition-colors duration-200"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Products
          </button>
        </div>
        <AddProduct authToken={authToken} />
      </div>
    );
  }

  // Show ProductDetails component if requested
  if (showProductDetails && selectedProductId) {
    return (
      <ProductDetails 
        productId={selectedProductId}
        authToken={authToken}
        onBack={handleBackToProducts}
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
      <div className="flex justify-between items-center compact-spacing">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] bg-clip-text text-transparent mb-2">
            Product Management
          </h2>
          <p className="text-gray-600">Manage your product inventory and listings</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddProduct(true)}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center"
          >
            <i className="fas fa-plus mr-2"></i>Add Product
          </button>
          <button
            onClick={loadProducts}
            className="px-6 py-3 bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--color-primary)] text-white font-semibold rounded-xl hover:from-[var(--color-primary)] hover:to-[var(--color-primary-hover)] shadow-lg hover:shadow-xl transition-all duration-200 flex items-center"
          >
            <i className="fas fa-refresh mr-2"></i>Refresh
          </button>
        </div>
      </div>

      <div className="modern-table">
        <table className="min-w-full">
          <thead className="bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--color-primary)] text-white">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Brand</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <i className="fas fa-box-open text-4xl mb-4 text-gray-300"></i>
                    <p className="text-lg font-medium">No products found</p>
                    <p className="text-sm">Add some products to get started</p>
                  </div>
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-all duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-12 w-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        {product.images && product.images.length > 0 ? (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <i className="fas fa-image text-gray-400"></i>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900">{product.name || 'Unnamed Product'}</div>
                        <div className="text-xs text-gray-500">ID: {product.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.brand || 'No Brand'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getCurrentCurrencySymbol()}{(product.price || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.category || 'Uncategorized'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      product.in_stock !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {product.in_stock !== false ? 'In Stock' : 'Sold Out'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => viewProductDetails(product.id)}
                        className="px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-200 flex items-center"
                        title="View Details"
                      >
                        <i className="fas fa-eye text-sm"></i>
                      </button>
                      <button
                        onClick={() => editProduct(product.id)}
                        className="px-3 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700 shadow-md hover:shadow-lg transition-all duration-200 flex items-center"
                        title="Edit Product"
                      >
                        <i className="fas fa-edit text-sm"></i>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(product.id, product.name || 'Unnamed Product')}
                        className="px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg transition-all duration-200 flex items-center"
                        title="Delete Product"
                      >
                        <i className="fas fa-trash text-sm"></i>
                      </button>
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
        title="Delete Product"
        message={`Are you sure you want to delete product "${productToDelete?.name}"? This action cannot be undone.`}
        confirmText="DELETE PRODUCT"
        cancelText="Cancel"
        onConfirm={() => productToDelete && deleteProduct(productToDelete.id)}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setProductToDelete(null);
        }}
        icon="fas fa-box"
        iconColor="text-red-500"
      />
    </div>
  );
};

export default ProductManagement;