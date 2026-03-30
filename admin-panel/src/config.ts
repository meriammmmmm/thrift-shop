// API configuration
// In production (Railway), use relative URL so server proxy works
// In development, use localhost
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api'
  : 'https://mery-rose-backend.onrender.comapi';
