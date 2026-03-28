// API configuration for connecting to separate backend
const BACKEND_URL = 'https://mery-rose-backend.onrender.com/api';

// Ensure the URL is absolute and properly formatted
const getApiBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  
  // Log for debugging
  if (typeof window !== 'undefined') {
    console.log('NEXT_PUBLIC_API_URL from env:', envUrl);
  }
  
  // If in production (Render, Railway, Vercel), use env var or fallback to Render backend
  if (typeof window !== 'undefined' && 
      (window.location.hostname.includes('onrender.com') || 
       window.location.hostname.includes('railway.app') || 
       window.location.hostname.includes('vercel.app'))) {
    const productionUrl = envUrl || BACKEND_URL;
    console.log('Using production backend URL:', productionUrl);
    return productionUrl;
  }
  
  // Use env var if set
  if (envUrl) {
    return envUrl;
  }
  
  // Default to localhost for local development
  return 'http://localhost:5001/api';
};

const API_BASE_URL = getApiBaseUrl();

// Log the final API URL
if (typeof window !== 'undefined') {
  console.log('Final API_BASE_URL:', API_BASE_URL);
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Get token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          // Clear invalid token
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth-token');
            localStorage.removeItem('user');
          }
          
          const errorData = await response.json().catch(() => ({ error: 'Session expired. Please sign in again.' }));
          const error = new Error(errorData.error || 'Session expired. Please sign in again.');
          (error as any).status = 401;
          throw error;
        }
        
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        const error = new Error(errorData.error || `HTTP error! status: ${response.status}`);
        (error as any).status = response.status;
        throw error;
      }

      return await response.json();
    } catch (error) {
      // Don't log 404 errors as they're often expected (e.g., user info not found)
      if ((error as any)?.status !== 404) {
        console.error('API request failed:', error);
      }
      throw error;
    }
  }

  // Auth endpoints
  async register(userData: { 
    email: string; 
    password: string; 
    name?: string;
    companyId?: number;
    verificationCode?: string;
    userInfo?: {
      fullName: string;
      email: string;
      phone: string;
      optionalPhone: string;
      address: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    }
  }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: { email: string; password: string }) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Products endpoints
  async getProducts(params: {
    page?: number;
    limit?: number;
    category?: string;
    brand?: string;
    search?: string;
    sortBy?: string;
    minPrice?: number;
    maxPrice?: number;
    companyId?: number;
  } = {}) {
    const queryString = new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && (typeof value === 'number' || value !== '')) {
          acc[key] = value.toString();
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString();

    return this.request(`/products${queryString ? `?${queryString}` : ''}`);
  }

  async getCompanyProducts(companyId: number, params: {
    page?: number;
    limit?: number;
    category?: string;
    brand?: string;
    search?: string;
    sortBy?: string;
    minPrice?: number;
    maxPrice?: number;
  } = {}) {
    const queryString = new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && (typeof value === 'number' || value !== '')) {
          acc[key] = value.toString();
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString();

    return this.request(`/products/company/${companyId}${queryString ? `?${queryString}` : ''}`);
  }

  async getProduct(id: string) {
    return this.request(`/products/${id}`);
  }

  async createProduct(productData: any) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(id: string, productData: any) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(id: string) {
    return this.request(`/products/${id}`, { method: 'DELETE' });
  }

  async getCategories() {
    return this.request('/products/meta/categories');
  }

  async getBrands() {
    return this.request('/products/meta/brands');
  }

  // Orders endpoints
  async getOrders() {
    return this.request('/orders');
  }

  async createOrder(orderData: {
    items: Array<{ product_id: number; quantity: number }>;
    shipping_address: any;
    billing_address: any;
    payment_method: string;
  }) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getOrder(id: string) {
    return this.request(`/orders/${id}`);
  }

  async updateOrderStatus(id: string, status: string) {
    return this.request(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async markOrderDelivered(id: number) {
    return this.request(`/orders/${id}/deliver`, {
      method: 'POST',
    });
  }

  // User endpoints
  async getUserProfile() {
    return this.request('/users/profile');
  }

  async updateUserProfile(profileData: { name?: string; profile_picture?: string | null }) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Wishlist endpoints
  async getWishlist() {
    return this.request('/wishlist');
  }

  async addToWishlist(productId: number) {
    return this.request('/wishlist', {
      method: 'POST',
      body: JSON.stringify({ productId }),
    });
  }

  async removeFromWishlist(productId: number) {
    return this.request(`/wishlist/${productId}`, { method: 'DELETE' });
  }

  async getWishlistIds() {
    return this.request('/wishlist/ids');
  }

  async clearWishlist() {
    return this.request('/wishlist', { method: 'DELETE' });
  }

  async addReview(reviewData: { product_id: number; rating: number; comment?: string }) {
    return this.request('/users/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  }

  async getUserReviews() {
    return this.request('/users/reviews');
  }

  // User Information endpoints
  async getUserInfo() {
    try {
      return await this.request('/users/info');
    } catch (error: any) {
      // 404 is expected when user hasn't saved info yet - don't log as error
      if (error?.status === 404) {
        throw error; // Re-throw but without logging
      }
      throw error;
    }
  }

  async saveUserInfo(userInfo: {
    fullName: string;
    email: string;
    phone: string;
    optionalPhone?: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
    profile_picture?: string;
  }) {
    return this.request('/users/info', {
      method: 'POST',
      body: JSON.stringify(userInfo),
    });
  }

  async updateUserInfo(userInfo: {
    fullName: string;
    email: string;
    phone: string;
    optionalPhone?: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
    profile_picture?: string;
  }) {
    return this.request('/users/info', {
      method: 'PUT',
      body: JSON.stringify(userInfo),
    });
  }

  async deleteUserInfo() {
    return this.request('/users/info', { method: 'DELETE' });
  }

  // Cart endpoints
  async getCart() {
    return this.request('/cart');
  }

  async addToCart(productId: number, quantity: number = 1) {
    return this.request('/cart/add', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity }),
    });
  }

  async updateCartItem(cartId: number, quantity: number) {
    return this.request(`/cart/update/${cartId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }

  async removeFromCart(cartId: number) {
    return this.request(`/cart/remove/${cartId}`, { method: 'DELETE' });
  }

  async removeProductFromCart(productId: number) {
    return this.request(`/cart/remove-product/${productId}`, { method: 'DELETE' });
  }

  async clearCart() {
    return this.request('/cart/clear', { method: 'DELETE' });
  }

  async getCartCount() {
    return this.request('/cart/count');
  }

  // Admin endpoints
  async getDashboardData() {
    return this.request('/admin/dashboard');
  }

  async getAllOrders(params: { page?: number; limit?: number; status?: string } = {}) {
    const queryString = new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && (typeof value === 'number' || value !== '')) {
          acc[key] = value.toString();
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString();

    return this.request(`/admin/orders${queryString ? `?${queryString}` : ''}`);
  }

  async updateOrderStatusAdmin(id: string, status: string) {
    return this.request(`/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async getAllUsers(params: { page?: number; limit?: number } = {}) {
    const queryString = new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && (typeof value === 'number' || value !== '')) {
          acc[key] = value.toString();
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString();

    return this.request(`/admin/users${queryString ? `?${queryString}` : ''}`);
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // Settings endpoints
  async getSettings() {
    return this.request('/settings');
  }

  async getSetting(key: string) {
    return this.request(`/settings/${key}`);
  }

  async updateSetting(key: string, value: any) {
    return this.request(`/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
  }

  async initializeSettings() {
    return this.request('/settings/init', { method: 'POST' });
  }
}

export const api = new ApiClient();
export default api;