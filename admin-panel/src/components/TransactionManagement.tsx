import React, { useState, useEffect } from 'react';

interface TransactionManagementProps {
  authToken: string;
}

interface Transaction {
  id: number;
  user_name?: string;
  email?: string;
  type: string;
  amount: number;
  status: string;
  created_at: string;
}

const API_BASE_URL = 'https://mertrosebackend-7wop5nev.b4a.run/api';

const TransactionManagement: React.FC<TransactionManagementProps> = ({ authToken }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyCurrency, setCompanyCurrency] = useState({ currency: 'USD', symbol: '$' });

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
    loadTransactions();
    
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

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/transactions`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || data);
      }
    } catch (error) {
      console.error('Transactions load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionTypeColor = (type: string) => {
    const colors = {
      'purchase': 'bg-green-100 text-green-800',
      'refund': 'bg-red-100 text-red-800',
      'payment': 'bg-blue-100 text-blue-800',
      'commission': 'bg-purple-100 text-purple-800'
    };
    return colors[type.toLowerCase() as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getTransactionStatusColor = (status: string) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800',
      'refunded': 'bg-orange-100 text-orange-800'
    };
    return colors[status.toLowerCase() as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const viewTransactionDetails = (transactionId: number) => {
    // Feature coming soon - could implement later
    console.log(`View transaction ${transactionId} details`);
  };

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
            Transactions Management
          </h2>
          <p className="text-gray-600">Monitor and manage financial transactions</p>
        </div>
        <div className="flex space-x-4">
          <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]">
            <option value="">All Types</option>
            <option value="purchase">Purchase</option>
            <option value="refund">Refund</option>
            <option value="payment">Payment</option>
            <option value="commission">Commission</option>
          </select>
          <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
          <button 
            onClick={loadTransactions} 
            className="btn-modern bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--color-primary)] text-white px-6 py-3 rounded-xl hover:from-[var(--color-primary)] hover:to-[var(--color-primary-hover)] flex items-center"
          >
            <i className="fas fa-refresh mr-2"></i>Refresh
          </button>
        </div>
      </div>

      {/* Transaction Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 compact-spacing">
        <div className="stats-card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 flex items-center justify-center">
              <i className="fas fa-dollar-sign text-xl text-green-600"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold">{getCurrentCurrencySymbol()}0</p>
            </div>
          </div>
        </div>
        <div className="stats-card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 flex items-center justify-center">
              <i className="fas fa-credit-card text-xl text-blue-600"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </div>
        <div className="stats-card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 flex items-center justify-center">
              <i className="fas fa-clock text-xl text-yellow-600"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </div>
        <div className="stats-card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 flex items-center justify-center">
              <i className="fas fa-exclamation-triangle text-xl text-red-600"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="modern-table">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--color-primary)] text-white">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <i className="fas fa-credit-card text-4xl mb-4 text-gray-300"></i>
                    <p className="text-lg font-medium">No transactions found</p>
                    <p className="text-sm">Transaction history will appear here</p>
                  </div>
                </td>
              </tr>
            ) : (
              transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50 transition-all duration-200">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">#{transaction.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {transaction.user_name || transaction.email || 'Unknown User'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`modern-badge ${getTransactionTypeColor(transaction.type || 'payment')}`}>
                      {(transaction.type || 'payment').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{getCurrentCurrencySymbol()}{(parseFloat(transaction.amount as any) || 0).toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`modern-badge ${getTransactionStatusColor(transaction.status || 'pending')}`}>
                      {(transaction.status || 'pending').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {transaction.created_at ? new Date(transaction.created_at).toLocaleDateString() : 'Unknown'}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => viewTransactionDetails(transaction.id)}
                      className="text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors duration-200"
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionManagement;