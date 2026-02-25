'use client';

import { useState } from 'react';
import { api } from '../../lib/api';

export default function TestApiPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testHealthCheck = async () => {
    setLoading(true);
    try {
      const response = await api.healthCheck();
      setResult(`✅ Health Check: ${JSON.stringify(response, null, 2)}`);
    } catch (error: any) {
      setResult(`❌ Health Check Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testUserInfo = async () => {
    setLoading(true);
    try {
      const response = await api.getUserInfo();
      setResult(`✅ User Info: ${JSON.stringify(response, null, 2)}`);
    } catch (error: any) {
      setResult(`❌ User Info Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    try {
      const response = await api.login({
        email: 'test@example.com',
        password: 'password123'
      });
      setResult(`✅ Login: ${JSON.stringify(response, null, 2)}`);
      
      // Store token for subsequent requests
      if (response.token) {
        localStorage.setItem('auth-token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
    } catch (error: any) {
      setResult(`❌ Login Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testUserInfoAfterLogin = async () => {
    setLoading(true);
    try {
      // First login
      const loginResponse = await api.login({
        email: 'test@example.com',
        password: 'password123'
      });
      
      if (loginResponse.token) {
        localStorage.setItem('auth-token', loginResponse.token);
        localStorage.setItem('user', JSON.stringify(loginResponse.user));
        
        // Then try to get user info
        const userInfoResponse = await api.getUserInfo();
        setResult(`✅ User Info After Login: ${JSON.stringify(userInfoResponse, null, 2)}`);
      }
    } catch (error: any) {
      setResult(`❌ User Info After Login Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">API Test Page</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Test API Endpoints</h2>
          
          <div className="space-y-4">
            <button
              onClick={testHealthCheck}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Test Health Check
            </button>
            
            <button
              onClick={testLogin}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 ml-4"
            >
              Test Login
            </button>
            
            <button
              onClick={testUserInfo}
              disabled={loading}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 ml-4"
            >
              Test User Info (requires login)
            </button>
            
            <button
              onClick={testUserInfoAfterLogin}
              disabled={loading}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 ml-4"
            >
              Test Login + User Info
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">API Response</h2>
          
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
              <span>Testing...</span>
            </div>
          ) : (
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
              {result || 'Click a button to test an API endpoint'}
            </pre>
          )}
        </div>
        
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Instructions</h3>
          <ol className="list-decimal list-inside text-blue-800 space-y-1">
            <li>First, test the Health Check to verify backend connectivity</li>
            <li>Then test Login to get an authentication token</li>
            <li>Finally, test User Info to verify the protected endpoint works</li>
            <li>Or use "Test Login + User Info" to do steps 2-3 automatically</li>
          </ol>
        </div>
        
        <div className="mt-4 text-center">
          <button
            onClick={() => window.location.href = '/'}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}