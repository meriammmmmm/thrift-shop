import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import UserManagement from './components/UserManagement';
import ProductManagement from './components/ProductManagement';
import CategoryManagement from './components/CategoryManagement';
import OrderManagement from './components/OrderManagement';
import TransactionManagement from './components/TransactionManagement';
import TestimonialsManagement from './components/TestimonialsManagement';
import ThemeSettings from './components/ThemeSettings';
import AdminProfile from './components/AdminProfile';
import LoginForm from './components/LoginForm';
import CompanySignup from './components/CompanySignup';
import NotificationSystem from './components/NotificationSystem';
import { useNotifications } from './hooks/useNotifications';

const API_BASE_URL = 'https://thrift-shop-backend-production.up.railway.app/api';

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

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string>('');
  const [activeSection, setActiveSection] = useState<string>('dashboard');
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
      const response = await fetch(`${API_BASE_URL}/settings/theme`);
      if (response.ok) {
        const data = await response.json();
        if (data.theme) {
          applyThemeToAdminPanel(data.theme);
        }
      }
    } catch (error) {
      console.error('Failed to load theme for admin panel:', error);
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

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard authToken={authToken} />;
      case 'profile':
        return currentUser ? <AdminProfile authToken={authToken} user={currentUser} /> : <Dashboard authToken={authToken} />;
      case 'users':
        return <UserManagement authToken={authToken} />;
      case 'products':
        return <ProductManagement authToken={authToken} />;
      case 'categories':
        return <CategoryManagement authToken={authToken} />;
      case 'orders':
        return <OrderManagement authToken={authToken} />;
      case 'transactions':
        return <TransactionManagement authToken={authToken} />;
      case 'testimonials':
        return <TestimonialsManagement authToken={authToken} />;
      case 'theme':
        return <ThemeSettings authToken={authToken} />;
      default:
        return <Dashboard authToken={authToken} />;
    }
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
      <LoginForm 
        onLogin={login} 
        onShowSignup={() => setShowSignup(true)}
      />
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#FFF5F7' }}>
      <Header 
        user={currentUser} 
        onLogout={logout}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onNavigateToProfile={() => setActiveSection('profile')}
      />
      
      <div className="flex">
        <Sidebar 
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          user={currentUser}
        />
        
        <main className="main-content flex-1" style={{ background: '#FFF5F7' }}>
          {renderContent()}
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

export default App;