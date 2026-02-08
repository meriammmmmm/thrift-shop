import React from 'react';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isOpen: boolean;
  onClose: () => void;
  user?: {
    name?: string;
    email: string;
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
  } | null;
}

const menuItems = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: 'fas fa-chart-bar',
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600'
  },
  {
    id: 'profile',
    name: 'My Profile',
    icon: 'fas fa-user-circle',
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600'
  },
  {
    id: 'users',
    name: 'User Management',
    icon: 'fas fa-users',
    bgColor: 'bg-purple-100',
    iconColor: 'text-purple-600'
  },
  {
    id: 'products',
    name: 'Product Management',
    icon: 'fas fa-box',
    bgColor: 'bg-orange-100',
    iconColor: 'text-orange-600'
  },
  {
    id: 'categories',
    name: 'Category Management',
    icon: 'fas fa-tags',
    bgColor: 'bg-teal-100',
    iconColor: 'text-teal-600'
  },
  {
    id: 'orders',
    name: 'Orders',
    icon: 'fas fa-shopping-cart',
    bgColor: 'bg-indigo-100',
    iconColor: 'text-indigo-600'
  },
  {
    id: 'transactions',
    name: 'Transactions',
    icon: 'fas fa-credit-card',
    bgColor: 'bg-yellow-100',
    iconColor: 'text-yellow-600'
  },
  {
    id: 'testimonials',
    name: 'Testimonials',
    icon: 'fas fa-quote-left',
    bgColor: 'bg-rose-100',
    iconColor: 'text-rose-600'
  },
  {
    id: 'theme',
    name: 'Theme Settings',
    icon: 'fas fa-palette',
    bgColor: 'bg-pink-100',
    iconColor: 'text-pink-600'
  }
];

const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSectionChange, isOpen, onClose, user }) => {
  const handleItemClick = (sectionId: string) => {
    onSectionChange(sectionId);
    onClose(); // Close sidebar on mobile after selection
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 custom-mobile-only"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 w-72 h-screen bg-white shadow-lg transform transition-transform duration-300 ease-in-out border-r border-gray-200 flex flex-col
        custom-desktop-static custom-desktop-translate
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Mobile menu header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 custom-mobile-only">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] flex items-center justify-center overflow-hidden">
              {user?.company?.logo ? (
                <img src={user.company.logo} alt="Company Logo" className="w-full h-full object-cover" />
              ) : (
                <i className="fas fa-tshirt text-white text-sm"></i>
              )}
            </div>
            <h2 className="text-lg font-semibold text-gray-800">
              {user?.company?.name || 'Thrift Shop Admin'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          >
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>

        {/* Desktop spacing from header */}
        <div className="custom-desktop-only h-4"></div>

        <nav className="px-4 py-2 flex-1">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`
                  nav-link w-full flex items-center px-4 py-3 text-left rounded-xl transition-all duration-200
                  ${activeSection === item.id
                    ? 'active bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--color-primary)] text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-[var(--color-primary)]'
                  }
                `}
              >
                <div className={`w-10 h-10 rounded-lg ${
                  activeSection === item.id 
                    ? 'bg-white bg-opacity-20' 
                    : item.bgColor
                } flex items-center justify-center mr-3 transition-all duration-200`}>
                  <i className={`${item.icon} ${
                    activeSection === item.id 
                      ? item.iconColor 
                      : item.iconColor
                  }`}></i>
                </div>
                <span className="font-medium text-sm">{item.name}</span>
              </button>
            ))}
          </div>
        </nav>

      </aside>
    </>
  );
};

export default Sidebar;