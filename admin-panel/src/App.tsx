import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import UserManagement from './components/UserManagement';
import ProductManagement from './components/ProductManagement';
import CategoryManagement from './components/CategoryManagement';
import OrderManagement from './components/OrderManagement';
import TransactionManagement from './components/TransactionManagement';
import TestimonialsManagement from './components/TestimonialsManagement';
import ArticlesManagement from './components/ArticlesManagement';
import LooksManagement from './components/LooksManagement';
import ThemeSettings from './components/ThemeSettings';
import AdminProfile from './components/AdminProfile';
import LoginForm from './components/LoginForm';
import CompanySignup from './components/CompanySignup';
import NotificationSystem from './components/NotificationSystem';
import { useNotifications } from './hooks/useNotifications';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://backend-wild-skylark-9834.fly.dev/api';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  company?: {
    id: number;
    name: string;
    description?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    logo?: string;
  };
}

// Component for the main layout with Header and Sidebar
const MainLayout: React.FC<{
  currentUser: User;
  authToken: string;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  logout: () => void;
  notifications: any[];
  removeNotification: (id: string) => void;
}> = ({ currentUser, authToken, sidebarOpen, setSidebarOpen, logout, notifications, removeNotification }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen" style={{ background: '#FFF5F7' }}>
      <Header
        user={currentUser}
        onLogout={logout}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex">
        <Sidebar
          activeSection={location.pathname.replace('/admin/', '') || 'dashboard'}
          onSectionChange={() => {}}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          user={currentUser}
        />

        <main className="main-content flex-1" style={{ background: '#FFF5F7' }}>
          <Routes>
            <Route path="/" element={<Dashboard authToken={authToken} />} />
            <Route path="/dashboard" element={<Dashboard authToken={authToken} />} />
            <Route path="/profile" element={currentUser ? <AdminProfile authToken={authToken} user={currentUser} /> : <Navigate to="/admin/dashboard" />} />
            <Route path="/users" element={<UserManagement authToken={authToken} />} />
            <Route path="/products" element={<ProductManagement authToken={authToken} />} />
            <Route path="/categories" element={<CategoryManagement authToken={authToken} />} />
            <Route path="/orders" element={<OrderManagement authToken={authToken} />} />
            <Route path="/transactions" element={<TransactionManagement authToken={authToken} />} />
            <Route path="/testimonials" element={<TestimonialsManagement authToken={authToken} />} />
            <Route path="/articles" element={<ArticlesManagement authToken={authToken} />} />
            <Route path="/looks" element={<LooksManagement authToken={authToken} />} />
            <Route path="/theme" element={<ThemeSettings authToken={authToken} />} />
            <Route path="*" element={<Navigate to="/admin/dashboard" />} />
          </Routes>
        </main>
      </div>

      {/* Notification System */}
      <NotificationSystem
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showSignup, setShowSignup] = useState<boolean>(false);
  const { notifications, removeNotification } = useNotifications();

  useEffect(() => {
    const token = localStorage.getItem('admin-token');
    if (token) {
      setAuthToken(token);
      checkAuth(token);
    } else {
      setIsLoading(false);
    }
    
    // Load and apply current theme
    loadAndApplyCurrentTheme();
  }, []);

  const loadAndApplyCurrentTheme = async () => {
    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${API_BASE_URL}/settings/theme`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        if (data.theme) {
          applyThemeToAdminPanel(data.theme);
        }
      }
    } catch (error) {
      console.error('Failed to load theme for admin panel:', error);
      // Apply default theme if loading fails
      applyThemeToAdminPanel({
        primary: '#731528',        // Mery Rose burgundy (main brand color)
        primaryHover: '#9B3550',   // Lighter burgundy on hover
        primaryLight: '#FFC0CB',   // Light pink accent
        secondary: '#8B2E3C',      // Darker burgundy for secondary elements
        accent: '#FF69B4',         // Hot pink accent
        background: '#ffffff',     // Clean white background
        text: '#1f2937',          // Dark gray text
        textLight: '#6b7280',     // Light gray text
        success: '#10b981',       // Keep success green
        error: '#ef4444',         // Keep error red
        warning: '#f59e0b',       // Keep warning amber
        info: '#731528'           // Use burgundy for info
      });
    }
  };

  const applyThemeToAdminPanel = (theme: any) => {
    const root = document.documentElement;
    
    // Apply all theme colors
    root.style.setProperty('--color-primary', theme.primary);
    root.style.setProperty('--color-primary-hover', theme.primaryHover);
    root.style.setProperty('--color-primary-light', theme.primaryLight);
    root.style.setProperty('--color-secondary', theme.secondary);
    root.style.setProperty('--color-accent', theme.accent);
    root.style.setProperty('--color-background', theme.background);
    root.style.setProperty('--color-text', theme.text);
    root.style.setProperty('--color-text-light', theme.textLight);
    root.style.setProperty('--color-success', theme.success);
    root.style.setProperty('--color-error', theme.error);
    root.style.setProperty('--color-warning', theme.warning);
    root.style.setProperty('--color-info', theme.info);
    
    // Convert hex to RGB for rgba usage
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? 
        `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
        '212, 165, 165'; // fallback to soft dusty rose
    };
    
    root.style.setProperty('--color-primary-rgb', hexToRgb(theme.primary));
    
    // Apply to body background for consistency
    document.body.style.background = theme.background || '#FFF5F7';
  };

  const checkAuth = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user.role === 'ADMIN') {
          setCurrentUser(data.user);
          setIsLoading(false);
        } else {
          logout();
        }
      } else {
        logout();
      }
    } catch (error) {
      console.error('Auth check error:', error);
      logout();
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.user.role === 'ADMIN') {
        setAuthToken(data.token);
        setCurrentUser(data.user);
        localStorage.setItem('admin-token', data.token);
        localStorage.setItem('admin-user', JSON.stringify(data.user));
      } else if (response.status === 403) {
        // Handle company status errors
        throw new Error(data.error);
      } else {
        throw new Error('Invalid credentials or insufficient permissions');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setAuthToken('');
    setCurrentUser(null);
    setShowSignup(false);
    localStorage.removeItem('admin-token');
    localStorage.removeItem('admin-user');
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FFF5F7' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    if (showSignup) {
      return (
        <CompanySignup
          onSignupSuccess={() => setShowSignup(false)}
          onBackToLogin={() => setShowSignup(false)}
        />
      );
    }
    return (
      <Routes>
        <Route path="/signup" element={<CompanySignup onSignupSuccess={() => setShowSignup(false)} onBackToLogin={() => setShowSignup(false)} />} />
        <Route path="*" element={<LoginForm onLogin={login} onShowSignup={() => setShowSignup(true)} />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/admin/dashboard" />} />
      <Route path="/signup" element={<Navigate to="/admin/dashboard" />} />
      <Route
        path="/admin/*"
        element={
          <MainLayout
            currentUser={currentUser}
            authToken={authToken}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            logout={logout}
            notifications={notifications}
            removeNotification={removeNotification}
          />
        }
      />
      <Route path="*" element={<Navigate to="/admin/dashboard" />} />
    </Routes>
  );
};

export default App;