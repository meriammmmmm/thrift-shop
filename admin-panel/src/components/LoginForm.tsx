import React, { useState } from 'react';

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onShowSignup: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onShowSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await onLogin(email, password);
    } catch (error: any) {
      if (error.message.includes('pending approval')) {
        setError('Your brand registration is pending approval. Please wait for admin approval.');
      } else if (error.message.includes('rejected')) {
        setError('Your brand registration has been rejected. Please contact support.');
      } else if (error.message.includes('suspended')) {
        setError('Your brand account has been suspended. Please contact support.');
      } else {
        setError('Invalid credentials or insufficient permissions');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* Creative Admin Logo with Animation */}
          <div className="relative inline-block mb-4">
            <div className="absolute -inset-2 bg-gradient-to-r from-teal-400 via-cyan-500 to-blue-500 rounded-full blur opacity-30 animate-pulse"></div>
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)] flex items-center justify-center mx-auto shadow-2xl transform hover:scale-110 transition-transform duration-300">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] bg-clip-text text-transparent">Admin Portal</h2>
          <p className="text-gray-600 mt-2">Secure access to your dashboard</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-gray-700 text-sm font-semibold mb-3">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                placeholder="admin@thriftshop.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-gray-700 text-sm font-semibold mb-3">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-modern w-full py-4 text-lg font-semibold"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
            ) : (
              <>
                <i className="fas fa-sign-in-alt mr-2"></i>
                Sign In
              </>
            )}
          </button>

          {/* Sign Up Button */}
          <div className="text-center">
            <p className="text-gray-600 mb-4">Don't have a brand account?</p>
            <button
              type="button"
              onClick={onShowSignup}
              className="w-full px-6 py-3 border-2 border-[var(--color-primary)] text-[var(--color-primary)] font-semibold rounded-xl hover:bg-[var(--color-primary)] hover:text-white transition-all duration-200"
            >
              <i className="fas fa-store mr-2"></i>
              Register Your Brand
            </button>
          </div>

          <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
            <div className="flex items-center mb-3">
              <i className="fas fa-rocket text-green-500 mr-2"></i>
              <span className="font-semibold text-green-700">Instant Access Registration</span>
            </div>
            <div className="text-sm text-green-600 space-y-2">
              <div>
                <p className="font-medium">🏪 Vintage Treasures</p>
                <p className="text-xs">admin@vintagetreasures.com / admin123</p>
              </div>
              <div>
                <p className="font-medium">🌱 Eco Fashion Hub</p>
                <p className="text-xs">admin@ecofashionhub.com / admin123</p>
              </div>
              <div>
                <p className="font-medium">🕺 Retro Style Co</p>
                <p className="text-xs">admin@retrostyleco.com / admin123</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-green-200">
              <p className="text-xs text-green-500">
                <i className="fas fa-check-circle mr-1"></i>
                New brands can login immediately after registration!
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;