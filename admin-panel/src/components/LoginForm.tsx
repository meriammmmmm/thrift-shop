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
    <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-shield-alt text-white text-2xl"></i>
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