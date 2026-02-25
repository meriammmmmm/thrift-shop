'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface UserInfo {
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

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [userInfo, setUserInfo] = useState<UserInfo>({
    fullName: '',
    email: '',
    phone: '',
    optionalPhone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Tunisia'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let data;
      if (isLogin) {
        data = await api.login({ email: formData.email, password: formData.password });
      } else {
        // For registration, use email from userInfo or fallback to formData
        const emailToUse = userInfo.email || formData.email;
        data = await api.register({
          email: emailToUse,
          password: formData.password,
          name: userInfo.fullName || formData.name,
          companyId: process.env.NEXT_PUBLIC_COMPANY_ID ? parseInt(process.env.NEXT_PUBLIC_COMPANY_ID) : undefined,
          userInfo: {
            fullName: userInfo.fullName,
            email: emailToUse,
            phone: userInfo.phone,
            optionalPhone: userInfo.optionalPhone,
            address: userInfo.address,
            city: userInfo.city,
            state: userInfo.state,
            zipCode: userInfo.zipCode,
            country: userInfo.country
          }
        });
      }

      // Store token and user data
      localStorage.setItem('auth-token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect based on user role
      if (data.user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleUserInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setUserInfo({
      ...userInfo,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 page-transition">
      <div className="sm:mx-auto sm:w-full sm:max-w-md scroll-animate scroll-fadeInDown">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isLogin ? 'Sign in to your account' : 'Create your account'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] underline-effect"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl scroll-animate scroll-fadeInUp">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 card-hover-enhanced">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                {/* Personal Information Section */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                        Full Name *
                      </label>
                      <div className="mt-1">
                        <input
                          id="fullName"
                          name="fullName"
                          type="text"
                          required={!isLogin}
                          value={userInfo.fullName}
                          onChange={handleUserInfoChange}
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] sm:text-sm"
                          placeholder="Enter your full name"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700">
                        Email Address *
                      </label>
                      <div className="mt-1">
                        <input
                          id="userEmail"
                          name="email"
                          type="email"
                          required={!isLogin}
                          value={userInfo.email}
                          onChange={handleUserInfoChange}
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] sm:text-sm"
                          placeholder="Enter your email"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        Phone Number *
                      </label>
                      <div className="mt-1">
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          required={!isLogin}
                          value={userInfo.phone}
                          onChange={handleUserInfoChange}
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] sm:text-sm"
                          placeholder="Enter your phone number"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="optionalPhone" className="block text-sm font-medium text-gray-700">
                        Optional Phone
                      </label>
                      <div className="mt-1">
                        <input
                          id="optionalPhone"
                          name="optionalPhone"
                          type="tel"
                          value={userInfo.optionalPhone}
                          onChange={handleUserInfoChange}
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] sm:text-sm"
                          placeholder="Optional phone number"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address Information Section */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Address Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                        Street Address *
                      </label>
                      <div className="mt-1">
                        <input
                          id="address"
                          name="address"
                          type="text"
                          required={!isLogin}
                          value={userInfo.address}
                          onChange={handleUserInfoChange}
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] sm:text-sm"
                          placeholder="Enter your street address"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                          City *
                        </label>
                        <div className="mt-1">
                          <input
                            id="city"
                            name="city"
                            type="text"
                            required={!isLogin}
                            value={userInfo.city}
                            onChange={handleUserInfoChange}
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] sm:text-sm"
                            placeholder="City"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                          State/Region *
                        </label>
                        <div className="mt-1">
                          <input
                            id="state"
                            name="state"
                            type="text"
                            required={!isLogin}
                            value={userInfo.state}
                            onChange={handleUserInfoChange}
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] sm:text-sm"
                            placeholder="State or Region"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
                          ZIP Code *
                        </label>
                        <div className="mt-1">
                          <input
                            id="zipCode"
                            name="zipCode"
                            type="text"
                            required={!isLogin}
                            value={userInfo.zipCode}
                            onChange={handleUserInfoChange}
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] sm:text-sm"
                            placeholder="ZIP Code"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                        Country
                      </label>
                      <div className="mt-1">
                        <select
                          id="country"
                          name="country"
                          value={userInfo.country}
                          onChange={handleUserInfoChange}
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] sm:text-sm"
                        >
                          <option value="Tunisia">Tunisia</option>
                          <option value="USA">United States</option>
                          <option value="Canada">Canada</option>
                          <option value="UK">United Kingdom</option>
                          <option value="France">France</option>
                          <option value="Germany">Germany</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Credentials Section */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Account Credentials</h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Password *
                      </label>
                      <div className="mt-1">
                        <input
                          id="password"
                          name="password"
                          type="password"
                          autoComplete="new-password"
                          required
                          value={formData.password}
                          onChange={handleChange}
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] sm:text-sm"
                          placeholder="Create a password"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {isLogin && (
              <>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] sm:text-sm"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] sm:text-sm"
                      placeholder="Enter your password"
                    />
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm animate-bounceIn">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed magnetic-btn transition-all duration-300"
              >
                {loading ? 'Loading...' : (isLogin ? 'Sign in' : 'Sign up')}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Demo Credentials</span>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-4 rounded-md">
              <p className="font-medium">Admin Access:</p>
              <p>Email: admin@thriftshop.com</p>
              <p>Password: admin123</p>
              <br />
              <p className="font-medium">Test User:</p>
              <p>Email: user@example.com</p>
              <p>Password: user123</p>
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                Backend API: http://localhost:5001
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}