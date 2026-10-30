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
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ background: '#FFC0D9' }}>
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-12">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <svg className="w-20 h-20 mx-auto" viewBox="0 0 100 100" fill="none">
              <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#8B2654', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#A73264', stopOpacity: 1 }} />
                </linearGradient>
              </defs>
              {/* Simple elegant woman silhouette */}
              <path d="M50 20 C45 20 42 23 42 28 C42 33 45 36 50 36 C55 36 58 33 58 28 C58 23 55 20 50 20 Z" fill="url(#logoGradient)"/>
              <path d="M50 38 C40 38 35 42 33 50 L33 80 L67 80 L67 50 C65 42 60 38 50 38 Z" fill="url(#logoGradient)"/>
              <path d="M35 50 C30 50 28 55 30 60 L25 80 L33 80 L33 50 Z" fill="url(#logoGradient)" opacity="0.7"/>
              <path d="M65 50 C70 50 72 55 70 60 L75 80 L67 80 L67 50 Z" fill="url(#logoGradient)" opacity="0.7"/>
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-4xl font-bold text-gray-900 mb-2">Sign In</h2>
        <p className="text-gray-600 mb-8">
          Don't have an account? <button type="button" onClick={onShowSignup} className="text-[#8B2654] font-semibold hover:underline">Sign up free</button>
        </p>

        {/* Form */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-gray-900 text-sm font-medium mb-2">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B2654] focus:border-transparent transition-all duration-200"
              placeholder="you@example.com"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-gray-900 text-sm font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B2654] focus:border-transparent transition-all duration-200"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showPassword ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  )}
                </svg>
              </button>
            </div>
            <div className="text-right mt-2">
              <button type="button" className="text-sm text-[#8B2654] hover:underline">
                Forgot password?
              </button>
            </div>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            style={{ background: 'linear-gradient(135deg, #8B2654 0%, #A73264 100%)' }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Signing in...
              </div>
            ) : (
              <>
                ✨ Sign In
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* Continue without account */}
          <button
            type="button"
            className="w-full py-3 text-gray-700 font-medium border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200"
          >
            ← Continue browsing without account
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;