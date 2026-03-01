import React, { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  user: any;
  onLogout: () => void;
  onToggleSidebar: () => void;
  onNavigateToProfile: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, onToggleSidebar, onNavigateToProfile }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProfileClick = () => {
    onNavigateToProfile();
    setDropdownOpen(false);
  };

  const handleLogoutClick = () => {
    onLogout();
    setDropdownOpen(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="px-3 sm:px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Brand Identity */}
          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 flex-1 min-w-0">
            <button
              onClick={onToggleSidebar}
              className="custom-mobile-only p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
              aria-label="Toggle sidebar"
            >
              <i className="fas fa-bars text-gray-600"></i>
            </button>
            
            <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 min-w-0">
              {/* Brand Logo */}
              <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)] shadow-lg overflow-hidden flex-shrink-0">
                {user?.company?.logo ? (
                  <img src={user.company.logo} alt="Brand Logo" className="w-full h-full object-cover" />
                ) : (
                  <i className="fas fa-store text-white text-sm sm:text-lg"></i>
                )}
              </div>
              
              {/* Brand Info */}
              <div className="hidden sm:block min-w-0">
                <h1 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 leading-tight truncate">
                  {user?.company?.name || 'Thrift Shop'}
                </h1>
                <p className="text-xs text-gray-500 font-medium">
                  Admin Dashboard
                </p>
              </div>
            </div>
          </div>

          {/* Right side - User Profile */}
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            {/* User Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-1.5 sm:py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-200 border border-gray-200"
                aria-label="User menu"
              >
                {/* User Avatar */}
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)] flex items-center justify-center shadow-md flex-shrink-0">
                  <span className="text-white font-semibold text-xs sm:text-sm">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                  </span>
                </div>
                
                {/* User Info */}
                <div className="hidden md:block text-left min-w-0">
                  <div className="font-semibold text-gray-900 text-sm truncate max-w-[120px] lg:max-w-[150px]">
                    {user?.name || 'Admin User'}
                  </div>
                  <div className="text-xs text-gray-500 truncate max-w-[120px] lg:max-w-[150px]">
                    {user?.email}
                  </div>
                </div>
                
                {/* Dropdown Arrow */}
                <i className={`fas fa-chevron-down text-xs text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''} hidden sm:block`}></i>
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                  {/* User Info Header */}
                  <div className="px-4 py-4 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)] flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-lg">
                          {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">
                          {user?.name || 'Admin User'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user?.email}
                        </div>
                        <div className="text-xs text-[var(--color-primary)] font-medium mt-1">
                          Administrator
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Menu Items */}
                  <div className="py-2">
                    <button
                      onClick={handleProfileClick}
                      className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center mr-3 group-hover:bg-green-200 transition-colors">
                        <i className="fas fa-user-circle text-green-600"></i>
                      </div>
                      <div className="text-left">
                        <div className="font-medium">My Profile</div>
                        <div className="text-xs text-gray-500">Manage account settings</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => setDropdownOpen(false)}
                      className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors">
                        <i className="fas fa-cog text-blue-600"></i>
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Settings</div>
                        <div className="text-xs text-gray-500">Preferences & configuration</div>
                      </div>
                    </button>
                    
                    <div className="border-t border-gray-100 my-2"></div>
                    
                    <button
                      onClick={handleLogoutClick}
                      className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center mr-3 group-hover:bg-red-200 transition-colors">
                        <i className="fas fa-sign-out-alt text-red-600"></i>
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Sign Out</div>
                        <div className="text-xs text-red-500">End your session</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;